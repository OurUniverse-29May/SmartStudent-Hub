"""
models.py — SQLAlchemy ORM model for the students table.

This class maps directly to a table in the SQLite database.
SQLAlchemy reads the Column definitions and creates (or validates)
the matching SQL table when create_all() is called at startup.
"""

from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Student(Base):
    """
    Represents a single student row in the 'students' table.

    Columns
    -------
    id              — auto-incrementing integer primary key
    name            — student's full name (required)
    date_of_birth   — stored as a SQL DATE value
    email           — must be unique across all students
    phone           — contact number stored as text (keeps leading zeros / formatting)
    course          — programme / degree the student is enrolled in
    address         — home or correspondence address
    enrollment_date — the date the student enrolled
    created_at      — timestamp set automatically when the record is inserted
    updated_at      — timestamp updated automatically on every change
    """

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    name = Column(String(120), nullable=False, index=True)

    date_of_birth = Column(Date, nullable=False)

    # unique=True enforces the "no duplicate email" rule at the database level
    # in addition to the application-level check in crud.py
    email = Column(String(180), unique=True, nullable=False, index=True)

    phone = Column(String(20), nullable=False)

    course = Column(String(120), nullable=False, index=True)

    address = Column(String(300), nullable=True)

    enrollment_date = Column(Date, nullable=False)

    # server_default=func.now() tells SQLAlchemy to let the database set the
    # timestamp automatically — no need to pass it in the request body.
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # onupdate=func.now() refreshes this column every time the row is updated.
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Student id={self.id} name='{self.name}' email='{self.email}'>"
