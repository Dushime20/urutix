# Nginx Configuration for UrutiX SmartCargo Backend

This directory contains the nginx configuration for the UrutiX SmartCargo backend application.

## Overview

Nginx is configured as a reverse proxy in front of the NestJS backend application, providing:

- **Reverse Proxy**: Routes requests to the backend service
- **Static File Serving**: Serves uploaded files from `/uploads/` directory
- **Rate Limiting**: Protects API endpoints from abuse
- **WebSocket Support**: Handles Socket.IO connections
- **Gzip Compression**: Reduces response sizes
- **Security Headers**: Adds security headers to responses
- **Load Balancing**: Ready for multiple backend instances

## Configuration Files

- `nginx.conf`: Main nginx configuration file
- `Dockerfile`: Dockerfile for building the nginx container

## Features

### Rate Limiting

- **API Endpoints**: 10 requests per second with burst of 20
- **File Uploads**: 5 requests per second with burst of 10
- **Health Check**: No rate limiting

### Static File Serving

- Serves files from `/uploads/` directory
- 30-day cache expiration
- CORS headers enabled

### WebSocket Support

- Full Socket.IO support
- Extended timeouts for long-lived connections
- Upgrade headers properly configured

### Security

- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Request size limits (50MB for uploads)
- Proper proxy headers for real IP tracking

## Usage

### With Docker Compose

The nginx service is included in `docker-compose.yml`. To start:

```bash
docker-compose up -d
```

### Standalone Nginx

If you want to run nginx standalone (not in Docker):

1. Copy `nginx.conf` to your nginx configuration directory:
   ```bash
   sudo cp nginx/nginx.conf /etc/nginx/sites-available/urutix
   sudo ln -s /etc/nginx/sites-available/urutix /etc/nginx/sites-enabled/
   ```

2. Update the `upstream backend` section to point to your backend:
   ```nginx
   upstream backend {
       server localhost:3000;  # Change to your backend address
   }
   ```

3. Update the static file path in the `/uploads/` location block:
   ```nginx
   location /uploads/ {
       alias /path/to/your/uploads/;  # Change to your uploads path
   }
   ```

4. Test and reload nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Ports

- **80**: HTTP (nginx)
- **443**: HTTPS (if SSL is configured)
- **3000**: Backend API (internal, not exposed)

## Environment Variables

The nginx configuration uses environment variables that can be set in docker-compose.yml:

- `PORT`: Backend port (default: 3000)
- `NODE_ENV`: Environment (production/development)

## SSL/HTTPS Configuration

To enable HTTPS, you'll need to:

1. Obtain SSL certificates (Let's Encrypt, etc.)
2. Add SSL configuration to `nginx.conf`:
   ```nginx
   server {
       listen 443 ssl http2;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       # ... rest of configuration
   }
   ```

3. Add certificate volumes to docker-compose.yml

## Monitoring

Nginx logs are available in:
- Access logs: `./nginx/logs/access.log`
- Error logs: `./nginx/logs/error.log`

## Troubleshooting

### Backend not reachable

Check that:
1. Backend service is running: `docker-compose ps`
2. Backend is healthy: `docker-compose exec backend wget -qO- http://localhost:3000/api/health`
3. Network connectivity: `docker-compose exec nginx ping backend`

### Static files not serving

Check that:
1. Uploads directory is mounted: `docker-compose exec nginx ls -la /app/uploads`
2. File permissions are correct
3. Path in nginx.conf matches the mount path

### WebSocket connections failing

Check that:
1. Upgrade headers are being passed
2. Connection header is set to "upgrade"
3. Timeouts are sufficient for your use case

## Customization

### Adjust Rate Limits

Edit the `limit_req_zone` directives in `nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

### Change Upload Size Limit

Edit `client_max_body_size`:

```nginx
client_max_body_size 50M;
```

### Add Additional Locations

Add new `location` blocks as needed:

```nginx
location /custom-path/ {
    proxy_pass http://backend;
    # ... proxy settings
}
```

