# SmartStudent Hub — Smart Student Record Management API

> 

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution & Key Features](#proposed-solution--key-features)
4. [Technology Stack](#technology-stack)
5. [Project Architecture](#project-architecture)
6. [Prerequisites](#prerequisites)
7. [Installation — Backend](#installation)
8. [Running the Backend Server](#running-the-server)
9. [Frontend Setup & Running](#frontend-setup--running)
10. [API Endpoints](#api-endpoints)
11. [Example Requests & Responses](#example-requests--responses)
12. [Running Tests](#running-tests)
13. [Sample Data](#sample-data)
14. [Swagger UI Demo Guide](#swagger-ui-demo-guide)
14. [Screenshots Checklist](#screenshots-checklist)
15. [GitHub Submission](#github-submission)
16. [Limitations & Future Enhancements](#limitations--future-enhancements)

---

## Project Overview

**SmartStudent Hub** is a fully functional REST API that manages student records for an educational institution. It is built with **FastAPI**, **SQLite**, and **SQLAlchemy**, and exposes a clean, documented HTTP interface for creating, reading, updating, and deleting student data.

---

## Problem Statement

Educational institutions often rely on spreadsheets or manual records to manage student information. These approaches are error-prone, difficult to search, and offer no validation. There is a need for a simple, reliable, and developer-friendly API that:

- Stores student records persistently.
- Validates input automatically.
- Prevents duplicate registrations.
- Allows quick search and filtering.
- Exposes aggregate statistics for administrators.

---

## Proposed Solution & Key Features

| Feature | Description |
|---|---|
| Full CRUD | Create, Read, Update (PUT & PATCH), Delete student records |
| Smart Search | Filter by name, course, or email; free-text search across all three |
| Pagination | All list responses include page, page_size, total, and total_pages |
| Validation | Pydantic enforces correct email, phone, date formats, and field lengths |
| Duplicate Prevention | 409 Conflict returned when an email already exists |
| Dashboard Stats | `/stats` returns total students, courses, and per-course counts |
| CSV Exports | Reports page can export the full student dataset as a CSV download |
| UI Preferences | Persisted light/dark mode and compact layout settings in the browser |
| Sample Data | 15 fictional students auto-loaded on first run |
| AI Assistant | Optional `/ai/ask` endpoint powered by local Ollama (llama3) |
| Interactive Docs | Swagger UI at `/docs`, ReDoc at `/redoc` |
| Persistent Storage | SQLite file survives server restarts |

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Programming language |
| FastAPI | 0.111.0 | Web framework & OpenAPI |
| Uvicorn | 0.29.0 | ASGI server |
| SQLAlchemy | 2.0.30 | ORM & database abstraction |
| SQLite | Built-in | Persistent relational database |
| Pydantic | 2.7.1 | Request validation & serialisation |
| Pytest | 8.2.0 | Automated testing |
| HTTPX | 0.27.0 | Test client & Ollama HTTP calls |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI component library |
| Vite | 5.2.x | Development server & bundler |
| JavaScript (ES2020+) | — | Frontend language |
| Lucide React | 0.395.0 | Icon library |
| Fetch API | Built-in | HTTP requests to backend |
| CSS (custom) | — | Full design system, no framework |

---

## Project Architecture

```
SmartStudent-Hub/
├── app/                         ← Python FastAPI backend
│   ├── __init__.py
│   ├── main.py                  # App entry, startup, /stats, /ai/ask
│   ├── database.py              # SQLite engine & session
│   ├── models.py                # SQLAlchemy Student ORM model
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── crud.py                  # All DB operations
│   └── routes/
│       └── students.py          # Student HTTP route handlers
│
├── frontend/                    ← React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Sticky top bar + Add button
│   │   │   ├── StatCard.jsx     # Single metric card
│   │   │   ├── StudentTable.jsx # Paginated table + search + filter
│   │   │   ├── StudentForm.jsx  # Create / edit modal form
│   │   │   ├── ViewModal.jsx    # Read-only student detail view
│   │   │   ├── ConfirmDialog.jsx# Delete confirmation dialog
│   │   │   └── Toast.jsx        # Auto-dismiss notifications
│   │   ├── services/
│   │   │   └── studentService.js# All Fetch API calls to backend
│   │   ├── App.jsx              # Root component, all state logic
│   │   ├── main.jsx             # React DOM entry point
│   │   └── styles.css           # Complete design system
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Dev proxy: /api/* → FastAPI
│
├── tests/
│   └── test_students.py         # 49 automated backend tests
├── .gitignore
├── requirements.txt
└── README.md
```

### How the full stack connects

```
Browser (React, port 5173)
     │
     │  /api/students/*  →  Vite proxy rewrites to  →  FastAPI (port 8000)
     │  /api/stats       →                          →  FastAPI (port 8000)
     ▼
FastAPI Route handlers
     │
     ▼
CRUD functions (SQLAlchemy ORM)
     │
     ▼
SQLite  smartstudent.db
```

The Vite dev proxy means the React app calls `/api/students/` — no CORS issues during development because both sides look like the same origin to the browser.

---

## Prerequisites

- **Python 3.10 or newer** — [Download](https://www.python.org/downloads/)
- **Node.js 18 or newer** — [Download](https://nodejs.org/) (includes npm)
- **pip** — included with Python
- **Git** — [Download](https://git-scm.com/)
- A terminal (PowerShell on Windows)

Check your Python version:

```bash
python --version
```

---

## Installation

### Step 1 — Clone or download the project

```bash
git clone https://github.com/YOUR_USERNAME/SmartStudent-Hub.git
cd SmartStudent-Hub
```

Or, if you already have the folder:

```bash
cd SmartStudent-Hub
```

### Step 2 — Create a virtual environment

**Windows (PowerShell):**

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

If you get an execution policy error on Windows, run this first:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

Your prompt will show `(venv)` when the environment is active.

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

Expected output: pip downloads and installs FastAPI, Uvicorn, SQLAlchemy, Pydantic, and testing libraries.

---

## Running the Backend Server

```bash
uvicorn app.main:app --reload
```

Expected startup output:

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO: Starting SmartStudent Hub…
INFO: Database tables verified / created.
INFO: Seeded 15 sample students into the database.
INFO: SmartStudent Hub is ready. Visit http://127.0.0.1:8000/docs
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Open your browser at **http://127.0.0.1:8000/docs** to see the interactive Swagger UI.

---

## Frontend Setup & Running

### Step 1 — Open a second terminal and navigate to the frontend folder

```powershell
cd SmartStudent-Hub\frontend
```

### Step 2 — Configure the environment variable

```powershell
Copy-Item .env.example .env
```

The default value `VITE_API_BASE_URL=http://127.0.0.1:8000` works as-is for local development. The Vite proxy in `vite.config.js` forwards all `/api/*` calls to the FastAPI backend automatically.

### Step 3 — Install Node dependencies

```powershell
npm install
```

### Step 4 — Start the frontend dev server

```powershell
npm run dev
```

Expected output:

```
  VITE v5.2.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5 — Open the app

Open **http://localhost:5173** in your browser.

You should see the SmartStudent Hub dashboard with 15 pre-loaded students.

### Frontend Features

| Feature | Description |
|---|---|
| Dashboard stats | Total students, courses offered, latest/oldest enrollment |
| Course breakdown | Horizontal bar chart showing students per course |
| Student directory | Paginated table with 10 rows per page |
| Search | Free-text search across name, course, and email (400 ms debounce) |
| Course filter | Dropdown populated from live backend stats |
| View student | Full read-only detail modal with all fields |
| Add student | Modal form with client-side + server-side validation |
| Edit student | Same form pre-populated; uses PUT to replace all fields |
| Delete student | Confirmation dialog before permanent deletion |
| Toast notifications | Auto-dismiss success / error messages |
| Responsive design | Desktop table → mobile card layout |
| Error states | Network errors and API errors shown cleanly |

### Troubleshooting Frontend

| Problem | Fix |
|---|---|
| Blank page / console error "Failed to fetch" | Make sure the FastAPI backend is running on port 8000 |
| 404 on `/api/students/` | Verify `vite.config.js` proxy is pointing to `http://127.0.0.1:8000` |
| `npm install` fails | Run `node --version` — must be 18+. Update Node if needed |
| Port 5173 already in use | Add `--port 5174` to the dev command |
| CORS error in production | Set `VITE_API_BASE_URL` in `.env` and ensure backend CORS allows your domain |

---

## API Endpoints

### Students

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/students/` | Register a new student | 201, 409, 422 |
| `GET` | `/students/` | List students (paginated, filterable) | 200 |
| `GET` | `/students/{id}` | Get student by ID | 200, 404 |
| `PUT` | `/students/{id}` | Full update (all fields required) | 200, 404, 409, 422 |
| `PATCH` | `/students/{id}` | Partial update (only changed fields) | 200, 404, 409, 422 |
| `DELETE` | `/students/{id}` | Delete a student | 200, 404 |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/stats` | Dashboard statistics |
| `POST` | `/ai/ask?question=...` | AI assistant (requires local Ollama) |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/redoc` | ReDoc documentation |

### Query Parameters for `GET /students/`

| Parameter | Type | Description | Default |
|---|---|---|---|
| `name` | string | Partial match on student name | — |
| `course` | string | Partial match on course | — |
| `email` | string | Partial match on email | — |
| `search` | string | Free-text search (name OR course OR email) | — |
| `page` | integer | Page number (≥ 1) | 1 |
| `page_size` | integer | Records per page (1–100) | 10 |

---

## Example Requests & Responses

### POST /students/ — Create a student

**Request body:**

```json
{
  "name": "Arjun Sharma",
  "date_of_birth": "2003-04-15",
  "email": "arjun.sharma@example.com",
  "phone": "+91-9876543210",
  "course": "B.Tech Computer Science",
  "address": "12, MG Road, Bangalore, Karnataka 560001",
  "enrollment_date": "2022-07-20"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "Arjun Sharma",
  "date_of_birth": "2003-04-15",
  "email": "arjun.sharma@example.com",
  "phone": "+91-9876543210",
  "course": "B.Tech Computer Science",
  "address": "12, MG Road, Bangalore, Karnataka 560001",
  "enrollment_date": "2022-07-20",
  "created_at": "2024-10-12T10:30:00",
  "updated_at": "2024-10-12T10:30:00"
}
```

---

### GET /students/ — List students with pagination

**Request:** `GET /students/?page=1&page_size=3`

**Response (200 OK):**

```json
{
  "total": 15,
  "page": 1,
  "page_size": 3,
  "total_pages": 5,
  "students": [...]
}
```

---

### GET /students/?search=arjun — Search students

**Request:** `GET /students/?search=arjun`

**Response (200 OK):**

```json
{
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1,
  "students": [{ "id": 1, "name": "Arjun Sharma", ... }]
}
```

---

### GET /students/1 — Get student by ID

**Response (200 OK):** Single student object.

**Response (404 Not Found):**

```json
{ "detail": "Student with ID 999 was not found." }
```

---

### PUT /students/1 — Full update

**Request body:** All fields required (same structure as POST).

**Response (200 OK):** Updated student object.

---

### PATCH /students/1 — Partial update

**Request body (only changed fields):**

```json
{ "course": "M.Tech Artificial Intelligence" }
```

**Response (200 OK):** Updated student object.

---

### DELETE /students/1 — Delete a student

**Response (200 OK):**

```json
{
  "message": "Student 'Arjun Sharma' (ID: 1) has been successfully deleted.",
  "deleted_id": 1
}
```

---

### POST /students/ — Duplicate email (409)

```json
{ "detail": "A student with email 'arjun.sharma@example.com' already exists (ID: 1)." }
```

---

### GET /stats — Dashboard statistics

**Response (200 OK):**

```json
{
  "total_students": 15,
  "courses_offered": 6,
  "students_per_course": [
    { "course": "B.Tech Computer Science", "count": 5 },
    { "course": "B.Sc Data Science", "count": 3 },
    { "course": "M.Tech Artificial Intelligence", "count": 3 },
    { "course": "MBA Business Analytics", "count": 2 },
    { "course": "B.Tech Mechanical Engineering", "count": 1 },
    { "course": "B.Tech Electrical Engineering", "count": 1 }
  ],
  "newest_enrollment": "2024-07-22",
  "oldest_enrollment": "2021-08-05"
}
```

---

## Running Tests

```bash
pytest tests/ -v
```

Run with a summary report:

```bash
pytest tests/ -v --tb=short
```

Run a specific test class:

```bash
pytest tests/test_students.py::TestCreateStudent -v
```

**Expected output:**

```
tests/test_students.py::TestCreateStudent::test_create_student_returns_201 PASSED
tests/test_students.py::TestCreateStudent::test_create_student_response_has_id PASSED
...
========= 40+ passed in Xs =========
```

The test suite uses an isolated database (`test_smartstudent.db`) that is created before tests run and deleted automatically afterward. Your real `smartstudent.db` is never modified.

---

## Sample Data

15 fictional students are automatically loaded into the database the first time you start the server (only if the table is empty). They cover 6 different courses from cities across India.

To reload sample data from scratch, delete `smartstudent.db` and restart the server:

```powershell
Remove-Item smartstudent.db
uvicorn app.main:app --reload
```

---

## Swagger UI Demo Guide

1. Start the server: `uvicorn app.main:app --reload`
2. Open **http://127.0.0.1:8000/docs** in your browser.
3. You will see all endpoints grouped by tag (Students, Dashboard, AI Assistant).

### Demo workflow:

| Step | Action |
|---|---|
| 1 | Click `GET /students/` → Execute → See 15 pre-loaded students |
| 2 | Click `POST /students/` → Try it out → Paste sample JSON → Execute → See 201 |
| 3 | Copy the `id` from the response |
| 4 | Click `GET /students/{student_id}` → Enter the id → Execute → See the student |
| 5 | Click `PATCH /students/{student_id}` → Change the course → Execute → See update |
| 6 | Click `PUT /students/{student_id}` → Replace all fields → Execute |
| 7 | Try `POST /students/` with the same email again → See 409 Conflict |
| 8 | Try `GET /students/` with `?search=computer` → See filtered results |
| 9 | Click `GET /stats` → See the dashboard statistics |
| 10 | Click `DELETE /students/{student_id}` → Execute → See confirmation |
| 11 | Try `GET /students/{student_id}` with the deleted id → See 404 |

---

## Screenshots Checklist

Take screenshots of each of the following for your submission:

- [ ] Swagger UI home page (`/docs`)
- [ ] POST /students/ — 201 response with student data
- [ ] POST /students/ — 409 response for duplicate email
- [ ] POST /students/ — 422 response for invalid input
- [ ] GET /students/ — paginated list response
- [ ] GET /students/?search=... — filtered results
- [ ] GET /students/{id} — single student response
- [ ] GET /students/{id} — 404 response for missing ID
- [ ] PUT /students/{id} — full update response
- [ ] PATCH /students/{id} — partial update response
- [ ] DELETE /students/{id} — deletion confirmation
- [ ] GET /stats — dashboard statistics
- [ ] pytest terminal output showing all tests passing
- [ ] Project folder structure in your editor

---

## GitHub Submission

### Step 1 — Create a repository on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click **New repository**.
3. Name it `SmartStudent-Hub`.
4. Set it to **Public**.
5. Do NOT initialise with a README (you already have one).
6. Click **Create repository**.

### Step 2 — Initialise Git locally

```bash
git init
git add .
git commit -m "Initial commit: SmartStudent Hub API"
```

### Step 3 — Connect and push

```bash
git remote add origin https://github.com/YOUR_USERNAME/SmartStudent-Hub.git
git branch -M main
git push -u origin main
```

### Step 4 — Get your repository URL

Your submission URL will be:
`https://github.com/YOUR_USERNAME/SmartStudent-Hub`

### What is NOT committed (protected by .gitignore)

- `smartstudent.db` — contains real data
- `test_smartstudent.db` — temporary test database
- `venv/` — virtual environment (too large, regenerated via pip)
- `__pycache__/` — Python bytecode cache
- `.env` — any future secrets

---

## Limitations & Future Enhancements

### Current Limitations

- SQLite is suitable for development and small deployments. For production with concurrent users, switch to PostgreSQL.
- Authentication and authorisation are not implemented.
- The AI assistant requires a locally running Ollama instance.
- No file upload support (e.g., student photos).

### Future Enhancements

| Enhancement | Description |
|---|---|
| JWT Authentication | Secure endpoints with token-based login |
| Role-Based Access | Admin vs. read-only roles |
| PostgreSQL support | Replace SQLite for production scale |
| Student Photo Upload | Store and serve profile images |
| Export to CSV/PDF | Download student records |
| Email Notifications | Send confirmation emails on enrollment |
| Audit Log | Track who changed what and when |
| Docker | Containerise the app for easy deployment |
| Frontend Dashboard | React or Vue.js UI consuming this API |
| Grade Management | Extend model with courses and grades |

---

*Built with FastAPI, SQLAlchemy, SQLite, and Pydantic.*
