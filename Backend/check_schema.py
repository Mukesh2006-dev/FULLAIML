import sqlalchemy
from sqlalchemy import create_engine, inspect

DATABASE_URL = "postgresql://postgres:Adhi%401234@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
columns = inspector.get_columns('users')
print("Columns in 'users' table:")
for col in columns:
    print(f"- {col['name']} ({col['type']})")
