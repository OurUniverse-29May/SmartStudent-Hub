"""
routes/students.py — All HTTP route handlers for student operations.

Each function:
  1. Receives validated input from Pydantic.
  2. Calls the appropriate crud.py function.
  3. Returns a typed response with the correct HTTP status code.

FastAPI handles JSON serialisation, OpenAPI docs, and error responses
automatically based on the type hints and response_model declarations.
"""

from __future__ import annotations

import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

# APIRouter groups all student-related routes under the /students prefix.
# The prefix and tags are applied in main.py when the router is included.
router = APIRouter()


# ---------------------------------------------------------------------------
# POST /students — Create a new student
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=schemas.StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student",
    description=(
        "Create a new student record. "
        "The email address must be unique across all students. "
        "Returns the created student with its auto-generated ID."
    ),
)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
):
    """
    Create student endpoint.

    - Checks for duplicate email → 409 Conflict if found.
    - Saves to SQLite and returns the new record with HTTP 201.
    """
    existing = crud.get_student_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A student with email '{payload.email}' already exists (ID: {existing.id}).",
        )

    student = crud.create_student(db, payload)
    return student


# ---------------------------------------------------------------------------
# GET /students — List all students (paginated, filterable)
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=schemas.PaginatedStudents,
    summary="List students",
    description=(
        "Retrieve a paginated list of students. "
        "Filter by name, course, or email. "
        "Use the 'search' parameter for a free-text search across all three fields."
    ),
)
def list_students(
    name: Optional[str] = Query(None, description="Filter by student name (partial match)."),
    course: Optional[str] = Query(None, description="Filter by course name (partial match)."),
    email: Optional[str] = Query(None, description="Filter by email (partial match)."),
    search: Optional[str] = Query(None, description="Free-text search across name, course, and email."),
    page: int = Query(1, ge=1, description="Page number (starts at 1)."),
    page_size: int = Query(10, ge=1, le=100, description="Records per page (max 100)."),
    db: Session = Depends(get_db),
):
    students, total = crud.get_students(
        db,
        name=name,
        course=course,
        email=email,
        search=search,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return schemas.PaginatedStudents(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        students=students,
    )


# ---------------------------------------------------------------------------
# GET /students/{student_id} — Retrieve a single student
# ---------------------------------------------------------------------------

@router.get(
    "/{student_id}",
    response_model=schemas.StudentResponse,
    summary="Get student by ID",
    description="Retrieve a single student record by their unique numeric ID.",
)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} was not found.",
        )
    return student


# ---------------------------------------------------------------------------
# PUT /students/{student_id} — Full update (replace all fields)
# ---------------------------------------------------------------------------

@router.put(
    "/{student_id}",
    response_model=schemas.StudentResponse,
    summary="Full update of a student record",
    description=(
        "Replace all fields of an existing student. "
        "Every field is required. "
        "To update only specific fields, use PATCH instead."
    ),
)
def update_student(
    student_id: int,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} was not found.",
        )

    # Check email conflict only if the email is being changed
    if payload.email.lower() != student.email.lower():
        existing = crud.get_student_by_email(db, payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{payload.email}' is already registered to student ID {existing.id}.",
            )

    return crud.update_student(db, student, payload)


# ---------------------------------------------------------------------------
# PATCH /students/{student_id} — Partial update
# ---------------------------------------------------------------------------

@router.patch(
    "/{student_id}",
    response_model=schemas.StudentResponse,
    summary="Partial update of a student record",
    description=(
        "Update one or more fields of a student without replacing the entire record. "
        "Only the fields you include in the request body will be changed."
    ),
)
def patch_student(
    student_id: int,
    payload: schemas.StudentPatch,
    db: Session = Depends(get_db),
):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} was not found.",
        )

    # Email conflict check for partial update
    if payload.email and payload.email.lower() != student.email.lower():
        existing = crud.get_student_by_email(db, payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{payload.email}' is already registered to student ID {existing.id}.",
            )

    return crud.patch_student(db, student, payload)


# ---------------------------------------------------------------------------
# DELETE /students/{student_id} — Delete a student
# ---------------------------------------------------------------------------

@router.delete(
    "/{student_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a student",
    description="Permanently delete a student record by ID. Returns a confirmation message.",
)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} was not found.",
        )

    name = student.name   # capture before deletion
    crud.delete_student(db, student)

    return {
        "message": f"Student '{name}' (ID: {student_id}) has been successfully deleted.",
        "deleted_id": student_id,
    }
