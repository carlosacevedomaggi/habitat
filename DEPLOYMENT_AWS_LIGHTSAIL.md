**Deployment Strategy: Local to AWS Lightsail**

**Visual Overview:**
```mermaid
graph TD
    subgraph AWS Lightsail Instance
        direction LR
        A[User/Internet] --> LB(Lightsail Firewall Ports 80/443)
        LB --> NginxDocker[Nginx Container (Port 80/443)]
        NginxDocker --> FrontendDocker[Frontend Container (Port 3000)]
        NginxDocker --> BackendDocker[Backend Container (Port 8000)]
        BackendDocker --> PostgresDocker[PostgreSQL Container (Port 5432)]
        
        subgraph Docker Engine
            direction TB
            NginxDocker
            FrontendDocker
            BackendDocker
            PostgresDocker
        end

        PV[Persistent Volume for DB Data] --> PostgresDocker
        PV_Uploads[Persistent Volume for Uploads] --> BackendDocker
        Code[Cloned Git Repository]
        EnvFile[.env File (Managed Securely)]
        DockerCompose[docker-compose.yml]

        DockerCompose -- Manages --> NginxDocker
        DockerCompose -- Manages --> FrontendDocker
        DockerCompose -- Manages --> BackendDocker
        DockerCompose -- Manages --> PostgresDocker
        
        EnvFile -- Configures --> FrontendDocker
        EnvFile -- Configures --> BackendDocker
        EnvFile -- Configures --> PostgresDocker

        Code -- Contains --> DockerCompose
        Code -- Contains --> backend/
        Code -- Contains --> frontend/
        Code -- Contains --> nginx.conf
        Code -- Contains --> certs/ (if applicable)
    end

    A -->|DNS (Your Domain)| LightsailStaticIP[Lightsail Static IP]
    LightsailStaticIP --> LB

    subgraph Your Local Machine / CI/CD
        direction TB
        LocalCode[Local Git Repo] -->|git push| RemoteGit[Remote Git Repository (e.g., GitHub)]
        LocalDockerBuild[Docker Build Environment] -- Builds --> DockerImageRegistry[Docker Image Registry (e.g., AWS ECR, Docker Hub)]
        LocalCode -- Contains --> backend/Dockerfile
        LocalCode -- Contains --> frontend/Dockerfile
    end
    
    RemoteGit -->|git clone| Code
    DockerImageRegistry -->|docker pull| Docker Engine
```

**Phase I: Pre-Deployment Preparations (Local & Git Repository)**

1.  **Application Specifics Review (Self-Check):**
    *   Technology Stack: Python/FastAPI, Node.js/Next.js, PostgreSQL, Nginx.
    *   Local Execution: `docker-compose build && docker-compose up`.
    *   Confirm all local dependencies are explicitly listed in `backend/requirements.txt` and `frontend/package.json`.

2.  **Git Repository Optimization:**
    *   `.gitignore` Review: Ensure it's comprehensive, no `.env` files or sensitive production-specific files are committed.
    *   Sensitive Data Management (`.env` file): `.env.example` is tracked. The actual `.env` for Lightsail (containing production secrets) MUST NOT be in Git. It will be securely created/transferred to Lightsail.
    *   Branching Strategy (Recommended): Use `main` or `production` branch for deployed code.

3.  **Docker Image Handling (Recommended: Pre-build and Push to Registry):**
    *   Choose a Docker Registry (AWS ECR or Docker Hub).
    *   Modify Dockerfiles for Production if needed (current ones seem good).
    *   Create a script (Local/CI) to build and push images:
        ```bash
        # Example for backend
        docker build -t YOUR_REGISTRY/your-backend-image:latest ./backend
        # Example for frontend (pass production API URL)
        docker build -t YOUR_REGISTRY/your-frontend-image:latest --build-arg NEXT_PUBLIC_API_URL=\${PRODUCTION_NEXT_PUBLIC_API_URL} ./frontend
        # Login to registry
        docker push YOUR_REGISTRY/your-backend-image:latest
        docker push YOUR_REGISTRY/your-frontend-image:latest
        ```
    *   Update `docker-compose.yml` (or use `docker-compose.prod.yml`) to use these pre-built images for `backend` and `frontend` services on Lightsail. `db` and `proxy` can use public images.

4.  **Dependency Management**: Handled by Dockerfiles. Ensure lock files (`package-lock.json`, pinned `requirements.txt`) are up-to-date and committed.

5.  **Environment Configuration Strategy for Lightsail**:
    *   Primary method: `.env` file on Lightsail, sourced by `docker-compose`.
    *   Defines: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `SECRET_KEY`, `NEXT_PUBLIC_API_URL` (production value), `NODE_ENV=production`, etc.

6.  **Build/Compilation Processes**: Docker images are pre-built. No compilation on Lightsail during deployment, only `docker pull`.

**Phase II: AWS Lightsail Instance Setup**

1.  **Create Lightsail Instance**: Linux OS (e.g., Ubuntu 20.04+), appropriate plan, SSH key pair.
2.  **Assign Static IP Address**.
3.  **Configure DNS** (point domain to static IP).
4.  **Configure Lightsail Firewall**: Allow TCP 22 (SSH), 80 (HTTP), 443 (HTTPS).
5.  **Connect via SSH and Install Software**:
    *   Update system: `sudo apt update && sudo apt upgrade -y`
    *   Install Docker: `sudo apt install -y docker.io; sudo systemctl start docker; sudo systemctl enable docker; sudo usermod -aG docker $USER` (re-login or `newgrp docker`).
    *   Install Docker Compose (check latest version):
        ```bash
        sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        ```
    *   Install Git: `sudo apt install -y git`

**Phase III: Application Deployment to Lightsail**

1.  **Clone Repository**: `git clone YOUR_GIT_REPOSITORY_URL /home/ubuntu/your-app-name; cd /home/ubuntu/your-app-name`
2.  **Create and Populate `.env` File**: Securely transfer or create `/home/ubuntu/your-app-name/.env` with production values.
3.  **Handle `certs/` Directory for Nginx (SSL/TLS)**:
    *   `docker-compose.yml` mounts `./certs:/etc/nginx/certs:ro`.
    *   For production, use Let's Encrypt (Certbot). This might involve initially running Nginx without SSL to obtain certs, then updating config.
4.  **Pull Docker Images (if using pre-built images)**:
    *   Log in to your Docker registry if private (e.g., `aws ecr get-login-password...` or `sudo docker login`).
    *   `docker-compose -f docker-compose.prod.yml pull backend frontend` (or similar).
5.  **Start Application**: `docker-compose -f docker-compose.prod.yml up -d` (or `docker-compose up -d`). Backend `entrypoint.sh` runs migrations/seeding.

**Phase IV: Post-Deployment Verification & Maintenance**

1.  **Verify Deployment**:
    *   `docker ps -a` (check all services are `Up`).
    *   `docker-compose logs <service_name>` (check for errors).
    *   Access application via browser.
2.  **Automate Docker Compose on Boot (Recommended)**: Use systemd service.
    *   Example `/etc/systemd/system/your-app.service`:
        ```ini
        [Unit]
        Description=Your App Service
        Requires=docker.service
        After=docker.service

        [Service]
        Type=oneshot
        RemainAfterExit=yes
        WorkingDirectory=/home/ubuntu/your-app-name
        ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
        ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down

        [Install]
        WantedBy=multi-user.target
        ```
    *   Enable: `sudo systemctl enable your-app.service; sudo systemctl start your-app.service`.
3.  **Maintenance & Updates**:
    *   `git pull`, rebuild/pull images, `docker-compose up -d --remove-orphans`.
    *   Regular OS updates, log monitoring, data backups (Lightsail snapshots).

**Addressing Common Discrepancies**:
*   Environment Variables (`.env` file accuracy).
*   File Paths/Permissions (Docker volume mounts).
*   Database Connectivity (`DATABASE_URL`, credentials).
*   API URLs (`NEXT_PUBLIC_API_URL`).
*   Resource Limits on Lightsail.
*   Avoid hardcoded environment-specific values.