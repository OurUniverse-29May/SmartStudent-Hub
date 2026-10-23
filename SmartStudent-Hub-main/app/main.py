"""
main.py — FastAPI application entry point.

Responsibilities:
  • Create the FastAPI app with metadata for the Swagger UI.
  • Register all routers.
  • Create database tables on startup.
  • Seed sample student data on first run.
  • Expose the /stats dashboard endpoint.
  • Expose an optional /ai/ask endpoint (requires local Ollama).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import date
from typing import Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import Base, SessionLocal, engine, get_db
from app.models import Student
from app.routes import students as students_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Sample dataset — 15 fictional students for demonstration
# ---------------------------------------------------------------------------
SAMPLE_STUDENTS = [
    {
        "name": "Arjun Sharma",
        "date_of_birth": date(2003, 4, 15),
        "email": "arjun.sharma@example.com",
        "phone": "+91-9876543210",
        "course": "B.Tech Computer Science",
        "address": "12, MG Road, Bangalore, Karnataka 560001",
        "enrollment_date": date(2022, 7, 20),
    },
    {
        "name": "Priya Nair",
        "date_of_birth": date(2004, 8, 22),
        "email": "priya.nair@example.com",
        "phone": "+91-8765432109",
        "course": "B.Sc Data Science",
        "address": "45, Palam Vihar, Gurugram, Haryana 122017",
        "enrollment_date": date(2023, 7, 18),
    },
    {
        "name": "Rohan Mehta",
        "date_of_birth": date(2002, 11, 5),
        "email": "rohan.mehta@example.com",
        "phone": "+91-9988776655",
        "course": "M.Tech Artificial Intelligence",
        "address": "7, Andheri West, Mumbai, Maharashtra 400058",
        "enrollment_date": date(2022, 8, 1),
    },
    {
        "name": "Sneha Iyer",
        "date_of_birth": date(2003, 2, 28),
        "email": "sneha.iyer@example.com",
        "phone": "+91-7654321098",
        "course": "B.Tech Computer Science",
        "address": "88, T. Nagar, Chennai, Tamil Nadu 600017",
        "enrollment_date": date(2022, 7, 25),
    },
    {
        "name": "Vikram Patel",
        "date_of_birth": date(2001, 6, 10),
        "email": "vikram.patel@example.com",
        "phone": "+91-6543210987",
        "course": "MBA Business Analytics",
        "address": "22, CG Road, Ahmedabad, Gujarat 380009",
        "enrollment_date": date(2023, 6, 15),
    },
    {
        "name": "Ananya Das",
        "date_of_birth": date(2004, 1, 17),
        "email": "ananya.das@example.com",
        "phone": "+91-9123456780",
        "course": "B.Sc Data Science",
        "address": "33, Park Street, Kolkata, West Bengal 700016",
        "enrollment_date": date(2023, 7, 20),
    },
    {
        "name": "Karan Singh",
        "date_of_birth": date(2002, 9, 3),
        "email": "karan.singh@example.com",
        "phone": "+91-8901234567",
        "course": "B.Tech Mechanical Engineering",
        "address": "56, Sector 17, Chandigarh 160017",
        "enrollment_date": date(2021, 8, 5),
    },
    {
        "name": "Divya Reddy",
        "date_of_birth": date(2003, 7, 14),
        "email": "divya.reddy@example.com",
        "phone": "+91-7890123456",
        "course": "M.Sc Data Science",
        "address": "10, Banjara Hills, Hyderabad, Telangana 500034",
        "enrollment_date": date(2022, 9, 1),
    },
    {
        "name": "Aditya Kumar",
        "date_of_birth": date(2005, 3, 21),
        "email": "aditya.kumar@example.com",
        "phone": "+91-6789012345",
        "course": "B.Tech Computer Science",
        "address": "4, Ashok Nagar, Jaipur, Rajasthan 302001",
        "enrollment_date": date(2024, 7, 22),
    },
    {
        "name": "Meera Pillai",
        "date_of_birth": date(2002, 12, 8),
        "email": "meera.pillai@example.com",
        "phone": "+91-5678901234",
        "course": "M.Tech Artificial Intelligence",
        "address": "78, Koramangala, Bangalore, Karnataka 560034",
        "enrollment_date": date(2022, 8, 10),
    },
    {
        "name": "Siddharth Joshi",
        "date_of_birth": date(2003, 5, 30),
        "email": "siddharth.joshi@example.com",
        "phone": "+91-9345678901",
        "course": "B.Tech Electrical Engineering",
        "address": "19, Shivaji Nagar, Pune, Maharashtra 411005",
        "enrollment_date": date(2022, 7, 28),
    },
    {
        "name": "Kavya Krishnan",
        "date_of_birth": date(2004, 10, 11),
        "email": "kavya.krishnan@example.com",
        "phone": "+91-8234567890",
        "course": "B.Sc Data Science",
        "address": "63, Adyar, Chennai, Tamil Nadu 600020",
        "enrollment_date": date(2023, 8, 2),
    },
    {
        "name": "Rahul Verma",
        "date_of_birth": date(2001, 8, 25),
        "email": "rahul.verma@example.com",
        "phone": "+91-7123456789",
        "course": "MBA Business Analytics",
        "address": "5, Connaught Place, New Delhi 110001",
        "enrollment_date": date(2023, 6, 20),
    },
    {
        "name": "Pooja Gupta",
        "date_of_birth": date(2003, 3, 19),
        "email": "pooja.gupta@example.com",
        "phone": "+91-9456789012",
        "course": "B.Tech Computer Science",
        "address": "27, Hazratganj, Lucknow, Uttar Pradesh 226001",
        "enrollment_date": date(2022, 7, 15),
    },
    {
        "name": "Nikhil Banerjee",
        "date_of_birth": date(2002, 7, 7),
        "email": "nikhil.banerjee@example.com",
        "phone": "+91-8567890123",
        "course": "M.Tech Artificial Intelligence",
        "address": "14, Salt Lake, Kolkata, West Bengal 700064",
        "enrollment_date": date(2021, 9, 3),
    },
]


def seed_sample_data(db: Session) -> None:
    """Insert sample students only if the table is empty."""
    count = db.query(Student).count()
    if count > 0:
        logger.info("Database already has %d student(s). Skipping seed.", count)
        return

    for data in SAMPLE_STUDENTS:
        student = Student(**data)
        db.add(student)
    db.commit()
    logger.info("Seeded %d sample students into the database.", len(SAMPLE_STUDENTS))


# ---------------------------------------------------------------------------
# Lifespan — runs on startup and shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code before 'yield' runs at startup.
    Code after 'yield' runs at shutdown.
    """
    logger.info("Starting SmartStudent Hub…")

    # Create all tables defined in models.py (safe to call multiple times)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified / created.")

    # Seed sample data
    with SessionLocal() as db:
        seed_sample_data(db)

    logger.info("SmartStudent Hub is ready. Visit http://127.0.0.1:8000/docs")
    yield
    logger.info("SmartStudent Hub shutting down.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SmartStudent Hub",
    description=(
        "## Smart Student Record Management API\n\n"
        "A complete **CRUD API** for managing student records, built with:\n"
        "- **FastAPI** — high-performance Python web framework\n"
        "- **SQLite + SQLAlchemy** — persistent relational storage\n"
        "- **Pydantic** — automatic request validation\n\n"
        "### Features\n"
        "- Full CRUD operations on student records\n"
        "- Smart search and filtering by name, course, and email\n"
        "- Pagination on list endpoints\n"
        "- Dashboard statistics (totals, course breakdown)\n"
        "- Duplicate email prevention with 409 Conflict responses\n"
        "- Optional AI assistant powered by local Ollama\n\n"
        "**EWB Edu Tech Pvt. Ltd. — Internship Assignment**"
    ),
    version="1.0.0",
    contact={
        "name": "SmartStudent Hub",
        "email": "support@smartstudent.example.com",
    },
    license_info={"name": "MIT"},
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS middleware — allows browser-based tools (like Swagger) to call the API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------
app.include_router(
    students_router.router,
    prefix="/students",
    tags=["Students"],
)


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"], summary="API health check")
def root():
    return {
        "status": "running",
        "app": "SmartStudent Hub",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


# ---------------------------------------------------------------------------
# Dashboard statistics endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/stats",
    response_model=schemas.DashboardStats,
    tags=["Dashboard"],
    summary="Dashboard statistics",
    description=(
        "Returns aggregate statistics: total students, number of courses offered, "
        "student count per course, newest and oldest enrollment dates."
    ),
)
def dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


# ---------------------------------------------------------------------------
# Optional Ollama AI assistant
# ---------------------------------------------------------------------------

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"          # change to any model you have pulled locally


@app.post(
    "/ai/ask",
    tags=["AI Assistant (Optional)"],
    summary="Ask the AI assistant about student data",
    description=(
        "Ask natural-language questions about the student database. "
        "The API fetches relevant aggregated data and sends it to a local Ollama model. "
        "**Requires Ollama to be running locally with a supported model.** "
        "The core application works normally if Ollama is unavailable."
    ),
)
async def ask_ai(
    question: str = Query(..., description="Your question about student data."),
    db: Session = Depends(get_db),
):
    # ---- Gather context from the database (no raw SQL from the AI) ----
    stats = crud.get_dashboard_stats(db)

    # Build a safe, structured context string
    course_lines = "\n".join(
        f"  - {row['course']}: {row['count']} student(s)"
        for row in stats["students_per_course"]
    )
    context = (
        f"Student database summary:\n"
        f"  Total students: {stats['total_students']}\n"
        f"  Courses offered: {stats['courses_offered']}\n"
        f"Students per course:\n{course_lines}\n"
        f"  Newest enrollment: {stats['newest_enrollment']}\n"
        f"  Oldest enrollment: {stats['oldest_enrollment']}\n"
    )

    prompt = (
        f"You are a helpful student records assistant. "
        f"Answer the following question using ONLY the data provided below. "
        f"Do not invent data or make assumptions beyond what is given.\n\n"
        f"Data:\n{context}\n\n"
        f"Question: {question}\n"
        f"Answer:"
    )

    # ---- Call Ollama ----
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            result = response.json()
            answer = result.get("response", "").strip()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Ollama is not running. Start it with 'ollama serve' and ensure "
                f"the model '{OLLAMA_MODEL}' is available ('ollama pull {OLLAMA_MODEL}')."
            ),
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama returned an error: {exc.response.status_code}",
        )

    return {
        "question": question,
        "answer": answer,
        "data_used": context,
    }
