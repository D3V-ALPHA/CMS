# 🎓 Course Management System (CMS)

**Built by Muhammad Ali Ashraf**

A full-stack Learning Management System built as a technical assessment. Teachers can create courses and manage lessons, while students can browse, enroll, and track their learning progress — all with a real-time activity feed powered by WebSockets and Redis.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Architectural Decisions](#architectural-decisions)
- [Running the Project](#running-the-project)
- [Environment Variables](#environment-variables)
- [Bonus Features](#bonus-features)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, TanStack Query, Zustand, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL (Supabase), Drizzle ORM |
| Cache / Pub-Sub | Redis |
| Auth | JWT — Access + Refresh token rotation |
| Real-time | NestJS WebSocket Gateway + Redis pub/sub |
| Containerisation | Docker + Docker Compose |

---

## ✨ Features

### 🔐 Auth
- Register and login on the same page with tab toggle
- Role selection on register — **Teacher** or **Student**
- JWT access token (15 min) + refresh token (7 days) rotation
- Protected routes per role — teachers and students cannot access each other's views
- Persistent auth state via Zustand with localStorage

### 🎓 Student Dashboard
- Paginated course browser with live search by title
- Course cards show teacher email and enrolled student count
- Enroll button transitions to **Continue Learning** after enrollment — persists on refresh
- Progress bar per enrolled course showing exact lesson completion percentage
- Course modal opens inline — no new page — lists all lessons for that course
- Mark lessons complete one by one — progress updates in real time
- Skeleton loading states on page load and refresh

### 👩‍🏫 Teacher Dashboard
- Create courses via modal dialog
- Add lessons to courses via inline dialog
- Drag and drop lesson reordering — persisted to backend
- Enrolled student count per course
- Live activity feed — WebSocket powered, shows enrollment and completion events in real time with timestamps
- Skeleton loading states

### ⚡ Real-Time Activity Feed
- NestJS WebSocket Gateway subscribes to a Redis pub/sub channel
- Every enrollment and lesson completion instantly emits an event to all connected clients
- Frontend auto-reconnects on disconnect
- Event payload shape:

```json
{
  "type": "enrollment | completion",
  "message": "student@example.com enrolled in Introduction to Python",
  "timestamp": "2026-03-30T01:45:44Z"
}
```

---

## 📁 Project Structure
```
CMS/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   └── filters/              # Global HTTP exception filter
│   │   ├── config/
│   │   │   ├── configuration.ts      # NestJS config factory
│   │   │   └── redis.ts              # Redis connection
│   │   ├── database/
│   │   │   ├── migrations/           # Drizzle auto-migrations (run on startup)
│   │   │   ├── schema/               # Table definitions — users, courses, lessons, enrollments, progress
│   │   │   ├── db.ts                 # Database connection
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   └── seed.ts               # Demo data seed script
│   │   └── modules/
│   │       ├── auth/                 # JWT auth, guards, decorators, strategies, DTOs
│   │       ├── courses/              # Course CRUD, teacher dashboard, DTOs
│   │       ├── enrollments/          # Student enrollment logic, DTOs
│   │       ├── lessons/              # Lesson management, reordering, DTOs
│   │       ├── progress/             # Lesson completion, progress calculation, DTOs
│   │       └── ws/                   # WebSocket gateway + Redis pub/sub
│   ├── test/                         # End-to-end tests
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui component library
│   │   │   ├── layout/               # ThemeToggle
│   │   │   ├── AddLessonDialog.tsx   # Inline lesson creation dialog
│   │   │   ├── CourseModal.tsx       # Inline lesson viewer and progress tracker
│   │   │   ├── navbar.tsx            # Role-aware navigation bar
│   │   │   └── theme-provider.tsx    # next-themes dark/light provider
│   │   ├── hooks/
│   │   │   ├── useActivityFeed.ts    # WebSocket activity feed hook
│   │   │   ├── useAuth.ts            # Login and register mutations
│   │   │   ├── useCourses.ts         # Course listing, enrollment, progress queries
│   │   │   └── useTeacherCourses.ts  # Teacher dashboard, lessons, reorder mutations
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance with JWT interceptor
│   │   │   ├── authSync.ts           # Token sync on app load
│   │   │   └── utils.ts              # Tailwind class utilities
│   │   ├── pages/
│   │   │   ├── AuthScreen.tsx        # Login + Register with role selection
│   │   │   ├── StudentDashboard.tsx  # Course browser, enrollment, progress
│   │   │   └── TeacherDashboard.tsx  # Course management, lessons, activity feed
│   │   ├── stores/
│   │   │   └── authStore.ts          # Zustand auth state with persistence
│   │   ├── routes.tsx                # Protected role-based routing
│   │   └── main.tsx                  # React entry point
│   ├── nginx.conf                    # Nginx config for SPA routing + API proxy
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml                # Single command full stack startup
├── .env.example                      # All required environment variables
└── README.md
```

## 🔌 API Endpoints

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/profile

GET    /courses                              — paginated, filterable by title (all roles)
POST   /courses                             — create course (teacher only)
GET    /courses/teacher/dashboard           — enrolled count per course (teacher only)
GET    /courses/:courseId/lessons           — fetch lessons for a course
POST   /courses/:courseId/lessons           — add lesson (teacher only)
PATCH  /courses/:courseId/lessons/reorder   — reorder lessons (teacher only)
POST   /courses/:courseId/enroll            — enroll in course (student only)
PATCH  /lessons/:lessonId/complete          — mark lesson complete (student only)
GET    /students/me/progress                — completion % across all enrolled courses
GET    /students/me/completed-lessons       — per-lesson completion state for a course
GET    /students/:id/progress               — progress by student ID (student only)
```

> ⚠️ All routes except `/auth/register` and `/auth/login` require a valid JWT bearer token.
> Role guards are strictly enforced — teachers and students can only access what belongs to them.

---

## 🏗 Architectural Decisions

### Redis Pub/Sub for WebSockets
Rather than emitting WebSocket events directly from services, all activity events are published to a Redis channel (`activity_channel`). The WebSocket gateway subscribes to this channel and broadcasts to all connected clients. This decouples the business logic from the WebSocket layer and makes the system ready for horizontal scaling — multiple API instances can publish to the same Redis channel and all clients receive events regardless of which instance they are connected to.

### Progress Calculation
Progress percentage is calculated server-side as:

```
(completed lessons in this course / total lessons in this course) × 100
```

Completed lessons are always filtered to the specific course before counting — this prevents cross-course contamination where completing a lesson in Course A would incorrectly inflate the progress of Course B.

### Course Modal Instead of a Course Page
The student-facing lesson view is implemented as an inline modal component rather than a separate route. This keeps the page count minimal and the navigation clean — students never lose context of the course browser while completing lessons.

### Route Ordering in NestJS
Static routes (`/students/me/progress`) are always declared before dynamic routes (`/students/:id/progress`) in the controller. NestJS matches routes top-to-bottom — without this ordering, the literal string `me` would be matched as a student ID parameter and the endpoint would never be reached.

### Production Notes
- **CORS** — The backend currently allows all origins (`*`). In production, restrict this to your frontend domain.
- **JWT Refresh** — An Axios interceptor in `src/lib/api.ts` handles automatic token refresh when a 401 response is received, using the stored refresh token.
- **Migrations** — Drizzle migrations run automatically on backend container startup — no manual steps required.

---

## 🚀 Running the Project

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

---

### ⭐ Option 1 — Docker (Recommended — Single Command)

This is the primary way to run the project. One command starts everything.

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/cms.git
cd cms
```

**2. Set up environment variables**
```bash
cp .env.example .env
```
Open `.env` and fill in your values — see [Environment Variables](#environment-variables) below.

**3. Start the entire stack**
```bash
docker compose up --build
```

This single command starts:
- ✅ Redis cache
- ✅ PostgreSQL database (if using local DB)
- ✅ NestJS backend — migrations run automatically on startup
- ✅ React frontend — served via Nginx

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

**To stop everything:**
```bash
docker compose down
```

---

### 🔧 Option 2 — Local Development (Without Docker)

You will need Node.js 18+ and a running Redis instance.

**Terminal 1 — Start Redis only via Docker:**
```bash
docker compose up redis
```

**Terminal 2 — Start the backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Terminal 3 — Start the frontend:**
```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_USER` | PostgreSQL user (Docker only) | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password (Docker only) | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name (Docker only) | `cms` |
| `REDIS_HOST` | Redis hostname | `localhost` or `redis` in Docker |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | any long random string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | any long random string |
| `JWT_ACCESS_EXPIRES` | Access token expiry | `7d` |
| `JWT_REFRESH_EXPIRES` | Refresh token expiry | `7d` |

> **Using Supabase?** Set `DATABASE_URL` to your Supabase connection string and ignore the `POSTGRES_*` variables — those are only used when running a local PostgreSQL container via Docker Compose.

---

## 🎁 Bonus Features Delivered

Beyond what was required by the assessment, the following were also implemented:

| Bonus | Status |
|---|---|
| Refresh token rotation | ✅ Implemented |
| Optimistic UI on lesson completion | ✅ Implemented |
| ThrottlerModule rate limiting configured | ✅ Implemented |
| Teacher email displayed on student course cards | ✅ Implemented |
| Per-lesson completed state via dedicated endpoint | ✅ Implemented |
| Dark / light theme with correct skeleton loading states | ✅ Implemented |
| Animated UI throughout with Framer Motion | ✅ Implemented |
| Redis pub/sub fully decoupled from WebSocket layer | ✅ Implemented |

---

## 👨‍💻 Author

**Muhammad Ali Ashraf**
