from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

from app.models.user import User
from app.models.dataset import Dataset
from app.models.job import Job
from app.models.ml_model import MLModel
from app.models.predictions import Prediction

from app.api.routes.auth import router as auth_router
from app.api.routes.datasets import router as dataset_router
from app.api.routes.preprocessing import router as preprocessing_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.ml import router as ml_router

app = FastAPI(
    title="ML Analysis Project",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(preprocessing_router)
app.include_router(analysis_router)
app.include_router(ml_router)


@app.get("/")
def home():
    return {"message": "ML Analysis Project running"}