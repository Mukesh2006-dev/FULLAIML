from fastapi import FastAPI

from app.core.database import Base, engine
from app.models.user import User
from app.models.dataset import Dataset
from app.models.job import Job
from app.models.ml_model import MLModel
from app.models.predictions import Prediction
from fastapi.middleware.cors import CORSMiddleware


from app.api.routes.auth import router as auth_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)


@app.get("/")
def home():
    return {"message": "ML Analysis Project running"}