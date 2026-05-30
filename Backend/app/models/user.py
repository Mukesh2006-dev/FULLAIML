from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from Backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, nullable=False)

    email = Column(String, unique=True, nullable=False)

    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    datasets=relationship("Dataset",back_populates="owner")