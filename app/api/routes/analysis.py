from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analysis_service import (
    generate_summary_service,
    correlation_analysis_service,
    dataset_insights_service,
    distribution_analysis_service,
)

router = APIRouter(prefix="/analysis", tags=["Automated EDA"])


@router.get("/{dataset_id}/summary")
def generate_summary(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return generate_summary_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )


@router.get("/{dataset_id}/correlation")
def analyze_correlation(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return correlation_analysis_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )


@router.get("/{dataset_id}/insights")
def inspect_dataset_insights(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return dataset_insights_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )


@router.get("/{dataset_id}/distribution")
def understand_distribution(dataset_id: int, db: Session = Depends(get_db)):
    user_id = 1

    return distribution_analysis_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )