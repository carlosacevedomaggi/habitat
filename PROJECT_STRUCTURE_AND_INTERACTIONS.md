# Project Structure and Key Module Interactions

## 1. Introduction

This document provides a high-level overview of the project's file structure for both the frontend and backend applications. It also details the key modules and components involved in displaying listings (properties) and team members, outlining their interactions. This analysis aims to consolidate understanding of the codebase, particularly in relation to the observed visibility issues where some data is visible in admin areas but not on public-facing pages. This document synthesizes information from the project's file system and previous analyses ([`DATA_LIFECYCLE_ANALYSIS.MD`](DATA_LIFECYCLE_ANALYSIS.MD:1), [`subtask_1_3_findings.md`](subtask_1_3_findings.md:1), and [`SYSTEM_ARCHITECTURAL_MAP.md`](SYSTEM_ARCHITECTURAL_MAP.md:1)).

## 2. Frontend File Structure (`frontend/`)

The frontend is a Next.js application.

### Key Subdirectories:

*   **`frontend/components/`**: Contains reusable React components used across various pages (e.g., [`Header.js`](frontend/components/Header.js:1), [`Footer.js`](frontend/components/Footer.js:1), [`PropertyCard.js`](frontend/components/PropertyCard.js:1), [`LeafletMap.js`](frontend/components/LeafletMap.js:1)).
*   **`frontend/pages/`**: Core of the Next.js routing system. Each `.js` file in this directory (and its subdirectories) corresponds to a route.
    *   `_app.js`, `_document.js`: Special Next.js files for global app shell and HTML document structure.
    *   Public routes: e.g., [`index.js`](frontend/pages/index.js:1) (homepage), [`about.js`](frontend/pages/about.js:1), [`contact.js`](frontend/pages/contact.js:1), `properties/index.js`, `properties/[id].js`.
    *   Admin routes: Nested under `admin/`, e.g., `admin/dashboard.js`, `admin/properties/index.js`, `admin/team/index.js`.
*   **`frontend/services/`**: Houses modules responsible for making API calls to the backend (e.g., [`propertyService.js`](frontend/services/propertyService.js:1), [`settingsService.js`](frontend/services/settingsService.js:1)).
*   **`frontend/context/`**: Implements React Context API for global state management. For example, [`SettingsContext.js`](frontend/context/SettingsContext.js:1) likely manages site-wide settings.
*   **`frontend/public/`**: Stores static assets like images ([`HABITAT_LOGO_BLK.png`](frontend/public/images/HABITAT_LOGO_BLK.png:1)) and `favicon.ico`. These are served directly by Next.js.
*   **`frontend/styles/`**: Contains global CSS files like [`globals.css`](frontend/styles/globals.css:1).
*   **`frontend/lib/`**: Intended for utility functions or libraries (currently contains a `.gitkeep` file, indicating it's a placeholder or not heavily used yet).

### Key Root-Level Files:

*   **[`frontend/next.config.js`](frontend/next.config.js:1)**: Configuration file for Next.js. Controls aspects like build process, environment variables, image optimization, and custom webpack configurations.
*   **[`frontend/package.json`](frontend/package.json:1)**: Node.js project manifest. Lists project dependencies (React, Next.js, etc.), scripts (dev, build, start), and other metadata. [`package-lock.json`](frontend/package-lock.json:1) ensures deterministic installs.
*   **[`frontend/tailwind.config.js`](frontend/tailwind.config.js:1)**: Configuration file for Tailwind CSS, defining theme customizations, plugins, and content paths.
*   **[`frontend/postcss.config.js`](frontend/postcss.config.js:1)**: Configuration for PostCSS, a tool for transforming CSS with JavaScript plugins (often used with Tailwind CSS for autoprefixing).
*   **[`frontend/Dockerfile`](frontend/Dockerfile:1)**: Instructions for building a Docker image for the frontend application, enabling containerized deployment.

## 3. Backend File Structure (`backend/`)

The backend is a FastAPI (Python) application.

### Key Subdirectories:

*   **`backend/crud/`**: Contains modules for Create, Read, Update, Delete (CRUD) operations. These modules typically interact directly with the database models and contain business logic for data manipulation (e.g., [`properties.py`](backend/crud/properties.py:1), [`team.py`](backend/crud/team.py:1), [`settings.py`](backend/crud/settings.py:1)).
*   **`backend/routers/`**: Defines API endpoints using FastAPI's `APIRouter`. Each file typically groups related endpoints (e.g., [`properties.py`](backend/routers/properties.py:1) for property-related routes, [`team.py`](backend/routers/team.py:1) for team routes).
*   **`backend/models.py`**: Defines SQLAlchemy database models, representing the structure of database tables.
*   **`backend/schemas.py`**: Defines Pydantic schemas used for data validation (incoming requests) and serialization (outgoing responses).
*   **`backend/core/`**: Contains core application configuration, suchas database connection setup ([`database.py`](backend/core/database.py:1)) and application settings ([`config.py`](backend/core/config.py:1)).
*   **`backend/static/`**: Serves static files directly from the backend, such as user-uploaded images (`uploads/`).
*   **`backend/alembic/`**: Manages database schema migrations using Alembic. Contains migration scripts (`versions/`) and configuration.
*   **`backend/auth/`**: Likely contains authentication and authorization related utilities (e.g., password hashing, token generation/validation in [`utils.py`](backend/auth/utils.py:1)).
*   **`backend/utils/`**: General utility modules, for example, [`pdf.py`](backend/utils/pdf.py:1).

### Key Root-Level Files:

*   **[`backend/main.py`](backend/main.py:1)**: The main entry point for the FastAPI application. Initializes the FastAPI app, includes routers, and sets up middleware.
*   **[`backend/requirements.txt`](backend/requirements.txt:1)**: Lists all Python dependencies required for the backend application (FastAPI, Uvicorn, SQLAlchemy, Pydantic, etc.).
*   **[`backend/alembic.ini`](backend/alembic.ini:1)**: Configuration file for Alembic database migrations.
*   **[`backend/Dockerfile`](backend/Dockerfile:1)**: Instructions for building a Docker image for the backend application.
*   **[`backend/entrypoint.sh`](backend/entrypoint.sh:1)**: A shell script often used as the entry point for the Docker container. It might run database migrations (via Alembic) before starting the Uvicorn server to serve the FastAPI application.
*   **[`backend/seed_data.py`](backend/seed_data.py:1)**: A script likely used to populate the database with initial or sample data during development or setup.

## 4. Root-Level Project Files

These files are at the root of the project and manage the overall application environment and services.

*   **[`docker-compose.yml`](docker-compose.yml:1)**: Defines and configures a multi-container Docker application. It likely orchestrates the frontend, backend, a database (e.g., PostgreSQL or the provided `habitat_api.db` SQLite file for development), and an Nginx reverse proxy.
*   **[`nginx.conf`](nginx.conf:1)**: Configuration file for the Nginx web server. Nginx is likely used as a reverse proxy to route requests to the appropriate backend or frontend service, handle SSL termination, and serve static assets efficiently.
*   **`.env.example`**: An example file showing the structure and names of environment variables required by the application (e.g., database credentials, API keys, secret keys). The actual values are typically stored in a `.env` file (which is gitignored).
*   **`.gitignore`**: Specifies intentionally untracked files that Git should ignore (e.g., `.env`, `__pycache__/`, `node_modules/`, `habitat_api.db`).
*   **`README.md`**: Provides an overview of the project, setup instructions, and other relevant information for developers.
*   **`habitat_api.db`**: An SQLite database file, likely used for local development if a more robust database like PostgreSQL is not configured or running.

## 5. Key Module/Component Interactions for Listings and Team Members

This section details how frontend and backend modules interact to display listings (properties) and team members, referencing the communication flows documented in [`SYSTEM_ARCHITECTURAL_MAP.md`](SYSTEM_ARCHITECTURAL_MAP.md:1).

### Listings (Properties)

*   **Frontend (Public View):**
    *   **Pages:** [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1) (list view), [`frontend/pages/properties/[id].js`](frontend/pages/properties/[id].js:1) (detail view).
    *   **Components:** [`frontend/components/PropertyCard.js`](frontend/components/PropertyCard.js:1) for individual listing display, [`frontend/components/PropertyFilter.js`](frontend/components/PropertyFilter.js:1) for search/filter UI, potentially map components like [`frontend/components/MapWithPins.js`](frontend/components/MapWithPins.js:1).
    *   **Service:** [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1) contains functions to fetch publicly available properties from the backend API.
    *   **Context:** [`frontend/context/SettingsContext.js`](frontend/context/SettingsContext.js:1) might influence display if global settings (e.g., currency, units) are relevant.
*   **Frontend (Admin View):**
    *   **Pages:** [`frontend/pages/admin/properties/index.js`](frontend/pages/admin/properties/index.js:1) (list all properties), [`frontend/pages/admin/properties/new.js`](frontend/pages/admin/properties/new.js:1) (create new), [`frontend/pages/admin/properties/edit/[id].js`](frontend/pages/admin/properties/edit/[id].js:1) (edit existing).
    *   **Service:** [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1) also handles fetching all properties (including non-public ones for admin), and methods for creating, updating, and deleting properties.
*   **Backend:**
    *   **Router:** [`backend/routers/properties.py`](backend/routers/properties.py:1) defines API endpoints like `GET /properties` (for public list, possibly with filters), `GET /properties/{id}` (for public detail), `GET /admin/properties` (for admin list), `POST /admin/properties`, `PUT /admin/properties/{id}`, etc.
    *   **CRUD:** [`backend/crud/properties.py`](backend/crud/properties.py:1) implements the database interaction logic. Functions here will query the `Property` model, applying filters (e.g., `is_public=True` for public views) and handling data manipulation.
    *   **Models:** The `Property` model in [`backend/models.py`](backend/models.py:1) defines the property data structure in the database.
    *   **Schemas:** Pydantic schemas in [`backend/schemas.py`](backend/schemas.py:1) (e.g., `PropertyPublic`, `PropertyAdmin`, `PropertyCreate`) validate request data and format response data.

### Team Members

*   **Frontend (Public View):**
    *   **Page:** [`frontend/pages/about.js`](frontend/pages/about.js:1) is a likely candidate for displaying team member information.
    *   **Components:** A dedicated component like `TeamMemberCard.js` (if it exists, or similar logic within `about.js`) would be used for display.
    *   **Service:** A dedicated `teamService.js` or relevant functions within an existing service (e.g., [`frontend/services/settingsService.js`](frontend/services/settingsService.js:1) if team members are considered part of general site content, or a new service) would fetch public team member data.
*   **Frontend (Admin View):**
    *   **Pages:** [`frontend/pages/admin/team/index.js`](frontend/pages/admin/team/index.js:1), [`frontend/pages/admin/team/new.js`](frontend/pages/admin/team/new.js:1), [`frontend/pages/admin/team/edit/[id].js`](frontend/pages/admin/team/edit/[id].js:1).
    *   **Service:** The corresponding service would handle fetching all team members and provide create/update/delete functionalities.
*   **Backend:**
    *   **Router:** [`backend/routers/team.py`](backend/routers/team.py:1) defines API endpoints for team member data.
    *   **CRUD:** [`backend/crud/team.py`](backend/crud/team.py:1) implements database interactions for team members, including filtering for public display (e.g., based on an `is_active` or `is_public` flag).
    *   **Models:** A `TeamMember` model in [`backend/models.py`](backend/models.py:1).
    *   **Schemas:** Pydantic schemas for team members in [`backend/schemas.py`](backend/schemas.py:1).

### High-Level Interaction Flow (Conceptual)

```mermaid
graph TD
    subgraph Frontend
        A[User Action on Page (e.g., Load /properties)] --> B{Page Component (e.g., frontend/pages/properties/index.js)};
        B --> C[Service Call (e.g., propertyService.getPublicProperties())];
        C --> D{API Request (e.g., GET /api/v1/properties)};
        F[UI Components (e.g., PropertyCard.js) receive data] --> B;
    end

    subgraph Backend
        E{API Endpoint (e.g., backend/routers/properties.py @router.get("/properties"))};
        D --> E;
        E --> G[Router Logic (validates with schemas.py)];
        G --> H[CRUD Function (e.g., crud.properties.get_multi_public())];
        H --> I[Database Query (via models.py, e.g., SELECT * FROM properties WHERE is_public = TRUE)];
        I --> H;
        H --> G;
        G --> E;
    end
    E --> C;
    C --> B;
    B --> J[Render Content to User];

    %% Admin Path is similar but uses different endpoints/CRUD functions
    %% that might not filter by is_public or apply different authorization.
    subgraph Admin Path Example
        Admin_A[Admin Navigates to /admin/properties] --> Admin_B{Admin Page Component};
        Admin_B --> Admin_C[Service Call (e.g., propertyService.getAllProperties())];
        Admin_C --> Admin_D{API Request (e.g., GET /api/v1/admin/properties)};
        Admin_D --> Admin_E{Admin API Endpoint};
        Admin_E --> Admin_G[Admin Router Logic];
        Admin_G --> Admin_H[Admin CRUD Function (e.g., crud.properties.get_multi_admin())];
        Admin_H --> Admin_I[DB Query (e.g., SELECT * FROM properties)];
        Admin_I --> Admin_H;
        Admin_H --> Admin_G;
        Admin_G --> Admin_E;
        Admin_E --> Admin_C;
        Admin_C --> Admin_B;
        Admin_B --> Admin_J[Render Admin Table];
    end

    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#ccf,stroke:#333,stroke-width:2px
    style Admin Path fill:#ff9,stroke:#333,stroke-width:2px,color:#333
```

## 6. Relationship to Visibility Issue

The described file structure and module interactions provide several potential points where the visibility discrepancy (items visible in admin but not publicly) could arise:

*   **Backend CRUD Logic (`backend/crud/`)**: This is the most likely area.
    *   Public-facing data retrieval functions (e.g., `get_public_listings` in [`backend/crud/properties.py`](backend/crud/properties.py:1) or `get_public_team_members` in [`backend/crud/team.py`](backend/crud/team.py:1)) might be missing or have incorrect filtering logic. They must explicitly filter for records marked as "public" or "active" (e.g., `WHERE is_public = TRUE AND is_active = TRUE`).
    *   Admin-facing functions might fetch all records or apply different, less restrictive filters.
*   **Backend Router Logic (`backend/routers/`)**:
    *   Public API endpoints might inadvertently call CRUD functions that don't correctly filter for public visibility, or they might not pass the necessary parameters to trigger public filtering.
    *   There might be separate endpoints for public and admin data, and the public ones are not correctly implemented or are missing.
*   **Frontend Service Calls (`frontend/services/`)**:
    *   Frontend services for public pages might call the wrong backend endpoints, or fail to pass parameters that would ensure only publicly visible data is returned.
    *   If the backend API correctly filters, but the frontend service for public pages calls an admin endpoint (unlikely due to auth, but possible if auth is lax or for read-only data), it might receive all data, but then the frontend rendering logic would need to filter, which is not ideal.
*   **Data Model Flags (`backend/models.py`)**:
    *   The `is_public`, `is_active`, or `status` flags in the database models might not be consistently set or updated through the admin interface. If an item is intended to be public but its flag is `False`, it won't appear in correctly filtered public views.
*   **State Management/Rendering (Frontend - Less Likely for Missing Data):**
    *   If the API *does* return the correct public data, then a bug in frontend state management (e.g., in `Context` or page-level state) or conditional rendering logic within components could prevent items from being displayed. However, if the API doesn't send the data, the frontend cannot display it.
*   **Configuration Issues**:
    *   Site-wide settings (potentially managed via [`frontend/context/SettingsContext.js`](frontend/context/SettingsContext.js:1) and [`backend/crud/settings.py`](backend/crud/settings.py:1)) could theoretically influence visibility, though this is less direct than specific flags on items.

The primary investigation for the visibility issue should focus on the backend CRUD functions called by public-facing API endpoints to ensure they correctly and consistently filter records based on their public visibility status.