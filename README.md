# GEO-SEO Domination Tool

A comprehensive SEO analysis and optimization platform built with Next.js 15, featuring Docker containerization for easy deployment.

## Features

- **SEO Audits**: Comprehensive website analysis and optimization recommendations
- **Keyword Research**: Track and analyze keyword performance
- **Project Management**: Organize SEO campaigns by project
- **Rankings Tracking**: Monitor search engine rankings
- **Resource Library**: Centralized SEO resources and documentation
- **Company CRM**: Manage client relationships and projects

## Technology Stack

- **Frontend/Backend**: Next.js 15 (React 18, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 15
- **Caching**: Redis 7
- **Container**: Docker & Docker Compose
- **Web Server**: Nginx (production)
- **External APIs**: Perplexity, SEMrush, Firecrawl, Anthropic, Google

## Quick Start

### Prerequisites

- Docker Desktop 20.10+ (Windows/Mac) or Docker Engine (Linux)
- Docker Compose 2.0+
- 4GB+ available RAM
- 10GB+ available disk space

### Development Environment

#### Windows (PowerShell)

```powershell
# Start services
.\scripts\docker-dev-start.ps1

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### Linux/Mac (Bash)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start services
./scripts/docker-dev-start.sh

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### Manual Start

```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### Access Points

- **Web Application**: http://localhost:3000
- **PgAdmin**: http://localhost:5050
  - Email: `admin@geoseo.local`
  - Password: `admin`
- **PostgreSQL**: `localhost:5432`
  - User: `geoseo`
  - Password: `dev_password_change_me`
  - Database: `geo_seo_db`
- **Redis**: `localhost:6379`

### Production Environment

#### 1. Configure Environment

```bash
# Copy environment template
cp .env.docker.example .env.docker

# Edit with your production values
nano .env.docker
```

#### 2. Start Services

**Windows:**
```powershell
.\scripts\docker-prod-start.ps1
```

**Linux/Mac:**
```bash
./scripts/docker-prod-start.sh
```

**Manual:**
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
```

## Docker Architecture

### Services

#### 1. Web Application (Next.js)
- **Port**: 3000
- **Image**: Custom multi-stage build
- **Features**:
  - Optimized production build
  - Non-root user security
  - Health checks
  - Hot reloading (dev)

#### 2. PostgreSQL Database
- **Port**: 5432
- **Image**: postgres:15-alpine
- **Volume**: `postgres_data`
- **Init Script**: `scripts/init-db.sql`

#### 3. Redis Cache
- **Port**: 6379
- **Image**: redis:7-alpine
- **Volume**: `redis_data`
- **Features**: AOF persistence

#### 4. PgAdmin (Dev Only)
- **Port**: 5050
- **Image**: dpage/pgadmin4:latest
- **Purpose**: Database management UI

#### 5. Nginx (Production Only)
- **Ports**: 80, 443
- **Image**: nginx:alpine
- **Purpose**: Reverse proxy, SSL, load balancing

## Project Structure

```
GEO_SEO_Domination-Tool/
├── geo-seo-domination-tool/
│   └── web-app/
│       ├── app/              # Next.js app directory
│       ├── components/       # React components
│       ├── lib/             # Utilities and libraries
│       ├── Dockerfile       # Multi-stage Docker build
│       └── package.json     # Dependencies
├── docker-compose.dev.yml   # Development environment
├── docker-compose.prod.yml  # Production environment
├── .dockerignore           # Docker build exclusions
├── .env.docker.example     # Environment template
├── nginx/
│   ├── nginx.conf          # Nginx configuration
│   ├── ssl/                # SSL certificates
│   └── logs/               # Nginx logs
├── scripts/
│   ├── init-db.sql         # Database initialization
│   ├── docker-dev-start.sh # Dev startup (Linux/Mac)
│   ├── docker-dev-start.ps1# Dev startup (Windows)
│   ├── docker-prod-start.sh# Prod startup (Linux/Mac)
│   ├── docker-prod-start.ps1# Prod startup (Windows)
│   ├── docker-backup.sh    # Database backup
│   └── docker-restore.sh   # Database restore
├── backups/                # Database backups
├── DOCKER_SETUP.md         # Detailed Docker guide
└── README.md               # This file
```

## Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f web-app

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100
```

### Service Management

```bash
# Check status
docker-compose -f docker-compose.dev.yml ps

# Restart service
docker-compose -f docker-compose.dev.yml restart web-app

# Rebuild service
docker-compose -f docker-compose.dev.yml build web-app
docker-compose -f docker-compose.dev.yml up -d web-app
```

### Database Operations

```bash
# Access PostgreSQL
docker exec -it geo-seo-postgres-dev psql -U geoseo -d geo_seo_db

# Backup database (Linux/Mac)
./scripts/docker-backup.sh

# Restore database (Linux/Mac)
./scripts/docker-restore.sh

# Manual backup
docker exec geo-seo-postgres-prod pg_dump -U geoseo geo_seo_db > backup.sql

# Manual restore
cat backup.sql | docker exec -i geo-seo-postgres-prod psql -U geoseo -d geo_seo_db
```

### Redis Operations

```bash
# Access Redis CLI
docker exec -it geo-seo-redis-dev redis-cli

# Monitor Redis
docker exec -it geo-seo-redis-dev redis-cli MONITOR

# Clear cache
docker exec -it geo-seo-redis-dev redis-cli FLUSHALL
```

### Maintenance

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.dev.yml down -v

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## Environment Variables

### Required for Production

Create `.env.docker` file with these variables:

```env
# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Database
POSTGRES_USER=geoseo
POSTGRES_PASSWORD=<strong-secure-password>
POSTGRES_DB=geo_seo_db

# Redis
REDIS_PASSWORD=<strong-secure-password>

# API Keys
PERPLEXITY_API_KEY=<your-key>
SEMRUSH_API_KEY=<your-key>
FIRECRAWL_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
GOOGLE_API_KEY=<your-key>
```

## Development

### Local Development (without Docker)

```bash
cd geo-seo-domination-tool/web-app

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Hot Reloading

Development environment includes hot reloading:
- Edit files in `geo-seo-domination-tool/web-app`
- Changes reflect automatically at http://localhost:3000

## Health Checks

All services include health checks:

```bash
# Check web app health
curl http://localhost:3000/api/health

# Check Docker health status
docker inspect --format='{{json .State.Health}}' geo-seo-web-dev
```

## Performance Tuning

### Resource Limits (Production)

Configured in `docker-compose.prod.yml`:
- **PostgreSQL**: 2 CPU cores, 2GB RAM
- **Redis**: 1 CPU core, 512MB RAM
- **Web App**: 2 CPU cores, 2GB RAM

Adjust based on your server capacity.

### Scaling

```bash
# Scale web application
docker-compose -f docker-compose.prod.yml up -d --scale web-app=3
```

Note: Requires Nginx load balancer configuration.

## Security

### Best Practices

1. **Use strong passwords** in production
2. **Don't commit** `.env.docker` to version control
3. **Keep images updated**: `docker-compose pull`
4. **Enable SSL/TLS** via Nginx
5. **Regular backups** of databases
6. **Monitor logs** for suspicious activity
7. **Use secrets management** for sensitive data

### SSL Configuration

Place SSL certificates in `nginx/ssl/`:
```
nginx/ssl/
├── cert.pem    # SSL certificate
└── key.pem     # Private key
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs [service-name]`
2. Verify environment variables
3. Ensure ports are available
4. Check disk space: `docker system df`

### Database Connection Issues

1. Verify PostgreSQL is healthy: `docker-compose ps`
2. Check connection string
3. Test connection: `docker exec geo-seo-postgres-dev pg_isready`

### Build Failures

1. Clear cache: `docker-compose build --no-cache`
2. Remove old images: `docker system prune -a`
3. Check `.dockerignore` excludes `node_modules`

### Performance Issues

1. Check resource usage: `docker stats`
2. Increase resource limits in compose file
3. Enable Redis caching
4. Optimize database queries

## Documentation

- **Detailed Docker Guide**: [DOCKER_SETUP.md](DOCKER_SETUP.md)
- **API Health Check**: http://localhost:3000/api/health

## Support

For issues or questions:
1. Check logs first
2. Review environment variables
3. Verify service health status
4. Check network connectivity

## License

Proprietary - All rights reserved

## Contributing

Internal project - contact team lead for contribution guidelines.
