import secrets
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId
import os
import dotenv
import re

dotenv.load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- MONGODB CONNECTION ---
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.PlanetaAnime
collection = db.anime
admin_sessions = db.admin_sessions


# --- MODELS ---
class LoginRequest(BaseModel):
    password: str
class Item(BaseModel):
    text: str
class Episode(BaseModel):
    title: str
    number: int
    link: str

class Series(BaseModel):
    series_number: int
    title: str
    episodes: List[Episode] = []

class Anime(BaseModel):
    name: str
    desc: str
    studio: str
    series: List[Series] = []

class SearchQuery(BaseModel):
    query: str


# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Hello"}

@app.post("/echo")
def echo_text(item: Item):
    return {"status": "ok", "received": item.text}

@app.post("/admin/login")
async def admin_login(req: LoginRequest):
    
    ADMIN_PASSWORD = os.getenv("ADMIN_PASS", "Fall")
    
    if req.password == ADMIN_PASSWORD:
        # Generate 64-character hash (Token)
        token = secrets.token_hex(32)
        
        # store in DB
        await admin_sessions.insert_one({"token": token})
        return {"status": "ok", "token": token}
    
    raise HTTPException(status_code=401, detail="Invalid password")

#Middleware (Dependency)
async def verify_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token format")
    
    token = authorization.split(" ")[1]
    # check token in DB
    session = await admin_sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Unauthorized token")
    
    return True

@app.post("/search")
async def search_anime(search: SearchQuery):
    escaped_query = re.escape(search.query) # Pass pure string to prevent ReDos (Denial of Service for DB)
    
    if not escaped_query:
        return []

    cursor = collection.find(
        {"name": {"$regex": f"^{escaped_query}", "$options": "i"}}
    ).limit(5) # Top 5 anime
    
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
async def add_episode(anime_id: str, series_number: int, episode: Episode):
    result = await collection.update_one(
        {"_id": ObjectId(anime_id), "series.series_number": series_number},
        {"$push": {"series.$.episodes": episode.model_dump()}}
    )
    return {"status": "ok"}

