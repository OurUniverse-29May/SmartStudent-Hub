"""
schemas.py — Pydantic models for request validation and response serialization.

Why Pydantic?
  • Automatically validates incoming JSON against type annotations.
  • Raises clear 422 Unprocessable Entity errors when data is wrong.
  • Controls exactly which fields are shown in API responses.

Schema hierarchy
  StudentBase      — shared fields used for both create and update
  StudentCreate    — inherits StudentBase; used for POST /students
  StudentUpdate    — all fields optional; used for PUT /students/{id}
  StudentPatch     — all fields optional; used for PATCH /students/{id}
  StudentResponse  — what the API returns (adds id, created_at, updated_at)
  PaginatedStudents— wraps a list of students with pagination metadata
  DashboardStats   — response shape for GET /stats
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Helper validators (reused across schemas)
# ---------------------------------------------------------------------------

def _validate_name(v: str) -> str:
    v = v.strip()
    if len(v) < 2:
        raise ValueError("Name must be at least 2 characters long.")
    if len(v) > 120:
        raise ValueError("Name must be 120 characters or fewer.")
    return v


def _validate_phone(v: str) -> str:
    v = v.strip()
    digits = v.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
    if not digits.isdigit():
        raise ValueError("Phone number must contain only digits, spaces, hyphens, or a leading '+'.")
    if len(digits) < 7 or len(digits) > 15:
        raise ValueError("Phone number must be between 7 and 15 digits.")
    return v


def _validate_course(v: str) -> str:
    v = v.strip()
    if len(v) < 2:
        raise ValueError("Course name must be at least 2 characters long.")
    if len(v) > 120:
        raise ValueError("Course name must be 120 characters or fewer.")
    return v


# ---------------------------------------------------------------------------
# Base schema — fields shared by create and update
# ---------------------------------------------------------------------------

class StudentBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Student's full name.",
        examples=["Arjun Sharma"],
    )
    date_of_birth: date = Field(
        ...,
        description="Date of birth in YYYY-MM-DD format.",
        examples=["2003-04-15"],
    )
    email: EmailStr = Field(
        ...,
        description="Valid email address (must be unique).",
        examples=["arjun.sharma@example.com"],
    )
    phone: str = Field(
        ...,
        min_length=7,
        max_length=20,
        description="Contact phone number.",
        examples=["+91-9876543210"],
    )
    course: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Programme or degree the student is enrolled in.",
        examples=["B.Tech Computer Science"],
    )
    address: Optional[str] = Field(
        None,
        max_length=300,
        description="Home or correspondence address (optional).",
        examples=["12, MG Road, Bangalore, Karnataka 560001"],
    )
    enrollment_date: date = Field(
        ...,
        description="Enrollment date in YYYY-MM-DD format.",
        examples=["2022-07-20"],
    )

    # ---- field-level validators ----

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return _validate_name(v)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)

    @field_validator("course")
    @classmethod
    def validate_course(cls, v: str) -> str:
        return _validate_course(v)

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        today = date.today()
        if v >= today:
            raise ValueError("Date of birth must be in the past.")
        age = (today - v).days // 365
        if age > 100:
            raise ValueError("Date of birth seems too far in the past (age > 100).")
        return v

    @field_validator("enrollment_date")
    @classmethod
    def validate_enrollment(cls, v: date) -> date:
        # Allow enrollment up to 30 days in the future (early registration)
        from datetime import timedelta
        if v > date.today() + timedelta(days=30):
            raise ValueError("Enrollment date cannot be more than 30 days in the future.")
        return v


# ---------------------------------------------------------------------------
# Create schema — all fields required (inherits StudentBase as-is)
# ---------------------------------------------------------------------------

class StudentCreate(StudentBase):
    """Used for POST /students. All fields required."""
    pass


# ---------------------------------------------------------------------------
# Update schema — all fields required (full replacement via PUT)
# ---------------------------------------------------------------------------

class StudentUpdate(StudentBase):
    """Used for PUT /students/{id}. All fields must be supplied."""
    pass


# ---------------------------------------------------------------------------
# Patch schema — every field is optional (partial update via PATCH)
# ---------------------------------------------------------------------------

class StudentPatch(BaseModel):
    """Used for PATCH /students/{id}. Only send the fields you want to change."""

    name: Optional[str] = Field(None, min_length=2, max_length=120, examples=["Priya Nair"])
    date_of_birth: Optional[date] = Field(None, examples=["2004-08-22"])
    email: Optional[EmailStr] = Field(None, examples=["priya.nair@example.com"])
    phone: Optional[str] = Field(None, min_length=7, max_length=20, examples=["+91-8765432109"])
    course: Optional[str] = Field(None, min_length=2, max_length=120, examples=["M.Sc Data Science"])
    address: Optional[str] = Field(None, max_length=300)
    enrollment_date: Optional[date] = Field(None, examples=["2023-07-18"])

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_name(v)
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_phone(v)
        return v

    @field_validator("course")
    @classmethod
    def validate_course(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_course(v)
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            today = date.today()
            if v >= today:
                raise ValueError("Date of birth must be in the past.")
            age = (today - v).days // 365
            if age > 100:
                raise ValueError("Date of birth seems too far in the past (age > 100).")
        return v

    @field_validator("enrollment_date")
    @classmethod
    def validate_enrollment(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            from datetime import timedelta
            if v > date.today() + timedelta(days=30):
                raise ValueError("Enrollment date cannot be more than 30 days in the future.")
        return v


# ---------------------------------------------------------------------------
# Response schema — what the API returns to the client
# ---------------------------------------------------------------------------

class StudentResponse(StudentBase):
    """
    Adds database-generated fields (id, created_at, updated_at) to the response.
    model_config from_attributes=True tells Pydantic to read data from
    SQLAlchemy ORM objects (not just plain dicts).
    """

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class PaginatedStudents(BaseModel):
    total: int = Field(..., description="Total number of matching students.")
    page: int = Field(..., description="Current page number (1-indexed).")
    page_size: int = Field(..., description="Number of records per page.")
    total_pages: int = Field(..., description="Total number of pages.")
    students: List[StudentResponse]


# ---------------------------------------------------------------------------
# Dashboard statistics response
# ---------------------------------------------------------------------------

class CourseCount(BaseModel):
    course: str
    count: int


class DashboardStats(BaseModel):
    total_students: int
    courses_offered: int
    students_per_course: List[CourseCount]
    newest_enrollment: Optional[date]
    oldest_enrollment: Optional[date]
