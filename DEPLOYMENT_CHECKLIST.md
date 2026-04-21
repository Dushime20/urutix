# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Set strong `DB_PASSWORD` (min 32 characters)
- [ ] Set strong `REDIS_PASSWORD` (min 32 characters)
- [ ] Generate `JWT_SECRET` with `openssl rand -base64 32`
- [ ] Generate `JWT_REFRESH_SECRET` with `openssl rand -base64 32`
- [ ] Configure `ALLOWED_ORIGINS` with production domains
- [ ] Set `VITE_API_BASE_URL` to production API URL
- [ ] Set `VITE_WEBSOCKET_URL` to production WebSocket URL
- [ ] Configure SMTP credentials
- [ ] Configure Mobile Money API credentials
- [ ] Set `FRONTEND_URL` to production domain

### 2. SSL/TLS Certificates
- [ ] Obtain SSL certificates (Let's Encrypt recommended)
- [ ] Place certificates in `nginx/ssl/` directory
- [ ] Update certificate paths in `nginx/nginx.conf`
- [ ] Test SSL configuration

### 3. Server Preparation
- [ ] Install Docker (version 20.10+)
- [ ] Install Docker Compose (version 2.0+)
- [ ] Configure firewall rules
  - [ ] Allow port 80 (HTTP)
  - [ ] Allow port 443 (HTTPS)
  - [ ] Block direct access to 3005, 5432, 6379
- [ ] Set up backup storage
- [ ] Configure monitoring tools

### 4. Code Review
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No sensitive data in code
- [ ] Dependencies updated
- [ ] Security vulnerabilities addressed

## Deployment Steps

### 1. Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd <project-directory>

# Configure environment
cp .env.production.example .env.production
nano .env.production
```

### 2. Build and Start Services
```bash
# Build images
make prod-build

# Verify containers are running
make ps
```

### 3. Database Setup
```bash
# Run migrations
make migrate

# Seed initial data (if needed)
make seed

# Verify database
make db-shell
# Run: \dt to list tables
# Run: SELECT COUNT(*) FROM users;
```

### 4. Verification
- [ ] Backend health check: `curl http://localhost:3005/api/health`
- [ ] Frontend accessible: `curl http://localhost:80/health`
- [ ] API documentation: `http://localhost:3005/api/docs`
- [ ] WebSocket connection working
- [ ] File uploads working
- [ ] Email sending working
- [ ] Database queries working
- [ ] Redis caching working

### 5. SSL Configuration (if using Nginx)
```bash
# Start with Nginx reverse proxy
make prod-nginx

# Verify SSL
curl https://yourdomain.com/health
```

### 6. Monitoring Setup
- [ ] Configure log rotation
- [ ] Set up health check monitoring
- [ ] Configure alerting
- [ ] Set up backup automation

## Post-Deployment

### 1. Immediate Checks (First Hour)
- [ ] Monitor logs: `make prod-logs`
- [ ] Check resource usage: `make stats`
- [ ] Test critical user flows
- [ ] Verify email notifications
- [ ] Test payment integration
- [ ] Check WebSocket connections

### 2. First Day Monitoring
- [ ] Review error logs
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Verify backup completion
- [ ] Test disaster recovery

### 3. First Week Tasks
- [ ] Performance optimization
- [ ] Security audit
- [ ] User feedback collection
- [ ] Documentation updates

## Backup Strategy

### Automated Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/project && make db-backup

# Weekly full backup
0 3 * * 0 cd /path/to/project && tar -czf backup_$(date +%Y%m%d).tar.gz .
```

### Manual Backup
```bash
# Database backup
make db-backup

# Full system backup
tar -czf backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  .
```

## Rollback Plan

### If Deployment Fails

1. **Stop new services**
   ```bash
   make prod-down
   ```

2. **Restore database backup**
   ```bash
   make db-restore
   # Select most recent backup
   ```

3. **Revert to previous version**
   ```bash
   git checkout <previous-commit>
   make prod-build
   ```

4. **Verify rollback**
   ```bash
   make ps
   make prod-logs
   ```

## Security Checklist

### Application Security
- [ ] All secrets in environment variables
- [ ] No hardcoded credentials
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

### Infrastructure Security
- [ ] Firewall configured
- [ ] SSL/TLS enabled
- [ ] Database not publicly accessible
- [ ] Redis not publicly accessible
- [ ] Containers run as non-root
- [ ] Security headers configured
- [ ] Regular security updates

### Access Control
- [ ] Strong passwords enforced
- [ ] SSH key-based authentication
- [ ] Limited sudo access
- [ ] Audit logging enabled
- [ ] Regular access reviews

## Monitoring Checklist

### Metrics to Monitor
- [ ] CPU usage
- [ ] Memory usage
- [ ] Disk space
- [ ] Network traffic
- [ ] Response times
- [ ] Error rates
- [ ] Database connections
- [ ] Cache hit rates

### Alerts to Configure
- [ ] Service down
- [ ] High error rate
- [ ] High response time
- [ ] Low disk space
- [ ] High memory usage
- [ ] Database connection failures
- [ ] SSL certificate expiration

## Maintenance Schedule

### Daily
- [ ] Check logs for errors
- [ ] Verify backups completed
- [ ] Monitor resource usage

### Weekly
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Test backup restoration
- [ ] Review error patterns

### Monthly
- [ ] Update dependencies
- [ ] Rotate secrets
- [ ] Security audit
- [ ] Performance optimization
- [ ] Clean up old backups
- [ ] Review and update documentation

### Quarterly
- [ ] Disaster recovery drill
- [ ] Capacity planning review
- [ ] Security penetration testing
- [ ] Architecture review

## Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Backend Lead**: [Contact Info]
- **Frontend Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: [Contact Info]

## Useful Commands

```bash
# View logs
make prod-logs

# Restart services
make restart

# Check status
make ps

# Database backup
make db-backup

# Database restore
make db-restore

# Container stats
make stats

# Clean up
make prune
```

## Documentation Links

- [Docker Deployment Guide](./DOCKER_DEPLOYMENT_GUIDE.md)
- [API Documentation](http://localhost:3005/api/docs)
- [Architecture Documentation](./docs/)
- [Security Guidelines](./SECURITY.md)

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Notes**: _______________
