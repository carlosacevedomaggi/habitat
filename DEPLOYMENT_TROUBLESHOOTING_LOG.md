# Deployment Troubleshooting Log (Habitat App to AWS Lightsail)

This document logs the fixes and implementations made during the attempt to deploy the Habitat application to AWS Lightsail, and outlines the current problem.

## Initial Goal:
Deploy the application (FastAPI backend, Next.js frontend, PostgreSQL, Nginx proxy) from a local Raspberry Pi development environment to AWS Lightsail, ensuring it runs correctly after cloning from Git and using Docker Compose.

## Key Implementations and Fixes During This Session:

1.  **Deployment Strategy Documented:**
    *   A comprehensive deployment strategy was created and saved as `DEPLOYMENT_AWS_LIGHTSAIL.md`. This document outlines all phases from local preparation to server setup and application launch.

2.  **Local Pre-Deployment Preparations:**
    *   **Target Docker Registry:** GitHub Container Registry (GHCR) was chosen.
    *   **Production API URL:** Determined as `https://habitatvip.com/api`.
    *   **Build Script for GHCR (`build_and_push_ghcr.sh`):**
        *   Initially created to build images locally and push to GHCR.
        *   Later updated to use `docker buildx` for cross-compiling `linux/amd64` images on the ARM-based Raspberry Pi, targeting the Lightsail instance architecture. This involved several iterations to correctly set up `buildx` and QEMU.
    *   **Production Docker Compose File (`docker-compose.prod.yml`):**
        *   Created to use pre-built images from GHCR for backend and frontend services, while db and proxy use public images.
    *   **Git Commits:**
        *   Deployment strategy document, build script, and production compose file were committed to the local `main` branch.
        *   These changes were then cherry-picked onto the local `v2` branch and pushed to `origin/v2` on GitHub.

3.  **AWS Lightsail Instance Setup (Primarily via AWS CLI):**
    *   **Instance Deletion:** Existing Lightsail instances were deleted to free up quota.
    *   **New Instance Creation (`habitat-app-instance`):**
        *   Region: `us-east-2`
        *   Blueprint: `ubuntu_22_04`
        *   Bundle: `small_3_0`
        *   SSH Key Pair: `habitat-lightsail-key` (verified from local `habitat-app-server-ss.pem`).
    *   **Static IP (`habitat-app-static-ip`):** Allocated and attached to the instance. Verified IP as `3.148.66.169`.
    *   **DNS Configuration (GoDaddy):** User confirmed `habitatvip.com` 'A' record was updated to point to `3.148.66.169`. Initial DNS issues (pointing to an old IP or "Parked" page) were resolved.
    *   **Lightsail Firewall:** Ports 80 (HTTP) and 443 (HTTPS) were opened for the instance (port 22 for SSH was default).
    *   **SSH Connection:** Successfully established to the instance using `ssh -i ~/Downloads/habitat-app-server-ss.pem ubuntu@habitatvip.com` after DNS propagated.
    *   **Software Installation on Server:** Docker, Docker Compose, and Git were successfully installed on the Lightsail instance. Docker group membership for the `ubuntu` user was activated.

4.  **Application Deployment to Lightsail (Phase III):**
    *   **Cloned Repository:** The `v2` branch of `carlosacevedomaggi/habitat` was cloned into `/home/ubuntu/habitat-app` on the server.
    *   **Production `.env` File Creation:**
        *   A local template `production_env_template.txt` was created and refined based on `.env.example`.
        *   Secure random values for `POSTGRES_PASSWORD`, `SECRET_KEY`, and `JWT_SECRET_KEY` were generated.
        *   The user was guided to fill this template with production values and then copy its content into `/home/ubuntu/habitat-app/.env` on the server using `nano`. Permissions were set to `600`.
    *   **`certs` Directory:** Created on the server (`/home/ubuntu/habitat-app/certs`).
    *   **`NEXT_PUBLIC_API_URL`:** Temporarily set to `http://habitatvip.com/api` in the server's `.env` file for initial HTTP testing.

5.  **Docker Image Architecture Troubleshooting (Major Hurdle):**
    *   Initial `exec format error` on backend and frontend containers indicated an architecture mismatch (ARM images from Pi trying to run on AMD64 Lightsail).
    *   **Attempt 1 (Buildx on Pi):**
        *   Installed `docker buildx` manually on the Raspberry Pi.
        *   Troubleshot QEMU setup for cross-compilation (using `aptman/qus` eventually succeeded in enabling `linux/amd64` platform for the builder).
        *   The `build_and_push_ghcr.sh` script was updated to use `docker buildx build --platform linux/amd64 --push`.
    *   **Attempt 2 (GitHub Actions for Building `amd64` Images):**
        *   Switched strategy to use GitHub Actions for building `amd64` images to avoid slow cross-compilation on the Pi.
        *   Created `.github/workflows/docker-publish.yml` to build and push to GHCR.
        *   Troubleshot YAML syntax errors in the workflow file (missing `id`s for steps, then a further syntax error).
        *   Troubleshot GHCR login issues ("denied: denied"), updating the workflow to use `${{ github.repository_owner }}` for username.
        *   Identified that an older ECR-focused workflow might have been running instead of the intended GHCR workflow. User was advised to check/delete conflicting workflow files.

## Current Problem (as of last interaction before this summary request):

The GitHub Actions workflow (`.github/workflows/docker-publish.yml`), intended to build `amd64` images and push them to GitHub Container Registry (GHCR), was still failing due to a YAML syntax error, reported by GitHub Actions on line 69.

The last action I took was to simplify the `run` command on line 69 of the local `.github/workflows/docker-publish.yml` to `run: echo "Test echo step"` for syntax validation purposes. This change was saved locally. The next step was for the user to commit and push this change, then check if the workflow passes syntax validation on GitHub.

**The overarching goal is to get `linux/amd64` versions of `habitat-backend` and `habitat-frontend` images successfully pushed to `ghcr.io/carlosacevedomaggi/` so they can be pulled and run on the Lightsail instance.** The `exec format error` for the frontend container on Lightsail (after the backend was fixed by a previous GH Actions run that *did* push an amd64 backend image, albeit to ECR initially) indicates the frontend image on the server is still not the correct architecture or has issues.