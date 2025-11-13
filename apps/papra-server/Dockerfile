# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=24.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Install pnpm
ARG PNPM_VERSION=10.19.0
RUN npm install -g pnpm@${PNPM_VERSION}

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Copy monorepo configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all workspace packages
COPY packages/lecture/package.json ./packages/lecture/package.json
COPY packages/webhooks/package.json ./packages/webhooks/package.json
COPY apps/papra-server/package.json ./apps/papra-server/package.json

# Install all dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Copy source code for dependencies
COPY packages/lecture ./packages/lecture
COPY packages/webhooks ./packages/webhooks

# Build workspace dependencies
RUN pnpm --filter @papra/lecture build
RUN pnpm --filter @papra/webhooks build

# Copy server application code
COPY apps/papra-server ./apps/papra-server

# Build server application
RUN pnpm --filter @papra/app-server build

# Prune dev dependencies
RUN pnpm --filter @papra/app-server --prod --legacy deploy /app/production


# Final stage for app image
FROM base
ENV NODE_ENV="production"
ENV PORT=1221

# Install Tesseract OCR
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y tesseract-ocr tesseract-ocr-all && \
    rm -rf /var/lib/apt/lists/*

# Copy built application from production deployment
COPY --from=build /app/production /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 1221
CMD [ "pnpm", "--silent", "start:with-migrations" ]
