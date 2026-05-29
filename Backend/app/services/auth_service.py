import secrets
from fastapi import HTTPException
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token 


from Backend.app.models.user import User
from Backend.app.schemas.user import UserCreate, UserLogin
from Backend.app.core.security import hash_password, verify_password, create_access_token
from Backend.app.core.config import settings


def register_user_service(user_data: UserCreate, db: Session):
    existing_user = (
        db.query(User)
        .filter(
            (User.email == user_data.email) |
            (User.username == user_data.username)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def login_user_service(user_data: UserLogin, db: Session):
    email = user_data.email.lower()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


def google_login_service(token: str, db: Session):
    try:
        google_user = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.google_client_id
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = google_user.get("email")
    name = google_user.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Google email not found")

    email = email.lower()

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        access_token = create_access_token(data={"sub": str(existing_user.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    username = name or email.split("@")[0]

    username_exists = db.query(User).filter(User.username == username).first()

    if username_exists:
        username = f"{username}_{secrets.token_hex(4)}"

    random_password = secrets.token_urlsafe(32)

    new_user = User(
        username=username,
        email=email,
        hashed_password=hash_password(random_password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }