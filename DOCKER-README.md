# Papra Docker Setup Guide

This guide covers Docker deployment for Papra, including **aarch64 (ARM64) support** for devices like Raspberry Pi, Termux on Android, and other ARM-based systems.

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.template .env
# Edit .env with your configuration
nano .env
```

### 2. Generate Required Secrets

```bash
# Generate AUTH_SECRET (minimum 32 characters)
echo "AUTH_SECRET=$(openssl rand -hex 48)" >> .env

# Generate BACKUPS_KEK (optional, for backup features)
echo "BACKUPS_KEK=$(openssl rand -hex 32)" >> .env
```

### 3. Build and Run

#### Using docker-compose (Recommended)

```bash
# Build for your current architecture
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

#### Using Docker Directly

```bash
# Build the image (auto-detects architecture)
docker build -t papra-server .

# Run with environment file
docker run -d \
  --name papra \
  --restart unless-stopped \
  -p 1221:1221 \
  -v papra_data:/app/apps/papra-server/data \
  -v papra_documents:/app/apps/papra-server/local-documents \
  --env-file .env \
  papra-server

# View logs
docker logs -f papra
```

## Architecture-Specific Builds

### Build for aarch64 (ARM64) on x86_64 Host (Cross-Compilation)

```bash
# Using buildx for multi-platform builds
docker buildx create --use
docker buildx build --platform linux/arm64 -t papra-server:arm64 .
```

### Build for Current Architecture

```bash
docker build --platform linux/$(uname -m) -t papra-server .
```

### Build for Multiple Architectures

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t papra-server:multiarch \
  --push .
```

## Termux (Android) Setup with uDocker

### Prerequisites

1. Install [Termux](https://termux.com/) from F-Droid (recommended)
2. Install uDocker:

```bash
# Update packages
pkg update && pkg upgrade

# Install dependencies
pkg install wget proot-docker

# Start uDocker
dockerd &
```

### Deploy Papra on Termux

```bash
# Create project directory
mkdir -p ~/papra && cd ~/papra

# Clone the repository (or copy files)
git clone https://github.com/papra-hq/papra.git .

# Copy environment template
cp .env.template .env
nano .env  # Edit with your configuration

# Build for aarch64 (Termux runs on ARM64)
docker build --platform linux/arm64 -t papra-server .

# Run the container
docker run -d \
  --name papra \
  --restart unless-stopped \
  -p 1221:1221 \
  -v $PREFIX/var/lib/papra/data:/app/apps/papra-server/data \
  -v $PREFIX/var/lib/papra/documents:/app/apps/papra-server/local-documents \
  --env-file .env \
  papra-server

# Check if running
docker ps
curl http://localhost:1221/api/health
```

### Termux-Specific Notes

- **Storage**: Use Termux storage directories (`$PREFIX/var/lib/...`) for persistent data
- **Port Forwarding**: Use `termux-exec` or Termux's built-in port forwarding
- **Access from Browser**: Use `http://localhost:1221` or your device's IP
- **Background Running**: Use `tmux` or `screen` to keep dockerd running:
  ```bash
  pkg install tmux
  tmux new -s docker
  dockerd
  # Press Ctrl+B then D to detach
  ```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SECRET` | Authentication secret (min 32 chars) | `openssl rand -hex 48` |
| `APP_BASE_URL` | Base URL for your instance | `http://localhost:1221` |

### Optional but Recommended

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `BACKUPS_KEK` | Backup encryption key | - | `openssl rand -hex 32` |
| `BACKUPS_RETENTION_DAYS` | Days to keep backups | - | `30` |
| `AUTH_FIRST_USER_AS_ADMIN` | First user is admin | `true` | `true` |
| `AUTH_IS_REGISTRATION_ENABLED` | Allow registration | `true` | `true` |

### Database

By default, SQLite is used with files stored in `/app/apps/papra-server/data`. For production, consider:

- **Turso**: `DATABASE_URL=libsql://your-db.turso.io`
- **Other**: See Papra documentation for supported databases

### Google Drive Backups

```bash
BACKUPS_GOOGLE_OAUTH_CLIENT_ID=your_client_id
BACKUPS_GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
BACKUPS_GOOGLE_OAUTH_REDIRECT_URI=http://localhost:1221/api/backups/google-drive/callback
```

Note: Redirect URI must match what's configured in Google Cloud Console.

## Volumes

The following volumes are recommended for persistent data:

| Volume | Purpose | Recommended Mount |
|--------|---------|-------------------|
| `/app/apps/papra-server/data` | SQLite database, backups metadata | Host directory |
| `/app/apps/papra-server/local-documents` | Document files | Host directory |
| `/app/apps/papra-server/ingestion` | Ingestion folder | Host directory |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 1221 | HTTP | API server |

## Health Checks

The container includes a health check endpoint:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' papra

# Or manually
curl http://localhost:1221/api/health
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs papra

# Check if migrations failed
docker exec papra node apps/papra-server/dist/scripts/migrate-up.script.js
```

### Port Already in Use

```bash
# Find and kill the process
lsof -i :1221
kill -9 <PID>

# Or change the port
docker run ... -p 3000:1221 ...
```

### Architecture Mismatch

If you get errors about architecture:

```bash
# Check your host architecture
uname -m

# Build for the correct platform
docker build --platform linux/$(uname -m) -t papra-server .
```

### Termux: Permission Denied

```bash
# Make sure Termux has storage permissions
termux-setup-storage

# Check and fix permissions
chmod -R 755 $PREFIX/var/lib/papra
```

## Security Considerations

1. **Never commit `.env`** to version control
2. **Use Docker secrets** for production:
   ```bash
   echo "your_auth_secret" | docker secret create auth_secret -
   ```
3. **Run as non-root**: The Dockerfile already creates a `nodejs` user
4. **Use HTTPS**: Set up a reverse proxy (Nginx, Caddy, Traefik) with SSL
5. **Firewall**: Only expose necessary ports

## Reverse Proxy Example (Nginx)

```nginx
server {
    listen 80;
    server_name papra.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name papra.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:1221;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or with Docker
docker stop papra
docker rm papra
docker build -t papra-server .
docker run ... (same as before)
```

## Multi-Architecture Images

For hosting on GitHub Container Registry (GHCR) with multiple architectures:

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and push multi-arch image
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/papra-hq/papra:latest \
  -t ghcr.io/papra-hq/papra:0.3.0 \
  --push .

# Then users can pull the correct architecture automatically
docker pull ghcr.io/papra-hq/papra:latest
```

## Using Pre-Built Images

Instead of building yourself, you can use the official images:

```bash
# Pull the latest image
docker pull ghcr.io/papra-hq/papra:latest

# Run it
docker run -d \
  --name papra \
  -p 1221:1221 \
  -v papra_data:/app/apps/papra-server/data \
  -e AUTH_SECRET=your_secret \
  -e APP_BASE_URL=http://localhost:1221 \
  ghcr.io/papra-hq/papra:latest
```

## Performance Tips

1. **Volume Performance**: For Termux, use directories on internal storage
2. **Memory**: Ensure at least 2GB RAM for comfortable operation
3. **CPU**: aarch64 performance is good on modern ARM chips
4. **Caching**: The Dockerfile uses layer caching for faster rebuilds

## Backup & Restore

### Backup

```bash
# Create a tar archive of volumes
docker run --rm \
  -v papra_data:/volume/data \
  -v $(pwd):/backup \
  alpine tar cvf /backup/papra-backup.tar /volume/data

# Or use docker volume backup tools
```

### Restore

```bash
# Extract to new container
docker run --rm \
  -v papra_data_new:/volume/data \
  -v $(pwd):/backup \
  alpine tar xvf /backup/papra-backup.tar -C /
```

## License

Papra is licensed under AGPL-3.0-or-later. By using this Docker setup, you agree to comply with the license terms.
