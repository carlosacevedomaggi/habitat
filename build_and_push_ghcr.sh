#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
GHCR_OWNER="carlosacevedomaggi"
BACKEND_IMAGE_NAME="habitat-backend"
FRONTEND_IMAGE_NAME="habitat-frontend"
IMAGE_TAG="latest" # Or use a version number, git commit SHA, etc.

# Production Next.js Public API URL
# This will be baked into the frontend image during its build process.
PRODUCTION_NEXT_PUBLIC_API_URL="https://habitatvip.com/api"

# Derived image names for GHCR
GHCR_BACKEND_IMAGE="ghcr.io/${GHCR_OWNER}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"
GHCR_FRONTEND_IMAGE="ghcr.io/${GHCR_OWNER}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"

# --- Login to GitHub Container Registry ---
# You need to authenticate to GHCR before pushing images.
# Typically, this is done using a Personal Access Token (PAT) with 'write:packages' scope.
# 1. Generate a PAT from your GitHub Developer settings.
# 2. Log in using the PAT as the password and your GitHub username:
#    echo "YOUR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
#
# IMPORTANT: Replace YOUR_PAT and YOUR_GITHUB_USERNAME with your actual credentials.
# For CI/CD, store the PAT as a secret.
echo "---------------------------------------------------------------------"
echo "IMPORTANT: Ensure you are logged into GHCR before running this script fully."
echo "Example: echo YOUR_PAT | docker login ghcr.io -u ${GHCR_OWNER} --password-stdin"
echo "---------------------------------------------------------------------"
# read -p "Press [Enter] to continue after ensuring you are logged in, or Ctrl+C to abort..."

# --- Build Backend Image ---
echo "Building backend Docker image: ${GHCR_BACKEND_IMAGE}..."
docker build -t "${GHCR_BACKEND_IMAGE}" ./backend
echo "Backend image build complete."

# --- Build Frontend Image ---
echo "Building frontend Docker image: ${GHCR_FRONTEND_IMAGE} with API URL: ${PRODUCTION_NEXT_PUBLIC_API_URL}..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL="${PRODUCTION_NEXT_PUBLIC_API_URL}" \
  -t "${GHCR_FRONTEND_IMAGE}" \
  ./frontend
echo "Frontend image build complete."

# --- Push Images to GHCR ---
echo "Pushing backend image to GHCR: ${GHCR_BACKEND_IMAGE}..."
docker push "${GHCR_BACKEND_IMAGE}"
echo "Backend image pushed."

echo "Pushing frontend image to GHCR: ${GHCR_FRONTEND_IMAGE}..."
docker push "${GHCR_FRONTEND_IMAGE}"
echo "Frontend image pushed."

echo "---------------------------------------------------------------------"
echo "Script finished. Images should be available at:"
echo "Backend: ${GHCR_BACKEND_IMAGE}"
echo "Frontend: ${GHCR_FRONTEND_IMAGE}"
echo "---------------------------------------------------------------------"