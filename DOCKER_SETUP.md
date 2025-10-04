# Docker Setup Guide for GEO-SEO Domination Tool

This guide explains how to use Docker to run the GEO-SEO Domination Tool in both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start

### Development Environment

1. **Start all services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **Stop services:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Environment

1. **Configure environment variables:**
   ```bash
   cp .env.docker.example .env.docker
   # Edit .env.docker with your production values
   ```

2. **Start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
   ```

3. **View logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f web-app
   ```

4. **Stop services:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

## Architecture

### Services

#### 1. PostgreSQL Database (`postgres`)
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Purpose:** Primary database for storing projects, keywords, and content
- **Volumes:**
  - `postgres_data`: Persistent database storage
  - `./scripts/init-db.sql`: Database initialization script

#### 2. Redis Cache (`redis`)
- **Image:** redis:7-alpine
- **Port:** 6379
- **Purpose:** Caching layer and future job queue support
- **Volumes:** `redis_data` for persistence

#### 3. Next.js Web Application (`web-app`)
- **Image:** Custom (built from Dockerfile)
- **Port:** 3000
- **Purpose:** Main application server
- **Features:**
  - Multi-stage build for optimization
  - Non-root user for security
  - Health checks
  - Hot reloading in development

#### 4. PgAdmin (Development Only)
- **Image:** dpage/pgadmin4:latest
- **Port:** 5050
- **Purpose:** Database management UI
- **Access:** http://localhost:5050
  - Email: admin@geoseo.local
  - Password: admin

#### 5. Nginx (Production Only)
- **Image:** nginx:alpine
- **Ports:** 80, 443
- **Purpose:** Reverse proxy, SSL termination, load balancing

### Network

All services communicate through a bridge network named `geo-seo-network`.

## Environment Variables

### Required for Development

The development environment uses default credentials. No additional configuration needed.

### Required for Production

Create `.env.docker` file with the following variables:

```env
# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Database
POSTGRES_USER=geoseo
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=geo_seo_db

# Redis
REDIS_PASSWORD=<strong-password>

# API Keys
PERPLEXITY_API_KEY=<your-key>
SEMRUSH_API_KEY=<your-key>
FIRECRAWL_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
GOOGLE_API_KEY=<your-key>
```

## Dockerfile Stages

The multi-stage Dockerfile optimizes the build process:

1. **deps**: Installs production dependencies only
2. **builder**: Builds the Next.js application
3. **runner**: Creates minimal production image with built assets

### Key Features:
- Uses Node 20 Alpine for minimal image size
- Non-root user (nextjs:nodejs) for security
- dumb-init for proper signal handling
- Health checks for container monitoring
- Optimized layer caching

## Common Commands

### Build Services

```bash
# Development
docker-compose -f docker-compose.dev.yml build

# Production
docker-compose -f docker-compose.prod.yml build
```

### View Service Status

```bash
# Development
docker-compose -f docker-compose.dev.yml ps

# Production
docker-compose -f docker-compose.prod.yml ps
```

### Access Service Shells

```bash
# Web application
docker exec -it geo-seo-web-dev sh

# PostgreSQL
docker exec -it geo-seo-postgres-dev psql -U geoseo -d geo_seo_db

# Redis
docker exec -it geo-seo-redis-dev redis-cli
```

### Database Operations

#### Backup Database

```bash
docker exec geo-seo-postgres-prod pg_dump -U geoseo geo_seo_db > backup.sql
```

#### Restore Database

```bash
cat backup.sql | docker exec -i geo-seo-postgres-prod psql -U geoseo -d geo_seo_db
```

#### Run Migrations

```bash
docker exec geo-seo-web-prod npm run migrate
```

### Clean Up

```bash
# Stop and remove containers, networks
docker-compose -f docker-compose.dev.yml down

# Also remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.dev.yml down -v

# Remove unused Docker resources
docker system prune -a
```

## Volume Management

### Named Volumes

- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files
- `pgadmin_data`: PgAdmin configuration (dev only)

### Backup Volumes

```bash
# Create backup
docker run --rm -v geo-seo-postgres-prod_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore backup
docker run --rm -v geo-seo-postgres-prod_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **Redis**: PING command
- **Web App**: HTTP GET to `/api/health`

Check health status:

```bash
docker inspect --format='{{json .State.Health}}' geo-seo-web-prod | jq
```

## Performance Tuning

### Production Resources

Services have resource limits defined in `docker-compose.prod.yml`:

- **PostgreSQL**: 2 CPU cores, 2GB RAM (limit)
- **Redis**: 1 CPU core, 512MB RAM (limit)
- **Web App**: 2 CPU cores, 2GB RAM (limit)

Adjust these based on your server capacity.

### Scaling

Scale the web application:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale web-app=3
```

Note: You'll need a load balancer (Nginx) for this to work properly.

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web-app

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Resource Usage

```bash
docker stats
```

## Troubleshooting

### Container won't start

1. Check logs: `docker-compose logs [service-name]`
2. Verify environment variables are set
3. Ensure ports are not already in use
4. Check disk space: `docker system df`

### Database connection issues

1. Verify PostgreSQL is healthy: `docker-compose ps`
2. Check connection string in web-app environment
3. Test connection: `docker exec geo-seo-postgres-dev pg_isready`

### Build failures

1. Clear build cache: `docker-compose build --no-cache`
2. Remove old images: `docker system prune -a`
3. Check Dockerfile syntax
4. Verify node_modules are excluded (.dockerignore)

### Slow performance

1. Check resource usage: `docker stats`
2. Increase allocated resources in compose file
3. Optimize database queries
4. Enable Redis caching

## Security Best Practices

1. **Use strong passwords** in production
2. **Don't commit** `.env.docker` to version control
3. **Run containers as non-root** users (already configured)
4. **Keep images updated**: `docker-compose pull`
5. **Use secrets management** for sensitive data
6. **Enable TLS/SSL** via Nginx
7. **Regular backups** of databases
8. **Monitor logs** for suspicious activity

## Next Steps

1. Configure SSL certificates for Nginx
2. Set up automated backups
3. Configure monitoring (Prometheus/Grafana)
4. Set up CI/CD pipeline
5. Configure log aggregation (ELK stack)
6. Implement secret management (Vault)

## Support

For issues or questions:
- Check container logs first
- Review environment variables
- Verify network connectivity
- Check health status of services
