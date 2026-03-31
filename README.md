# 🎓 Course Management System (CMS)

**Built by Muhammad Ali Ashraf**

A full-stack Learning Management System built as a technical assessment. Teachers can create courses and manage lessons, while students can browse, enroll, and track their learning progress — all with a real-time activity feed powered by WebSockets and Redis.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Architectural Decisions / Production Notes](#%EF%B8%8F-architectural-decisions--production-notes)
- [Database Schema](#%EF%B8%8F-database-schema)
- [Running the Project](#-running-the-project)
- [Troubleshooting](#-troubleshooting)
- [Environment Variables](#%EF%B8%8F-environment-variables)
- [Bonus Features](#bonus-features)
- [Screenshots](#%EF%B8%8F-screenshots)
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
- JWT access token (valid for 7 days) – no JWT refresh token; refresh tokens are stored in Redis with a 7‑day TTL
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
## 🛠️ Architectural Decisions / Production Notes 

### Authentication Flow

- **Access tokens** are signed JWTs with a 7‑day expiry (configurable via `JWT_ACCESS_EXPIRES`).  
- **Refresh tokens** are **not** JWTs. Instead, when a user logs in, a random UUID is generated, stored in Redis with a 7‑day TTL, and returned as the refresh token.  
- On `/auth/refresh`, the provided refresh token is looked up in Redis. If found, it is deleted and a new refresh token is generated (rotation), and a fresh access token is issued.  
- The `JwtStrategy` validates the access token using the secret. The `RefreshTokenStrategy` (custom Passport strategy) reads the refresh token from the request body and checks Redis.

### Token Handling in the Frontend

- The `authSync.ts` module listens to the Zustand store and calls `setAuthToken` to update the Axios default header whenever the access token changes.  
- All API requests automatically include the `Authorization: Bearer <token>` header.  
- **No automatic refresh interceptor** is implemented. Instead, to keep the assessment simple and avoid 401 errors during testing, the access token expiry has been set to 7 days.  
- In a production application, a proper Axios interceptor would be added to `/src/lib/api.ts` to catch 401 responses, call `/auth/refresh`, and retry the original request.

### WebSocket & Real‑Time Events

- The WebSocket gateway uses `io()` (relative path) so it works both locally (proxied by Vite) and in Docker (proxied by Nginx).  
- Events are published to a Redis channel `activity_channel` by the services (`enrollments` and `progress`). The gateway subscribes and broadcasts to all connected clients.  
- The frontend `useActivityFeed` hook automatically reconnects on disconnect (handled by Socket.IO client).

### Redis Pub/Sub for WebSockets
Rather than emitting WebSocket events directly from services, all activity events are published to a Redis channel (`activity_channel`). The WebSocket gateway subscribes to this channel and broadcasts to all connected clients. This decouples the business logic from the WebSocket layer and makes the system ready for horizontal scaling — multiple API instances can publish to the same Redis channel and all clients receive events regardless of which instance they are connected to.

### Progress Calculation
Progress percentage is calculated server‑side as:

(completed lessons in this course / total lessons in this course) × 100

Completed lessons are always filtered to the specific course before counting — this prevents cross‑course contamination where completing a lesson in Course A would incorrectly inflate the progress of Course B.

### Course Modal Instead of a Course Page
The student‑facing lesson view is implemented as an inline modal component rather than a separate route. This keeps the page count minimal and the navigation clean — students never lose context of the course browser while completing lessons.

### Route Ordering in NestJS
Static routes (`/students/me/progress`) are always declared before dynamic routes (`/students/:id/progress`) in the controller. NestJS matches routes top‑to‑bottom — without this ordering, the literal string `me` would be matched as a student ID parameter and the endpoint would never be reached.

### CORS
The backend currently allows all origins (`*`). In production, restrict this to your frontend domain.

---

---

## 🗄️ Database Schema

The database consists of five tables with proper foreign keys and indexes to support the LMS functionality.

### Entity‑Relationship Diagram

![Database Schema](screenshots/db-schema.png.PNG)

### Tables

| Table | Columns | Description |
|-------|---------|-------------|
| `users` | `id`, `email`, `password_hash`, `role`, `created_at` | Stores user accounts with roles `teacher` or `student`. |
| `courses` | `id`, `title`, `description`, `teacher_id`, `created_at` | Courses created by teachers. `teacher_id` references `users.id`. |
| `lessons` | `id`, `course_id`, `title`, `content`, `order`, `created_at` | Lessons belonging to a course. `order` ensures unique ordering per course (unique index `unique_course_order`). |
| `enrollments` | `id`, `student_id`, `course_id`, `enrolled_at` | Many‑to‑many relationship between students and courses. Unique index `unique_student_course` prevents duplicate enrollments. |
| `progress` | `id`, `student_id`, `lesson_id`, `completed`, `completed_at` | Tracks lesson completion. Unique index `unique_student_lesson` ensures each student can complete a lesson only once. |

### Key Constraints & Indexes

- `courses.teacher_id` → `users.id` (cascade delete)
- `lessons.course_id` → `courses.id` (cascade delete)
- `enrollments.student_id` → `users.id` (cascade delete)
- `enrollments.course_id` → `courses.id` (cascade delete)
- `progress.student_id` → `users.id` (cascade delete)
- `progress.lesson_id` → `lessons.id` (cascade delete)

- `unique_student_course` – prevents a student from enrolling in the same course twice.
- `unique_course_order` – ensures lesson orders are unique per course.
- `unique_student_lesson` – prevents duplicate completion records.

All foreign keys are defined with `ON DELETE CASCADE` so that when a user or course is deleted, related records are automatically removed.

The migration file [`0000_flashy_rictor.sql`](backend/src/database/migrations/0000_flashy_rictor.sql) contains the exact SQL used to create the schema.

---

## 🚀 Running the Project

### 📦 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for the containerised run
- A [Supabase](https://supabase.com) account — free tier is enough
- A terminal — PowerShell, bash, or any terminal

---

### ⚙️ Environment Setup (Required for Both Options)

Before running the project you need to create a `.env` file in the `backend/` folder.

**Step 1 — Copy the example file:**
```bash
cp backend/.env.example backend/.env
```

**Step 2 — Get your Supabase DATABASE_URL:**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project — remember the database password you set
3. Once the project is ready, click the green **Connect** button in the top-right
4. Under **ORM**, select **Drizzle**
5. Click the **.env** tab — copy the `DATABASE_URL` line
6. Make sure the URL ends with `?sslmode=require` — add it if missing

**Step 3 — Generate your JWT secrets:**
```bash
openssl rand -hex 32
```
**Step 4 — Fill in `backend/.env`:**
```
PORT=3000
DATABASE_URL=your-supabase-url-here?sslmode=require
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-generated-secret
JWT_ACCESS_EXPIRES=7d
```
---

### ⭐ Option 1 — Docker (Recommended — Single Command)

**1. Clone the repository:**
```bash
git clone https://github.com/D3V-ALPHA/CMS.git
cd CMS
```

**2. Complete the environment setup above**

**3. Start the entire stack:**
```bash
docker compose up --build
```

This single command automatically:
- ✅ Starts Redis cache
- ✅ Builds and starts the NestJS backend
- ✅ Runs all database migrations on startup
- ✅ Builds and serves the React frontend via Nginx

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

Gives you hot-reload on both frontend and backend. Requires Node.js 18+.

**1. Clone and set up environment** (same as above)

**2. Start Redis via Docker:**
```bash
docker compose up redis
```

**3. Start the backend** (in a new terminal):
```bash
cd backend
npm install
npm run start:dev
```

**4. Start the frontend** (in another new terminal):
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

### ✅ Verify Everything Works

1. Register as a **Teacher** — create a course and add lessons
2. Register as a **Student** — enroll in the course and complete lessons
3. Watch the **Teacher dashboard live activity feed** update in real time

---

### 🔧 Troubleshooting

**Docker cannot resolve Supabase hostname**

If you see `getaddrinfo ENOTFOUND db.xxx.supabase.co`, your Docker environment
has a DNS issue. Fix it by going to **Docker Desktop → Settings → Docker Engine**
and adding:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
Click **Apply & Restart**, then run `docker compose up --build` again.

### 🐘 Alternative: Use a Local PostgreSQL Container

If you cannot connect to Supabase (e.g., due to network restrictions), you can run a local PostgreSQL database inside Docker. Follow these steps:

1. **Add the PostgreSQL service** to your `docker-compose.yml` (paste the block below into the file, right before the `networks:` section):

   ```yaml
   # ────────────────────────────────────────────────────────────
   # Local PostgreSQL – uncomment if you cannot reach Supabase
   # ────────────────────────────────────────────────────────────
   postgres:
     image: postgres:16-alpine
     container_name: cms-postgres
     restart: unless-stopped
     environment:
       POSTGRES_USER: postgres
       POSTGRES_PASSWORD: postgres
       POSTGRES_DB: cms
     ports:
       - "5432:5432"
     volumes:
       - postgres_data:/var/lib/postgresql/data
     networks:
       - cms-network
     healthcheck:
       test: ["CMD-SHELL", "pg_isready -U postgres -d cms"]
       interval: 10s
       timeout: 5s
       retries: 5

   networks:
     cms-network:
       driver: bridge

   volumes:
     postgres_data:

then change your
`DATABASE_URL` in `backend/.env` to:
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cms?sslmode=disable
```

Then run:
```bash
docker compose up --build
```
The local database and migrations will be handled automatically.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string (Supabase or local) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `REDIS_HOST` | Redis hostname | `localhost` or `redis` in Docker |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | any long random string |
| `JWT_ACCESS_EXPIRES` | Access token expiry (e.g., `15m`, `7d`) | `7d` |

> **Note:** Refresh tokens are stored in Redis, not signed with a secret. No `JWT_REFRESH_SECRET` is needed.  
> If you use the optional local PostgreSQL container, also set the `POSTGRES_*` variables (see `docker-compose.yml`).

---

## 🎁 Bonus Features Delivered

Beyond what was required by the assessment, the following were also implemented:

| Bonus | Status |
|---|---|
| Refresh token rotation | ✅ Implemented (Redis‑based) |
| Optimistic UI on lesson completion | ✅ Implemented |
| ThrottlerModule rate limiting configured | ✅ Implemented |
| Teacher email displayed on student course cards | ✅ Implemented |
| Per‑lesson completed state via dedicated endpoint | ✅ Implemented |
| Dark / light theme with correct skeleton loading states | ✅ Implemented |
| Animated UI throughout with Framer Motion | ✅ Implemented |
| Redis pub/sub fully decoupled from WebSocket layer | ✅ Implemented |

---

## 🖼️ Screenshots

### 🔐 Authentication

![Auth Page](screenshots/auth-page.png.PNG)

The login/register screen with role selection.

---

### 🎓 Student Dashboard & Lesson Completion

![Student Dashboard](screenshots/student-dashboard.png.PNG)

Course browser with pagination, live search, enrolled courses, and progress bars.

![Complete Lesson](screenshots/complete-lesson.png.PNG)

Inline modal for viewing lessons, marking them complete, and tracking real‑time progress.

---

### 👩‍🏫 Teacher Dashboard & Management

![Teacher Dashboard](screenshots/teacher-dashboard.png.PNG)

Course list, lesson list with drag‑and‑drop, and live activity feed.

![Create Course](screenshots/image_2026-03-31_200745916.png)

Creating a new course via modal.

![Add Lesson](screenshots/add-lesson.png.PNG)

Adding a lesson to a course with title, content, and order.

---

### 🐳 Docker Containers

![Docker Containers](screenshots/docker-containers.png.png)

The Docker Compose project `cms` runs three containers:
- `cms-redis` – Redis cache
- `cms-backend` – NestJS API (port 3000)
- `cms-frontend` – React frontend served by Nginx (port 5173)

All services start together with `docker compose up`.

---
## 👨‍💻 Author

**Muhammad Ali Ashraf**
