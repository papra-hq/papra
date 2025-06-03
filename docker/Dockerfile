# Base stage with pnpm
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest
RUN corepack enable
RUN corepack prepare pnpm@10.9.0 --activate

# Build stage
FROM base AS build

WORKDIR /app

COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/papra-client/package.json apps/papra-client/package.json
COPY apps/papra-server/package.json apps/papra-server/package.json
COPY packages/webhooks/package.json packages/webhooks/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm --filter "@papra/app-client..." run build && \
    pnpm --filter "@papra/app-server..." run build

RUN pnpm deploy --filter=@papra/app-server --legacy --prod /prod/papra-server

FROM base

WORKDIR /app

COPY --from=build /prod/papra-server ./
COPY --from=build /app/apps/papra-client/dist ./public

EXPOSE 1221

ENV NODE_ENV=production
ENV SERVER_SERVE_PUBLIC_DIR=true
ENV DATABASE_URL=file:./app-data/db/db.sqlite
ENV DOCUMENT_STORAGE_FILESYSTEM_ROOT=./app-data/documents
ENV PAPRA_CONFIG_DIR=./app-data
ENV EMAILS_DRY_RUN=true
ENV CLIENT_BASE_URL=http://localhost:1221

RUN mkdir -p ./app-data/db ./app-data/documents ./ingestion

CMD ["pnpm", "start:with-migrations"]
