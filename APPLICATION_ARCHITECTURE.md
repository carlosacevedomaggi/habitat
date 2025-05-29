# Application Architecture Overview

## 1. Introduction

This document provides a high-level overview of the application's architecture. It describes the main components, their technology stacks, responsibilities, and how they interact. This document is intended for onboarding new developers and for anyone needing to understand the system's structure.

The application follows a **client-server architectural pattern**, with distinct frontend and backend services. For deployment and development consistency, the entire stack is **containerized using Docker and orchestrated with Docker Compose**.

## 2. Core Components

The system is composed of the following primary services:

*   **Frontend Application**
*   **Backend API**
*   **Database**
*   **Nginx Reverse Proxy**

```mermaid
graph LR
    User[User's Browser] --> Nginx[Nginx Reverse Proxy];

    subgraph Dockerized Services
        Nginx --> Frontend[Frontend (Next.js)];
        Nginx --> Backend[Backend (FastAPI)];
        Frontend -- API Calls --> Backend;
        Backend -- Database Queries --> Database[(Database)];
        Backend -- Serves Files --> Nginx;
    end

    style User fill:#fff,stroke:#333,stroke-width:2px
    style Nginx fill:#eee,stroke:#333,stroke-width:2px
    style Frontend fill:#lightcyan,stroke:#333,stroke-width:2px
    style Backend fill:#honeydew,stroke:#333,stroke-width:2px
    style Database fill:#lavenderblush,stroke:#333,stroke-width:2px
```

### 2.1. Frontend

*   **Technology Stack:**
    *   Framework: **Next.js** (React framework)
    *   Language: JavaScript/JSX
    *   Styling: **Tailwind CSS**
    *   State Management: React Context API (e.g., [`SettingsContext.js`](frontend/context/SettingsContext.js:1))
*   **Responsibilities:**
    *   Rendering the user interface (UI) and handling user interactions.
    *   Client-side routing and page navigation.
    *   Managing client-side application state.
    *   Communicating with the Backend API to fetch and submit data (via services like [`propertyService.js`](frontend/services/propertyService.js:1)).
*   **Key Structural Elements (as per [`PROJECT_STRUCTURE_AND_INTERACTIONS.md`](PROJECT_STRUCTURE_AND_INTERACTIONS.md:1)):**
    *   **Pages ([`frontend/pages/`](frontend/pages/)):** Define application routes.
    *   **Components ([`frontend/components/`](frontend/components/)):** Reusable UI building blocks.
    *   **Services ([`frontend/services/`](frontend/services/)):** Modules for API interactions.
    *   **Context ([`frontend/context/`](frontend/context/)):** Global state management.
*   **Deployment:** Runs as a Docker container (`frontend` service in [`docker-compose.yml`](docker-compose.yml:1)).

### 2.2. Backend

*   **Technology Stack:**
    *   Framework: **FastAPI**
    *   Language: **Python**
    *   ORM: **SQLAlchemy** (for database interaction)
    *   Data Validation/Serialization: Pydantic (schemas in [`backend/schemas.py`](backend/schemas.py:1))
*   **Responsibilities:**
    *   Providing a RESTful API for the frontend and potentially other clients.
    *   Implementing core business logic.
    *   Interacting with the database for data persistence (CRUD operations).
    *   Handling user authentication and authorization (JWT-based, using utilities in [`backend/auth/`](backend/auth/)).
    *   Serving static files, such as user-uploaded images (from `backend/static/uploads/`).
*   **Key Structural Elements (as per [`PROJECT_STRUCTURE_AND_INTERACTIONS.md`](PROJECT_STRUCTURE_AND_INTERACTIONS.md:1)):**
    *   **Routers ([`backend/routers/`](backend/routers/)):** Define API endpoints.
    *   **CRUD Modules ([`backend/crud/`](backend/crud/)):** Contain data access logic.
    *   **Models ([`backend/models.py`](backend/models.py:1)):** SQLAlchemy database table definitions.
    *   **Schemas ([`backend/schemas.py`](backend/schemas.py:1)):** Pydantic models for request/response validation.
*   **Deployment:** Runs as a Docker container (`backend` service in [`docker-compose.yml`](docker-compose.yml:1)).

### 2.3. Database

*   **Type:**
    *   **Primary (Dockerized Environment): PostgreSQL** (version 15-alpine, as defined in [`docker-compose.yml`](docker-compose.yml:47)'s `db` service).
    *   **Local Development Fallback/Alternative:** SQLite (evidenced by [`habitat_api.db`](habitat_api.db:1) in the project root).
*   **Role:**
    *   Provides persistent storage for all application data. This includes:
        *   Property listings
        *   Team members
        *   User accounts
        *   Site settings
        *   Property images
        *   Property click tracking
*   **ORM:** **SQLAlchemy** is used by the backend to interact with the database.
*   **Deployment:** Runs as a Docker container (`db` service in [`docker-compose.yml`](docker-compose.yml:1)) when using PostgreSQL.

### 2.4. Other Significant Services/Components

#### 2.4.1. Nginx (Reverse Proxy)

*   **Technology:** Nginx (latest image, configured via [`nginx.conf`](nginx.conf:1)).
*   **Role:**
    *   Acts as the main entry point for all incoming HTTP/HTTPS traffic.
    *   Performs **reverse proxying**:
        *   Routes requests to `/` (and other UI paths) to the **Frontend** service.
        *   Routes requests to `/api/` to the **Backend** service.
        *   Routes requests to `/static/` to the **Backend** service (which then serves the static files).
    *   Handles SSL termination (intended, with certificate paths configured in [`docker-compose.yml`](docker-compose.yml:1) and [`nginx.conf`](nginx.conf:1)).
    *   Can be used for load balancing (though not explicitly configured for multiple backend instances in the current setup).
    *   Serves a `/health` check endpoint by proxying to the backend.
*   **Deployment:** Runs as a Docker container (`proxy` service in [`docker-compose.yml`](docker-compose.yml:1)).

#### 2.4.2. Docker & Docker Compose

*   **Role:**
    *   **Docker:** Provides containerization for the frontend, backend, database (PostgreSQL), and Nginx proxy. This ensures consistent environments across development, testing, and production.
    *   **Docker Compose ([`docker-compose.yml`](docker-compose.yml:1)):** Orchestrates the multi-container application. It defines the services, their build configurations, dependencies, networking, ports, and volumes.

## 3. Component Interactions

The major components interact as follows:

1.  **User to Nginx:** The user's web browser sends HTTP/HTTPS requests to the application's domain, which are received by Nginx.
2.  **Nginx to Frontend/Backend:**
    *   Nginx inspects the request path.
    *   If it's a UI-related path (e.g., `/`, `/about`, `/properties`), Nginx forwards the request to the **Frontend (Next.js) container**.
    *   If it's an API call (e.g., `/api/properties`, `/api/team`), Nginx forwards the request to the **Backend (FastAPI) container**.
    *   If it's a request for a static asset (e.g., `/static/uploads/image.jpg`), Nginx forwards the request to the **Backend container**, which serves the file.
3.  **Frontend to Backend:** The Frontend application (running in the user's browser or server-side rendered by Next.js) makes asynchronous API calls to the Backend API (via Nginx) to fetch data or submit changes.
4.  **Backend to Database:** The Backend application uses SQLAlchemy to execute queries (SELECT, INSERT, UPDATE, DELETE) against the **Database (PostgreSQL in Docker, or SQLite locally)** to manage persistent data.
5.  **Authentication Flow:**
    *   Users authenticate via an endpoint on the Backend API.
    *   The Backend issues a JWT (JSON Web Token).
    *   The Frontend stores this token and includes it in subsequent requests to protected API endpoints.
    *   The Backend validates the JWT to authorize access to resources.

This architecture provides a clear separation of concerns between the presentation layer (Frontend), business logic/data access layer (Backend), data storage (Database), and request handling/routing (Nginx).