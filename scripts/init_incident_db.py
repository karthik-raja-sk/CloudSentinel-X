import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.session import engine
from app.db.base import Base

def init_db():
    print("Creating newly added tables (like Incident)..")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    init_db()
