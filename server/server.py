from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Hello"}

@app.post("/echo")
def echo_text(item: Item):
    return {"status": "ok", "received": item.text}