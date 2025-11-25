# Quick Start Guide - UrutiX SmartCargo Backend

## 🚀 Quick Deployment

### 1. Setup Environment
```bash
cp .env.production.example .env.production
# Edit .env.production with your values
```

### 2. Deploy
```bash
# Linux/Mac
./deploy.sh production

# Windows
.\deploy.ps1 production

# Or use Makefile
make deploy
```

### 3. Verify
```bash
curl http://localhost/api/health
```

## 📋 Common Commands

### Using Makefile
```bash
make build      # Build images
make up         # Start services
make down       # Stop services
make logs       # View logs
make backup     # Backup database
make health     # Check health
```

### Using Docker Compose
```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Status
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Configuration

### Required Environment Variables
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `ALLOWED_ORIGINS` - CORS allowed origins

### Generate Secrets
```bash
openssl rand -base64 32  # For JWT secrets
```

## 📊 Service URLs

- **API**: `http://localhost/api`
- **Health**: `http://localhost/api/health`
- **Docs**: `http://localhost/api/docs`

## 🐛 Troubleshooting

### Services not starting?
```bash
docker-compose -f docker-compose.prod.yml logs
```

### Database issues?
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Check health
```bash
make health
# OR
docker-compose -f docker-compose.prod.yml ps
```

## 📚 Full Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- `DOCKERIZATION_SUMMARY.md` - What was done
- `NGINX_SETUP.md` - Nginx configuration

