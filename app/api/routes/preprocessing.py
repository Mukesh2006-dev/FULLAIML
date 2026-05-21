from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.preprocessing_service import (
    remove_missing_values_service,
    remove_duplicates_service,
    auto_clean_service,
)

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing"])


@router.post("/{dataset_id}/remove-missing")
def remove_missing_values(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return remove_missing_values_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )


@router.post("/{dataset_id}/remove-duplicates")
def remove_duplicates(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return remove_duplicates_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )


@router.post("/{dataset_id}/auto-clean")
def auto_clean(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return auto_clean_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )