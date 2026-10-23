"""
crud.py — All database operations (Create, Read, Update, Delete).

Every function accepts a SQLAlchemy Session and returns ORM objects or None.
Routes call these functions; they never interact with the DB directly.

This separation keeps route logic thin and makes testing easier — you can
unit-test CRUD functions independently of HTTP concerns.
"""

from __future__ import annotations

import math
from typing import Optional, Tuple, List

from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models import Student
from app.schemas import StudentCreate, StudentUpdate, StudentPatch


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def create_student(db: Session, data: StudentCreate) -> Student:
    """
    Insert a new student row.

    Steps:
      1. Build a Student ORM object from the validated Pydantic data.
      2. Add it to the session (marks it as pending).
      3. Commit → writes to SQLite.
      4. Refresh → re-reads the row so auto-generated fields (id, created_at)
         are available on the returned object.
    """
    student = Student(
        name=data.name,
        date_of_birth=data.date_of_birth,
        email=data.email.lower(),          # normalise email to lowercase
        phone=data.phone,
        course=data.course,
        address=data.address,
        enrollment_date=data.enrollment_date,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


# ---------------------------------------------------------------------------
# READ — single student by ID
# ---------------------------------------------------------------------------

def get_student_by_id(db: Session, student_id: int) -> Optional[Student]:
    """Return the Student with the given primary key, or None if not found."""
    return db.query(Student).filter(Student.id == student_id).first()


# ---------------------------------------------------------------------------
# READ — single student by email
# ---------------------------------------------------------------------------

def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Used to check for duplicate emails before create/update."""
    return db.query(Student).filter(Student.email == email.lower()).first()


# ---------------------------------------------------------------------------
# READ — list with search, filter, and pagination
# ---------------------------------------------------------------------------

def get_students(
    db: Session,
    *,
    name: Optional[str] = None,
    course: Optional[str] = None,
    email: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Student], int]:
    """
    Return a paginated list of students with optional filters.

    Parameters
    ----------
    name        — partial, case-insensitive match on student name
    course      — partial, case-insensitive match on course
    email       — partial, case-insensitive match on email
    search      — free-text search across name, course, and email (OR logic)
    page        — 1-indexed page number
    page_size   — records per page (capped at 100)

    Returns
    -------
    (list_of_students, total_count)
    """
    page_size = min(page_size, 100)   # safety cap
    page = max(page, 1)

    query = db.query(Student)

    # Apply individual column filters first (AND logic between filters)
    if name:
        query = query.filter(Student.name.ilike(f"%{name}%"))
    if course:
        query = query.filter(Student.course.ilike(f"%{course}%"))
    if email:
        query = query.filter(Student.email.ilike(f"%{email}%"))

    # Free-text search: match across name OR course OR email
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(pattern),
                Student.course.ilike(pattern),
                Student.email.ilike(pattern),
            )
        )

    # Count BEFORE slicing — used for pagination metadata
    total = query.count()

    # Order by id ascending (consistent ordering)
    students = (
        query.order_by(Student.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return students, total


# ---------------------------------------------------------------------------
# UPDATE — full replacement (PUT)
# ---------------------------------------------------------------------------

def update_student(db: Session, student: Student, data: StudentUpdate) -> Student:
    """
    Replace all mutable fields of an existing student.

    The caller is responsible for fetching the student first and checking
    for email conflicts.
    """
    student.name = data.name
    student.date_of_birth = data.date_of_birth
    student.email = data.email.lower()
    student.phone = data.phone
    student.course = data.course
    student.address = data.address
    student.enrollment_date = data.enrollment_date

    db.commit()
    db.refresh(student)
    return student


# ---------------------------------------------------------------------------
# UPDATE — partial (PATCH)
# ---------------------------------------------------------------------------

def patch_student(db: Session, student: Student, data: StudentPatch) -> Student:
    """
    Update only the fields that were explicitly supplied in the request body.

    data.model_dump(exclude_unset=True) returns only the fields the client
    actually sent — unset fields are left unchanged on the database row.
    """
    updates = data.model_dump(exclude_unset=True)

    # Normalise email if it's being updated
    if "email" in updates and updates["email"]:
        updates["email"] = updates["email"].lower()

    for field, value in updates.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

def delete_student(db: Session, student: Student) -> None:
    """Remove the student row from the database permanently."""
    db.delete(student)
    db.commit()


# ---------------------------------------------------------------------------
# STATISTICS — dashboard
# ---------------------------------------------------------------------------

def get_dashboard_stats(db: Session) -> dict:
    """
    Return aggregate statistics for the dashboard endpoint.

    Uses SQLAlchemy's func.count() which translates to SQL COUNT() —
    no raw SQL strings involved.
    """
    total_students: int = db.query(func.count(Student.id)).scalar() or 0

    # GROUP BY course — returns list of (course_name, count) tuples
    course_counts = (
        db.query(Student.course, func.count(Student.id).label("count"))
        .group_by(Student.course)
        .order_by(func.count(Student.id).desc())
        .all()
    )

    newest = db.query(func.max(Student.enrollment_date)).scalar()
    oldest = db.query(func.min(Student.enrollment_date)).scalar()

    return {
        "total_students": total_students,
        "courses_offered": len(course_counts),
        "students_per_course": [
            {"course": row[0], "count": row[1]} for row in course_counts
        ],
        "newest_enrollment": newest,
        "oldest_enrollment": oldest,
    }
