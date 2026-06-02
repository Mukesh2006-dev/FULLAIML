from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:Adhi%401234@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user';"))
        print("Column 'role' added successfully.")
    except Exception as e:
        print("Error adding role:", e)
        
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR;"))
        print("Column 'profile_picture' added successfully.")
    except Exception as e:
        print("Error adding profile_picture:", e)

print("Done.")
