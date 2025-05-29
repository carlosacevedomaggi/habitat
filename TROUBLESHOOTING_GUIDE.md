# Troubleshooting Guide

## 1. Introduction
    - Purpose of the guide: To help diagnose and resolve common issues with the Habitat application.
    - Emphasis on understanding application mechanics for effective troubleshooting. This guide leverages information from documents such as [`SYSTEM_ARCHITECTURAL_MAP.md`](SYSTEM_ARCHITECTURAL_MAP.md:1), [`APPLICATION_ARCHITECTURE.md`](APPLICATION_ARCHITECTURE.md:1), [`DATA_FLOW_DIAGRAMS.md`](DATA_FLOW_DIAGRAMS.md:1), `DATA_LIFECYCLE_ANALYSIS.MD`, [`MODULE_FUNCTIONALITIES_AND_INTERDEPENDENCIES.md`](MODULE_FUNCTIONALITIES_AND_INTERDEPENDENCIES.md:1), [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1), [`DATABASE_SCHEMA_DETAILS.md`](DATABASE_SCHEMA_DETAILS.md:1), and [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:1).

## 2. General Troubleshooting Tips
    - **Check Docker Container Logs:** This is often the first place to look.
        - Use the command: `docker-compose logs -f <service_name>` (e.g., `docker-compose logs -f backend`, `docker-compose logs -f frontend`).
    - **Use Browser Developer Tools:** Essential for frontend issues.
        - **Console Tab:** Look for JavaScript errors.
        - **Network Tab:** Inspect API requests (URLs, headers, payloads, responses, status codes).
        - **Application Tab:** Check local storage, session storage, cookies (e.g., for JWT tokens).
    - **Verify Environment Variables:** Ensure the `.env` file at the project root is correctly configured as per [`.env.example`](.env.example:1) and [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:35). Changes might require rebuilding or restarting containers.
    - **Ensure Services Are Running:** Check the status of all Docker containers: `docker-compose ps`.
    - **Test API Endpoints Directly:** Use tools like `curl`, Postman, or your browser to interact with API endpoints directly (e.g., `http://localhost/api/properties/`). This helps isolate backend vs. frontend issues. Refer to [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1).
    - **Isolate the Problem:** Try to determine if the issue lies with the frontend, backend, database, Nginx proxy, network configuration, or local environment setup.
    - **Check for Recent Changes:** If the application was working and suddenly stopped, consider recent code changes, configuration updates, or deployments.

## 3. Common Issues and Solutions

### 3.1. Data Visibility Problems

#### 3.1.1. Listings/Properties Not Appearing on Public Site (But Visible in Admin)
    *   **Symptom(s):**
        *   Properties created or edited in the admin panel do not show up on the public `/properties` page or individual property detail pages.
        *   The count of properties differs significantly between what's shown in the admin panel and what's visible on the public site.
    *   **Explanation of Relevant Application Mechanics:**
        *   **Data Flow:** Property data originates from admin input or seeding ([`backend/seed_data.py`](backend/seed_data.py:1)), is stored in the `properties` table in the database ([`DATABASE_SCHEMA_DETAILS.md`](DATABASE_SCHEMA_DETAILS.md:156)), and accessed via API endpoints defined in [`backend/routers/properties.py`](backend/routers/properties.py:1). The frontend ([`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1)) fetches this data using services like [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1). Refer to [`DATA_FLOW_DIAGRAMS.md`](DATA_FLOW_DIAGRAMS.md:9) and `DATA_LIFECYCLE_ANALYSIS.MD` for detailed flows.
        *   **Role of `status` field:** The `Property` model ([`backend/models.py`](backend/models.py:43)) has a `status` field (e.g., 'available', 'sold', 'pending'), which defaults to `"available"`.
        *   **Backend API Behavior:** The `GET /api/properties/` endpoint, handled by [`crud_property.get_properties()`](backend/crud/properties.py:11), does *not* filter by `status` by default for public (unauthenticated) requests. It returns all properties matching other filters, including their `status` attribute.
        *   **Frontend Fetching & Rendering:** The public listings page ([`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1)) currently fetches properties without explicitly requesting a `status` filter and its client-side filtering logic also does not account for the `property.status` field.
    *   **Possible Causes:**
        *   The property's `status` in the database is not 'available' (e.g., it was changed to 'pending', 'sold', or 'draft' in the admin panel).
        *   The public frontend page ([`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1)) is expected to show only 'available' properties but lacks the logic to filter by `status='available'`. This is the primary cause identified in `DATA_LIFECYCLE_ANALYSIS.MD`.
        *   Caching issues (browser, Next.js data cache, or CDN if one is implemented externally).
    *   **Diagnostic Steps:**
        1.  **Inspect Property Status in DB:** Directly query the `properties` table for the specific listing(s). Check the value of the `status` column.
            ```sql
            SELECT id, title, status FROM properties WHERE id = YOUR_PROPERTY_ID;
            ```
        2.  **Test API Endpoint:** Call `GET /api/properties/` and `GET /api/properties/{id}/` directly (e.g., via browser or `curl`). Examine the JSON response. Does it include the property in question? What is its `status` value in the response?
        3.  **Test API with Status Filter:** Call `GET /api/properties/?status=available`. Does this filtered list match what you expect on the public site?
        4.  **Check Frontend Code:**
            *   Review [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1), specifically the `getServerSideProps` function (around line 74 in `DATA_LIFECYCLE_ANALYSIS.MD`) and any client-side filtering logic (around line 20 in `DATA_LIFECYCLE_ANALYSIS.MD`).
            *   Review [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1) to see if [`fetchProperties()`](frontend/services/propertyService.js:16) passes or can accept a status filter.
        5.  **Browser Developer Tools:** On the public `/properties` page, check the Network tab for the API call to `/api/properties/`. Inspect its response. Check the Console tab for any JavaScript errors.
    *   **Common Solutions/Fixes:**
        *   **If the public page should *only* display 'available' properties:**
            *   Modify the call to [`fetchProperties()`](frontend/services/propertyService.js:16) in [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:74) (within `getServerSideProps`) to include a status filter:
                ```javascript
                // Example:
                // const propertiesData = await fetchProperties("status=available");
                ```
            *   Alternatively, implement client-side filtering in [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1) based on the `property.status` field if fetching all and then filtering is preferred.
        *   Ensure the property's `status` in the database is correctly set to 'available' via the admin panel if it's intended to be publicly visible.

#### 3.1.2. Team Members Not Appearing on Public "About Us" Page (But Visible in Admin)
    *   **Symptom(s):**
        *   Team members added or edited in the admin panel do not appear on the public `/about` page.
    *   **Explanation of Relevant Application Mechanics:**
        *   **Data Flow:** Team member data is managed in the `team_members` table ([`DATABASE_SCHEMA_DETAILS.md`](DATABASE_SCHEMA_DETAILS.md:240)) and accessed via `GET /api/team/` ([`backend/routers/team.py`](backend/routers/team.py:1)). The public "About Us" page ([`frontend/pages/about.js`](frontend/pages/about.js:1)) fetches and renders this data. See [`DATA_FLOW_DIAGRAMS.md`](DATA_FLOW_DIAGRAMS.md:122) and `DATA_LIFECYCLE_ANALYSIS.MD`.
        *   **Model Structure:** The `TeamMember` model ([`backend/models.py`](backend/models.py:87)) does **not** have a `status` or `is_public` field.
        *   **API Behavior:** The `GET /api/team/` endpoint and its CRUD function [`get_team_members()`](backend/crud/team.py:10) are designed to return all team members.
    *   **Possible Causes:** (Primarily frontend issues as per `DATA_LIFECYCLE_ANALYSIS.MD`)
        *   JavaScript error in [`frontend/pages/about.js`](frontend/pages/about.js:1) during or after the data fetch, preventing data from being set to state or rendered.
        *   The API call from [`frontend/pages/about.js`](frontend/pages/about.js:19) to `/api/team/` is failing (e.g., network error, incorrect API URL) or returning an empty list unexpectedly.
        *   Incorrect environment variable `NEXT_PUBLIC_API_URL` being used by [`frontend/pages/about.js`](frontend/pages/about.js:1).
        *   React state update issue (e.g., `teamMembers` state not being set correctly after fetch).
        *   Conditional rendering logic (e.g., `teamMembers.length > 0` at [`frontend/pages/about.js:143`](frontend/pages/about.js:143)) correctly hiding the section if the `teamMembers` array is empty or not populated.
    *   **Diagnostic Steps:**
        1.  **Browser Developer Tools (on `/about` page):**
            *   **Console Tab:** Check for any JavaScript errors. This is the most critical first step.
            *   **Network Tab:** Inspect the `fetch` request to `/api/team/`. Verify the URL, status code (should be 200 OK), and response payload (should be a JSON array of team members).
        2.  **Verify API Directly:** Call `GET /api/team/` using `curl` or Postman. Ensure it returns the expected team member data.
        3.  **Add Logging in [`frontend/pages/about.js`](frontend/pages/about.js:1):**
            *   Log the resolved API URL (e.g., `console.log(\`Fetching team from: \${process.env.NEXT_PUBLIC_API_URL}/team/\`);`).
            *   Log the raw response from the `fetch`.
            *   Log the parsed data before calling `setTeamMembers`.
            *   Log the `teamMembers` state variable and any `teamError` state after the fetch attempt. (See `DATA_LIFECYCLE_ANALYSIS.MD` lines 295-303 for examples).
        4.  **Check Database:** Ensure team members actually exist in the `team_members` table.
    *   **Common Solutions/Fixes:**
        *   Fix any JavaScript errors identified in the browser console on [`frontend/pages/about.js`](frontend/pages/about.js:1).
        *   Ensure the API call is successful and data is being correctly passed to the `setTeamMembers` state setter.
        *   Verify `NEXT_PUBLIC_API_URL` (in your `.env` file) is correctly configured and accessible from the frontend environment.

#### 3.1.3. Data Not Updating Correctly After Admin Changes
    *   **Symptom(s):**
        *   Changes made in the admin panel (e.g., editing a property title, changing a team member's position) are saved successfully in admin but are not reflected on the public site, or old data is still shown.
    *   **Explanation of Relevant Application Mechanics:**
        *   Admin UI makes `PUT` requests to relevant API endpoints (e.g., `/api/properties/{id}/`, `/api/team/{member_id}/`).
        *   Backend CRUD operations ([`update_property()`](backend/crud/properties.py:163), [`update_team_member()`](backend/crud/team.py:177)) modify data in the database.
        *   The public site fetches data via `GET` requests. Next.js data fetching strategies (SSR in [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1), client-side fetch in [`frontend/pages/about.js`](frontend/pages/about.js:1) and [`frontend/pages/properties/[id].js`](frontend/pages/properties/[id].js:1)) can lead to stale data if not revalidated.
    *   **Possible Causes:**
        *   **Caching:**
            *   Browser cache holding old versions of API responses or pages.
            *   Next.js data caching (if using `getStaticProps` with revalidation, or server-side caching layers not explicitly detailed but possible).
            *   CDN caching (if a CDN is used in front of the application).
        *   Backend `PUT` request appearing successful to admin UI but failing silently or not committing changes to the database correctly.
        *   Frontend not re-fetching data or not having a mechanism to invalidate its cache after admin changes.
    *   **Diagnostic Steps:**
        1.  **Verify DB Update:** After making a change in the admin panel, query the database directly to confirm if the record was actually updated.
        2.  **Check Admin API Call:** Use browser developer tools (Network tab) in the admin panel when saving changes. Inspect the `PUT` request. Is it successful (200 OK)? Is the request payload correct? Does the API response show the updated data?
        3.  **Check Backend Logs:** Look for any errors during the processing of the `PUT` request or during the database update operation.
        4.  **Force Refresh Public Page:** On the public site, perform a hard refresh (e.g., Ctrl+Shift+R or Cmd+Shift+R) to bypass browser cache.
        5.  **Test Public API Directly:** After an admin change and database verification, call the relevant public `GET` API endpoint for the specific item. Does it return the updated data?
    *   **Common Solutions/Fixes:**
        *   **Clear Caches:** Instruct users to clear browser cache or test in an incognito window.
        *   **Revalidation Strategy (Next.js):**
            *   For pages using `getServerSideProps` (like [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1)), data is fetched on each request, so server-side caching is less of an issue unless explicitly implemented.
            *   For client-side fetched data (like [`frontend/pages/about.js`](frontend/pages/about.js:1) or [`frontend/pages/properties/[id].js`](frontend/pages/properties/[id].js:1)), ensure data is re-fetched when appropriate (e.g., on page navigation, or implement a pull-to-refresh or periodic refresh if needed).
            *   If using Incremental Static Regeneration (ISR) with `getStaticProps` (not currently indicated for these pages but a general Next.js pattern), ensure the `revalidate` prop is set appropriately.
        *   Ensure backend `PUT` operations correctly save data to the database and handle any errors gracefully.
        *   Ensure the admin panel correctly sends the data in `PUT` requests and properly handles API responses (e.g., updating its own state to reflect success).

### 3.2. Setup/Deployment Issues

#### 3.2.1. Docker Containers Not Starting
    *   **Symptom(s):**
        *   `docker-compose up` command fails with error messages.
        *   Specific services (e.g., `backend`, `frontend`, `db`, `proxy`) are not listed as "running" or "up" in `docker-compose ps`, or they exit immediately after starting.
    *   **Explanation of Relevant Application Mechanics:**
        *   The [`docker-compose.yml`](docker-compose.yml:1) file defines all services, their builds (from `Dockerfile`s), ports, volumes, environment variables, and dependencies.
        *   Individual `Dockerfile`s (e.g., [`backend/Dockerfile`](backend/Dockerfile:1), [`frontend/Dockerfile`](frontend/Dockerfile:1)) contain instructions to build the service images.
        *   The [`backend/entrypoint.sh`](backend/entrypoint.sh:1) script handles initialization tasks for the backend service (like database migrations).
    *   **Possible Causes:**
        *   **Port Conflicts:** Another application on your host machine is already using a port that a Docker container is trying to map (e.g., 80, 3000, 8000, 5432).
        *   **Errors in `Dockerfile`:** Syntax errors, missing dependencies, incorrect commands during the image build process.
        *   **Errors in [`docker-compose.yml`](docker-compose.yml:1):** Syntax errors, incorrect paths for volumes or build contexts, service misconfiguration, invalid environment variable references.
        *   **Missing or Incorrect `.env` File:** The root `.env` file is missing, or essential variables (especially those used as build arguments in `docker-compose.yml`) are not defined or are incorrect.
        *   **Volume Mount Issues:** Incorrect host paths for volume mounts, or permission problems with mounted directories.
        *   **Resource Limitations:** Insufficient disk space, memory (RAM), or CPU resources on the host machine.
        *   **Network Configuration Issues:** Problems with Docker's internal networking or conflicts with host network settings.
        *   **Errors in [`backend/entrypoint.sh`](backend/entrypoint.sh:1):** The script might be failing due to command errors or logic issues.
    *   **Diagnostic Steps:**
        1.  **Examine `docker-compose up` Output:** Carefully read all error messages. They often point directly to the problematic service or configuration.
        2.  **Check Individual Service Logs:** If a service starts and then exits, its logs are crucial: `docker-compose logs <service_name>`.
        3.  **Attempt to Build Images Manually:** If a build fails: `docker-compose build <service_name>`. This will show detailed build output.
        4.  **Validate `.env` file:** Ensure it exists in the project root and all required variables (see [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:35)) are present and correctly formatted.
        5.  **Check Port Availability on Host:** Use tools like `netstat -tulnp` (Linux/macOS) or `Get-NetTCPConnection` (Windows PowerShell) to see if ports are already in use.
        6.  **Inspect [`backend/entrypoint.sh`](backend/entrypoint.sh:1):** If the `backend` service fails, add `set -x` at the beginning of the script to print every command being executed.
    *   **Common Solutions/Fixes:**
        *   Resolve port conflicts by stopping the other service or changing the host-side port mapping in [`docker-compose.yml`](docker-compose.yml:1) (e.g., `"8080:80"`).
        *   Correct errors in `Dockerfile`s or [`docker-compose.yml`](docker-compose.yml:1) based on error messages.
        *   Ensure the `.env` file is correctly populated.
        *   Fix issues in [`backend/entrypoint.sh`](backend/entrypoint.sh:1) if identified.
        *   Adjust volume paths or permissions if necessary.
        *   Free up host resources or allocate more resources to Docker.

#### 3.2.2. Database Connection Problems
    *   **Symptom(s):**
        *   The `backend` container fails to start or its logs show errors like "cannot connect to database," "connection refused," or timeout errors when trying to reach PostgreSQL.
        *   Alembic migrations ([`backend/alembic/`](backend/alembic/)) fail with connection errors.
    *   **Explanation of Relevant Application Mechanics:**
        *   The `backend` service uses the `DATABASE_URL` environment variable (defined in `.env`) to connect to the PostgreSQL database service, which is named `db` in [`docker-compose.yml`](docker-compose.yml:1).
        *   The PostgreSQL service (`db`) must be running and fully initialized before the `backend` service can successfully connect.
        *   Database connection logic is typically handled in [`backend/core/database.py`](backend/core/database.py:1).
    *   **Possible Causes:**
        *   Incorrect `DATABASE_URL` in the `.env` file (e.g., wrong hostname, port, credentials, or database name).
        *   The `db` (PostgreSQL) service is not running, not healthy, or still initializing.
        *   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` variables in `.env` do not match what the PostgreSQL container expects or is initialized with.
        *   Docker networking issues preventing the `backend` container from resolving or reaching the `db` container on port 5432.
        *   The database within the PostgreSQL container has not been created, or the user does not have permissions.
    *   **Diagnostic Steps:**
        1.  **Check Backend Logs:** `docker-compose logs backend`. Look for specific database connection error messages (e.g., `psycopg2.OperationalError`).
        2.  **Check `db` Service Logs:** `docker-compose logs db`. Ensure PostgreSQL started without errors and is ready to accept connections.
        3.  **Verify `.env` Variables:** Double-check `DATABASE_URL`. It should be like: `postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`. Also verify `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
        4.  **Check Service Dependencies:** Ensure the `backend` service in [`docker-compose.yml`](docker-compose.yml:1) has `depends_on: - db` (or a more robust healthcheck dependency).
        5.  **Connect to DB Manually from Host (if port mapped) or Another Container:**
            *   From host (if 5432 is mapped, e.g. `"5433:5432"` in `docker-compose.yml`): `psql -h localhost -p 5433 -U your_user -d your_db`
            *   From within a running container (e.g., `backend` if it starts enough to exec into, or a temporary container on the same network):
                `docker-compose exec backend psql -h db -U $POSTGRES_USER -d $POSTGRES_DB`
                (You might need to install `postgresql-client` in the backend container if not present: `docker-compose exec backend apt-get update && apt-get install -y postgresql-client`)
    *   **Common Solutions/Fixes:**
        *   Correct `DATABASE_URL` and other PostgreSQL related variables in the `.env` file.
        *   Ensure the `db` service is healthy. Restart services: `docker-compose down && docker-compose up -d`.
        *   Verify Docker networking allows the `backend` container to reach the `db` service on port 5432 using the hostname `db`.
        *   If the database or user was not created correctly within PostgreSQL, you might need to remove the `db_data` volume (`docker-compose down -v`) and restart to allow PostgreSQL to re-initialize. **Caution: This deletes all database data.**

#### 3.2.3. Migration Issues (Alembic)
    *   **Symptom(s):**
        *   The `backend` service fails to start, and logs show errors from Alembic (e.g., "Target database is not up to date," "Can't locate revision identified by...", "No such table: alembic_version").
        *   The [`backend/entrypoint.sh`](backend/entrypoint.sh:1) script fails during the `alembic upgrade head` command.
    *   **Explanation of Relevant Application Mechanics:**
        *   Alembic manages database schema migrations. Migration scripts are located in [`backend/alembic/versions/`](backend/alembic/versions/).
        *   Alembic uses a special table named `alembic_version` in the database to track the currently applied migration revision.
        *   Configuration is in [`backend/alembic.ini`](backend/alembic.ini:1).
    *   **Possible Causes:**
        *   Inconsistent migration history (e.g., manual changes made to the database schema outside of Alembic, or conflicting migration files from different branches).
        *   Database not accessible or not correctly initialized when migrations attempt to run.
        *   Errors within one or more migration scripts (e.g., SQL syntax errors, incorrect table/column names).
        *   Missing migration files or an incorrect revision chain (e.g., a 'down_revision' points to a non-existent file).
        *   The `alembic_version` table is missing or corrupted.
    *   **Diagnostic Steps:**
        1.  **Check Backend Logs:** `docker-compose logs backend`. Detailed Alembic error messages are usually printed here.
        2.  **Check `alembic_version` Table:** Connect to the database (see previous section) and run:
            `SELECT * FROM alembic_version;`
        3.  **Run Alembic Commands Manually (inside the `backend` container):**
            *   Get current revision: `docker-compose exec backend alembic -c /app/backend/alembic.ini current`
            *   View migration history: `docker-compose exec backend alembic -c /app/backend/alembic.ini history`
            *   Check for unapplied migrations: `docker-compose exec backend alembic -c /app/backend/alembic.ini check` (This command might not exist in all Alembic versions; `upgrade --sql head` can show pending SQL).
        4.  **Inspect Migration Files:** Review recent migration scripts in [`backend/alembic/versions/`](backend/alembic/versions/) for any obvious errors or inconsistencies.
    *   **Common Solutions/Fixes:**
        *   Correct errors in the problematic migration script(s).
        *   If the migration history has diverged or is inconsistent:
            *   You might need to manually adjust the `alembic_version` table (with extreme caution).
            *   Use Alembic commands like `stamp` to set the current revision to a specific point (again, with caution).
            *   For a fresh development setup where data loss is acceptable, deleting the database volume (`docker-compose down -v`) and restarting services will re-run all migrations from scratch.
        *   Ensure the database service is fully running and accessible before the `alembic upgrade head` command is executed in [`backend/entrypoint.sh`](backend/entrypoint.sh:1). Consider adding a wait-for-db script or using Docker Compose healthchecks.

#### 3.2.4. Frontend Not Connecting to Backend API
    *   **Symptom(s):**
        *   The frontend application loads in the browser, but data is missing (e.g., no properties listed, "About Us" page shows no team members).
        *   Browser console shows network errors (e.g., 404 Not Found, 502 Bad Gateway, CORS errors) for API calls to `/api/...` paths.
    *   **Explanation of Relevant Application Mechanics:**
        *   The frontend makes API calls to the URL specified by the `NEXT_PUBLIC_API_URL` environment variable (set in `.env` and passed as a build argument to the frontend Docker image).
        *   The Nginx service (`proxy` in [`docker-compose.yml`](docker-compose.yml:1)) is configured via [`nginx.conf`](nginx.conf:1) to route requests starting with `/api/` to the `backend` service.
        *   The `backend` service must be running and correctly configured for Cross-Origin Resource Sharing (CORS) via the `BACKEND_CORS_ORIGINS` environment variable.
    *   **Possible Causes:**
        *   Incorrect `NEXT_PUBLIC_API_URL` in the `.env` file, or it was not correctly passed/used during the frontend build process.
        *   The `backend` service is not running, is unhealthy, or is crashing.
        *   The Nginx `proxy` service is not running or is misconfigured (e.g., incorrect routing in [`nginx.conf`](nginx.conf:1)).
        *   **CORS Issues:** The `BACKEND_CORS_ORIGINS` variable in `.env` does not include the origin from which the frontend is being served (e.g., `http://localhost` or `http://localhost:3000`).
        *   Docker networking issues preventing communication between the browser -> Nginx -> backend.
    *   **Diagnostic Steps:**
        1.  **Browser Developer Tools (Network Tab):** Inspect the failed API calls. Check the request URL, HTTP method, status code, and response. Pay close attention to the exact URL being requested.
        2.  **Browser Developer Tools (Console Tab):** Look for CORS error messages (e.g., "Access to fetch at '...' from origin '...' has been blocked by CORS policy...").
        3.  **Verify `NEXT_PUBLIC_API_URL`:**
            *   Check its value in the `.env` file.
            *   Verify how it's used in frontend code, for example in API service files like [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1).
            *   If it's a build argument, ensure the frontend image was rebuilt after changes to `.env`.
        4.  **Check Backend Logs:** `docker-compose logs backend`. Is it receiving requests? Are there any errors?
        5.  **Check Nginx Logs:** `docker-compose logs proxy`. Are requests to `/api/` being received and routed correctly? Any errors here?
        6.  **Test Backend API Directly (Bypassing Frontend/Nginx if possible):**
            *   If backend port 8000 is exposed on host: `curl http://localhost:8000/api/health` (or any other simple endpoint).
            *   From within the Nginx container to test routing to backend: `docker-compose exec proxy curl backend:8000/api/health`
        7.  **Verify `BACKEND_CORS_ORIGINS`:** Ensure this variable in `.env` is correctly set (e.g., `BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000` for local development) and that the `backend` service was restarted after any changes.
    *   **Common Solutions/Fixes:**
        *   Correct the `NEXT_PUBLIC_API_URL` in `.env`. If it's a build argument, rebuild the frontend image: `docker-compose build frontend && docker-compose up -d --force-recreate frontend`.
        *   Ensure the `backend` and `proxy` (Nginx) services are running and healthy.
        *   Fix Nginx configuration in [`nginx.conf`](nginx.conf:1) if routing is incorrect.
        *   Correct the `BACKEND_CORS_ORIGINS` in `.env` and restart the `backend` service (`docker-compose restart backend`).

### 3.3. API Errors

#### 3.3.1. Understanding Common HTTP Error Codes
    *   **400 Bad Request:** The client sent an invalid request. This could be due to malformed JSON, missing required fields in the request body, or invalid query parameters.
        *   **Check:** The request payload against the API schema defined in [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1) and implemented in [`backend/schemas.py`](backend/schemas.py:1). Backend logs often provide specific validation error details from Pydantic.
    *   **401 Unauthorized:** The client attempted to access a protected resource without proper authentication, or authentication failed (e.g., missing, invalid, or expired JWT token).
        *   **Check:** Is the request supposed to be authenticated? Is a valid JWT token being sent in the `Authorization: Bearer <token>` header? Review the login process ([`POST /api/users/token/`](API_SPECIFICATIONS.md:509)) and token handling in the frontend.
    *   **403 Forbidden:** The client is authenticated, but does not have the necessary permissions (role) to access the requested resource or perform the action.
        *   **Check:** The authenticated user's role (stored in `users.role` in the database, see [`backend/models.py`](backend/models.py:22)). Compare this against the required role for the API endpoint (e.g., decorators like [`@auth_utils.require_admin`](backend/auth/utils.py:73) or [`@auth_utils.require_manager`](backend/auth/utils.py:79) in backend router files like [`backend/routers/properties.py`](backend/routers/properties.py:1)).
    *   **404 Not Found:** The requested resource (e.g., a specific property, user, or API path itself) does not exist on the server.
        *   **Check:** The URL path and any resource IDs in the path. Verify that the data actually exists in the database.
    *   **422 Unprocessable Entity:** The request was well-formed (syntactically correct) but contained semantic errors, meaning FastAPI (Pydantic) could not process the data according to the defined schemas.
        *   **Check:** Backend logs for detailed validation error messages from Pydantic. Compare the request payload carefully against the relevant Pydantic models in [`backend/schemas.py`](backend/schemas.py:1).
    *   **500 Internal Server Error:** A generic server-side error indicating that the backend encountered an unexpected condition and could not fulfill the request.
        *   **Check:** Backend logs (`docker-compose logs backend`) for a detailed traceback and error message. This could be due to unhandled exceptions in the Python code, database errors not caught, or other unexpected issues.
    *   **502 Bad Gateway / 503 Service Unavailable / 504 Gateway Timeout:** These errors usually indicate problems with the Nginx proxy or the upstream `backend` service.
        *   **Check:** Nginx logs (`docker-compose logs proxy`). Backend logs (`docker-compose logs backend`). Is the `backend` service running and responsive? Are there network issues between Nginx and the `backend` container? Is the backend taking too long to respond?

#### 3.3.2. Investigating API Errors
    *   **Symptom(s):** Frontend application shows error messages, data doesn't load as expected, or operations (like saving data) fail. The browser's Network tab shows API calls returning 4xx or 5xx status codes.
    *   **Explanation of Relevant Application Mechanics:**
        *   The frontend application interacts with backend API endpoints defined in the [`backend/routers/`](backend/routers/) directory.
        *   The backend processes these requests, often involving CRUD modules in [`backend/crud/`](backend/crud/) to interact with the database.
        *   Pydantic schemas ([`backend/schemas.py`](backend/schemas.py:1)) are used for request and response data validation and serialization.
        *   Authentication and authorization are handled by utilities in [`backend/auth/utils.py`](backend/auth/utils.py:1).
    *   **Diagnostic Steps:**
        1.  **Identify Failing Endpoint & Method:** Use the browser's Network tab to find the exact API endpoint (URL) and HTTP method (GET, POST, PUT, DELETE) that failed.
        2.  **Check Request Payload (for POST/PUT/PATCH):** Is the payload valid JSON? Does it conform to the structure and data types expected by the Pydantic schema for that endpoint (see [`backend/schemas.py`](backend/schemas.py:1) and [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1))?
        3.  **Check Request Headers:** Is an authentication token (JWT) present and correctly formatted (`Authorization: Bearer <token>`) if required? Is the `Content-Type` header (e.g., `application/json`) correct for the request body?
        4.  **Examine Backend Logs:** `docker-compose logs backend`. Look for errors, validation messages (especially from Pydantic), or full tracebacks that correspond to the time of the failed request.
        5.  **Examine Nginx Logs (if applicable, for 50x errors):** `docker-compose logs proxy`.
        6.  **Reproduce with `curl` or Postman:** Manually send the same request directly to the API. This helps isolate whether the issue is in the frontend's request formation or the backend's processing.
        7.  **Step Through Backend Code (if necessary):** If the error is not obvious from logs, use a Python debugger attached to the backend container, or add `print()` statements in the relevant router functions or CRUD operations to trace execution and inspect variable values.
    *   **Common Solutions/Fixes:**
        *   Correct the frontend request payload or headers to match API expectations.
        *   Fix backend logic errors identified from logs or debugging.
        *   Ensure correct authentication tokens are being sent and validated.
        *   Resolve database issues if backend errors point to database problems.
        *   Adjust Pydantic schemas in [`backend/schemas.py`](backend/schemas.py:1) if validation rules are unintentionally too strict or incorrect for the intended use case.

### 3.4. Frontend Rendering Issues

#### 3.4.1. Pages Not Loading / Blank Pages
    *   **Symptom(s):** The browser displays a blank white page, or a generic error message from Next.js (e.g., "Application error: a client-side exception has occurred") or the browser itself.
    *   **Explanation of Relevant Application Mechanics:**
        *   Next.js pages are defined in the [`frontend/pages/`](frontend/pages/) directory.
        *   Rendering can occur server-side (SSR via `getServerSideProps`), client-side (CSR, often involving `useEffect` for data fetching), or statically (SSG, less likely for dynamic parts of this app).
        *   JavaScript execution in the browser is critical for interactivity and client-side rendering.
    *   **Possible Causes:**
        *   **JavaScript Errors:** A critical JavaScript error occurring during page rendering (either on the server during SSR, or in the client's browser) can halt rendering.
        *   **Failed API Calls in `getServerSideProps`:** If a page uses `getServerSideProps` to fetch data and this fetch fails without graceful error handling, the page rendering might fail.
        *   **Errors in React Component Lifecycle:** Errors in methods like `render()`, `constructor()`, or `useEffect` hooks.
        *   **Incorrect Routing or Page Component Not Found:** Next.js cannot find the component associated with the URL.
        *   **CSS Issues:** Extreme CSS issues could make content invisible, though less likely to cause a completely blank page without JS errors.
        *   **Build Errors:** If the frontend Docker image failed to build correctly, essential JavaScript bundles might be missing or corrupted.
    *   **Diagnostic Steps:**
        1.  **Browser Developer Tools (Console Tab):** This is the **most important first step**. Check for any JavaScript errors. Error messages often point to the problematic file and line number.
        2.  **Browser Developer Tools (Network Tab):** Check if the main page HTML document loaded successfully (200 OK). Are there any failed requests for JavaScript bundles (e.g., `.js` files) or CSS files?
        3.  **View Page Source (Ctrl+U or Cmd+Option+U):** Is there any HTML content in the source, or is it truly empty? This can help differentiate server-side vs. client-side rendering failures.
        4.  **Check Frontend Service Logs:** `docker-compose logs frontend`. Look for errors during Server-Side Rendering (SSR) or any build-related errors if the container restarted.
        5.  **Simplify the Page:** If a specific page is failing, try commenting out components one by one within that page file to isolate the problematic one.
    *   **Common Solutions/Fixes:**
        *   Fix JavaScript errors identified in the browser console.
        *   Add robust error handling (e.g., `try...catch` blocks) for API calls made in `getServerSideProps` or `useEffect`.
        *   Correct logic within React components.
        *   Ensure the frontend Docker image builds successfully and all necessary assets are included.

#### 3.4.2. Component Errors (Check Browser Console)
    *   **Symptom(s):** Specific parts of a page are broken, missing, or display React error messages (e.g., "Cannot read property 'name' of undefined," "Error: Objects are not valid as a React child").
    *   **Explanation of Relevant Application Mechanics:**
        *   React components are defined in [`frontend/components/`](frontend/components/). They receive data via `props`, manage their own `state`, and render UI elements.
    *   **Possible Causes:**
        *   **Props Issues:** Props are not being passed correctly from parent to child component, or they have unexpected values (e.g., `undefined`, `null`) or incorrect data types.
        *   **Accessing Properties of Undefined/Null:** Attempting to access a property or call a method on an object that is `undefined` or `null`.
        *   **Incorrect State Management:** Logic errors in `useState` or `useReducer` hooks, or when updating state.
        *   **Errors in Conditional Rendering:** Flawed logic in `if` statements or ternary operators used to render different UI based on conditions.
        *   **Type Errors in JavaScript:** Mismatched data types leading to runtime errors.
    *   **Diagnostic Steps:**
        1.  **Browser Developer Tools (Console Tab):** Error messages usually provide a stack trace pointing to the component and line number where the error occurred.
        2.  **React Developer Tools (Browser Extension):** This powerful tool allows you to inspect the component tree, view the `props` and `state` of individual components, and trace component updates.
        3.  **Add Logging (`console.log`):** Insert `console.log()` statements within the problematic component to inspect the values of `props`, `state`, and other relevant variables at different points in its lifecycle.
        4.  **Check Data Source:** Verify that the data being fed into the component (from API calls, context, or parent components) is correct and in the expected format.
    *   **Common Solutions/Fixes:**
        *   **Defensive Coding:** Add checks to ensure objects and props exist and are of the expected type before accessing their properties (e.g., `if (data && data.name)` or `data?.name`).
        *   Correct the logic for passing props or managing state.
        *   Ensure data fetched from APIs or provided by context is correctly formatted and handled.
        *   Fix errors in conditional rendering logic.

#### 3.4.3. Map Functionality Issues (e.g., Pins Not Saving/Displaying)
    *   **Symptom(s):**
        *   The map on property pages ([`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1), [`frontend/pages/properties/[id].js`](frontend/pages/properties/[id].js:1)) doesn't load correctly or at all.
        *   Property pins are not displayed on the map, or they appear in the wrong locations.
        *   The original problem statement mentioned "pins not saving," which implies an issue with creating or updating property latitude/longitude values.
    *   **Explanation of Relevant Application Mechanics:**
        *   Properties have `latitude` and `longitude` fields in the `properties` database table ([`backend/models.py`](backend/models.py:43)).
        *   The admin UI for creating/editing properties should allow setting these geographic coordinates.
        *   The API for creating/updating properties ([`backend/routers/properties.py`](backend/routers/properties.py:1)) is responsible for handling and saving these coordinate fields.
        *   Frontend map components like [`MapWithPins.js`](frontend/components/MapWithPins.js:1) (potentially aliased as [`LeafletMap.js`](frontend/components/LeafletMap.js:1)) or [`Map.js`](frontend/components/Map.js:1) use these `latitude` and `longitude` values to display pins.
    *   **Possible Causes:**
        *   `latitude` and `longitude` data is missing, null, or incorrect in the database for the affected properties.
        *   The admin form for properties is not correctly capturing or sending latitude/longitude data to the backend API during create/update operations.
        *   The backend API is not correctly processing or saving the latitude/longitude data received from the admin form.
        *   The frontend map component is not receiving the latitude/longitude props correctly, or it's misinterpreting them.
        *   JavaScript errors within the map component itself or its dependencies (e.g., Leaflet).
        *   Issues with the Leaflet library integration, missing CSS, or conflicts with other styles.
    *   **Diagnostic Steps:**
        1.  **Check Database:** Directly query the `properties` table to verify the `latitude` and `longitude` values for the affected properties. Are they present and numerically valid?
        2.  **Admin Panel Test (Saving Pins):**
            *   Try creating a new property or updating an existing one with specific coordinates via the admin panel.
            *   Use browser developer tools (Network tab) to inspect the `POST` or `PUT` request to the properties API. Is the latitude/longitude data being sent in the request payload?
            *   Is the API response successful (200 OK or 201 Created)?
            *   After the API call, re-check the database to see if the coordinates were saved correctly.
        3.  **Frontend Map Component (Displaying Pins):**
            *   Add `console.log` statements in the relevant map component ([`MapWithPins.js`](frontend/components/MapWithPins.js:1), [`LeafletMap.js`](frontend/components/LeafletMap.js:1), or [`Map.js`](frontend/components/Map.js:1)) to inspect the `props` it receives, especially the array of properties and their coordinate data.
            *   Check the browser console for any JavaScript errors originating from the map component or Leaflet library when the map is supposed to render.
        4.  **Test API Directly (Fetching Data):** Fetch property data via the API (`GET /api/properties/` or `GET /api/properties/{id}/`). Does the JSON response include correct and valid `latitude` and `longitude` values?
    *   **Common Solutions/Fixes:**
        *   Ensure the admin property forms correctly capture and send valid latitude/longitude data. This might involve fixing form input handling or data validation on the frontend.
        *   Ensure the backend API endpoints for creating/updating properties correctly parse and save the `latitude` and `longitude` fields to the database. Check [`backend/crud/properties.py`](backend/crud/properties.py:1).
        *   Fix the frontend map component's logic if it's not correctly receiving, parsing, or using the coordinate props to render pins.
        *   Ensure the Leaflet library and its CSS are loaded correctly and that there are no conflicting styles hiding the map or its elements.

### 3.5. Authentication/Authorization Problems

#### 3.5.1. Login Failures
    *   **Symptom(s):** Users are unable to log in via the admin login page ([`frontend/pages/admin/login.js`](frontend/pages/admin/login.js:1)). Error messages like "Invalid credentials," "Unauthorized," or other generic errors might be displayed.
    *   **Explanation of Relevant Application Mechanics:**
        *   The login form submits credentials (username, password) to the `POST /api/users/token/` endpoint, handled by [`backend/routers/users.py`](backend/routers/users.py:1).
        *   The backend authenticates the user against the `users` table in the database (comparing the provided password against the stored `password_hash`) using [`auth_utils.authenticate_user()`](backend/auth/utils.py:39).
        *   If authentication is successful, a JWT (JSON Web Token) is generated by [`auth_utils.create_access_token()`](backend/auth/utils.py:56) and returned to the client.
    *   **Possible Causes:**
        *   Incorrect username or password being entered.
        *   The user account does not exist in the `users` table.
        *   The user account exists, but the password hash stored in the database does not match the provided password (e.g., password was changed, or an issue with hashing logic if custom).
        *   The backend API endpoint `/api/users/token/` is not reachable, is misconfigured, or is crashing.
        *   Password hashing during user creation and password verification during login are incompatible (unlikely if using standard library functions like `pwd_context.verify` and `pwd_context.hash` from [`backend/auth/utils.py`](backend/auth/utils.py:1)).
        *   CORS issues, if the frontend origin is not correctly configured in `BACKEND_CORS_ORIGINS` for this specific API path (though less common for login paths if they are simple POSTs).
    *   **Diagnostic Steps:**
        1.  **Verify Credentials:** Double-check that the username and password are being entered correctly. For a fresh setup, try the default admin credentials (`admin` / `Admin123!`) as specified in [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:91).
        2.  **Browser Developer Tools (Network Tab):** When submitting the login form, inspect the `POST` request to `/api/users/token/`.
            *   Check the request payload (form data): Is `username` and `password` being sent correctly?
            *   Check the response status code (e.g., 401 Unauthorized for bad credentials, 200 OK for success).
            *   Check the response body for any error messages or the JWT token on success.
        3.  **Check Backend Logs:** `docker-compose logs backend`. Look for errors related to login attempts, authentication failures, or issues with the `/api/users/token/` endpoint.
        4.  **Check `users` Table in DB:** Connect to the database and verify:
            *   Does the user account exist (`SELECT * FROM users WHERE username = 'your_username';`)?
            *   Is the `password_hash` field populated?
    *   **Common Solutions/Fixes:**
        *   Ensure correct credentials are being used.
        *   If the user account does not exist, create it (if appropriate, e.g., via admin or a registration process if available).
        *   If the backend API endpoint `/api/users/token/` is failing for reasons other than incorrect credentials (e.g., 500 error), investigate and fix the backend issue.
        *   Ensure the password hashing mechanism used when creating users (e.g., in [`backend/crud/users.py`](backend/crud/users.py:1) or [`backend/seed_data.py`](backend/seed_data.py:1)) is compatible with the verification method in [`auth_utils.authenticate_user()`](backend/auth/utils.py:39).

#### 3.5.2. Access Denied to Certain Admin Sections
    *   **Symptom(s):** A logged-in user attempts to access an admin page or perform an administrative action and receives a "Forbidden" error (often HTTP 403), is redirected, or the feature is simply not visible/available.
    *   **Explanation of Relevant Application Mechanics:**
        *   Backend API endpoints are protected by role-based access control using decorators like [`@auth_utils.require_admin`](backend/auth/utils.py:73), [`@auth_utils.require_manager`](backend/auth/utils.py:79), or [`@auth_utils.require_staff`](backend/auth/utils.py:85) in the router files (e.g., [`backend/routers/properties.py`](backend/routers/properties.py:1), [`backend/routers/users.py`](backend/routers/users.py:1)).
        *   The frontend admin layout ([`frontend/components/AdminLayout.js`](frontend/components/AdminLayout.js:1)) might also implement role-based logic to show/hide navigation links or restrict page access based on the authenticated user's role.
        *   The user's role is stored in the `role` column of the `users` table in the database and is typically determined by fetching the current user's details via `GET /api/users/me/`.
    *   **Possible Causes:**
        *   The authenticated user does not have the required role (e.g., 'admin', 'manager', 'staff') for the specific action or resource they are trying to access.
        *   The JWT token being sent with requests is missing, invalid, or expired (this should ideally lead to a 401 Unauthorized error, but could sometimes manifest as access issues if not handled consistently).
        *   Incorrect role-checking logic in the backend API endpoint decorators or in the frontend's conditional rendering.
        *   The user's role in the database is incorrect.
    *   **Diagnostic Steps:**
        1.  **Verify User's Role:**
            *   Check the user's `role` directly in the `users` table in the database.
            *   After logging in, call the `GET /api/users/me/` endpoint (e.g., using browser dev tools or Postman, ensuring the auth token is sent). The response should include the user's role.
        2.  **Check Required Role for the Resource:** Consult [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1) or examine the backend router code (e.g., [`backend/routers/users.py`](backend/routers/users.py:1)) for the specific endpoint to see which role(s) are required (e.g., `Depends(auth_utils.require_admin)`).
        3.  **Browser Developer Tools (Network Tab):** When the access denied error occurs, inspect the API call that was denied. What was the HTTP status code (likely 403 Forbidden)?
        4.  **Check Backend Logs:** `docker-compose logs backend`. Look for any messages related to authorization failure or role checks.
        5.  **Inspect JWT Token:** If possible, decode the JWT token (e.g., using a site like jwt.io) to see the claims it contains. The user ID (`sub`) should be present. The role might not be directly in the token but fetched based on the user ID.
        6.  **Review Frontend Logic:** If UI elements are hidden, inspect the conditional rendering logic in components like [`frontend/components/AdminLayout.js`](frontend/components/AdminLayout.js:1) to see how it uses the user's role.
    *   **Common Solutions/Fixes:**
        *   If the user genuinely lacks the required permissions, assign the correct role to the user in the database (e.g., via an admin interface for user management, or directly in the DB if necessary and authorized).
        *   Correct any flawed role-checking logic in the backend API endpoint decorators or in the frontend's conditional rendering if it's not behaving as expected.
        *   Ensure the user is properly logged in and a valid, non-expired JWT token is being sent with all authenticated requests.

## 4. How to Ask for Help / Report a Bug
    - When encountering an issue that cannot be resolved with this guide, provide the following information to facilitate assistance:
        - **What were you trying to do?** (Describe the goal or action.)
        - **What steps did you take?** (Provide a clear, step-by-step reproduction of the issue.)
        - **What did you expect to happen?**
        - **What actually happened?** (Include full error messages, screenshots if visual, or unexpected behavior.)
        - **Relevant Logs:**
            - Backend logs: `docker-compose logs backend` (especially any tracebacks or errors around the time of the issue).
            - Frontend logs: `docker-compose logs frontend`.
            - Browser console output (copy-paste any errors or relevant messages).
            - Nginx logs: `docker-compose logs proxy` (if relevant, e.g., for 50x errors).
        - **Environment Details:**
            - Operating System (e.g., Windows 10, macOS Ventura, Ubuntu 22.04).
            - Docker version (`docker --version`) and Docker Compose version (`docker-compose --version` or `docker compose version`).
            - Browser name and version.
        - **Relevant Configuration:** Snippets from `.env`, [`docker-compose.yml`](docker-compose.yml:1), or [`nginx.conf`](nginx.conf:1) if they seem related to the issue.
        - **References:** Point to specific sections in documentation (like this guide or [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1)) if you suspect a deviation.