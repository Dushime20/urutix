# Nginx Setup Guide for UrutiX SmartCargo Backend

This guide will help you set up and configure nginx as a reverse proxy for your UrutiX backend application.

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f nginx
   docker-compose logs -f backend
   ```

4. **Access your application:**
   - API: `http://localhost/api`
   - Swagger Docs: `http://localhost/api/docs`
   - Health Check: `http://localhost/api/health`

## Architecture

```
Internet → Nginx (Port 80) → Backend (Port 3000) → PostgreSQL (Port 5432)
```

Nginx acts as a reverse proxy, handling:
- Request routing
- Static file serving
- Rate limiting
- SSL/TLS termination (when configured)
- Load balancing (ready for scaling)

## Configuration Files

### Main Configuration
- `nginx/nginx.conf` - Main nginx configuration
- `nginx/Dockerfile` - Nginx container build file
- `docker-compose.yml` - Docker Compose configuration

### Example Configurations
- `nginx/nginx.ssl.conf.example` - SSL/HTTPS example configuration

## Features

### ✅ Rate Limiting
- API endpoints: 10 requests/second (burst: 20)
- File uploads: 5 requests/second (burst: 10)
- Health checks: No rate limiting

### ✅ Static File Serving
- Serves files from `/uploads/` directory
- 30-day cache expiration
- CORS enabled

### ✅ WebSocket Support
- Full Socket.IO support
- Extended timeouts for long-lived connections

### ✅ Security Headers
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### ✅ Gzip Compression
- Automatic compression for text-based responses
- Reduces bandwidth usage

## Manual Setup (Without Docker)

If you prefer to run nginx directly on your host:

### 1. Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
```

**macOS:**
```bash
brew install nginx
```

### 2. Copy Configuration

```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/urutix
sudo ln -s /etc/nginx/sites-available/urutix /etc/nginx/sites-enabled/
```

### 3. Update Configuration

Edit `/etc/nginx/sites-available/urutix` and update:

- **Backend upstream:** Change `server backend:3000;` to `server localhost:3000;`
- **Static file path:** Update `/app/uploads/` to your actual uploads directory path

### 4. Test and Reload

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Auto-renewal (already configured by certbot):**
   Certbot sets up automatic renewal via cron.

### Manual SSL Configuration

1. **Obtain SSL certificates** (from your CA or self-signed for testing)

2. **Update nginx configuration:**
   - Copy `nginx/nginx.ssl.conf.example` to `nginx/nginx.conf`
   - Update `server_name` with your domain
   - Update SSL certificate paths

3. **Mount certificates in docker-compose.yml:**
   ```yaml
   nginx:
     volumes:
       - ./ssl:/etc/nginx/ssl:ro
       # ... other volumes
   ```

## Environment Variables

Create a `.env` file in the backend directory (see `.env.example`):

```bash
NODE_ENV=production
PORT=3000
DATABASE_HOST=postgres
DATABASE_PORT=5432
# ... other variables
```

## Monitoring and Logs

### View Logs

**Docker Compose:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nginx
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 nginx
```

**Standalone Nginx:**
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Backend health
curl http://localhost/api/health

# Nginx status (if status module enabled)
curl http://localhost/nginx_status
```

## Troubleshooting

### Backend Not Reachable

1. **Check backend is running:**
   ```bash
   docker-compose ps backend
   curl http://localhost:3000/api/health
   ```

2. **Check nginx can reach backend:**
   ```bash
   docker-compose exec nginx ping backend
   ```

3. **Check nginx configuration:**
   ```bash
   docker-compose exec nginx nginx -t
   ```

### Static Files Not Serving

1. **Check uploads directory exists:**
   ```bash
   docker-compose exec nginx ls -la /app/uploads
   ```

2. **Check file permissions:**
   ```bash
   docker-compose exec nginx ls -la /app/uploads
   ```

3. **Verify mount in docker-compose.yml:**
   ```yaml
   volumes:
     - ./uploads:/app/uploads:ro
   ```

### WebSocket Issues

1. **Check upgrade headers are set:**
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
        -H "Host: localhost" -H "Origin: http://localhost" \
        http://localhost/socket.io/
   ```

2. **Verify nginx configuration includes:**
   ```nginx
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

### Rate Limiting Too Strict

Edit `nginx/nginx.conf` and adjust:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

Change `rate=10r/s` to your desired rate.

## Performance Tuning

### Worker Processes

For better performance, adjust in `nginx.conf`:
```nginx
worker_processes auto;
worker_connections 1024;
```

### Caching

Add caching for static assets:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Keep-Alive

Already configured:
```nginx
upstream backend {
    server backend:3000;
    keepalive 64;
}
```

## Scaling

### Multiple Backend Instances

Update `docker-compose.yml`:
```yaml
backend:
  deploy:
    replicas: 3
```

Update nginx upstream:
```nginx
upstream backend {
    server backend:3000;
    server backend:3001;
    server backend:3002;
    keepalive 64;
}
```

## Security Best Practices

1. ✅ **Keep nginx updated**
2. ✅ **Use HTTPS in production**
3. ✅ **Restrict access to sensitive endpoints**
4. ✅ **Monitor logs for suspicious activity**
5. ✅ **Use strong SSL/TLS configurations**
6. ✅ **Implement firewall rules**
7. ✅ **Regular security audits**

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check nginx error logs
4. Verify docker-compose configuration

