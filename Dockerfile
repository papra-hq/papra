# Papra Server Dockerfile
# Multi-stage build optimized for production and aarch64 support
# Supports both amd64 and arm64/aarch64 architectures
# Uses Node.js 26+ for Temporal API support

# =============================================================================
# Build stage - Build the application
# =============================================================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

# Set build arguments
ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Install build dependencies
RUN apk add --no-cache python3 make g++ linux-headers ca-certificates openssl git && \
    update-ca-certificates && \
    npm install -g pnpm

# Create app directory
WORKDIR /app
ENV PNPM_CONFIG_STRICT_PEER_DEPENDENCIES=false

# Copy package files for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/papra-server/package.json ./apps/papra-server/
COPY packages/ ./packages/

# Install dependencies
# Using --ignore-scripts to avoid postinstall issues
# Note: Using without --frozen-lockfile for now due to network/timeouts
RUN pnpm install --ignore-scripts

# Copy all source files
COPY . .

# Build the server and all scripts
RUN cd apps/papra-server && \
    pnpm build && \
    pnpm esbuild --bundle src/scripts/migrate-up.script.ts --platform=node --packages=external --format=esm --outfile=dist/scripts/migrate-up.script.js --minify --alias:@papra/std=../../packages/std/src/index.ts

# =============================================================================
# Runtime stage - Minimal production image
# =============================================================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS runtime

# Set target platform (automatically uses build platform if not specified)
ARG TARGETPLATFORM

# Install runtime dependencies for SQLite
RUN apk add --no-cache libstdc++ ca-certificates openssl && \
    update-ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create app directory and set permissions
WORKDIR /app
RUN mkdir -p /app/apps/papra-server/data && \
    mkdir -p /app/apps/papra-server/local-documents && \
    mkdir -p /app/apps/papra-server/ingestion && \
    chown -R nodejs:nodejs /app

# Copy built files and dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/papra-server/dist ./apps/papra-server/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/papra-server/node_modules ./apps/papra-server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/papra-server/src ./apps/papra-server/src
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=1221
ENV SERVER_HOSTNAME=0.0.0.0
ENV NODE_OPTIONS="--experimental-sqlite"

# Expose port
EXPOSE 1221

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:1221/api/health || exit 1

# Run the server (Node.js 26+ has Temporal API by default)
# CMD ["sh", "-c", "cd /app/apps/papra-server && node /app/node_modules/tsx/dist/cli.mjs src/scripts/migrate-up.script.ts && node dist/index.js"]
CMD ["node", "/app/apps/papra-server/dist/index.js"]
