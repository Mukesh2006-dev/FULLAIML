from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ml_model import TrainModelRequest
from app.services.ml_service import train_model_service
from app.api.dependencies import get_current_user
from app.models.user import User


router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@router.post("/train")
def train_model(
    request: TrainModelRequest,
    db: Session = Depends(get_db),
    current_user: User=Depends(get_current_user)
):

    return train_model_service(
        request=request,
        user_id=current_user.id,
        db=db
    )