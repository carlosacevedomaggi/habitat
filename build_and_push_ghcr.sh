#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
GHCR_OWNER="carlosacevedomaggi"
BACKEND_IMAGE_NAME="habitat-backend"
FRONTEND_IMAGE_NAME="habitat-frontend"
IMAGE_TAG="latest" 
TARGET_PLATFORM="linux/amd64" # Target platform for Lightsail

PRODUCTION_NEXT_PUBLIC_API_URL="https://habitatvip.com/api"

GHCR_BACKEND_IMAGE="ghcr.io/${GHCR_OWNER}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"
GHCR_FRONTEND_IMAGE="ghcr.io/${GHCR_OWNER}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"

# --- Ensure Docker Buildx builder is active ---
echo "---------------------------------------------------------------------"
echo "Using Docker Buildx builder 'my_amd64_builder'."
echo "Ensure it's created and bootstrapped (docker buildx create --use --name my_amd64_builder; docker buildx inspect my_amd64_builder --bootstrap)"
echo "---------------------------------------------------------------------"
docker buildx use my_amd64_builder

# --- Login to GitHub Container Registry ---
echo "---------------------------------------------------------------------"
echo "IMPORTANT: Ensure you are logged into GHCR."
echo "Example: echo YOUR_PAT | docker login ghcr.io -u ${GHCR_OWNER} --password-stdin"
echo "---------------------------------------------------------------------"
# read -p "Press [Enter] to continue after ensuring you are logged in, or Ctrl+C to abort..."

# --- Build and Push Backend Image for amd64 ---
echo "Building and pushing backend Docker image for ${TARGET_PLATFORM}: ${GHCR_BACKEND_IMAGE}..."
docker buildx build \
  --platform "${TARGET_PLATFORM}" \
  -t "${GHCR_BACKEND_IMAGE}" \
  --push \
  ./backend  # Assumes script is run from project root
echo "Backend image build and push complete for ${TARGET_PLATFORM}."

# --- Build and Push Frontend Image for amd64 ---
echo "Building and pushing frontend Docker image for ${TARGET_PLATFORM}: ${GHCR_FRONTEND_IMAGE} with API URL: ${PRODUCTION_NEXT_PUBLIC_API_URL}..."
docker buildx build \
  --platform "${TARGET_PLATFORM}" \
  --build-arg NEXT_PUBLIC_API_URL="${PRODUCTION_NEXT_PUBLIC_API_URL}" \
  -t "${GHCR_FRONTEND_IMAGE}" \
  --push \
  ./frontend # Assumes script is run from project root
echo "Frontend image build and push complete for ${TARGET_PLATFORM}."

echo "---------------------------------------------------------------------"
echo "Script finished. Images for ${TARGET_PLATFORM} should be available at:"
echo "Backend: ${GHCR_BACKEND_IMAGE}"
echo "Frontend: ${GHCR_FRONTEND_IMAGE}"
echo "---------------------------------------------------------------------"