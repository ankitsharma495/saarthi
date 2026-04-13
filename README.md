# 🚀 Mentorship Evaluation System

## 📌 Overview

A full-stack **Mentorship Evaluation System** where:

* Mentors can review students
* Students can track progress
* AI (Google Gemini) generates concise actionable summaries

The system is designed to handle **real-world messy data**, enforce **role-based access control**, and demonstrate **clean architecture practices**.

---

## � Screenshots

### Landing Page — Mentorship Program
![Landing Page](frontend/public/Screenshot%202026-04-13%20110046.png)

### Mentor Dashboard — Student Management & Review Submission
![Mentor Dashboard](frontend/public/Screenshot%202026-04-13%20110059.png)

### Review History with AI-Generated Summaries
![Review History](frontend/public/Screenshot%202026-04-13%20110109.png)

### Student Dashboard — Progress & Feedback
![Student Dashboard](frontend/public/Screenshot%202026-04-13%20110225.png)

---

## �🛠️ Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Backend  | Node.js, Express, MongoDB (Mongoose)    |
| Frontend | React (Vite), Tailwind CSS              |
| Auth     | JWT (jsonwebtoken), bcrypt              |
| AI       | Google Gemini (`@google/generative-ai`) |

---

## 🧱 Architecture

```
Frontend (React SPA)
        ↓
Axios (JWT Auth)
        ↓
Backend (Express API)
        ↓
MongoDB (Database)
        ↓
Google Gemini API (AI Summary)
```

---

## 📊 Data Pipeline (Phase 1)

### Messy Dataset Handling

```
messy_students.json
        ↓
dataCleaner.js
        ↓
cleaned_students.json
        ↓
seedService.js
        ↓
MongoDB
```

### Cleaning Steps

* Removed duplicate students (based on email)
* Standardized date formats → ISO (YYYY-MM-DD)
* Removed unnecessary fields (`meta`, `timestamp`, etc.)
* Normalized inconsistent keys (`created_at`, `createdAt`)

👉 This ensures **clean, scalable data before usage**

---

## ⚙️ Backend Features

### Models

* **User**

  * name, email (unique), password, role (mentor/student)

* **Student**

  * name, email, enrollmentDate, status

* **Review**

  * studentId, mentorId, reviewText, rating, summary

* **Application**

  * name, email, phone, targetYear, status

---

### API Endpoints

| Method | Endpoint                   | Description                 |
| ------ | -------------------------- | --------------------------- |
| POST   | `/api/auth/login`          | Login user                  |
| GET    | `/api/auth/me`             | Get user profile            |
| GET    | `/api/students`            | Get all students            |
| POST   | `/api/reviews`             | Submit review (mentor only) |
| GET    | `/api/reviews/:studentId`  | Get student reviews         |
| POST   | `/api/reviews/:id/summary` | Generate AI summary         |
| POST   | `/api/applications`        | Submit form                 |

---

### Authentication & RBAC

* JWT-based authentication
* Middleware:

  * `authenticate` → verifies token
  * `authorize(role)` → role-based access

#### Roles:

* **Mentor**

  * View students
  * Submit reviews
  * Generate AI summary

* **Student**

  * View own progress
  * View reviews

---

## 🎨 Frontend Features

### Pages

* `/mentorship-program` → Landing + Form
* `/login` → Authentication
* `/dashboard` → Role-based dashboard

---

### Dashboards

#### Mentor Dashboard

* View all students
* Submit reviews
* Generate AI summary

#### Student Dashboard

* View progress
* View latest review
* View AI insights

---

## 🧠 AI Feature (Gemini)

* Converts long review → **3 actionable bullet points**

### Prompt Used:

```
Convert the following mentor review into exactly 3 short actionable bullet points.
Return ONLY 3 lines starting with "- ".
```

---

## 📝 Form Handling (Real-Time Data Pipeline)

```
Form Input
   ↓
Sanitize
   ↓
Validate
   ↓
Check Duplicate
   ↓
Save to DB
```

### Sanitization

* trim spaces
* lowercase email
* normalize input

### Validation

* email format
* phone format
* required fields

### Duplicate Prevention

* email check
* phone check
* DB unique constraint

---

## 🔄 Data Strategy

### 1. Initial Dataset

* Cleaned once
* Seeded into DB

### 2. User Input Data

* Sanitized in real-time
* Stored directly in DB

👉 Separation ensures performance + clarity

---

## 🔧 Phase 5: Code Refactoring

### Original Code

```js
if (user.role == 'admin') {
  if (data.length > 0) {
    data.map(item => {
      if (item.status == 'active') {
        // Logic…
      }
    })
  }
}
```

### Refactored Code

```js
if (user.role !== 'admin' || !Array.isArray(data)) return;

data
  .filter(item => item.status === 'active')
  .forEach(item => {
    // Logic…
  });
```

### Improvements

* Reduced nesting using early returns
* Used correct array methods
* Improved readability

---

## 🧠 Phase 6: System Design

### End-to-End Flow

```
User submits form
        ↓
Application stored
        ↓
Approved → converted to Student
        ↓
Student appears in dashboard
        ↓
Mentor submits review
        ↓
AI generates summary
        ↓
Student views insights
```

---

## ⚖️ Design Decisions

* Used **JWT (simple auth)** for assignment scope
* Used **seeding instead of runtime JSON** for scalability
* Separated **data cleaning vs sanitization**
* Implemented **RBAC middleware**
* Integrated **Gemini API** for AI feature

---

## 💡 Key Highlights

* Clean architecture (MVC pattern)
* Real-world data handling
* Role-based dashboards
* AI-powered summaries
* Auto database seeding
* Strong validation & error handling

---

## ▶️ How to Run

### Backend

```bash
cd backend
npm install
npm run seed
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Default Credentials

| Role    | Email                                         | Password    |
| ------- | --------------------------------------------- | ----------- |
| Mentor  | [mentor@test.com](mailto:mentor@test.com)     | password123 |
| Student | [rahul@example.com](mailto:rahul@example.com) | password123 |

---

## 🎯 Conclusion

This project demonstrates:

* Backend engineering fundamentals
* Data cleaning & processing
* Scalable system design
* AI integration
* Clean and maintainable code

---

## 👨‍💻 Author

**Ankit Sharma**
Aspiring Full Stack Developer 🚀

---


