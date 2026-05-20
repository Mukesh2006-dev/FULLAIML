# AI-Powered Data Analysis & Machine Learning Platform

A scalable full-stack platform built using FastAPI and React for dataset management, data preprocessing, exploratory data analysis (EDA), machine learning model training, and prediction generation.

This project is designed to simulate a production-style AI/ML platform with clean backend architecture, asynchronous task processing, and interactive frontend visualization.

---

## Features

- User Authentication with JWT
- Dataset Upload & Management
- Data Preprocessing Pipeline
- Exploratory Data Analysis (EDA)
- Machine Learning Model Training
- Prediction APIs
- Interactive Frontend Dashboard
- Background Task Processing using Celery & Redis
- PostgreSQL Database Integration

---

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Celery
- Redis

### Frontend
- React
- Axios
- Tailwind CSS

### Machine Learning
- scikit-learn
- pandas
- NumPy

### Other Tools
- Docker
- GitHub Actions
- Pydantic

---

## Project Structure

```text
app/
 ├── api/
 ├── core/
 ├── models/
 ├── schemas/
 ├── services/
 ├── workers/
 └── main.py

1.First feature devlopment 
Au