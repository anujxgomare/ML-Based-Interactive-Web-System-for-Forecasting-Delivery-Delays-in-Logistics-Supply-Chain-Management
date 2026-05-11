"""
Database configuration using SQLAlchemy.
Connects to MySQL (or SQLite as fallback for local dev).
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# ── Database URL ───────────────────────────────────────────────────────────────
# Use MySQL in production, SQLite for local dev if MySQL is unavailable
MYSQL_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/logipredict"
)

# SQLite fallback for zero-config local development
SQLITE_URL = "sqlite:///./logipredict.db"

# Detect which DB to use
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
DATABASE_URL = SQLITE_URL if USE_SQLITE else MYSQL_URL

# ── Engine Setup ───────────────────────────────────────────────────────────────
connect_args = {"check_same_thread": False} if USE_SQLITE else {}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
    print(f"✅ Connected to: {'SQLite' if USE_SQLITE else 'MySQL'}")
except Exception as e:
    print(f"⚠️  MySQL connection failed ({e}). Falling back to SQLite.")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency to get a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
