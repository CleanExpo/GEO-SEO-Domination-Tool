# Docker Quick Reference

## Quick Start Commands

### Development
```bash
# Windows
.\scripts\docker-dev-start.ps1

# Linux/Mac
./scripts/docker-dev-start.sh

# Manual
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
# Windows
.\scripts\docker-prod-start.ps1

# Linux/Mac
./scripts/docker-prod-start.sh

# Manual
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
```

## Common Commands

### Service Management
```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# Restart service
docker-compose -f docker-compose.dev.yml restart web-app

# View status
docker-compose -f docker-compose.dev.yml ps

# View logs (all)
docker-compose -f docker-compose.dev.yml logs -f

# View logs (specific)
docker-compose -f docker-compose.dev.yml logs -f web-app
```

### Build & Deploy
```bash
# Build services
docker-compose -f docker-compose.dev.yml build

# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Pull latest images
docker-compose -f docker-compose.dev.yml pull
```

### Access Services
```bash
# Web app shell
docker exec -it geo-seo-web-dev sh

# PostgreSQL
docker exec -it geo-seo-postgres-dev psql -U geoseo -d geo_seo_db

# Redis CLI
docker exec -it geo-seo-redis-dev redis-cli
```

### Database Operations
```bash
# Backup (Linux/Mac)
./scripts/docker-backup.sh

# Restore (Linux/Mac)
./scripts/docker-restore.sh

# Manual backup
docker exec geo-seo-postgres-dev pg_dump -U geoseo geo_seo_db > backup.sql

# Manual restore
cat backup.sql | docker exec -i geo-seo-postgres-dev psql -U geoseo -d geo_seo_db
```

### Monitoring
```bash
# Resource usage
docker stats

# Container health
docker inspect --format='{{json .State.Health}}' geo-seo-web-dev

# Disk usage
docker system df

# Network info
docker network inspect geo-seo-network
```

### Cleanup
```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.dev.yml down -v

# Clean unused resources
docker system prune

# Clean everything (WARNING: removes all unused images)
docker system prune -a
```

## Service URLs

### Development
- Web App: http://localhost:3000
- PgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production
- Web App: http://localhost:3000 (or via Nginx)
- Nginx: http://localhost:80, https://localhost:443
- PostgreSQL: Internal only
- Redis: Internal only

## Default Credentials

### Development

**PgAdmin:**
- Email: `admin@geoseo.local`
- Password: `admin`

**PostgreSQL:**
- User: `geoseo`
- Password: `dev_password_change_me`
- Database: `geo_seo_db`

**Redis:**
- Password: `dev_redis_password`

### Production
Set in `.env.docker` file

## Environment Files

### Development
- Uses defaults in `docker-compose.dev.yml`
- No additional config needed

### Production
1. Copy template: `cp .env.docker.example .env.docker`
2. Edit with production values
3. Never commit `.env.docker` to git

## Health Checks

```bash
# Web app
curl http://localhost:3000/api/health

# PostgreSQL
docker exec geo-seo-postgres-dev pg_isready -U geoseo

# Redis
docker exec geo-seo-redis-dev redis-cli ping
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Kill process or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs web-app

# Check health
docker inspect geo-seo-web-dev

# Remove and recreate
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.dev.yml ps postgres

# Check health
docker exec geo-seo-postgres-dev pg_isready

# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres
```

### Out of Disk Space
```bash
# Check usage
docker system df

# Clean up
docker system prune -a

# Remove old images
docker image prune -a

# Remove volumes (WARNING: deletes data)
docker volume prune
```

## Best Practices

1. **Always backup before major changes**
2. **Check logs when issues occur**
3. **Use environment-specific files** (dev vs prod)
4. **Don't expose unnecessary ports** in production
5. **Keep images updated**: `docker-compose pull`
6. **Use strong passwords** in production
7. **Regular backups** of volumes
8. **Monitor resource usage**: `docker stats`

## File Structure
```
D:\GEO_SEO_Domination-Tool\
├── docker-compose.dev.yml      # Development config
├── docker-compose.prod.yml     # Production config
├── .dockerignore              # Build exclusions
├── .env.docker.example        # Environment template
├── geo-seo-domination-tool/
│   └── web-app/
│       └── Dockerfile         # Multi-stage build
├── nginx/
│   ├── nginx.conf            # Nginx config
│   ├── ssl/                  # SSL certificates
│   └── logs/                 # Nginx logs
├── scripts/
│   ├── docker-dev-start.*    # Startup scripts
│   ├── docker-prod-start.*   # Startup scripts
│   ├── docker-backup.sh      # Backup script
│   └── docker-restore.sh     # Restore script
└── backups/                   # Database backups
```

## Links
- Detailed Guide: [DOCKER_SETUP.md](DOCKER_SETUP.md)
- Main README: [README.md](README.md)
- Docker Docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
