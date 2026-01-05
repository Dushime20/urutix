# 🚀 Production Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **1. Environment Configuration**

#### **Backend (.env)**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/urutix_prod
REDIS_URL=redis://user:password@host:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here-256-bits
JWT_EXPIRES_IN=24h

# API Keys
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_SPEECH_API_KEY=your-google-speech-api-key
GOOGLE_VISION_API_KEY=your-google-vision-api-key

# Payment Gateway
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=urutix-documents-prod
AWS_REGION=us-east-1

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@urutix.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Security
CORS_ORIGIN=https://app.urutix.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
```

#### **Frontend (.env.production)**
```bash
VITE_API_URL=https://api.urutix.com
VITE_WS_URL=wss://api.urutix.com
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_SENTRY_DSN=your-sentry-dsn
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_ENVIRONMENT=production
```

---

### **2. Database Setup**

```bash
# Run migrations
cd backend
npm run migration:run

# Seed essential data (if needed)
npm run seed:production

# Create database backup
pg_dump -U username urutix_prod > backup_pre_deploy.sql

# Verify database connection
npm run db:verify
```

---

### **3. Build & Test**

```bash
# Backend build
cd backend
npm run build
npm run test

# Frontend build
cd ../frontend
npm run build
npm run test

# E2E tests
npm run test:e2e
```

---

### **4. Security Hardening**

#### **Backend Security**
```typescript
// Add helmet for security headers
import helmet from 'helmet';
app.use(helmet());

// Enable CORS properly
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  maxAge: 86400
}));

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// XSS protection
import xss from 'xss-clean';
app.use(xss());

// SQL injection prevention
// Already handled by TypeORM parameterized queries
```

#### **Frontend Security**
```typescript
// CSP headers in index.html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://unpkg.com;
               style-src 'self' 'unsafe-inline' https://unpkg.com;
               img-src 'self' data: https:;
               connect-src 'self' https://api.urutix.com wss://api.urutix.com">

// Disable console in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}
```

---

### **5. Performance Optimization**

#### **Backend Optimization**
```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Database connection pooling
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  poolSize: 20,
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST,
      port: 6379
    }
  }
});

// API response caching
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 });
```

#### **Frontend Optimization**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'charts': ['recharts'],
          'maps': ['leaflet', 'react-leaflet']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});

// Enable lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CargoDashboard = lazy(() => import('./components/CargoDashboard/CargoDashboard'));
```

---

### **6. Monitoring Setup**

#### **Sentry Integration**
```typescript
// Backend
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1
});

// Frontend
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1
});
```

#### **New Relic Setup**
```javascript
// newrelic.js
exports.config = {
  app_name: ['Urutix Production'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  }
};
```

---

## 🌐 **Deployment Steps**

### **Option 1: Docker Deployment**

```bash
# Build Docker images
docker build -t urutix-backend:latest ./backend
docker build -t urutix-frontend:latest ./frontend

# Push to registry
docker push yourusername/urutix-backend:latest
docker push yourusername/urutix-frontend:latest

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  backend:
    image: yourusername/urutix-backend:latest
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis

  frontend:
    image: yourusername/urutix-frontend:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl

  postgres:
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_DB=urutix_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

### **Option 2: AWS Deployment**

#### **Backend on AWS ECS**
```bash
# Create ECR repositories
aws ecr create-repository --repository-name urutix-backend

# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t urutix-backend .
docker tag urutix-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/urutix-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/urutix-backend:latest

# Create ECS task definition and service
aws ecs create-service --cluster urutix-prod --service-name backend --task-definition urutix-backend --desired-count 2
```

#### **Frontend on AWS S3 + CloudFront**
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://urutix-frontend-prod/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

### **Option 3: Heroku Deployment**

```bash
# Backend
cd backend
heroku create urutix-backend-prod
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main

# Frontend
cd frontend
npm run build
heroku create urutix-frontend-prod
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static
git push heroku main
```

---

### **Option 4: DigitalOcean App Platform**

```yaml
# .do/app.yaml
name: urutix-production

services:
  - name: backend
    github:
      repo: your-org/urutix
      branch: main
      deploy_on_push: true
    build_command: cd backend && npm run build
    run_command: cd backend && npm start
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: professional-xs
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}

  - name: frontend
    github:
      repo: your-org/urutix
      branch: main
      deploy_on_push: true
    build_command: cd frontend && npm run build
    routes:
      - path: /
    static_sites:
      - name: frontend
        build_command: npm run build
        output_dir: dist

databases:
  - name: db
    engine: PG
    version: "15"
    size: db-s-1vcpu-1gb
    num_nodes: 1
```

---

## 🔐 **SSL Certificate Setup**

### **Using Let's Encrypt (Free)**
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d app.urutix.com -d api.urutix.com

# Auto-renewal
sudo certbot renew --dry-run
```

### **Nginx Configuration**
```nginx
server {
    listen 443 ssl http2;
    server_name app.urutix.com;

    ssl_certificate /etc/letsencrypt/live/app.urutix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.urutix.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /var/www/urutix-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name app.urutix.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 **Post-Deployment Monitoring**

### **Health Checks**
```bash
# Backend health endpoint
curl https://api.urutix.com/health

# Frontend availability
curl -I https://app.urutix.com

# Database connection
npm run db:health

# Redis connection
redis-cli -h your-redis-host ping
```

### **Monitoring Dashboards**
1. **Sentry** - Error tracking and performance monitoring
2. **New Relic** - APM and infrastructure monitoring
3. **Datadog** (optional) - Full-stack observability
4. **AWS CloudWatch** (if on AWS) - Logs and metrics

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t urutix-backend:${{ github.sha }} ./backend
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push urutix-backend:${{ github.sha }}
      
      - name: Deploy to production
        run: |
          # Your deployment script here

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'frontend/dist'
```

---

## 🚨 **Rollback Plan**

### **Quick Rollback**
```bash
# Backend rollback
docker tag urutix-backend:previous urutix-backend:latest
kubectl rollout undo deployment/backend

# Frontend rollback
aws s3 sync s3://urutix-frontend-backup/ s3://urutix-frontend-prod/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Database rollback
psql urutix_prod < backup_pre_deploy.sql
```

---

## 📱 **Mobile App Deployment**

### **PWA Update**
```bash
# Update service worker version
# In service-worker.js
const CACHE_VERSION = 'v2.0.0';

# Users will auto-update on next visit
```

---

## 📝 **Post-Deployment Tasks**

### **Week 1: Monitoring**
- [ ] Check error rates in Sentry
- [ ] Monitor API response times
- [ ] Review database performance
- [ ] Check server resources usage
- [ ] Monitor user feedback

### **Week 2: Optimization**
- [ ] Analyze slow API endpoints
- [ ] Optimize database queries
- [ ] Review CloudFront cache hit rate
- [ ] Check CDN performance
- [ ] Tune server configurations

### **Month 1: Analysis**
- [ ] Review analytics data
- [ ] Analyze user behavior
- [ ] Check conversion rates
- [ ] Monitor cost metrics
- [ ] Plan improvements

---

## 🎯 **Success Criteria**

### **Technical Metrics**
- ✅ API response time < 200ms (p95)
- ✅ Frontend load time < 2 seconds
- ✅ Error rate < 0.1%
- ✅ Uptime > 99.9%
- ✅ Database query time < 50ms (p95)

### **Business Metrics**
- ✅ User satisfaction > 4.5/5
- ✅ Feature adoption > 70%
- ✅ Task completion rate > 90%
- ✅ Support tickets < 10/day
- ✅ User retention > 85%

---

## 📞 **Emergency Contacts**

```
DevOps Lead: devops@urutix.com
Backend Lead: backend@urutix.com
Frontend Lead: frontend@urutix.com
Database Admin: dba@urutix.com
24/7 On-Call: +1-XXX-XXX-XXXX
```

---

## 🎉 **Deployment Complete!**

**Next Steps:**
1. ✅ Verify all health checks pass
2. ✅ Test critical user flows
3. ✅ Monitor error rates for 24 hours
4. ✅ Announce to users
5. ✅ Celebrate! 🎊

**Estimated Deployment Time**: 2-4 hours  
**Estimated Monitoring Time**: 48 hours  
**Recommended Team Size**: 3-5 engineers

**Good luck with your deployment!** 🚀

