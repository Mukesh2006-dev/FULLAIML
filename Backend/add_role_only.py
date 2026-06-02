from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:Adhi%401234@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("COMMIT")) # turn off implicit transaction for a moment if needed, or just use connection
    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user';"))
    conn.commit()
    print("Column 'role' added successfully.")
