# UrutiX Smart Logistics - Docker Architecture

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Users                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (443)
                             │ HTTP (80)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Nginx Reverse Proxy                           │
│                  (Optional - Production)                         │
│  - SSL/TLS Termination                                          │
│  - Load Balancing                                               │
│  - Rate Limiting                                                │
│  - Static File Caching                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                │ HTTP                    │ HTTP
                │                         │
┌───────────────▼──────────┐    ┌────────▼────────────────────────┐
│   Frontend Container     │    │     Backend Container           │
│   ==================     │    │     =================           │
│                          │    │                                 │
│   Nginx (Production)     │    │   NestJS Application            │
│   - Serves React SPA     │    │   - REST API                    │
│   - Gzip Compression     │    │   - WebSocket Server            │
│   - Security Headers     │    │   - Business Logic              │
│   - SPA Routing          │    │   - Authentication              │
│                          │    │   - File Uploads                │
│   OR                     │    │                                 │
│                          │    │   Node.js 20                    │
│   Vite Dev Server (Dev)  │    │   Port: 3005                    │
│   - Hot Module Reload    │    │                                 │
│   - Fast Refresh         │    │   Health: /api/health           │
│                          │    │                                 │
│   Port: 80 (Prod)        │    └─────────────┬───────────────────┘
│   Port: 5173 (Dev)       │                  │
│                          │                  │
└──────────────────────────┘                  │
                                              │
                                 ┌────────────┴────────────┐
                                 │                         │
                                 │                         │
                    ┌────────────▼──────────┐  ┌──────────▼──────────┐
                    │  PostgreSQL Container │  │   Redis Container   │
                    │  ==================== │  │   ===============   │
                    │                       │  │                     │
                    │  - Primary Database   │  │   - Session Store   │
                    │  - User Data          │  │   - Cache Layer     │
                    │  - Transactions       │  │   - Rate Limiting   │
                    │  - Persistent Storage │  │   - Pub/Sub         │
                    │                       │  │                     │
                    │  PostgreSQL 15        │  │   Redis 7           │
                    │  Port: 5432           │  │   Port: 6379        │
                    │                       │  │                     │
                    │  Volume: postgres_data│  │   Volume: redis_data│
                    │                       │  │                     │
                    └───────────────────────┘  └─────────────────────┘
```

## 🔄 Data Flow

### 1. User Request Flow

```
User Browser
    │
    │ 1. HTTPS Request
    ▼
Nginx (Optional)
    │
    │ 2. Proxy to Frontend
    ▼
Frontend Container (Nginx/Vite)
    │
    │ 3. Serve React App
    ▼
User Browser (React App Running)
    │
    │ 4. API Request
    ▼
Backend Container (NestJS)
    │
    ├─► 5a. Query Database ──► PostgreSQL
    │
    ├─► 5b. Check Cache ──► Redis
    │
    └─► 6. Return Response
```

### 2. WebSocket Connection Flow

```
User Browser
    │
    │ 1. WebSocket Handshake
    ▼
Nginx (Optional)
    │
    │ 2. Upgrade Connection
    ▼
Backend Container
    │
    │ 3. Socket.IO Connection
    ▼
Real-time Communication
    │
    ├─► Notifications
    ├─► Live Updates
    └─► Chat Messages
```

### 3. File Upload Flow

```
User Browser
    │
    │ 1. Upload File
    ▼
Backend Container
    │
    ├─► 2. Validate File
    │
    ├─► 3. Process (OCR, etc.)
    │
    ├─► 4. Save to Volume
    │       (backend_uploads)
    │
    └─► 5. Store Metadata ──► PostgreSQL
```

## 🌐 Network Architecture

### Development Network

```
┌─────────────────────────────────────────────────────────────┐
│                    Host Machine                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Docker Network: urutix_network_dev             │ │
│  │                  (Bridge Mode)                         │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │ │
│  │  │ Frontend │  │ Backend  │  │PostgreSQL│  │ Redis │ │ │
│  │  │  :5173   │  │  :3005   │  │  :5432   │  │ :6379 │ │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬───┘ │ │
│  │       │             │             │            │     │ │
│  │       └─────────────┴─────────────┴────────────┘     │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ Port Mapping                     │
│                           │                                  │
│  localhost:5173 ──────────┼─► Frontend                      │
│  localhost:3005 ──────────┼─► Backend                       │
│  localhost:5433 ──────────┼─► PostgreSQL                    │
│  localhost:6379 ──────────┼─► Redis                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Production Network

```
┌─────────────────────────────────────────────────────────────┐
│                    Host Machine                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Docker Network: urutix_network                 │ │
│  │              (Bridge Mode - Isolated)                  │ │
│  │              Subnet: 172.20.0.0/16                     │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │ │
│  │  │ Frontend │  │ Backend  │  │PostgreSQL│  │ Redis │ │ │
│  │  │   :80    │  │  :3005   │  │  :5432   │  │ :6379 │ │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬───┘ │ │
│  │       │             │             │            │     │ │
│  │       └─────────────┴─────────────┴────────────┘     │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ Port Mapping (Limited)           │
│                           │                                  │
│  0.0.0.0:80 ──────────────┼─► Frontend                      │
│  0.0.0.0:3005 ────────────┼─► Backend                       │
│  (PostgreSQL - Internal Only)                               │
│  (Redis - Internal Only)                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 📦 Container Details

### Frontend Container

**Base Image**: `node:18-alpine` (Dev) / `nginx:1.25-alpine` (Prod)

**Responsibilities**:
- Serve React application
- Handle client-side routing
- Proxy API requests (optional)
- Serve static assets

**Build Process**:
```
1. Install dependencies (npm ci)
2. Build React app (npm run build)
3. Copy to Nginx
4. Configure Nginx
5. Start Nginx
```

**Volumes**:
- Development: `./frontend:/app` (live code)
- Production: None (built into image)

**Environment Variables**:
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_WEBSOCKET_URL`: WebSocket URL

### Backend Container

**Base Image**: `node:20-alpine`

**Responsibilities**:
- REST API endpoints
- WebSocket server
- Business logic
- Authentication/Authorization
- Database operations
- File processing

**Build Process**:
```
1. Install dependencies (npm ci)
2. Build TypeScript (npm run build)
3. Remove dev dependencies
4. Copy to production image
5. Start application
```

**Volumes**:
- Development: `./backend:/app` (live code)
- Production: `backend_uploads:/app/uploads` (persistent files)

**Environment Variables**:
- Database connection
- Redis connection
- JWT secrets
- SMTP configuration
- API keys

### PostgreSQL Container

**Base Image**: `postgres:15-alpine`

**Responsibilities**:
- Primary data storage
- Relational data
- Transactions
- Data integrity

**Volumes**:
- `postgres_data:/var/lib/postgresql/data` (persistent)

**Initialization**:
- Runs scripts in `database/init/` on first start
- Creates extensions (uuid-ossp, pg_trgm, btree_gin)

### Redis Container

**Base Image**: `redis:7-alpine`

**Responsibilities**:
- Session storage
- Caching layer
- Rate limiting
- Pub/Sub messaging

**Volumes**:
- `redis_data:/data` (persistent)

**Configuration**:
- Max memory: 256MB
- Eviction policy: allkeys-lru
- AOF persistence enabled

## 🔐 Security Architecture

### Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                      Firewall Rules                          │
│                                                              │
│  Allow:                                                      │
│  - Port 80 (HTTP)                                           │
│  - Port 443 (HTTPS)                                         │
│                                                              │
│  Block:                                                      │
│  - Port 3005 (Backend - via reverse proxy only)            │
│  - Port 5432 (PostgreSQL - internal only)                  │
│  - Port 6379 (Redis - internal only)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Container Security

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Measures                          │
│                                                              │
│  ✓ Non-root users in all containers                        │
│  ✓ Read-only root filesystem (where possible)              │
│  ✓ No privileged containers                                │
│  ✓ Minimal base images (Alpine Linux)                      │
│  ✓ No unnecessary packages                                 │
│  ✓ Security headers configured                             │
│  ✓ Secrets via environment variables                       │
│  ✓ Network isolation                                       │
│  ✓ Health checks enabled                                   │
│  ✓ Resource limits set                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 💾 Data Persistence

### Volume Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Volumes                            │
│                                                              │
│  postgres_data                                              │
│  ├─ /var/lib/postgresql/data                               │
│  ├─ Size: ~1-10GB (grows with data)                        │
│  └─ Backup: Daily via pg_dump                              │
│                                                              │
│  redis_data                                                 │
│  ├─ /data                                                   │
│  ├─ Size: ~100MB-1GB                                        │
│  └─ Backup: AOF persistence                                │
│                                                              │
│  backend_uploads                                            │
│  ├─ /app/uploads                                            │
│  ├─ Size: Variable (user uploads)                          │
│  └─ Backup: tar.gz archives                                │
│                                                              │
│  backend_logs                                               │
│  ├─ /app/logs                                               │
│  ├─ Size: ~100MB-1GB                                        │
│  └─ Rotation: Automatic                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Deployment Flow

### Development Deployment

```
Developer
    │
    │ 1. make dev
    ▼
Docker Compose
    │
    ├─► 2. Pull base images
    │
    ├─► 3. Build containers (if needed)
    │
    ├─► 4. Start services
    │
    ├─► 5. Mount volumes (live code)
    │
    └─► 6. Enable hot reload
        │
        ▼
    Running Application
        │
        ├─► Frontend: http://localhost:5173
        ├─► Backend: http://localhost:3005
        └─► API Docs: http://localhost:3005/api/docs
```

### Production Deployment

```
CI/CD or Manual
    │
    │ 1. make prod-build
    ▼
Docker Compose
    │
    ├─► 2. Build optimized images
    │       - Multi-stage builds
    │       - Layer caching
    │       - Minimal size
    │
    ├─► 3. Start services
    │       - Health checks
    │       - Restart policies
    │       - Resource limits
    │
    ├─► 4. Run migrations
    │       - Database schema updates
    │       - Data migrations
    │
    ├─► 5. Verify deployment
    │       - Health endpoints
    │       - Smoke tests
    │
    └─► 6. Monitor
        │
        ▼
    Production Application
        │
        ├─► Frontend: https://yourdomain.com
        ├─► Backend: https://api.yourdomain.com
        └─► Monitoring: Logs, Metrics, Alerts
```

## 📊 Scaling Strategy

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                     │
└────────────┬────────────┬────────────┬────────────┬─────────┘
             │            │            │            │
    ┌────────▼───┐  ┌────▼────┐  ┌────▼────┐  ┌───▼─────┐
    │ Backend 1  │  │Backend 2│  │Backend 3│  │Backend N│
    └────────┬───┘  └────┬────┘  └────┬────┘  └───┬─────┘
             │            │            │            │
             └────────────┴────────────┴────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼──────┐
            │   PostgreSQL   │  │    Redis    │
            │   (Primary)    │  │  (Cluster)  │
            └────────────────┘  └─────────────┘
```

### Vertical Scaling

```yaml
# Increase resources per container
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 1G
```

## 🎯 Performance Optimization

### Caching Strategy

```
User Request
    │
    ▼
Backend
    │
    ├─► Check Redis Cache
    │   │
    │   ├─► Cache Hit ──► Return Cached Data
    │   │
    │   └─► Cache Miss
    │       │
    │       ├─► Query PostgreSQL
    │       │
    │       ├─► Store in Redis
    │       │
    │       └─► Return Data
    │
    └─► Response
```

### Static Asset Caching

```
User Request
    │
    ▼
Nginx
    │
    ├─► Static Files (.js, .css, images)
    │   │
    │   ├─► Cache-Control: 1 year
    │   └─► Gzip Compression
    │
    └─► Dynamic Content
        │
        └─► Cache-Control: no-cache
```

## 🔍 Monitoring Architecture

### Health Check Flow

```
Health Check System
    │
    ├─► Frontend Health
    │   └─► GET /health
    │       └─► 200 OK
    │
    ├─► Backend Health
    │   └─► GET /api/health
    │       ├─► Check Database Connection
    │       ├─► Check Redis Connection
    │       └─► 200 OK
    │
    ├─► Database Health
    │   └─► pg_isready
    │       └─► accepting connections
    │
    └─► Redis Health
        └─► redis-cli ping
            └─► PONG
```

### Logging Flow

```
Application Logs
    │
    ├─► Container stdout/stderr
    │   │
    │   └─► Docker Logging Driver
    │       │
    │       ├─► Local Files
    │       ├─► Syslog
    │       └─► External Service (optional)
    │
    └─► Application Files
        │
        └─► backend_logs volume
            │
            ├─► access.log
            ├─► error.log
            └─► application.log
```

---

## 📚 Related Documentation

- [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [DOCKER_SETUP_SUMMARY.md](./DOCKER_SETUP_SUMMARY.md) - Setup summary
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [DOCKER_README.md](./DOCKER_README.md) - Quick reference

---

**Version**: 1.0.0
**Last Updated**: 2024
