# AI-Powered Data Analysis & Machine Learning Platform

A scalable full-stack platform built using FastAPI and React for dataset management, data preprocessing, exploratory data analysis (EDA), machine learning model training, and prediction generation.

This project is designed to simulate a production-style AI/ML platform with clean backend architecture, asynchronous task processing, and interactive frontend visualization, styled with a modern dark theme and WebGL shader animations.

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
- Celery & Redis
- scikit-learn, pandas, NumPy

### Frontend
- React (Vite)
- Tailwind CSS v4
- Three.js / React Three Fiber (WebGL Animations)
- Axios & Lucide React

---

## Local Development Setup

Follow these steps to run the project locally.

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (Running locally)
- Redis (Running locally for Celery background tasks)

### 2. Backend Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd <repo-name>

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file in the root directory and configure your variables
# Example:
# DATABASE_URL=postgresql://user:password@localhost:5432/db_name
# SECRET_KEY=your_secret_key
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30
# CELERY_BROKER_URL=redis://localhost:6379/0
# CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Start the FastAPI server
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### 4. Background Workers (Optional)
If you are using background tasks for large datasets, start Celery:
```bash
celery -A app.workers.celery_worker.celery_app worker --loglevel=info
```

---

## Project Structure

```text
app/
 ├── api/           # FastAPI Routes
 ├── core/          # Config & Database Setup
 ├── models/        # SQLAlchemy Models
 ├── schemas/       # Pydantic Validation Schemas
 ├── services/      # Business Logic (ML, Preprocessing, EDA)
 ├── workers/       # Celery Tasks
 └── main.py        # FastAPI Application Entry
frontend/
 ├── src/
 │   ├── components/ # Reusable UI Components & Shaders
 │   ├── pages/      # Route Views (Dashboard, EDA, Visualizations)
 │   └── utils/      # API Handlers
```
