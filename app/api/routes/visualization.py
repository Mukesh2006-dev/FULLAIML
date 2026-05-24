from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.visualization_service import (
    generate_histogram_service,
    generate_correlation_heatmap_service,
    generate_scatter_plot_service,
    generate_bar_chart_service,
)

router = APIRouter(prefix="/visualizations", tags=["Visualizations"])


@router.get("/{dataset_id}/histogram")
def generate_histogram(
    dataset_id: int,
    column: str,
    db: Session = Depends(get_db)
):
    user_id = 1

    return generate_histogram_service(
        dataset_id=dataset_id,
        column=column,
        user_id=user_id,
        db=db
    )


@router.get("/{dataset_id}/heatmap")
def generate_heatmap(
    dataset_id: int,
    db: Session = Depends(get_db)
):
    user_id = 1

    return generate_correlation_heatmap_service(
        dataset_id=dataset_id,
        user_id=user_id,
        db=db
    )


@router.get("/{dataset_id}/scatter")
def generate_scatter_plot(
    dataset_id: int,
    x_column: str,
    y_column: str,
    db: Session = Depends(get_db)
):
    user_id = 1

    return generate_scatter_plot_service(
        dataset_id=dataset_id,
        x_column=x_column,
        y_column=y_column,
        user_id=user_id,
        db=db
    )


@router.get("/{dataset_id}/bar")
def generate_bar_chart(
    dataset_id: int,
    column: str,
    db: Session = Depends(get_db)
):
    user_id = 1

    return generate_bar_chart_service(
        dataset_id=dataset_id,
        column=column,
        user_id=user_id,
        db=db
    )