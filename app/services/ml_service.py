import os
import uuid
import joblib
import pandas as pd

from fastapi import HTTPException
from sqlalchemy.orm import Session

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_squared_error,
    r2_score
)

from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

from app.models.dataset import Dataset
from app.models.ml_model import MLModel
from app.schemas.ml_model import TrainModelRequest
from app.utils.csv_utils import read_csv_safely


MODEL_DIR = "storage/models"
os.makedirs(MODEL_DIR, exist_ok=True)


def get_dataset_or_404(dataset_id: int, user_id: int, db: Session):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == user_id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return dataset


def get_algorithm_model(algorithm: str, problem_type: str, hyperparameters: dict):
    if problem_type == "classification":
        if algorithm == "logistic_regression":
            return LogisticRegression(max_iter=1000, **hyperparameters)

        if algorithm == "random_forest":
            return RandomForestClassifier(**hyperparameters)

    if problem_type == "regression":
        if algorithm == "linear_regression":
            return LinearRegression(**hyperparameters)

        if algorithm == "random_forest":
            return RandomForestRegressor(**hyperparameters)

    raise HTTPException(
        status_code=400,
        detail="Invalid algorithm or problem type"
    )


def prepare_dataset(df: pd.DataFrame, target_column: str):
    if target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Target column not found"
        )

    df = df.dropna(subset=[target_column])

    X = df.drop(columns=[target_column])
    y = df[target_column]

    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]):
            X[col] = X[col].fillna(X[col].median())
        else:
            X[col] = X[col].fillna("missing")

    X = pd.get_dummies(X, drop_first=True)

    X = X.fillna(0)

    label_encoder = None

    if y.dtype == "object":
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y)

    return X, y, label_encoder


def train_model_service(request: TrainModelRequest, user_id: int, db: Session):
    dataset = get_dataset_or_404(
        dataset_id=request.dataset_id,
        user_id=user_id,
        db=db
    )
    df = read_csv_safely(dataset.stored_path)

    X, y, label_encoder = prepare_dataset(df, request.target_column)

    if X.empty:
        raise HTTPException(status_code=400, detail="No features available for training")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=request.test_size,
        random_state=request.random_state
    )

    model = get_algorithm_model(
        algorithm=request.algorithm,
        problem_type=request.problem_type,
        hyperparameters=request.hyperparameters or {}
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    if request.problem_type == "classification":
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred, average="weighted")), 4)
        }

    elif request.problem_type == "regression":
        metrics = {
            "rmse": round(float(mean_squared_error(y_test, y_pred) ** 0.5), 4),
            "r2_score": round(float(r2_score(y_test, y_pred)), 4)
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid problem type")

    model_filename = f"{uuid.uuid4()}_{request.model_name}.pkl"
    model_path = os.path.join(MODEL_DIR, model_filename)

    model_package = {
        "model": model,
        "columns": X.columns.tolist(),
        "label_encoder": label_encoder,
        "target_column": request.target_column,
        "problem_type": request.problem_type
    }

    joblib.dump(model_package, model_path)

    new_model = MLModel(
        user_id=user_id,
        dataset_id=request.dataset_id,
        model_name=request.model_name,
        algorithm=request.algorithm,
        problem_type=request.problem_type,
        target_column=request.target_column,
        model_path=model_path,
        metrics=metrics
    )

    db.add(new_model)
    db.commit()
    db.refresh(new_model)

    return {
        "message": "Model trained successfully",
        "model_id": new_model.id,
        "model_name": new_model.model_name,
        "algorithm": new_model.algorithm,
        "problem_type": new_model.problem_type,
        "target_column": new_model.target_column,
        "metrics": metrics,
        "model_path": model_path
    }