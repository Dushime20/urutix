# Production Deployment Guide for UrutiX SmartCargo Backend

This guide provides step-by-step instructions for deploying the UrutiX SmartCargo backend to a production server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- **CPU**: 2+ cores recommended
- **RAM**: 4GB+ recommended (2GB minimum)
- **Disk**: 20GB+ free space
- **Network**: Static IP address or domain name

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Git (for cloning repository)
- OpenSSL (for generating secrets)

### Install Docker & Docker Compose

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**
```bash
# Install Docker
sudo yum install -y docker docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

## Server Setup

### 1. Clone Repository

```bash
# Clone your repository
git clone <your-repository-url> urutix-backend
cd urutix-backend/urutixv2/backend
```

### 2. Create Directory Structure

```bash
# Create necessary directories
mkdir -p uploads logs data/postgres nginx/logs nginx/ssl
```

### 3. Set Permissions

```bash
# Set proper permissions
chmod 755 uploads logs
chmod 700 data/postgres
chmod +x deploy.sh  # For Linux/Mac
```

## Configuration

### 1. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.production.example .env.production
nano .env.production  # or use your preferred editor
```

**Critical Variables to Update:**

```bash
# Database - Use strong passwords!
DB_PASSWORD=your-strong-database-password-here

# JWT Secrets - Generate strong random strings
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)

# CORS - Add your frontend domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (if using)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Generate Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh token secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

### 3. SSL Certificates (Optional but Recommended)

If you have SSL certificates:

```bash
# Copy your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Set proper permissions
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
```

**Using Let's Encrypt (Recommended):**

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem
```

## Deployment

### Option 1: Using Deployment Script (Recommended)

**Linux/Mac:**
```bash
./deploy.sh production
```

**Windows (PowerShell):**
```powershell
.\deploy.ps1 production
```

### Option 2: Manual Deployment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run:linux
```

## Post-Deployment

### 1. Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Test health endpoint
curl http://localhost/api/health

# Test API
curl http://localhost/api/docs
```

### 2. Create Admin User (if needed)

```bash
docker-compose -f docker-compose.prod.yml exec backend npm run create:admin
```

### 3. Seed Initial Data (Optional)

```bash
docker-compose -f docker-compose.prod.yml exec backend npm run seed:complete
```

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Service Management

```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml stop

# Start services
docker-compose -f docker-compose.prod.yml start

# Stop and remove containers
docker-compose -f docker-compose.prod.yml down

# Stop and remove containers + volumes (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres urutix > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres urutix < backup_file.sql
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run:linux
```

## Troubleshooting

### Services Won't Start

1. **Check logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **Check Docker status:**
   ```bash
   sudo systemctl status docker
   ```

3. **Check port availability:**
   ```bash
   sudo netstat -tulpn | grep -E ':(80|443|3000|5432)'
   ```

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   ```

2. **Check environment variables:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend env | grep DB_
   ```

3. **Test connection:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run migration:run:linux
   ```

### Nginx Issues

1. **Check nginx configuration:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec nginx nginx -t
   ```

2. **Check nginx logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   tail -f nginx/logs/error.log
   ```

### Performance Issues

1. **Check resource usage:**
   ```bash
   docker stats
   ```

2. **Check disk space:**
   ```bash
   df -h
   docker system df
   ```

3. **Clean up unused resources:**
   ```bash
   docker system prune -a
   ```

## Security Best Practices

1. ✅ **Use strong passwords** for all services
2. ✅ **Enable SSL/HTTPS** in production
3. ✅ **Keep Docker updated**: `sudo apt update && sudo apt upgrade docker-ce`
4. ✅ **Use firewall**: Configure UFW or iptables
5. ✅ **Regular backups**: Automate database backups
6. ✅ **Monitor logs**: Set up log monitoring
7. ✅ **Limit access**: Use SSH keys, disable password auth
8. ✅ **Update regularly**: Keep system and Docker updated

## Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## Automated Backups

Create a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/backend && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres urutix > backups/backup_$(date +\%Y\%m\%d).sql && find backups/ -name "backup_*.sql" -mtime +7 -delete
```

## Support

For issues or questions:
1. Check logs first
2. Review this documentation
3. Check Docker and service status
4. Review environment variables

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

