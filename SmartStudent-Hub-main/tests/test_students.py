"""
tests/test_students.py — Automated test suite for SmartStudent Hub.

Every test uses an isolated in-memory SQLite database so the real
smartstudent.db file is never touched during testing.

Test coverage:
  ✓ Create a student successfully
  ✓ Reject invalid input (bad email, missing fields, bad date)
  ✓ Reject duplicate emails (409)
  ✓ List all students (paginated)
  ✓ Search and filter students
  ✓ Retrieve a student by ID
  ✓ Return 404 for missing student IDs
  ✓ Full update (PUT)
  ✓ Partial update (PATCH)
  ✓ Delete a student
  ✓ Verify database changes persist within the same session
  ✓ Dashboard statistics endpoint
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# ---------------------------------------------------------------------------
# Isolated test database setup
# ---------------------------------------------------------------------------

# Use an in-memory SQLite database for tests.
# "check_same_thread": False is required for SQLite.
TEST_DATABASE_URL = "sqlite:///./test_smartstudent.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Replace the real DB session with a test session for every request."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the dependency BEFORE the TestClient is created
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    """Create all tables once before the module's tests run, drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    # Dispose engine connections before removing the file (required on Windows)
    test_engine.dispose()
    import os, time
    for _ in range(5):
        try:
            if os.path.exists("test_smartstudent.db"):
                os.remove("test_smartstudent.db")
            break
        except PermissionError:
            time.sleep(0.5)


# ---------------------------------------------------------------------------
# Shared test client
# ---------------------------------------------------------------------------

client = TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Helper — valid student payload
# ---------------------------------------------------------------------------

def valid_student(suffix: str = "1") -> dict:
    """Return a complete, valid student payload. Change suffix to get unique emails."""
    return {
        "name": f"Test Student {suffix}",
        "date_of_birth": "2003-06-15",
        "email": f"test.student{suffix}@example.com",
        "phone": "+91-9000000000",
        "course": "B.Tech Computer Science",
        "address": "1, Test Street, Testville 000001",
        "enrollment_date": "2022-07-01",
    }


# ===========================================================================
# 1. CREATE — success
# ===========================================================================

class TestCreateStudent:

    def test_create_student_returns_201(self):
        response = client.post("/students/", json=valid_student("A"))
        assert response.status_code == 201, response.text

    def test_create_student_response_has_id(self):
        response = client.post("/students/", json=valid_student("B"))
        data = response.json()
        assert "id" in data
        assert isinstance(data["id"], int)

    def test_create_student_response_fields_match(self):
        payload = valid_student("C")
        response = client.post("/students/", json=payload)
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"].lower()
        assert data["course"] == payload["course"]

    def test_create_student_email_lowercased(self):
        payload = valid_student("D")
        payload["email"] = "TEST.UPPER@EXAMPLE.COM"
        response = client.post("/students/", json=payload)
        assert response.status_code == 201
        assert response.json()["email"] == "test.upper@example.com"

    def test_create_student_without_address(self):
        """Address is optional — creating without it should succeed."""
        payload = valid_student("E")
        del payload["address"]
        response = client.post("/students/", json=payload)
        assert response.status_code == 201
        assert response.json()["address"] is None


# ===========================================================================
# 2. VALIDATION — reject invalid input
# ===========================================================================

class TestInputValidation:

    def test_reject_invalid_email(self):
        payload = valid_student("V1")
        payload["email"] = "not-an-email"
        response = client.post("/students/", json=payload)
        assert response.status_code == 422

    def test_reject_missing_name(self):
        payload = valid_student("V2")
        del payload["name"]
        response = client.post("/students/", json=payload)
        assert response.status_code == 422

    def test_reject_missing_course(self):
        payload = valid_student("V3")
        del payload["course"]
        response = client.post("/students/", json=payload)
        assert response.status_code == 422

    def test_reject_future_date_of_birth(self):
        payload = valid_student("V4")
        payload["date_of_birth"] = "2099-01-01"
        response = client.post("/students/", json=payload)
        assert response.status_code == 422

    def test_reject_name_too_short(self):
        payload = valid_student("V5")
        payload["name"] = "X"
        response = client.post("/students/", json=payload)
        assert response.status_code == 422

    def test_reject_invalid_phone(self):
        payload = valid_student("V6")
        payload["phone"] = "abc"
        response = client.post("/students/", json=payload)
        assert response.status_code == 422

    def test_reject_missing_enrollment_date(self):
        payload = valid_student("V7")
        del payload["enrollment_date"]
        response = client.post("/students/", json=payload)
        assert response.status_code == 422


# ===========================================================================
# 3. DUPLICATE EMAIL — 409 Conflict
# ===========================================================================

class TestDuplicateEmail:

    def test_duplicate_email_returns_409(self):
        payload = valid_student("DUP")
        # First creation must succeed
        r1 = client.post("/students/", json=payload)
        assert r1.status_code == 201
        # Second creation with same email must fail
        r2 = client.post("/students/", json=payload)
        assert r2.status_code == 409

    def test_duplicate_email_error_message(self):
        payload = valid_student("DUP2")
        client.post("/students/", json=payload)
        response = client.post("/students/", json=payload)
        assert "already exists" in response.json()["detail"].lower()


# ===========================================================================
# 4. READ — list students
# ===========================================================================

class TestListStudents:

    def test_list_returns_200(self):
        response = client.get("/students/")
        assert response.status_code == 200

    def test_list_response_has_pagination_fields(self):
        response = client.get("/students/")
        data = response.json()
        for field in ("total", "page", "page_size", "total_pages", "students"):
            assert field in data, f"Missing field: {field}"

    def test_list_students_is_list(self):
        response = client.get("/students/")
        assert isinstance(response.json()["students"], list)

    def test_pagination_page_size(self):
        response = client.get("/students/?page=1&page_size=2")
        data = response.json()
        assert len(data["students"]) <= 2

    def test_pagination_page_2(self):
        # Create enough students to guarantee page 2 exists
        for i in range(5):
            client.post("/students/", json=valid_student(f"PG{i}"))
        r1 = client.get("/students/?page=1&page_size=3")
        r2 = client.get("/students/?page=2&page_size=3")
        ids_page1 = {s["id"] for s in r1.json()["students"]}
        ids_page2 = {s["id"] for s in r2.json()["students"]}
        assert ids_page1.isdisjoint(ids_page2), "Pages should not overlap"


# ===========================================================================
# 5. SEARCH & FILTER
# ===========================================================================

class TestSearchFilter:

    @pytest.fixture(autouse=True)
    def seed_search_students(self):
        """Create two known students specifically for search tests."""
        client.post("/students/", json={
            "name": "Search Alpha",
            "date_of_birth": "2002-05-10",
            "email": "search.alpha@example.com",
            "phone": "+91-9111111111",
            "course": "M.Sc Physics",
            "enrollment_date": "2022-07-01",
        })
        client.post("/students/", json={
            "name": "Search Beta",
            "date_of_birth": "2003-09-20",
            "email": "search.beta@example.com",
            "phone": "+91-9222222222",
            "course": "B.Sc Chemistry",
            "enrollment_date": "2023-07-01",
        })

    def test_filter_by_name(self):
        response = client.get("/students/?name=Search+Alpha")
        data = response.json()
        assert data["total"] >= 1
        assert any("Alpha" in s["name"] for s in data["students"])

    def test_filter_by_course(self):
        response = client.get("/students/?course=M.Sc+Physics")
        data = response.json()
        assert data["total"] >= 1
        assert all("Physics" in s["course"] for s in data["students"])

    def test_filter_by_email(self):
        response = client.get("/students/?email=search.alpha")
        data = response.json()
        assert data["total"] >= 1

    def test_free_text_search(self):
        response = client.get("/students/?search=Search")
        data = response.json()
        assert data["total"] >= 2

    def test_search_no_results(self):
        response = client.get("/students/?name=ZZZ_NONEXISTENT_XYZ")
        data = response.json()
        assert data["total"] == 0
        assert data["students"] == []


# ===========================================================================
# 6. READ — single student by ID
# ===========================================================================

class TestGetStudentById:

    def test_get_existing_student(self):
        # Create a student and fetch it back by ID
        create_resp = client.post("/students/", json=valid_student("GET1"))
        student_id = create_resp.json()["id"]
        response = client.get(f"/students/{student_id}")
        assert response.status_code == 200
        assert response.json()["id"] == student_id

    def test_get_student_fields(self):
        create_resp = client.post("/students/", json=valid_student("GET2"))
        student_id = create_resp.json()["id"]
        data = client.get(f"/students/{student_id}").json()
        for field in ("id", "name", "email", "course", "date_of_birth", "enrollment_date"):
            assert field in data


# ===========================================================================
# 7. 404 — missing student
# ===========================================================================

class TestNotFound:

    def test_get_nonexistent_student_returns_404(self):
        response = client.get("/students/999999")
        assert response.status_code == 404

    def test_put_nonexistent_student_returns_404(self):
        response = client.put("/students/999999", json=valid_student("NF1"))
        assert response.status_code == 404

    def test_patch_nonexistent_student_returns_404(self):
        response = client.patch("/students/999999", json={"name": "Ghost"})
        assert response.status_code == 404

    def test_delete_nonexistent_student_returns_404(self):
        response = client.delete("/students/999999")
        assert response.status_code == 404

    def test_404_has_detail_message(self):
        response = client.get("/students/888888")
        assert "detail" in response.json()


# ===========================================================================
# 8. UPDATE — full replacement (PUT)
# ===========================================================================

class TestUpdateStudent:

    def test_put_updates_all_fields(self):
        create_resp = client.post("/students/", json=valid_student("UPD1"))
        student_id = create_resp.json()["id"]

        updated = {
            "name": "Updated Name",
            "date_of_birth": "2001-01-01",
            "email": f"updated.upd1@example.com",
            "phone": "+91-9000000001",
            "course": "M.Tech AI",
            "address": "New Address",
            "enrollment_date": "2021-08-01",
        }
        response = client.put(f"/students/{student_id}", json=updated)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["course"] == "M.Tech AI"

    def test_put_email_conflict_returns_409(self):
        # Create two students
        r1 = client.post("/students/", json=valid_student("UPD2"))
        r2 = client.post("/students/", json=valid_student("UPD3"))
        id2 = r2.json()["id"]

        # Try to update student 2's email to student 1's email → conflict
        payload = valid_student("UPD3")
        payload["email"] = r1.json()["email"]
        response = client.put(f"/students/{id2}", json=payload)
        assert response.status_code == 409


# ===========================================================================
# 9. UPDATE — partial (PATCH)
# ===========================================================================

class TestPatchStudent:

    def test_patch_only_name(self):
        create_resp = client.post("/students/", json=valid_student("PCH1"))
        student_id = create_resp.json()["id"]

        response = client.patch(f"/students/{student_id}", json={"name": "Patched Name"})
        assert response.status_code == 200
        assert response.json()["name"] == "Patched Name"
        # Email must remain unchanged
        assert response.json()["email"] == valid_student("PCH1")["email"].lower()

    def test_patch_only_course(self):
        create_resp = client.post("/students/", json=valid_student("PCH2"))
        student_id = create_resp.json()["id"]

        response = client.patch(f"/students/{student_id}", json={"course": "MBA Finance"})
        assert response.status_code == 200
        assert response.json()["course"] == "MBA Finance"

    def test_patch_email_conflict_returns_409(self):
        r1 = client.post("/students/", json=valid_student("PCH3"))
        r2 = client.post("/students/", json=valid_student("PCH4"))
        id2 = r2.json()["id"]

        # Patch student 2's email to student 1's email → conflict
        response = client.patch(f"/students/{id2}", json={"email": r1.json()["email"]})
        assert response.status_code == 409


# ===========================================================================
# 10. DELETE
# ===========================================================================

class TestDeleteStudent:

    def test_delete_returns_200(self):
        create_resp = client.post("/students/", json=valid_student("DEL1"))
        student_id = create_resp.json()["id"]
        response = client.delete(f"/students/{student_id}")
        assert response.status_code == 200

    def test_delete_response_contains_confirmation(self):
        create_resp = client.post("/students/", json=valid_student("DEL2"))
        student_id = create_resp.json()["id"]
        data = client.delete(f"/students/{student_id}").json()
        assert "deleted_id" in data
        assert data["deleted_id"] == student_id

    def test_deleted_student_no_longer_retrievable(self):
        create_resp = client.post("/students/", json=valid_student("DEL3"))
        student_id = create_resp.json()["id"]
        client.delete(f"/students/{student_id}")
        response = client.get(f"/students/{student_id}")
        assert response.status_code == 404


# ===========================================================================
# 11. PERSISTENCE — changes survive within the session
# ===========================================================================

class TestPersistence:

    def test_created_student_appears_in_list(self):
        payload = valid_student("PERSIST1")
        create_resp = client.post("/students/", json=payload)
        new_id = create_resp.json()["id"]

        # Fetch the list and confirm the new student is there
        list_resp = client.get("/students/?page_size=100")
        ids = [s["id"] for s in list_resp.json()["students"]]
        assert new_id in ids

    def test_updated_name_visible_on_get(self):
        create_resp = client.post("/students/", json=valid_student("PERSIST2"))
        sid = create_resp.json()["id"]
        client.patch(f"/students/{sid}", json={"name": "Persistence Check"})
        get_resp = client.get(f"/students/{sid}")
        assert get_resp.json()["name"] == "Persistence Check"

    def test_deleted_student_not_in_list(self):
        create_resp = client.post("/students/", json=valid_student("PERSIST3"))
        sid = create_resp.json()["id"]
        client.delete(f"/students/{sid}")
        # Use page_size=100 (max allowed) to scan a large page
        list_resp = client.get("/students/?page_size=100")
        ids = [s["id"] for s in list_resp.json()["students"]]
        assert sid not in ids


# ===========================================================================
# 12. DASHBOARD STATISTICS
# ===========================================================================

class TestDashboard:

    def test_stats_returns_200(self):
        response = client.get("/stats")
        assert response.status_code == 200

    def test_stats_has_required_fields(self):
        data = client.get("/stats").json()
        for field in ("total_students", "courses_offered", "students_per_course"):
            assert field in data, f"Missing field: {field}"

    def test_stats_total_is_non_negative(self):
        data = client.get("/stats").json()
        assert data["total_students"] >= 0

    def test_stats_students_per_course_is_list(self):
        data = client.get("/stats").json()
        assert isinstance(data["students_per_course"], list)

    def test_stats_count_increases_after_create(self):
        before = client.get("/stats").json()["total_students"]
        client.post("/students/", json=valid_student("STAT1"))
        after = client.get("/stats").json()["total_students"]
        assert after == before + 1


# ===========================================================================
# 13. ROOT & HEALTH
# ===========================================================================

class TestHealth:

    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200

    def test_root_has_status_running(self):
        data = client.get("/").json()
        assert data["status"] == "running"
