# Papra Server Dockerfile
# Multi-stage build optimized for production and aarch64 support
# Supports both amd64 and arm64/aarch64 architectures

# =============================================================================
# Build stage - Build the application
# =============================================================================
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

# Set build arguments
ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Install build dependencies
RUN apk add --no-cache python3 make g++ linux-headers && \
    npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/papra-server/package.json ./apps/papra-server/

# Install dependencies (frozen for reproducibility)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy all source files
COPY . .

# Build the server
RUN cd apps/papra-server && \
    pnpm build

# =============================================================================
# Runtime stage - Minimal production image
# =============================================================================
FROM --platform=$BUILDPLATFORM node:20-alpine AS runtime

# Set target platform (automatically uses build platform if not specified)
ARG TARGETPLATFORM

# Install runtime dependencies for SQLite
RUN apk add --no-cache libstdc++

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create app directory and set permissions
WORKDIR /app
RUN mkdir -p /app/apps/papra-server/data && \
    mkdir -p /app/apps/papra-server/local-documents && \
    mkdir -p /app/apps/papra-server/ingestion && \
    chown -R nodejs:nodejs /app

# Copy built files from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/papra-server/dist ./apps/papra-server/dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=1221
ENV SERVER_HOSTNAME=0.0.0.0

# Expose port
EXPOSE 1221

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:1221/api/health || exit 1

# Run migrations on startup, then start the server
CMD ["sh", "-c", "node apps/papra-server/dist/scripts/migrate-up.script.js && node apps/papra-server/dist/index.js"]
