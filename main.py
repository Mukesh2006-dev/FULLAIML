from fastapi import FastAPI

from app.core.database import engine,Base
from app.models.user import User

app=FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message": "ML Analysis Project running"}