# 🐳 Docker Guide - Discord Bots Management

This guide explains how to run the project using Docker and Docker Compose.

## 📋 Prerequisites

- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)

## 🚀 Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.docker .env
```

Edit the `.env` file and configure the variables:

```env
NODE_ENV=production
PORT=3000
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password-here
AUTH_SECRET=your-32-character-secret-key-here
```

> ⚠️ **Important**: Change `AUTH_PASSWORD` and `AUTH_SECRET` to secure values!

### 2. Run in Production

```bash
# Build and start the container
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at: `http://localhost:3000`

### 3. Run in Development

For development with hot reload:

```bash
# Build and start in development mode
docker-compose -f docker-compose.dev.yml up

# Or in background
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down
```

## 🏗️ Docker Architecture

### Docker Files

- **`Dockerfile`**: Optimized build for production (multi-stage)
- **`Dockerfile.dev`**: Build for development with hot reload
- **`docker-compose.yml`**: Orchestration for production
- **`docker-compose.dev.yml`**: Orchestration for development
- **`.dockerignore`**: Files excluded from build

### Multi-Stage Build

The production Dockerfile uses 3 stages:

1. **deps**: Install dependencies
2. **builder**: Build the Next.js application
3. **runner**: Final optimized and minimal image

### Persistent Volumes

The following directories are mounted as volumes to persist data:

- `./data`: Bot data and message logs
- `./public/uploads`: Avatars and uploads

## 🔧 Useful Commands

### Manual Build

```bash
# Build the image
docker build -t discord-bots-hub .

# Build for development
docker build -f Dockerfile.dev -t discord-bots-hub:dev .
```

### Run Container Manually

```bash
# Production
docker run -d \
  --name discord-bots-hub \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -e AUTH_USERNAME=admin \
  -e AUTH_PASSWORD=your-password \
  -e AUTH_SECRET=your-32-char-secret-key \
  discord-bots-hub

# Development
docker run -d \
  --name discord-bots-hub-dev \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  -v $(pwd)/data:/app/data \
  discord-bots-hub:dev
```

### Management

```bash
# View logs
docker logs discord-bots-hub
docker logs -f discord-bots-hub  # follow logs

# Access container shell
docker exec -it discord-bots-hub sh

# Restart container
docker restart discord-bots-hub

# Stop and remove
docker stop discord-bots-hub
docker rm discord-bots-hub

# Remove image
docker rmi discord-bots-hub
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Clean everything (containers, volumes, networks)
docker-compose down -v
```

## 📊 Health Check

The container includes a health check that verifies if the application is responding:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' discord-bots-hub
```

Possible statuses:
- `healthy`: Application working
- `unhealthy`: Application with issues
- `starting`: Starting

## 🔒 Security

### Implemented Best Practices

1. ✅ Container runs with non-root user (`nextjs:nodejs`)
2. ✅ Alpine Linux image (smaller attack surface)
3. ✅ Multi-stage build (minimal final image)
4. ✅ Sensitive variables via `.env` (not committed)
5. ✅ `.dockerignore` to exclude unnecessary files

### Recommendations

- Use strong passwords for `AUTH_PASSWORD`
- Generate a random 32-character key for `AUTH_SECRET`
- Do not commit the `.env` file to Git
- Use secrets in production (Docker Swarm or Kubernetes)

## 🌐 Production Deployment

### Using Docker Compose

```bash
# On a server with Docker installed
git clone <your-repository>
cd discord-bots-management
cp .env.docker .env
# Edit the .env with production values
docker-compose up -d
```

### Using Docker Swarm

```bash
docker stack deploy -c docker-compose.yml discord-bots
```

### Reverse Proxy (Nginx)

Nginx configuration example:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is in use
lsof -i :3000
```

### Permission error / Avatar upload failure

**Problem**: Error when uploading avatar or creating files.

**Solution**:
```bash
# Adjust volume permissions
chmod -R 777 public/uploads
chmod -R 755 data

# Restart the container
docker-compose restart
```

**Or use the setup script**:
```bash
./docker-setup.sh
```

### Bots appear as "Unauthorized" or decryption error

**Problem**: `Error: Unsupported state or unable to authenticate data`

**Cause**: Bot tokens were encrypted with a different key than the one configured in `.env`.

**Solutions**:

1. **Use the same encryption key**:
   - If you had a previous `.env`, use the same `AUTH_SECRET`
   - Copy the old key to the new `.env`

2. **Re-add the bots**:
   - Delete existing bots in the interface
   - Add them again with the new key
   - Tokens will be re-encrypted with the new key

3. **Clear data and start from scratch**:
   ```bash
   # Stop containers
   docker-compose down
   
   # Backup (optional)
   cp data/bots.json data/bots.json.backup
   
   # Clear data
   echo "[]" > data/bots.json
   
   # Restart
   docker-compose up -d
   ```

### Build is very slow

```bash
# Clear Docker cache
docker builder prune

# Build without cache
docker-compose build --no-cache
```

### Cannot connect to bots

Make sure that:
1. Environment variables are correct
2. Volumes are mounted correctly
3. The application has network access
4. Discord tokens are valid

### "Internal Server Error"

**Problem**: Error 500 when accessing the application.

**Solution**:
```bash
# Check detailed logs
docker-compose logs -f

# Check if environment variables are configured
docker exec discord-bots-hub env | grep AUTH

# If not, stop and reconfigure
docker-compose down
# Edit the .env with correct values
docker-compose up -d
```

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## 🤝 Contributing

If you encounter issues with the Docker configuration, please open an issue!
