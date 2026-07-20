#!/bin/bash

# Papra Docker Build Script
# Builds Docker images for Papra with support for multiple architectures
# Usage: ./scripts/build-docker.sh [platform] [push]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PLATFORM="${1:-linux/$(uname -m)}"
PUSH_IMAGES="${2:-false}"
IMAGE_NAME="papra-server"
IMAGE_TAG="latest"
REGISTRY="ghcr.io/papra-hq"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Buildx is available
if ! docker buildx version &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Buildx not found. Creating buildx instance...${NC}"
    docker buildx create --use
fi

echo -e "${GREEN}Building Papra Docker image...${NC}"
echo -e "Platform: ${YELLOW}${PLATFORM}${NC}"
echo -e "Image: ${YELLOW}${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}${NC}"

# Determine full image name
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Build the image
echo -e "${GREEN}Starting build...${NC}"
docker buildx build \
    --platform "${PLATFORM}" \
    -t "${FULL_IMAGE}" \
    --load .

if [ "$?" -eq 0 ]; then
    echo -e "${GREEN}Build completed successfully!${NC}"
    docker images | grep "${IMAGE_NAME}"
else
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Push to registry if requested
if [ "${PUSH_IMAGES}" = "true" ] || [ "${PUSH_IMAGES}" = "push" ]; then
    echo -e "${GREEN}Pushing image to registry...${NC}"
    
    # Check if already logged in
    if ! docker info | grep -q "Username: ${REGISTRY}"; then
        echo -e "${YELLOW}Please log in to ${REGISTRY}...${NC}"
        echo -e "Run: echo \$GITHUB_TOKEN | docker login ${REGISTRY} -u YOUR_USERNAME --password-stdin"
        exit 1
    fi
    
    docker buildx build \
        --platform "${PLATFORM}" \
        -t "${FULL_IMAGE}" \
        --push .
    
    if [ "$?" -eq 0 ]; then
        echo -e "${GREEN}Image pushed successfully!${NC}"
    else
        echo -e "${RED}Push failed!${NC}"
        exit 1
    fi
fi

# Print usage instructions
echo ""
echo -e "${GREEN}Docker image is ready!${NC}"
echo ""
echo "To run the container:"
echo "  docker run -d \\"
    echo "    --name papra \\"
    echo "    -p 1221:1221 \\"
    echo "    -v papra_data:/app/apps/papra-server/data \\"
    echo "    -v papra_documents:/app/apps/papra-server/local-documents \\"
    echo "    --env-file .env \\"
    echo "    ${FULL_IMAGE}"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up -d"
echo ""
