# Habitat – Modern Real Estate Platform (Next.js + FastAPI)

## Overview

Habitat is a modern, full-featured real estate platform built with a **Next.js (React)** frontend and a **FastAPI (Python)** backend. This project provides a comprehensive solution for managing property listings, agents, user interactions, and site content.

## Features

*   **Property Listings:** Detailed property information, image galleries, search and filtering, map integration.
*   **User Roles:** Admin, Manager, Staff with distinct permissions.
*   **Admin Dashboard:** Centralized management of:
    *   Properties (CRUD operations)
    *   Users and Roles
    *   Team Members
    *   Site Settings (contact info, social media, About Us page content, footer, etc.)
    *   Appearance (theme colors - currently view-only, homepage background image)
*   **Contact Form:** Submissions stored and viewable in admin, with PDF export.
*   **Dynamic Content:** About page, Footer, Social Media links are editable from admin panel.
*   **Image Uploads:** For properties, team members, and site background.
*   **Authentication:** JWT-based authentication for the backend API.
*   **Responsive Design:** Adapts to various screen sizes.
*   **Dark Theme:** For the public-facing site, dynamically configurable (colors viewable in admin).

## Tech Stack

*   **Frontend:** Next.js 14 (React), Tailwind CSS, `react-toastify`, `react-leaflet`
*   **Backend:** FastAPI, Python 3.10+, SQLAlchemy (ORM), PostgreSQL (recommended) / SQLite, Alembic (migrations), Pydantic
*   **Authentication:** JWT (JSON Web Tokens)

## Directory Structure

```
habitat/
├── frontend/            # Next.js application
│   ├── components/      # React components
│   ├── context/         # React context (e.g., SettingsContext)
│   ├── pages/           # Next.js pages (including admin UI)
│   ├── public/          # Static assets (images, fonts)
│   ├── services/        # API service functions
│   ├── styles/          # Global styles, Tailwind config
│   ├── next.config.js
│   └── package.json
├── backend/             # FastAPI application
│   ├── alembic/         # Alembic migration scripts
│   ├── auth/            # Authentication logic (JWT, password hashing)
│   ├── core/            # Core settings, database connection
│   ├── crud/            # CRUD operations for database models
│   ├── models.py        # SQLAlchemy ORM models
│   ├── routers/         # API endpoint definitions
│   ├── schemas.py       # Pydantic schemas for data validation
│   ├── static/          # Static files served by backend (e.g., uploads)
│   ├── utils/           # Utility functions (e.g., PDF generation)
│   ├── main.py          # FastAPI application entry point
│   ├── seed_data.py     # Script to populate initial database content
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile
├── .gitignore
└── README.md
```

## Prerequisites

1.  **Node.js:** Version 18 or higher (for the Next.js frontend).
2.  **Python:** Version 3.10 or higher (for the FastAPI backend).
3.  **Database:** PostgreSQL (recommended for production) or SQLite (for quick local development).

## Setup and Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd habitat
```

### 2. Backend Setup (FastAPI)

```bash
cd backend
python -m venv .venv
# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

pip install -r requirements.txt

# Environment Variables:
# Create a .env file in the `backend/` directory (you can copy from a .env.example if provided).
# Essential variables:
# DATABASE_URL=postgresql+psycopg2://user:password@host:port/dbname  (for PostgreSQL)
# or for SQLite (default if not set, relative to project root):
# DATABASE_URL=sqlite:///../habitat_api.db
# SECRET_KEY=a_very_strong_and_random_secret_key_for_jwt
# ALGORITHM=HS256 (default)
# ACCESS_TOKEN_EXPIRE_MINUTES=30 (default)
# BACKEND_CORS_ORIGINS=http://localhost:3000 (adjust if frontend runs on different port)

# Database Migrations (Alembic):
# (Ensure your DATABASE_URL in .env is correctly configured first)
alembic upgrade head  # Applies database migrations

# Seed Initial Data (Optional but Recommended):
# This creates default admin user, site settings, sample properties, etc.
python -m seed_data  # Run from within the backend directory

# Run the Backend Development Server:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install          # or pnpm install / yarn install

# Environment Variables:
# Create a .env.local file in the `frontend/` directory.
# Essential variable:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 # URL of your FastAPI backend

# Run the Frontend Development Server:
npm run dev          # or pnpm dev / yarn dev
```
The frontend application will be available at `http://localhost:3000`.

### Default Admin Account (from seed_data.py)

*   **Username:** `admin`
*   **Password:** `Admin123!`
*   **Important:** Change these credentials after your first login, especially in a production environment!

## Deployment

### Backend (FastAPI)

*   **Docker:** A `backend/Dockerfile` is provided. Build an image and run it on a container platform.
    *   `docker build -t habitat-backend ./backend`
    *   `docker run -d -p 8000:8000 --env-file ./backend/.env habitat-backend`
*   **Server/VPS:**
    *   Use a process manager like Supervisor.
    *   Use an ASGI server like Gunicorn with Uvicorn workers:
        `gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000`
    *   Place behind a reverse proxy like Nginx for SSL termination, caching, and load balancing.
*   **PaaS:** Platforms like Heroku (with Python buildpack), Google Cloud Run, AWS Elastic Beanstalk.

### Frontend (Next.js)

*   **Vercel:** The easiest way to deploy Next.js applications, offering seamless integration.
*   **Node.js Server:** Build the app (`npm run build`) and run it with a Node.js server (`npm start`). This can be containerized or run on a VPS with a process manager and reverse proxy.
*   **Static Export:** If your site has limited dynamic server-side needs, consider static export (`next export`), though this project leverages API routes and SSR/ISR features that benefit from a Node.js environment.
*   **Netlify, AWS Amplify, Azure Static Web Apps:** Other platforms with good Next.js support.

## Maintenance

*   **Regular Backups:**
    *   Database (PostgreSQL `pg_dump`, or SQLite file copy).
    *   Uploaded files (`backend/static/uploads/` directory).
*   **Dependency Updates:** Regularly update packages for both frontend (`npm outdated`, `npm update`) and backend (`pip list --outdated`, `pip install -U <package>`) to patch security vulnerabilities and get new features. Test thoroughly after updates.
*   **Monitoring:**
    *   Application-level logging and error tracking (e.g., Sentry, LogRocket).
    *   Server resource monitoring (CPU, memory, disk space).

## Security Considerations

*   **Strong `SECRET_KEY`:** Ensure a unique, long, and random secret key for JWT signing in the backend `.env` file.
*   **Environment Variables:** Never commit sensitive information (API keys, database credentials, secret keys) directly into the codebase. Use `.env` files (added to `.gitignore`) and environment variables in deployment.
*   **HTTPS:** Enforce HTTPS in production for both frontend and backend.
*   **CORS:** Configure `BACKEND_CORS_ORIGINS` in the backend correctly to only allow your frontend domain.
*   **Input Validation:** FastAPI with Pydantic handles request validation. Ensure all inputs are validated.
*   **SQL Injection:** SQLAlchemy helps prevent SQL injection, but always use its ORM features correctly.
*   **XSS (Cross-Site Scripting):** React helps mitigate XSS by escaping content by default. Be cautious when using `dangerouslySetInnerHTML`. Sanitize user-generated content if displayed.
*   **Rate Limiting:** Implement rate limiting on sensitive API endpoints (login, contact form) to prevent abuse.
*   **Regular Audits:** Periodically review security best practices and audit your application.
*   **File Uploads:** Validate file types and sizes. Consider scanning uploaded files for malware.

## License

This project is licensed under the MIT License.
