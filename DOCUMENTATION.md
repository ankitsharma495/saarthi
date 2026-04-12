# Mentorship Evaluation System — Documentation

## Project Overview

A full-stack mentorship evaluation system that allows mentors to review students, generate AI-powered summaries using Google Gemini, and provides role-based dashboards for both mentors and students.

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Backend  | Node.js, Express 4.21, MongoDB (Atlas), Mongoose 8.6 |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios |
| AI       | Google Gemini 2.5 Flash (`@google/generative-ai`)     |
| Auth     | JWT (`jsonwebtoken`), bcryptjs                         |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)         │
│  MentorshipProgram ─ Login ─ Dashboard (SPA)        │
│         ↕ Axios (JWT interceptor)                   │
├─────────────────────────────────────────────────────┤
│                   Backend (Express REST API)         │
│  Routes → Middleware (auth/RBAC) → Controllers       │
│         ↕ Mongoose ODM                               │
├─────────────────────────────────────────────────────┤
│   MongoDB Atlas          │    Google Gemini API      │
└──────────────────────────┴──────────────────────────┘
```

---

## Data Pipeline (Data Cleaning)

```
messy_students.json → dataCleaner.js → cleaned_students.json → seedService.js → MongoDB
```

### Cleaning Steps (with audit logging)

1. **Unwrap nested structures** — Extracts the `students` array from the nested JSON wrapper.
2. **Strip unnecessary fields** — Removes non-essential keys like `id`, `meta`, `timestamp`, `notes`.
3. **Resolve duplicate date fields** — Picks the most reliable date when both `created_at` and `createdAt` exist.
4. **Standardize dates** — Converts `YYYY/MM/DD`, `DD-MM-YYYY`, and other formats to ISO 8601.
5. **Deduplicate by email** — Keeps the first occurrence, removes duplicates.

Every removal is documented in the audit log printed to the console, showing what was removed and why.

---

## Backend

### Models

| Model         | Fields                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `User`        | name, email, password (hashed), role (`mentor` \| `student`)           |
| `Student`     | name, email, enrollmentDate, course (default: "General"), mentorId, status |
| `Review`      | studentId, mentorId, reviewText, rating (1–5), summary ([String])      |
| `Application` | name, email, phone, targetYear, status (`pending` \| `approved` \| `rejected`) |

### API Routes

| Method | Endpoint                     | Auth       | Description                          |
| ------ | ---------------------------- | ---------- | ------------------------------------ |
| POST   | `/api/auth/login`            | Public     | Login, returns JWT + user object     |
| GET    | `/api/auth/me`               | Authenticated | Get current user profile          |
| GET    | `/api/students`              | Authenticated | List all students                 |
| GET    | `/api/students/:id`          | Authenticated | Get student by ID                 |
| POST   | `/api/reviews`               | Mentor     | Submit a review for a student        |
| GET    | `/api/reviews/:studentId`    | Authenticated | Get reviews for a student         |
| POST   | `/api/reviews/:id/summary`   | Mentor     | Generate AI summary for a review     |
| POST   | `/api/applications`          | Public     | Submit mentorship application        |
| GET    | `/api/health`                | Public     | Health check                         |

### Middleware

- **`authenticate`** — Verifies JWT from `Authorization: Bearer <token>` header, attaches `req.user`.
- **`authorize(...roles)`** — RBAC guard that checks `req.user.role` against allowed roles.

### Services

- **`geminiService.js`** — Calls Google Gemini 2.5 Flash with a structured prompt to convert review text into 3 actionable bullet points. Handles `*`, `-`, `•`, and numbered list formats.
- **`seedService.js`** — `autoSeed()` checks if DB is empty on server start and seeds from `cleaned_students.json`. Creates User + Student records, ensures a default mentor exists.

### Scripts

- **`seed.js`** — Manual seeding script. Supports `--fresh` flag to wipe the DB before seeding.
- **`cleanData.js`** — Standalone data cleaning script with console audit log.

### Auto-Seed on Startup

When the server starts, `autoSeed()` in `server.js` checks if MongoDB is empty. If so, it runs the full pipeline: clean messy data → save cleaned JSON → seed Users + Students → create default mentor account.

---

## Frontend

### Pages

| Page                | Route                  | Description                                    |
| ------------------- | ---------------------- | ---------------------------------------------- |
| `MentorshipProgram` | `/mentorship-program`  | Landing page with hero, features grid, and application form |
| `Login`             | `/login`               | Email/password login with demo credential hints |
| `Dashboard`         | `/dashboard`           | Protected route — renders Mentor or Student dashboard based on role |

### Components

| Component          | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `Navbar`           | Top navigation with logo (→ home), dashboard link, user info, logout |
| `ProtectedRoute`   | Wraps routes that require authentication                      |
| `MentorDashboard`  | Stats row, student table, review form, review history with AI summary |
| `StudentDashboard` | Stats grid, latest review, review history with AI takeaways   |
| `LoadingSpinner`   | Reusable loading indicator                                    |
| `ErrorAlert`       | Reusable error banner with retry button                       |

### Auth Flow

1. User logs in via `/login` → backend returns JWT + user object.
2. Token stored in `localStorage`, attached to every request via Axios interceptor.
3. 401 responses trigger automatic logout and redirect to `/login`.
4. `AuthContext` provides `user`, `login()`, `logout()` across the app.

---

## Mentorship Application Form

**Route:** `/mentorship-program` → `POST /api/applications`

### Pipeline: Hero Form → Sanitize → Validate → Check Duplicate → Save to DB

**Frontend Sanitization & Validation:**
- `sanitize()` strips HTML tags and collapses whitespace before sending.
- Regex validation: name (2–50 letters), email format, phone (7–15 digits).
- `maxLength` attributes on inputs prevent oversized input.
- Inline field-level error messages with red highlighting.

**Backend Sanitization & Validation:**
- `sanitize()` strips HTML tags, control characters (`\x00-\x1F`), and collapses whitespace.
- Validates name (regex), email (regex), phone (regex), targetYear (range check: current year to +5).
- Duplicate check by **email** (409 response).
- Duplicate check by **phone** (409 response).
- All data is sanitized before being persisted to MongoDB.

---

## AI Summary Feature

- Mentor clicks **"Generate AI Summary"** on any review card.
- Backend sends the review text to Google Gemini 2.5 Flash with a structured prompt.
- Gemini returns exactly 3 actionable bullet points.
- The summary is saved to the `Review.summary` field and displayed in a gradient card.
- Students can see the AI-generated key takeaways on their dashboard.

**Prompt:**
> "Convert the following mentor review into exactly 3 short actionable bullet points. Format: Return ONLY 3 lines, each starting with '- '."

---

## Role-Based Access Control (RBAC)

| Feature                  | Mentor | Student |
| ------------------------ | :----: | :-----: |
| View student list        |   ✅   |   ❌    |
| Submit reviews           |   ✅   |   ❌    |
| Generate AI summaries    |   ✅   |   ❌    |
| View own progress/stats  |   ❌   |   ✅    |
| View received reviews    |   ❌   |   ✅    |
| Apply to program         |   ✅   |   ✅    |

---

## Default Credentials (Seeded)

| Role    | Email              | Password    |
| ------- | ------------------ | ----------- |
| Mentor  | mentor@test.com    | password123 |
| Student | rahul@example.com  | password123 |

---

## How to Run

### Backend
```bash
cd backend
npm install
# Set MONGODB_URI, JWT_SECRET, GEMINI_API_KEY in .env
npm run seed          # Seed the database
npm start             # Start server (auto-seeds if DB empty)
```

### Frontend
```bash
cd frontend
npm install
npm run dev           # Start Vite dev server
```

---

## Project Structure

```
asignment/
├── backend/
│   └── src/
│       ├── config/         # db.js, index.js (env loader)
│       ├── data/           # messy_students.json, cleaned_students.json
│       ├── middleware/      # auth.js (authenticate + authorize)
│       ├── models/         # User, Student, Review, Application
│       ├── routes/         # auth, students, reviews, summary, applications
│       ├── scripts/        # seed.js, cleanData.js
│       ├── services/       # geminiService.js, seedService.js
│       ├── utils/          # dataCleaner.js
│       └── server.js       # Express app entry point
├── frontend/
│   └── src/
│       ├── components/     # Navbar, MentorDashboard, StudentDashboard, etc.
│       ├── context/        # AuthContext.jsx
│       ├── pages/          # Login, MentorshipProgram, Dashboard
│       ├── services/       # api.js (Axios instance)
│       ├── App.jsx         # Router + layout
│       └── main.jsx        # Entry point
└── DOCUMENTATION.md
```
