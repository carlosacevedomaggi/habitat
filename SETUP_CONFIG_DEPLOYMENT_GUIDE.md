# Habitat: Setup, Configuration, and Deployment Guide

## I. Introduction

This guide provides comprehensive instructions for setting up the development environment, configuring the Habitat application, and deploying it to a production-like environment. The primary method for running and managing the application services (backend, frontend, database, and proxy) is through Docker and Docker Compose.

Following these instructions will help developers get started quickly, ensure consistent environments, and provide a clear path for deployment.

## II. Development Environment Setup

### A. Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Docker Engine**: For running containerized applications.
*   **Docker Compose**: For defining and running multi-container Docker applications (supports both v1 `docker-compose` and v2 `docker compose` syntax).
*   **Git**: For cloning the project repository.

While the application uses Node.js (>=18) for the frontend and Python (>=3.10) for the backend, Docker manages these versions within their respective containers, so direct installation on your host machine is not strictly required for Docker-based development.

### B. Cloning the Repository

1.  Open your terminal or command prompt.
2.  Clone the project repository using Git:
    ```bash
    git clone <repository_url>
    ```
    (Replace `<repository_url>` with the actual URL of the Git repository.)
3.  Navigate into the cloned project directory:
    ```bash
    cd habitat-project-directory
    ```
    (Replace `habitat-project-directory` with the actual name of the cloned folder.)

### C. Environment Configuration (`.env` file)

The application uses a `.env` file at the project root to manage environment variables for all services orchestrated by Docker Compose.

1.  In the root of the project directory, copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and configure the essential variables. Refer to [`.env.example`](.env.example:1) and [`backend/core/config.py`](backend/core/config.py:1) for a full list. Key variables include:

    *   `POSTGRES_USER`: Username for the PostgreSQL database (e.g., `habitat_user`).
    *   `POSTGRES_PASSWORD`: Password for the PostgreSQL user (e.g., `supersecretpassword`).
    *   `POSTGRES_DB`: Name of the PostgreSQL database (e.g., `habitat_db`).
    *   `DATABASE_URL`: The connection string for the backend to connect to the database. For the Docker Compose setup, this should be:
        `DATABASE_URL=postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
        (The `db` hostname refers to the PostgreSQL service name in [`docker-compose.yml`](docker-compose.yml:1)).
    *   `SECRET_KEY`: A strong, unique secret key used for JWT generation and other security purposes. Generate a secure random string for this.
    *   `ALGORITHM`: The algorithm used for JWTs (default is `HS256`).
    *   `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for JWT access tokens (e.g., `30`).
    *   `NEXT_PUBLIC_API_URL`: The base URL for the frontend to make API calls to the backend.
        *   For local development with Nginx proxying on port 80: `NEXT_PUBLIC_API_URL=http://localhost/api/`
        *   Alternatively, if your frontend makes relative calls: `NEXT_PUBLIC_API_URL=/api/`
        *   This value is passed as a build argument to the frontend Docker image.
    *   `BACKEND_CORS_ORIGINS`: A comma-separated list of allowed origins for Cross-Origin Resource Sharing (CORS) requests to the backend. For local development, this typically includes the frontend's address:
        `BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost` (if accessing via Nginx on port 80).

### D. Running the Full Application with Docker Compose

1.  Ensure Docker Desktop (or Docker Engine) is running.
2.  From the project root directory (where [`docker-compose.yml`](docker-compose.yml:1) is located), run the following command:
    ```bash
    docker-compose up -d
    ```
    Or, if you are using Docker Compose V2:
    ```bash
    docker compose up -d
    ```
    This command will:
    *   Build the Docker images for the `backend` and `frontend` services if they haven't been built yet (as defined in their respective `Dockerfile`s).
    *   Pull the official images for `postgres:15-alpine` (database) and `nginx:latest` (proxy).
    *   Start all services in detached mode (`-d`).

3.  **Backend Initialization**: When the `backend` service starts, the [`backend/entrypoint.sh`](backend/entrypoint.sh:1) script automatically performs the following:
    *   **Database Migrations**: Runs Alembic migrations to set up or update the database schema:
        `alembic -c alembic.ini upgrade head`
    *   **Data Seeding**: Executes the [`backend/seed_data.py`](backend/seed_data.py:1) script to populate the database with initial data, including:
        *   Default admin user.
        *   Sample properties, users, contacts, and team members.
        *   Default site settings.

### E. Accessing the Application

Once all services are up and running:

*   **Main Application (Frontend)**: Open your web browser and go to `http://localhost` (This is served by the Nginx proxy, which routes to the frontend service).
*   **Admin Panel**: Access the admin login page at `http://localhost/admin/login`.
    *   Default admin credentials (from [`backend/seed_data.py`](backend/seed_data.py:1)):
        *   Username: `admin`
        *   Password: `Admin123!`
        *   **Important**: Change the default admin password after your first login.
*   **Backend API (via Nginx proxy)**: The API is accessible under `http://localhost/api/`. For example, `http://localhost/api/properties/`.
*   **Direct Service Access (for development/debugging if needed)**:
    *   Frontend development server: `http://localhost:3000`
    *   Backend API server: `http://localhost:8000`

### F. Backend Service Details (Docker Context)

*   **Build Image**: `docker-compose build backend` (or `docker compose build backend`)
*   **Run Service**: Included in `docker-compose up`.
*   **Database Migrations**:
    *   Automatic: Handled by [`backend/entrypoint.sh`](backend/entrypoint.sh:1) on container start.
    *   Manual Execution (if needed):
        ```bash
        docker-compose exec backend alembic -c /app/backend/alembic.ini upgrade head
        ```
        (Adjust path to `alembic.ini` if necessary, `/app/backend/` is the WORKDIR in the container).
*   **Viewing Logs**: `docker-compose logs backend` (add `-f` to follow logs).

### G. Frontend Service Details (Docker Context)

*   **Build Image**: `docker-compose build frontend` (or `docker compose build frontend`)
*   **Run Service**: Included in `docker-compose up`.
*   **Dependency Installation**: Handled by `npm ci` within the `frontend/Dockerfile` during the image build process.
*   **Viewing Logs**: `docker-compose logs frontend` (add `-f` to follow logs).

### H. Stopping the Application

1.  To stop all running services defined in [`docker-compose.yml`](docker-compose.yml:1):
    ```bash
    docker-compose down
    ```
    Or, for Docker Compose V2:
    ```bash
    docker compose down
    ```
2.  To stop services AND remove associated volumes (including database data, use with caution):
    ```bash
    docker-compose down -v
    ```
    Or, for Docker Compose V2:
    ```bash
    docker compose down -v
    ```

## III. Application Configuration

### A. Core Configuration via `.env` file

As detailed in the setup section, the root `.env` file is the primary source for configuring services. Beyond the essential variables, you can also configure other aspects of the backend by setting the corresponding environment variables, which are then read by [`backend/core/config.py`](backend/core/config.py:1). These include:

*   `DEBUG`: Set to `True` or `False` for the backend FastAPI application's debug mode.
*   `API_BASE_URL`: The base URL the backend considers itself to be running at (e.g., `http://localhost:8000` or your production domain).
*   **SMTP Settings** (for email functionality, if used):
    *   `SMTP_HOST`
    *   `SMTP_PORT`
    *   `SMTP_USER`
    *   `SMTP_PASS`
    *   `SMTP_FROM_EMAIL`
*   `UPLOAD_DIR`: The directory where file uploads are stored (default: `backend/static/uploads`).
*   `NON_ADMIN_CAN_VIEW_ALL_CONTACTS`: Boolean (`true`/`false`) to control contact visibility for non-admin users. This is also seeded via [`backend/seed_data.py`](backend/seed_data.py:1).

### B. Dynamic Configuration via Admin Panel

Many aspects of the application's appearance, content, and behavior can be configured dynamically through the Admin Panel after logging in. These settings are stored in the database and managed via API endpoints defined in [`backend/routers/settings.py`](backend/routers/settings.py:1), with the CRUD (Create, Read, Update, Delete) logic handled by [`backend/crud/site_settings.py`](backend/crud/site_settings.py:1).

Initial values for these settings are populated by the [`backend/seed_data.py`](backend/seed_data.py:1) script. Examples of configurable settings include:

*   Site Name
*   Contact Information (email, phone, address, map coordinates)
*   Social Media Profile URLs
*   'About Us' Page Content (titles, paragraphs for mission, vision, history)
*   Footer Tagline
*   Theme Colors (primary, secondary, accent, text, background colors)
*   Home Page Background Image URL
*   Permissions like `non_admin_can_view_all_contacts`

## IV. Deployment Procedures

This section outlines general steps for deploying the application using Docker Compose.

### A. General Docker Compose Deployment

1.  **Server Prerequisites**:
    *   A server (e.g., a Linux VPS or cloud instance).
    *   Docker Engine installed.
    *   Docker Compose installed.
2.  **Deployment Steps**:
    *   Clone your project repository to the server or pull the latest changes if already cloned.
    *   Navigate to the project root directory.
    *   **Create Production `.env` File**: Create a `.env` file on the server. **Do not commit your production `.env` file to version control.** This file should contain production-specific values:
        *   A strong, unique `SECRET_KEY`.
        *   Production `DATABASE_URL` (pointing to your production PostgreSQL instance, which could be a managed service or another Docker container).
        *   The public domain for `NEXT_PUBLIC_API_URL` (e.g., `https://yourdomain.com/api/`).
        *   Appropriate `BACKEND_CORS_ORIGINS` for your production frontend domain (e.g., `https://yourdomain.com`).
        *   Set `DEBUG=False` for the backend.
        *   Configure any other necessary production settings (e.g., SMTP for emails).
    *   **Build Images (Optional)**: If you are not using pre-built images from a Docker registry:
        ```bash
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
        ```
        (Assuming you might have a `docker-compose.prod.yml` to override or extend the base configuration for production. If not, just `docker-compose build`).
    *   **Start Services**:
        ```bash
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        ```
        (Or `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`).

### B. Role of Nginx ([`nginx.conf`](nginx.conf:1))

In the provided setup, Nginx ([`nginx.conf`](nginx.conf:1)) acts as the reverse proxy:

*   It listens for incoming HTTP traffic (default on port 80).
*   Routes requests to the `frontend` service (for `/`).
*   Routes requests to the `backend` service (for `/api/`, `/static/`, `/health`).
*   Handles client body size limits.

**SSL Termination for Production (HTTPS)**:
The current [`nginx.conf`](nginx.conf:1) is configured for HTTP on port 80. For production, you **must** configure SSL/TLS (HTTPS on port 443).
*   The [`docker-compose.yml`](docker-compose.yml:1) includes a volume mount: `./certs:/etc/nginx/certs:ro`. Place your SSL certificate and private key files in a `certs` directory in your project root on the server.
*   Modify your `nginx.conf` (or a production-specific version) to:
    *   Listen on port 443 SSL.
    *   Specify `ssl_certificate` and `ssl_certificate_key` paths (e.g., `/etc/nginx/certs/fullchain.pem` and `/etc/nginx/certs/privkey.pem`).
    *   Implement a redirect from HTTP (port 80) to HTTPS (port 443).
    *   Consider using Certbot with Nginx for free SSL certificates from Let's Encrypt.

### C. Production Environment Variables

Re-emphasize: **Never commit production secrets or `.env` files to your Git repository.** Manage them securely on the server. Ensure all environment variables in the production `.env` file are set correctly for the production environment (database credentials, API keys, domain names, `DEBUG=False`, etc.).

### D. Database Management in Production

*   **Migrations**: The [`backend/entrypoint.sh`](backend/entrypoint.sh:1) script, as configured, will attempt to run `alembic upgrade head` on container startup. Review this behavior for production deployments. For critical production environments, you might prefer to run migrations manually or as a separate step in your deployment pipeline before restarting application containers.
*   **Backups**: **Crucially important.** Implement a robust and regular backup strategy for your production PostgreSQL database. This is typically handled outside the application's direct functions (e.g., using `pg_dump`, cloud provider backup services, or other database management tools).
*   **Seed Data**: The [`backend/entrypoint.sh`](backend/entrypoint.sh:1) also runs [`backend/seed_data.py`](backend/seed_data.py:1).
    *   The script is designed to be idempotent (safe to run multiple times).
    *   The admin user creation part is likely necessary for initial setup.
    *   Evaluate if running the full seed (which includes sample properties, contacts, etc.) is desirable in a fresh production environment. You might want to modify the seed script or the entrypoint logic for production to only seed essential data (like the admin user and core site settings).

### E. Static Files

Currently, Nginx proxies `/static/` requests to the backend service, which then serves them. For improved performance in a high-traffic production environment, consider:
*   Collecting static files to a volume shared directly with Nginx.
*   Configuring Nginx to serve these static files directly.
*   Using a Content Delivery Network (CDN) for static assets.

## V. Seed Data Script ([`backend/seed_data.py`](backend/seed_data.py:1))

*   **Purpose**: Populates the database with initial data to make the application usable immediately after setup. This includes:
    *   An administrator user (`admin` / `Admin123!`).
    *   Sample users with different roles (manager, staff).
    *   A collection of sample properties with details and images.
    *   Sample contact inquiries.
    *   Sample team members.
    *   Default site settings (site name, contact info, theme colors, etc.).
*   **Execution**:
    *   Automatically run by [`backend/entrypoint.sh`](backend/entrypoint.sh:1) when the `backend` container starts.
    *   Manual execution (if needed, e.g., for testing or after a database reset):
        ```bash
        docker-compose exec backend python backend/seed_data.py
        ```
*   **Idempotency**: The script is designed to be safe to run multiple times. It checks for existing data (e.g., admin user, properties by title) before attempting to insert new records, and may update existing ones.

## VI. Troubleshooting

*   **Port Conflicts**: If `docker-compose up` fails due to port conflicts, ensure that ports 80, 443, 3000, 8000, and 5432 (if running Postgres locally outside Docker and not using the `db` service) are not already in use by other applications on your host machine. You can change the host-side port mappings in [`docker-compose.yml`](docker-compose.yml:1) if necessary (e.g., ` "8080:80"`).
*   **Incorrect `.env` Values**: Double-check all values in your `.env` file, especially `DATABASE_URL`, `SECRET_KEY`, and `NEXT_PUBLIC_API_URL`.
*   **Docker Networking**: Ensure Docker's networking is functioning correctly. Sometimes a `docker-compose down` followed by `docker-compose up` can resolve transient networking issues between containers.
*   **File Permissions for Volumes**: If you encounter permission errors related to Docker volumes (e.g., for the database or uploaded files), ensure the user running Docker has appropriate permissions, or adjust volume ownership/permissions as needed (this is less common with named volumes like `db_data`).
*   **Checking Logs**: The first step in troubleshooting is always to check the logs for the relevant service(s):
    ```bash
    docker-compose logs <service_name>
    ```
    For example, `docker-compose logs backend` or `docker-compose logs frontend`. Add the `-f` flag to follow the logs in real-time (`docker-compose logs -f backend`).
*   **Alembic Migrations**: If the backend fails to start due to migration issues, check the backend logs. You might need to resolve migration conflicts or manually inspect the database state.
*   **Frontend Build Issues**: If the frontend fails to build, check the output of `docker-compose build frontend`. Common issues include missing dependencies (though `npm ci` should handle this) or errors in the Next.js build process.

## VII. System Flow Diagram

This diagram visualizes the general setup and deployment flow:

```mermaid
graph TD
    subgraph "Development Setup"
        DevMachine[Developer Machine] -->|1. Git Clone| ProjectCode(Project Code)
        ProjectCode -->|2. Create & Configure| DotEnvDev(.env file)
        DotEnvDev -->|3. docker-compose up -d| DevDockerEnv{Docker Environment (Dev)}
            DevDockerEnv --> DevDB[(PostgreSQL DB)]
            DevDockerEnv --> DevBackend[Backend Service]
            DevDockerEnv --> DevFrontend[Frontend Service]
            DevDockerEnv --> DevNginx[Nginx Proxy]

        DevBackend -->|Alembic Migrations via entrypoint.sh| DevDB
        DevBackend -->|Seed Data via entrypoint.sh| DevDB
        DevNginx -->|Proxies to| DevFrontend
        DevNginx -->|Proxies to| DevBackend
        UserBrowserDev[User Browser] -->|http://localhost| DevNginx
        AdminPanelDev[Admin Panel] -->|Configure Site Settings| DevBackend
        DevBackend -->|Updates DB| DevDB
    end

    subgraph "Deployment Process"
        ProdServer[Production Server] -->|1. Git Pull / Deploy Code| ProdProjectCode(Project Code)
        ProdProjectCode -->|2. Create & Configure| DotEnvProd(Production .env file)
        DotEnvProd -->|3. docker-compose up -d| ProdDockerEnv{Docker Environment (Prod)}
            ProdDockerEnv --> ProdDB[(Production PostgreSQL DB)]
            ProdDockerEnv --> ProdBackend[Backend Service (Prod)]
            ProdDockerEnv --> ProdFrontend[Frontend Service (Prod)]
            ProdDockerEnv --> ProdNginx[Nginx Proxy (Prod with SSL)]

        ProdBackend -->|Alembic Migrations via entrypoint.sh| ProdDB
        ProdBackend -->|Seed Admin/Initial Settings via entrypoint.sh (Review sample data)| ProdDB
        ProdNginx -->|Proxies to| ProdFrontend
        ProdNginx -->|Proxies to| ProdBackend
        UserBrowserProd[User Browser] -->|https://yourdomain.com| ProdNginx
    end

    style DevMachine fill:#f9f,stroke:#333,stroke-width:2px
    style ProdServer fill:#f9f,stroke:#333,stroke-width:2px
    style DotEnvDev fill:#lightgrey,stroke:#333,stroke-width:2px
    style DotEnvProd fill:#lightgrey,stroke:#333,stroke-width:2px
    style DevDockerEnv fill:#lightblue,stroke:#333,stroke-width:2px
    style ProdDockerEnv fill:#lightgreen,stroke:#333,stroke-width:2px