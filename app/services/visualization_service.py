import os
import uuid
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.dataset import Dataset

CHART_DIR = "storage/charts"
os.makedirs(CHART_DIR, exist_ok=True)


def get_dataset_or_404(dataset_id: int, user_id: int, db: Session):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == user_id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return dataset


from app.services.dataset_service import read_csv_safely

def load_dataframe(dataset: Dataset):
    return read_csv_safely(dataset.stored_path)


def save_chart():
    filename = f"{uuid.uuid4()}.png"
    path = os.path.join(CHART_DIR, filename)
    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return {
        "chart_path": path,
        "chart_url": f"/charts/{filename}"
    }


def generate_histogram_service(dataset_id: int, column: str, user_id: int, db: Session):
    dataset = get_dataset_or_404(dataset_id, user_id, db)
    df = load_dataframe(dataset)

    if column not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found")

    if not pd.api.types.is_numeric_dtype(df[column]):
        raise HTTPException(status_code=400, detail="Histogram requires a numeric column")

    plt.figure(figsize=(8, 5))
    plt.hist(df[column].dropna(), bins=30)
    plt.title(f"Histogram of {column}")
    plt.xlabel(column)
    plt.ylabel("Frequency")

    chart = save_chart()

    return {
        "message": "Histogram generated successfully",
        "dataset_id": dataset_id,
        "column": column,
        **chart
    }


def generate_correlation_heatmap_service(dataset_id: int, user_id: int, db: Session):
    dataset = get_dataset_or_404(dataset_id, user_id, db)
    df = load_dataframe(dataset)

    numeric_df = df.select_dtypes(include=["number"])

    if numeric_df.empty:
        raise HTTPException(
            status_code=400,
            detail="No numeric columns available for heatmap"
        )

    corr = numeric_df.corr()

    plt.figure(figsize=(10, 7))
    plt.imshow(corr, interpolation="nearest")
    plt.colorbar()
    plt.xticks(range(len(corr.columns)), corr.columns, rotation=45, ha="right")
    plt.yticks(range(len(corr.columns)), corr.columns)
    plt.title("Correlation Heatmap")

    chart = save_chart()

    return {
        "message": "Correlation heatmap generated successfully",
        "dataset_id": dataset_id,
        "columns": corr.columns.tolist(),
        **chart
    }


def generate_scatter_plot_service(
    dataset_id: int,
    x_column: str,
    y_column: str,
    user_id: int,
    db: Session
):
    dataset = get_dataset_or_404(dataset_id, user_id, db)
    df = load_dataframe(dataset)

    if x_column not in df.columns or y_column not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found")

    if not pd.api.types.is_numeric_dtype(df[x_column]):
        raise HTTPException(status_code=400, detail="x_column must be numeric")

    if not pd.api.types.is_numeric_dtype(df[y_column]):
        raise HTTPException(status_code=400, detail="y_column must be numeric")

    plt.figure(figsize=(8, 5))
    plt.scatter(df[x_column], df[y_column])
    plt.title(f"{x_column} vs {y_column}")
    plt.xlabel(x_column)
    plt.ylabel(y_column)

    chart = save_chart()

    return {
        "message": "Scatter plot generated successfully",
        "dataset_id": dataset_id,
        "x_column": x_column,
        "y_column": y_column,
        **chart
    }


def generate_bar_chart_service(dataset_id: int, column: str, user_id: int, db: Session):
    dataset = get_dataset_or_404(dataset_id, user_id, db)
    df = load_dataframe(dataset)

    if column not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found")

    value_counts = df[column].value_counts().head(10)

    plt.figure(figsize=(9, 5))
    plt.bar(value_counts.index.astype(str), value_counts.values)
    plt.title(f"Top values in {column}")
    plt.xlabel(column)
    plt.ylabel("Count")
    plt.xticks(rotation=45, ha="right")

    chart = save_chart()

    return {
        "message": "Bar chart generated successfully",
        "dataset_id": dataset_id,
        "column": column,
        "top_values": value_counts.to_dict(),
        **chart
    }