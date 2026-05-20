import os
import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.utils.file_utils import save_upload_file


def upload_dataset_service(file: UploadFile, user_id: int, db: Session):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    stored_filename, stored_path, file_size = save_upload_file(file)

    try:
        df = pd.read_csv(stored_path)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    file_size = os.path.getsize(stored_path)

    new_dataset = Dataset(
        user_id=user_id,
        filename=file.filename,
        stored_path=stored_path,
        file_size=file_size,
        rows_count=df.shape[0],
        columns_count=df.shape[1],
    )

    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return new_dataset


def list_datasets_service(user_id: int, db: Session):
    return db.query(Dataset).filter(Dataset.user_id == user_id).all()


def get_dataset_service(dataset_id: int, user_id: int, db: Session):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == user_id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return dataset


def delete_dataset_service(dataset_id: int, user_id: int, db: Session):
    dataset = get_dataset_service(dataset_id, user_id, db)

    if os.path.exists(dataset.stored_path):
        os.remove(dataset.stored_path)

    db.delete(dataset)
    db.commit()

    return {"message": "Dataset deleted successfully"}