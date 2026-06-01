from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:Adhi%401234@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0;"))
print("Column added successfully.")
