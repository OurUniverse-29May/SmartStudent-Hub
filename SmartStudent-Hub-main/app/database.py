"""
database.py — SQLite connection and session management.

SQLAlchemy creates the database file automatically on first run.
The file is stored at ./smartstudent.db (project root).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ---------------------------------------------------------------------------
# Database URL
# ---------------------------------------------------------------------------
# "sqlite:///./smartstudent.db" means:
#   - Use SQLite driver
#   - Create / open the file "smartstudent.db" in the current working directory
DATABASE_URL = "sqlite:///./smartstudent.db"

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# connect_args={"check_same_thread": False} is required for SQLite only.
# By default SQLite only allows the thread that created the connection to use it.
# FastAPI uses multiple threads, so we disable that restriction safely here
# because SQLAlchemy's session management handles concurrency for us.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,          # set True to print SQL statements to console for debugging
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
# SessionLocal is a class.  Each call to SessionLocal() creates a new session.
# autocommit=False → changes are not saved until session.commit() is called.
# autoflush=False  → SQLAlchemy won't flush changes to DB automatically.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---------------------------------------------------------------------------
# Base class for ORM models
# ---------------------------------------------------------------------------
# All model classes (in models.py) will inherit from this Base.
# SQLAlchemy uses it to track table definitions.
Base = declarative_base()


# ---------------------------------------------------------------------------
# Dependency — used by FastAPI route functions
# ---------------------------------------------------------------------------
def get_db():
    """
    Yield a database session, then close it when the request is done.

    FastAPI calls this function automatically for every request that
    declares `db: Session = Depends(get_db)` in its signature.

    The try/finally block guarantees the session is closed even if an
    exception is raised inside the route.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
