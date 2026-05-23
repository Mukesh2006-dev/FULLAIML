from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ml_model import TrainModelRequest
from app.services.ml_service import train_model_service

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@router.post("/train")
def train_model(
    request: TrainModelRequest,
    db: Session = Depends(get_db)
):
    user_id = 1

    return train_model_service(
        request=request,
        user_id=user_id,
        db=db
    )