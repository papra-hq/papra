# syntax = docker/dockerfile:1

ARG NODE_VERSION=24.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ARG PNPM_VERSION=10.19.0
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

ENV NODE_ENV="production"

# -----------------

FROM base AS build

# Install packages needed by some node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/lecture/package.json ./packages/lecture/package.json
COPY packages/webhooks/package.json ./packages/webhooks/package.json
COPY packages/search-parser/package.json ./packages/search-parser/package.json
COPY apps/papra-server/package.json ./apps/papra-server/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/lecture ./packages/lecture
COPY packages/webhooks ./packages/webhooks
COPY packages/search-parser ./packages/search-parser
COPY apps/papra-server ./apps/papra-server

RUN pnpm --filter "@papra/app-server..." run build

RUN pnpm --filter @papra/app-server --prod --legacy deploy /app/production

# -----------------

FROM base
ENV NODE_ENV="production"
ENV PORT=1221

# Install Tesseract OCR
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y tesseract-ocr tesseract-ocr-all && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/production /app

EXPOSE 1221

# The command is overridden by Fly at runtime, see ./fly.toml
CMD [ "pnpm", "--silent", "start:with-migrations" ]
