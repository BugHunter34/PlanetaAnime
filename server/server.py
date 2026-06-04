import secrets
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId
import os
import dotenv
import re
import shutil
import subprocess
import tempfile
import boto3
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from typing import List, Optional
from fastapi.responses import StreamingResponse
import httpx

dotenv.load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://planetaanime.andhyy.com",
        "https://api-planetaanime.andhyy.com",
        "andhyy.com",
        "http://localhost:5173",  
        "http://localhost:8000", 
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
    max_age=600,
)


# --- MONGODB CONNECTION ---
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.PlanetaAnime
collection = db.anime
admin_sessions = db.admin_sessions

# --- B2 CONFIG ---
B2_ENDPOINT_URL = os.getenv("B2_ENDPOINT_URL", "https://s3.eu-central-003.backblazeb2.com")
B2_KEY_ID = os.getenv("B2_KEY_ID")
B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY")
BUCKET_NAME = "govis-cdn"
CDN_DOMAIN = "https://cdn.andhyy.com"

b2_client = boto3.client(
    "s3",
    endpoint_url=B2_ENDPOINT_URL,
    aws_access_key_id=B2_KEY_ID,
    aws_secret_access_key=B2_APPLICATION_KEY
)

# --- MODELS ---
class LoginRequest(BaseModel):
    password: str

class Item(BaseModel):
    text: str

class Episode(BaseModel):
    title: str
    number: int
    link: str
    sub_cz: Optional[str] = None
    sub_en: Optional[str] = None

class Series(BaseModel):
    series_number: int
    episodes: List[Episode] = []

class Anime(BaseModel):
    name: str
    desc: str
    studio: str
    series: List[Series] = []
    imageUrl: Optional[str] = ""

class SearchQuery(BaseModel):
    query: str


# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Hello"}

@app.post("/echo")
def echo_text(item: Item):
    return {"status": "ok", "received": item.text}


@app.get("/proxy-subtitle")
async def proxy_subtitle(url: str):
    """
    Proxy subtitle files to avoid CORS issues.
    Usage: /proxy-subtitle?url=https://cdn.andhyy.com/videos/.../sub_cz.vtt
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            
            return StreamingResponse(
                iter([response.content]),
                status_code=response.status_code,
                media_type="text/vtt",
                headers={
                    "Content-Disposition": "inline",
                    "Cache-Control": "public, max-age=86400"  # Cache for 1 day
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch subtitle: {str(e)}")

@app.post("/admin/login")
async def admin_login(req: LoginRequest):
    ADMIN_PASSWORD = os.getenv("ADMIN_PASS", "Fall")
    
    if req.password == ADMIN_PASSWORD:
        token = secrets.token_hex(32)
        await admin_sessions.insert_one({"token": token})
        return {"status": "ok", "token": token}
    
    raise HTTPException(status_code=401, detail="Invalid password")

async def verify_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token format")
    
    token = authorization.split(" ")[1]
    session = await admin_sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Unauthorized token")
    return True

@app.get("/anime/{anime_id}")
async def get_anime(anime_id: str):
    doc = await collection.find_one({"_id": ObjectId(anime_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Anime not found")
    doc["_id"] = str(doc["_id"])
    return doc

@app.post("/search")
async def search_anime(search: SearchQuery):
    escaped_query = re.escape(search.query) 
    if not escaped_query:
        return []

    cursor = collection.find(
        {"name": {"$regex": f"^{escaped_query}", "$options": "i"}}
    ).limit(5)
    
    results = await cursor.to_list(length=5)
    for doc in results:
        doc["_id"] = str(doc["_id"])
    return results

@app.post("/anime", dependencies=[Depends(verify_admin)])
async def create_anime(anime: Anime):
    anime_dict = anime.model_dump()
    result = await collection.insert_one(anime_dict)
    
    return {"status": "ok", "inserted_id": str(result.inserted_id)}

@app.delete("/anime/{anime_id}", dependencies=[Depends(verify_admin)])
async def delete_anime(anime_id: str):
    try:
        result = await collection.delete_one({"_id": ObjectId(anime_id)})
        if result.deleted_count == 1:
            return {"status": "ok"}
        raise HTTPException(status_code=404, detail="Anime not found")
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

@app.post("/anime/{anime_id}/series", dependencies=[Depends(verify_admin)])
async def add_series(anime_id: str, series: Series):
    result = await collection.update_one(
        {"_id": ObjectId(anime_id)},
        {"$push": {"series": series.model_dump()}}
    )
    return {"status": "ok"}


@app.post("/anime/{anime_id}/series/{series_number}/episode", dependencies=[Depends(verify_admin)])
async def add_episode_with_hls(
    anime_id: str,
    series_number: int,
    chunk: UploadFile = File(...),
    chunkIndex: int = Form(...),
    totalChunks: int = Form(...),
    fileId: str = Form(...),
    # Make these Optional because they only arrive on the final chunk
    title: Optional[str] = Form(None),
    number: Optional[int] = Form(None),
    sub_cz: Optional[UploadFile] = File(None),
    sub_en: Optional[UploadFile] = File(None)
):
    # Verify DB first
    anime_doc = await collection.find_one({"_id": ObjectId(anime_id), "series.series_number": series_number})
    if not anime_doc:
        raise HTTPException(status_code=404, detail="Anime or Series not found")

    # Create a secure temp directory specific to this exact upload session
    tmpdir = f"/tmp/hls_upload_{fileId}"
    os.makedirs(tmpdir, exist_ok=True)
    
    # Save the incoming 50MB chunk
    chunk_path = os.path.join(tmpdir, f"chunk_{chunkIndex}")
    with open(chunk_path, "wb") as buffer:
        shutil.copyfileobj(chunk.file, buffer)

    # IF THIS IS NOT THE LAST CHUNK -> Just return a success status and wait for the next one
    if chunkIndex < totalChunks - 1:
        return {"status": "chunk_received", "progress": f"{chunkIndex + 1}/{totalChunks}"}

    # ==========================================
    # IF WE ARE HERE, IT IS THE FINAL CHUNK
    # ==========================================
    
    # 1. Stitch all the chunks back together into the original MP4
    input_video_path = os.path.join(tmpdir, "input.mp4")
    with open(input_video_path, "wb") as outfile:
        for i in range(totalChunks):
            part_file = os.path.join(tmpdir, f"chunk_{i}")
            with open(part_file, "rb") as infile:
                shutil.copyfileobj(infile, outfile)
            os.remove(part_file) # Clean up the chunk file to save disk space

    # Now proceed with your existing B2 and FFmpeg logic
    b2_folder_prefix = f"videos/{anime_id}/s{series_number}/ep{number}"
    playlist_filename = "master.m3u8"
    video_cdn_url = f"{CDN_DOMAIN}/{b2_folder_prefix}/{playlist_filename}"
    cz_cdn_url, en_cdn_url = None, None

    try:
        # Process Czech Subtitles
        if sub_cz:
            out_cz = os.path.join(tmpdir, "sub_cz.vtt")
            with open(os.path.join(tmpdir, "tmp_cz"), "wb") as buffer:
                shutil.copyfileobj(sub_cz.file, buffer)
            subprocess.run(["ffmpeg", "-i", os.path.join(tmpdir, "tmp_cz"), out_cz], check=True)
            with open(out_cz, "rb") as f:
                b2_client.put_object(Bucket=BUCKET_NAME, Key=f"{b2_folder_prefix}/sub_cz.vtt", Body=f, ContentType="text/vtt")
            cz_cdn_url = f"{CDN_DOMAIN}/{b2_folder_prefix}/sub_cz.vtt"

        # Process English Subtitles
        if sub_en:
            out_en = os.path.join(tmpdir, "sub_en.vtt")
            with open(os.path.join(tmpdir, "tmp_en"), "wb") as buffer:
                shutil.copyfileobj(sub_en.file, buffer)
            subprocess.run(["ffmpeg", "-i", os.path.join(tmpdir, "tmp_en"), out_en], check=True)
            with open(out_en, "rb") as f:
                b2_client.put_object(Bucket=BUCKET_NAME, Key=f"{b2_folder_prefix}/sub_en.vtt", Body=f, ContentType="text/vtt")
            en_cdn_url = f"{CDN_DOMAIN}/{b2_folder_prefix}/sub_en.vtt"

        # Process HLS Chunking
        output_playlist_path = os.path.join(tmpdir, playlist_filename)
        ffmpeg_cmd = [
            "ffmpeg", "-i", input_video_path,
            "-codec:v", "libx264", "-profile:v", "main", "-level", "3.1",
            "-codec:a", "aac", "-b:a", "128k",
            "-start_number", "0",
            "-hls_time", "5",
            "-hls_list_size", "0",
            "-f", "hls",
            output_playlist_path
        ]
        
        process = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        if process.returncode != 0:
            raise HTTPException(status_code=500, detail=f"FFmpeg failed: {process.stderr}")

        # Upload Chunks to B2
        for filename in os.listdir(tmpdir):
            if filename.endswith(".ts") or filename == playlist_filename:
                file_path = os.path.join(tmpdir, filename)
                content_type = "application/x-mpegURL" if filename.endswith(".m3u8") else "video/MP2T"
                with open(file_path, "rb") as f:
                    b2_client.put_object(Bucket=BUCKET_NAME, Key=f"{b2_folder_prefix}/{filename}", Body=f, ContentType=content_type)

        # Save to MongoDB
        episode_entry = {
            "title": title,
            "number": number,
            "link": video_cdn_url,
            "sub_cz": cz_cdn_url,
            "sub_en": en_cdn_url
        }
        await collection.update_one(
            {"_id": ObjectId(anime_id), "series.series_number": series_number},
            {"$push": {"series.$.episodes": episode_entry}}
        )

        return {"status": "ok", "video_url": video_cdn_url}

    finally:
        # ALWAYS wipe the temp directory off your Ubuntu server when finished
        shutil.rmtree(tmpdir, ignore_errors=True)