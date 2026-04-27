# UrutiX Smart Logistics - Docker Deployment Guide

## 📋 Table of Contents

1. [🚀 SIMPLE DEPLOYMENT (Start Here!)](#-simple-deployment-start-here)
2. [Overview](#overview)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Quick Start](#quick-start)
6. [Development Setup](#development-setup)
7. [Production Deployment](#production-deployment)
8. [Configuration](#configuration)
9. [Database Management](#database-management)
10. [Monitoring & Logs](#monitoring--logs)
11. [Troubleshooting](#troubleshooting)
12. [Security Best Practices](#security-best-practices)

---

## 🚀 SIMPLE DEPLOYMENT (Start Here!)

### Complete Deployment with Your Local Database - Copy & Paste Commands

This is the **simplest way** to deploy your project with your existing local database.

---

### 📍 PART 1: ON YOUR LOCAL MACHINE (Windows)

#### Step 1: Dump Your Local Database

```bash
# Open Command Prompt or PowerShell on your Windows machine
# Navigate to PostgreSQL bin directory (adjust path if needed)
cd "C:\Program Files\PostgreSQL\15\bin"

# Dump your database
pg_dump -U postgres -d urutix -f C:\Users\YourUsername\Desktop\urutix_dump.sql

# Enter your PostgreSQL password when prompted
```

**Alternative if using Docker locally:**
```bash
docker exec -t your_local_postgres_container pg_dump -U postgres -d urutix > urutix_dump.sql
```

#### Step 2: Transfer Database to Server

```bash
# Using SCP (from Command Prompt or PowerShell)
scp C:\Users\YourUsername\Desktop\urutix_dump.sql root@38.242.224.199:/root/

# Enter server password when prompted
```

**Alternative using WinSCP or FileZilla:**
- Download WinSCP: https://winscp.net/
- Connect to: 38.242.224.199
- Username: root
- Upload `urutix_dump.sql` to `/root/` directory

---

### 📍 PART 2: ON THE SERVER

#### Step 3: Connect to Server

```bash
# From your local machine
ssh root@38.242.224.199

# Enter password when prompted
```

#### Step 4: Clone Project

```bash
# Navigate to root directory
cd /root

# Clone repository
git clone https://github.com/Dushime20/urutix.git urutix-smart-logistics

# Enter project directory
cd urutix-smart-logistics

# Checkout the correct branch
git checkout merge-superdashboard-into-dev

# Pull latest changes
git pull origin merge-superdashboard-into-dev

# Verify you're in the right place
pwd
# Should show: /root/urutix-smart-logistics
```

#### Step 5: Configure Environment Variables

```bash
# Copy example file
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Edit these values in nano:**

```env
# Change these 4 values (REQUIRED):
DB_PASSWORD=YourSecurePassword123!@#
JWT_SECRET=your_random_32_character_string_here_12345
JWT_REFRESH_SECRET=another_random_32_character_string_67890
REDIS_PASSWORD=YourRedisPassword456!@#

# Keep these as-is (already correct):
DB_USERNAME=postgres
DB_NAME=urutix
DB_PORT=5432
BACKEND_PORT=3005
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://38.242.224.199:3005/api
VITE_WEBSOCKET_URL=ws://38.242.224.199:3005
ALLOWED_ORIGINS=http://38.242.224.199:5173,http://38.242.224.199
FRONTEND_URL=http://38.242.224.199:5173
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

**Generate secure passwords (optional but recommended):**
```bash
# Generate random passwords
openssl rand -base64 32
# Copy output and use for DB_PASSWORD

openssl rand -base64 32
# Copy output and use for JWT_SECRET

openssl rand -base64 32
# Copy output and use for JWT_REFRESH_SECRET

openssl rand -base64 32
# Copy output and use for REDIS_PASSWORD
```

#### Step 6: Build Docker Images

```bash
# Build all images (takes 5-10 minutes)
docker-compose -f docker-compose.production.yml build --no-cache

# You'll see output like:
# Building backend...
# Building frontend...
# Successfully built...
```

#### Step 7: Start All Services

```bash
# Start all containers
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready (30 seconds)
echo "Waiting for services to start..."
sleep 30

# Check all containers are running
docker-compose -f docker-compose.production.yml ps

# You should see all services "Up" and "healthy"
```

#### Step 8: Load Your Database

```bash
# Restore your local database dump
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres -d urutix < /root/urutix_dump.sql

# This will take a few minutes depending on database size
# You'll see lots of output like:
# SET
# CREATE TABLE
# ALTER TABLE
# COPY 100
# ...
```

#### Step 9: Verify Database

```bash
# Check tables were created
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "\dt"

# Check user count (example)
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT COUNT(*) FROM users;"
```

#### Step 10: Restart Backend

```bash
# Restart backend to connect to database
docker-compose -f docker-compose.production.yml restart backend

# Wait a few seconds
sleep 5

# Check backend logs
docker-compose -f docker-compose.production.yml logs --tail=50 backend
```

#### Step 11: Verify Deployment

```bash
# Test backend health
curl http://localhost:3005/api/health

# Expected output: {"status":"ok",...}

# Test frontend
curl http://localhost:5173

# Should return HTML
```

#### Step 12: Configure Firewall

```bash
# Allow frontend port
ufw allow 5173/tcp

# Allow backend API
ufw allow 3005/tcp

# Allow HTTP traffic (for future nginx reverse proxy)
ufw allow 80/tcp

# Allow HTTPS traffic (for future SSL setup)
ufw allow 443/tcp

# DO NOT expose database and Redis ports publicly
# These should only be accessible within Docker network

# Enable firewall
ufw enable

# Check status
ufw status

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 5173/tcp                   ALLOW       Anywhere
# 3005/tcp                   ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

---

### ✅ DEPLOYMENT COMPLETE!

Your application is now live at:

- **Frontend**: http://38.242.224.199:5173
- **Backend API**: http://38.242.224.199:3005/api
- **API Docs**: http://38.242.224.199:3005/api/docs

---

### 🔄 To Update Later (Pull New Code)

```bash
# Connect to server
ssh root@38.242.224.199
cd /root/urutix-smart-logistics

# Pull latest changes
git pull origin merge-superdashboard-into-dev

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Restart backend
docker-compose -f docker-compose.production.yml restart backend
```

---

### 🆘 Quick Troubleshooting

**Container not starting?**
```bash
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
```

**Database connection error?**
```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres
```

**Frontend can't connect to backend?**
```bash
# Check VITE_API_BASE_URL in .env.production
grep VITE_API_BASE_URL .env.production

# Should be: http://38.242.224.199:3005/api
```

**Need to restart everything?**
```bash
docker-compose -f docker-compose.production.yml restart
```

---

## 🎯 Overview

This Docker setup provides a complete containerized environment for the UrutiX Smart Logistics platform, including:

- **Backend**: NestJS application (Node.js 20)
- **Frontend**: React + Vite application (Node.js 18)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Web Server**: Nginx (for production)

---

## 🚀 Quick Start - Manual Commands

> **📌 For complete manual commands reference, see [MANUAL_DEPLOYMENT_COMMANDS.md](./MANUAL_DEPLOYMENT_COMMANDS.md)**

### First Time Deployment (Copy & Paste)

```bash
# 1. Connect and clone
ssh root@38.242.224.199
cd /root
git clone https://github.com/your-username/urutix-smart-logistics.git
cd urutix-smart-logistics

# 2. Configure
cp .env.production.example .env.production
nano .env.production  # Edit values, save with Ctrl+X, Y, Enter

# 3. Deploy
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
sleep 30
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# 4. Verify
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3005/api/health
```

### Update Deployment (Pull New Changes)

```bash
# 1. Connect and navigate
ssh root@38.242.224.199
cd /root/urutix-smart-logistics

# 2. Update
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

### Daily Operations

```bash
# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f backend

# Restart
docker-compose -f docker-compose.production.yml restart

# Backup database
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix > backup_$(date +%Y%m%d).sql
```

---

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Optional)                      │
│              Reverse Proxy + SSL Termination            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│    Frontend    │      │     Backend     │
│  React + Vite  │      │     NestJS      │
│   (Port 80)    │      │   (Port 3005)   │
└────────────────┘      └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐      ┌────────▼────────┐
            │   PostgreSQL   │      │      Redis      │
            │  (Port 5432)   │      │   (Port 6379)   │
            └────────────────┘      └─────────────────┘
```

---

## 📦 Prerequisites

### Required Software

1. **Docker** (version 20.10 or higher)
   ```bash
   docker --version
   ```

2. **Docker Compose** (version 2.0 or higher)
   ```bash
   docker-compose --version
   ```

### System Requirements

- **Minimum**: 4GB RAM, 2 CPU cores, 20GB disk space
- **Recommended**: 8GB RAM, 4 CPU cores, 50GB disk space

---

## 📁 Project Structure

```
.
├── backend/
│   ├── Dockerfile              # Production backend image
│   ├── Dockerfile.dev          # Development backend image
│   ├── .dockerignore           # Backend Docker ignore
│   └── src/                    # Backend source code
├── frontend/
│   ├── Dockerfile              # Production frontend image
│   ├── Dockerfile.dev          # Development frontend image
│   ├── nginx.conf              # Frontend Nginx config
│   ├── .dockerignore           # Frontend Docker ignore
│   └── src/                    # Frontend source code
├── nginx/
│   └── nginx.conf              # Main reverse proxy config
├── docker-compose.dev.yml      # Development environment
├── docker-compose.production.yml # Production environment
├── .env.production.example     # Production env template
├── Makefile                    # Convenience commands
└── DOCKER_DEPLOYMENT_GUIDE.md  # This file
```

---

## 🚀 Quick Start

### Development Environment

```bash
# 1. Start all services with hot reload
make dev

# OR using docker-compose directly
docker-compose -f docker-compose.dev.yml up

# 2. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3005/api
# API Docs: http://localhost:3005/api/docs
```

### Production Environment

```bash
# 1. Copy and configure environment variables
cp .env.production.example .env.production

# 2. Edit .env.production with your values
nano .env.production

# 3. Build and start production services
make prod-build

# OR using docker-compose directly
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🛠️ Development Setup

### Starting Development Environment

```bash
# Start all services
make dev

# Start with rebuild
make dev-build

# View logs
make dev-logs

# Stop services
make dev-down
```

### Development Features

- **Hot Reload**: Both frontend and backend support hot module replacement
- **Volume Mapping**: Source code is mounted for instant updates
- **Debug Ports**: All ports exposed for debugging
- **Development Dependencies**: Includes all dev tools

### Accessing Services

| Service    | URL                              | Credentials          |
|------------|----------------------------------|----------------------|
| Frontend   | http://localhost:5173            | -                    |
| Backend    | http://localhost:3005/api        | -                    |
| API Docs   | http://localhost:3005/api/docs   | -                    |
| PostgreSQL | localhost:5433                   | postgres/1234        |
| Redis      | localhost:6379                   | (no password)        |

### Running Commands in Containers

```bash
# Backend shell
docker-compose -f docker-compose.dev.yml exec backend sh

# Frontend shell
docker-compose -f docker-compose.dev.yml exec frontend sh

# Database shell
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix

# Run migrations
docker-compose -f docker-compose.dev.yml exec backend npm run migration:run

# Seed database
docker-compose -f docker-compose.dev.yml exec backend npm run seed:all
```

---

## 🚢 Production Deployment

### Complete Deployment from GitHub to Live (Step-by-Step)

This section provides **exact commands** to deploy from a fresh server to a fully running application.

---

### Prerequisites Check

Before starting, ensure you have:

```bash
# Check Docker installation
docker --version
# Should show: Docker version 20.10.0 or higher

# Check Docker Compose installation
docker-compose --version
# Should show: Docker Compose version 2.0.0 or higher

# Check Git installation
git --version
# Should show: git version 2.0.0 or higher
```

If any are missing, install them first:

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get update
sudo apt-get install git -y

# Log out and back in for Docker group to take effect
```

---

### Step 1: Clone Repository from GitHub

```bash
# Navigate to your desired directory
# Connect to server
ssh root@38.242.224.199

# Navigate to root home directory
cd /root

# Clone repository (first time only)
git clone https://github.com/Dushime20/urutix.git urutix-smart-logistics

# Enter project directory
cd /root/urutix-smart-logistics

# Checkout correct branch
git checkout merge-superdashboard-into-dev

# Pull latest changes
git pull origin merge-superdashboard-into-dev
# ⚠️ IMPORTANT: All commands below are run from this root directory
# DO NOT cd into backend/ or frontend/ folders
# Docker Compose handles everything from the root

# Verify you're on the correct branch
git branch
# Should show: * main (or your production branch)

# If you need to switch branches
git checkout main

# Pull latest changes
git pull origin main

# Verify files are present
ls -la
# You should see: backend/, frontend/, docker-compose.production.yml, Makefile, etc.

# Confirm you're in the root directory
pwd
# Should show: /home/your-username/urutix-smart-logistics
```

---

### Step 2: Configure Environment Variables

```bash
# ⚠️ IMPORTANT: You should still be in the root directory (urutix-smart-logistics)
# Verify your location
pwd
# Should show: /home/your-username/urutix-smart-logistics

# Copy the production environment template (from root directory)
cp .env.production.example .env.production

# Edit the environment file (still in root directory)
nano .env.production
```

**Required Configuration** - Update these values:

```env
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE_MIN_32_CHARS
DB_NAME=urutix
DB_PORT=5432

# Redis Configuration
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE_MIN_32_CHARS
REDIS_DB=0
REDIS_TLS=false
REDIS_PORT=6379

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_JWT_SECRET_HERE_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET_HERE_MIN_32_CHARS

# Backend Configuration
BACKEND_PORT=3005
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://38.242.224.199:3005/api
VITE_WEBSOCKET_URL=ws://38.242.224.199:3005

# CORS Configuration (comma-separated, no spaces)
ALLOWED_ORIGINS=http://38.242.224.199:5173,http://38.242.224.199,http://localhost:5173

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_SECURE=true

# Mobile Money API (if applicable)
MOBILE_MONEY_API_URL=https://api.payment.ishema.rw
MOBILE_MONEY_API_KEY=your_api_key_here
MOBILE_MONEY_CALLBACK_URL=http://38.242.224.199:3005/api/payments/webhooks/mobile-money
MOBILE_MONEY_CURRENCY=RWF
MOBILE_MONEY_ACCOUNT_PHONE=250788309463

# Frontend URL
FRONTEND_URL=http://38.242.224.199:5173
```

**Generate Secure Secrets:**

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32

# Generate DB_PASSWORD
openssl rand -base64 32

# Generate REDIS_PASSWORD
openssl rand -base64 32
```

**Save and exit nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**Verify configuration:**

```bash
# Check that file was created
ls -la .env.production

# Verify it contains your values (be careful not to expose secrets)
grep "DB_PASSWORD" .env.production
# Should show: DB_PASSWORD=your_password (not empty)
```

---

### Step 3: Build Docker Images

```bash
# ⚠️ IMPORTANT: Still in root directory (urutix-smart-logistics)
# Docker Compose will automatically find backend/Dockerfile and frontend/Dockerfile

# Build all Docker images (this will take 5-10 minutes)
docker-compose -f docker-compose.production.yml build --no-cache

# Expected output:
# Building backend...
# Step 1/15 : FROM node:20-alpine AS builder
# ...
# Building frontend...
# Step 1/12 : FROM node:18-alpine AS builder
# ...
# Successfully built...

# Note: Docker Compose reads docker-compose.production.yml which specifies:
# - backend: build context is ./backend (so it uses backend/Dockerfile)
# - frontend: build context is ./frontend (so it uses frontend/Dockerfile)
# You never need to cd into those directories!
```

**Monitor the build process:**

```bash
# If build fails, check for errors in the output
# Common issues:
# - Missing files: Ensure you're in the project root
# - Network issues: Check internet connection
# - Disk space: Ensure you have at least 10GB free
```

**Verify images were created:**

```bash
# List Docker images
docker images | grep urutix

# You should see:
# urutix-backend    latest    ...
# urutix-frontend   latest    ...
```

---

### Step 4: Start All Services

```bash
# Start all services in detached mode
docker-compose -f docker-compose.production.yml up -d

# Expected output:
# Creating network "urutix_network" ... done
# Creating volume "urutix_postgres_data" ... done
# Creating volume "urutix_redis_data" ... done
# Creating urutix_postgres ... done
# Creating urutix_redis ... done
# Creating urutix_backend ... done
# Creating urutix_frontend ... done
```

**Verify all containers are running:**

```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# All services should show "Up" status:
# NAME              STATUS
# urutix_postgres   Up (healthy)
# urutix_redis      Up (healthy)
# urutix_backend    Up (healthy)
# urutix_frontend   Up (healthy)
```

**If any container is not running:**

```bash
# Check logs for the specific service
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
docker-compose -f docker-compose.production.yml logs postgres
docker-compose -f docker-compose.production.yml logs redis
```

---

### Step 5: Wait for Services to Be Ready

```bash
# Wait for database to be ready (30-60 seconds)
echo "Waiting for database to be ready..."
sleep 30

# Check database health
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U postgres -d urutix

# Expected output: 
# /var/run/postgresql:5432 - accepting connections

# Check Redis health
docker-compose -f docker-compose.production.yml exec redis redis-cli ping

# Expected output:
# PONG

# Check backend health
curl http://localhost:3005/api/health

# Expected output:
# {"status":"ok","timestamp":"..."}

# Check frontend health
curl http://localhost:5173/health

# Expected output:
# healthy
```

---

### Step 6: Setup Database (Choose ONE Option)

You have **TWO OPTIONS** for setting up your database:

---

#### **OPTION A: Use Your Local Database (Recommended if you have existing data)**

If you want to use your local database with all existing data:

##### Step 6A.1: Dump Your Local Database (On LOCAL Machine)

```bash
# On your LOCAL machine (Windows)

# Option 1: If PostgreSQL is installed locally
pg_dump -U postgres -d urutix -F c -b -v -f urutix_local_dump.backup

# Option 2: If using Docker locally
docker exec -t your_local_postgres_container pg_dump -U postgres -d urutix -F c -b -v > urutix_local_dump.backup

# Option 3: Plain SQL format (easier to inspect/edit)
pg_dump -U postgres -d urutix --clean --if-exists -f urutix_local_dump.sql
```

##### Step 6A.2: Transfer Dump to Server (On LOCAL Machine)

```bash
# Using SCP (Secure Copy)
scp urutix_local_dump.backup root@38.242.224.199:/root/urutix-smart-logistics/

# OR if you used SQL format
scp urutix_local_dump.sql root@38.242.224.199:/root/urutix-smart-logistics/

# Verify file was transferred
ssh root@38.242.224.199 "ls -lh /root/urutix-smart-logistics/urutix_local_dump.*"
```

##### Step 6A.3: Restore Database on Server (On SERVER)

```bash
# On the SERVER (you should already be SSH'd in)
cd /root/urutix-smart-logistics

# Verify database is running
docker-compose -f docker-compose.production.yml ps postgres

# Option 1: Restore from custom format backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_restore -U postgres -d urutix --clean --if-exists -v < urutix_local_dump.backup

# Option 2: Restore from SQL file
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres -d urutix < urutix_local_dump.sql

# Expected output:
# SET
# SET
# CREATE TABLE
# ALTER TABLE
# COPY 100
# ...
# (lots of SQL statements)
```

##### Step 6A.4: Verify Database Restoration

```bash
# Check table count
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# List all tables
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "\dt"

# Check user count (example)
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT COUNT(*) FROM users;"

# Verify migrations table exists
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
```

**✅ If using Option A, SKIP to Step 7**

---

#### **OPTION B: Fresh Database with Migrations (For new deployment)**

If you want to start with a fresh database:

##### Step 6B.1: Run Database Migrations

```bash
# Run database migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Expected output:
# query: SELECT * FROM "migrations" ...
# 0 migrations are already loaded in the database.
# X migrations were found in the source code.
# X migrations are new migrations that needs to be executed.
# Migration ... has been executed successfully.
# ...
# Migration completed successfully
```

**If migrations fail:**

```bash
# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Common issues:
# - Database not ready: Wait longer and retry
# - Connection refused: Check DB_HOST in .env.production (should be "postgres")
# - Authentication failed: Check DB_PASSWORD matches
```

##### Step 6B.2: Verify Migrations

```bash
# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run migration:show

# Should list all executed migrations
```

##### Step 6B.3: Seed Initial Data

```bash
# Seed database with initial data (admin users, default settings, etc.)
docker-compose -f docker-compose.production.yml exec backend npm run seed:all

# Expected output:
# Seeding database...
# Creating admin user...
# Creating default settings...
# Seeding completed successfully
```

---

### Step 7: Restart Backend Service

```bash
# Seed database with initial data (admin users, default settings, etc.)
docker-compose -f docker-compose.production.yml exec backend npm run seed:all

# Expected output:
# Seeding database...
# Creating admin user...
# Creating default settings...
# Seeding completed successfully
```

**Note:** Only run this on first deployment. Skip if database already has data.

---

### Step 8: Verify Deployment

#### 8.1 Check All Services

```bash
# Check all containers are running
docker-compose -f docker-compose.production.yml ps

# All should show "Up" and "healthy"
```

#### 8.2 Test Backend API

```bash
# Test backend health endpoint
curl http://localhost:3005/api/health

# Expected: {"status":"ok",...}

# Test API documentation (should return HTML)
curl http://localhost:3005/api/docs

# Test a sample API endpoint (should return JSON)
curl http://localhost:3005/api/users
```

#### 8.3 Test Frontend

```bash
# Test frontend health
curl http://localhost:5173/health

# Expected: healthy

# Test frontend loads (should return HTML)
curl http://localhost:5173

# Should return HTML with <div id="root">
```

#### 8.4 Test from Browser

Open your browser and navigate to:

1. **Frontend Application:**
   ```
   http://38.242.224.199:5173
   ```
   - Should load the React application
   - Check browser console for errors (F12)

2. **Backend API Documentation:**
   ```
   http://38.242.224.199:3005/api/docs
   ```
   - Should show Swagger API documentation
   - Test some endpoints

3. **Backend Health Check:**
   ```
   http://38.242.224.199:3005/api/health
   ```
   - Should return: `{"status":"ok",...}`

---

### Step 9: Configure Firewall (Important!)

```bash
# Allow frontend port
sudo ufw allow 5173/tcp

# Allow backend API
sudo ufw allow 3005/tcp

# Allow HTTP traffic (for future nginx reverse proxy)
sudo ufw allow 80/tcp

# Allow HTTPS traffic (for future SSL setup)
sudo ufw allow 443/tcp

# DO NOT expose database and Redis ports publicly
# These should only be accessible within Docker network

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 5173/tcp                   ALLOW       Anywhere
# 3005/tcp                   ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

---

### Step 10: Set Up Automated Backups

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Test backup manually
./scripts/backup.sh

# Expected output:
# [INFO] Starting backup process...
# [INFO] Backing up database...
# [INFO] Database backup created: db_backup_20240101_120000.sql.gz
# [INFO] Backing up uploaded files...
# [INFO] Uploads backup created: uploads_backup_20240101_120000.tar.gz
# [INFO] Backup completed successfully!

# Verify backup was created
ls -lh backups/

# Set up automated daily backups with cron
crontab -e

# Add this line to run backup daily at 2 AM:
0 2 * * * cd /home/$USER/urutix-smart-logistics && ./scripts/backup.sh >> /var/log/urutix-backup.log 2>&1

# Save and exit
```

---

### Step 11: Monitor Logs

```bash
# View all logs in real-time
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# View last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend

# Stop following logs: Press Ctrl+C
```

---

### Step 12: Verify Everything is Working

Run the comprehensive health check:

```bash
# Make health check script executable
chmod +x scripts/health-check.sh

# Run health check
./scripts/health-check.sh

# Expected output:
# UrutiX Smart Logistics - Health Check
# ======================================
# 
# Container Status:
# ✓ urutix_postgres is running
# ✓ urutix_redis is running
# ✓ urutix_backend is running
# ✓ urutix_frontend is running
# 
# Service Health:
# ✓ Database is ready
# ✓ Redis is ready
# ✓ Backend API is healthy
# ✓ Frontend is healthy
# 
# All services are healthy ✓
```

---

## 🎉 Deployment Complete!

Your application is now live and accessible at:

- **Frontend**: `http://38.242.224.199:5173`
- **Backend API**: `http://38.242.224.199:3005/api`
- **API Documentation**: `http://38.242.224.199:3005/api/docs`

---

## 🔄 Updating Deployment (Pull New Changes)

When you need to deploy updates from GitHub:

```bash
# 1. Navigate to project ROOT directory (if not already there)
cd /home/$USER/urutix-smart-logistics

# ⚠️ IMPORTANT: Stay in root directory for all commands below
# DO NOT cd into backend/ or frontend/

# 2. Pull latest changes from GitHub
git pull origin main

# 3. Rebuild and restart services (from root directory)
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# 4. Run new migrations (if any) - still from root directory
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# 5. Verify deployment - still from root directory
./scripts/health-check.sh

# 6. Check logs for errors - still from root directory
docker-compose -f docker-compose.production.yml logs -f
```

**Quick update without downtime (if only code changes, no dependencies):**

```bash
# Pull changes
git pull origin main

# Rebuild and restart with minimal downtime
docker-compose -f docker-compose.production.yml up -d --build

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

---

## 🚨 Troubleshooting Deployment Issues

### Issue 1: Containers Not Starting

```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# Check logs for errors
docker-compose -f docker-compose.production.yml logs

# Common fixes:
# - Port already in use: Change ports in docker-compose.production.yml
# - Out of memory: Increase Docker memory limit
# - Permission denied: Check file permissions
```

### Issue 2: Database Connection Failed

```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Test database connection
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT 1;"

# Common fixes:
# - Check DB_HOST in .env.production (should be "postgres")
# - Check DB_PASSWORD matches
# - Wait longer for database to initialize
```

### Issue 3: Frontend Can't Connect to Backend

```bash
# Check VITE_API_BASE_URL in .env.production
grep VITE_API_BASE_URL .env.production

# Should be: http://38.242.224.199:3005/api

# Check ALLOWED_ORIGINS in .env.production
grep ALLOWED_ORIGINS .env.production

# Should include your frontend URL

# Rebuild frontend with correct environment
docker-compose -f docker-compose.production.yml up -d --build frontend
```

### Issue 4: Migrations Fail

```bash
# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Check database connection
docker-compose -f docker-compose.production.yml exec backend npm run migration:show

# Reset migrations (CAUTION: Only on fresh install)
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

---

## 📊 Post-Deployment Monitoring

### Daily Checks

```bash
# Check service health
./scripts/health-check.sh

# Check disk space
df -h

# Check Docker resource usage
docker stats --no-stream

# Check logs for errors
docker-compose -f docker-compose.production.yml logs --tail=100 | grep -i error
```

### Weekly Checks

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Clean up Docker
docker system prune -f

# Verify backups
ls -lh backups/

# Test backup restoration (on staging)
./scripts/restore.sh
```

---

## 🔐 Security Hardening (Recommended)

### 1. Set Up SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot -y

# Stop services temporarily
docker-compose -f docker-compose.production.yml down

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in: /etc/letsencrypt/live/yourdomain.com/

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Update nginx/nginx.conf with SSL configuration

# Start services with Nginx
docker-compose -f docker-compose.production.yml --profile with-nginx up -d
```

### 2. Enable Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt-get install unattended-upgrades -y

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Set Up Fail2Ban

```bash
# Install Fail2Ban
sudo apt-get install fail2ban -y

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## ✅ Deployment Verification Checklist

After deployment, verify:

- [ ] All containers are running: `docker-compose -f docker-compose.production.yml ps`
- [ ] Database is accessible: `docker-compose -f docker-compose.production.yml exec postgres pg_isready`
- [ ] Redis is accessible: `docker-compose -f docker-compose.production.yml exec redis redis-cli ping`
- [ ] Backend health check passes: `curl http://localhost:3005/api/health`
- [ ] Frontend loads in browser: `http://38.242.224.199:5173`
- [ ] API documentation accessible: `http://38.242.224.199:3005/api/docs`
- [ ] Migrations completed: `docker-compose -f docker-compose.production.yml exec backend npm run migration:show`
- [ ] Logs show no errors: `docker-compose -f docker-compose.production.yml logs`
- [ ] Firewall configured: `sudo ufw status`
- [ ] Backups working: `./scripts/backup.sh`
- [ ] Health check passes: `./scripts/health-check.sh`

---

### Alternative: Using Makefile Commands

If you prefer shorter commands, use the Makefile:

```bash
# Build and start production
make prod-build

# Run migrations
make migrate

# Create backup
make db-backup

# View logs
make prod-logs

# Check status
make ps

# Run health check
./scripts/health-check.sh
```

---

### Step 1: Prepare Environment Variables (Original Content)

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

**Critical Variables to Set:**

```env
# Database
DB_PASSWORD=your_secure_database_password_here

# Redis
REDIS_PASSWORD=your_secure_redis_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_min_32_chars

# Domain Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WEBSOCKET_URL=wss://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
```

### Step 2: Build and Deploy

```bash
# Build and start all services
make prod-build

# OR with docker-compose
docker-compose -f docker-compose.production.yml up -d --build
```

### Step 3: Run Database Migrations

```bash
# Run migrations
make migrate

# OR
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

### Step 4: Seed Initial Data (Optional)

```bash
# Seed database
make seed

# OR
docker-compose -f docker-compose.production.yml exec backend npm run seed:all
```

### Step 5: Verify Deployment

```bash
# Check service status
make ps

# View logs
make prod-logs

# Check health
curl http://localhost:3005/api/health
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend Environment Variables

| Variable                    | Description                          | Default              |
|-----------------------------|--------------------------------------|----------------------|
| `NODE_ENV`                  | Environment mode                     | `production`         |
| `PORT`                      | Backend port                         | `3005`               |
| `DB_HOST`                   | Database host                        | `postgres`           |
| `DB_PORT`                   | Database port                        | `5432`               |
| `DB_USERNAME`               | Database username                    | `postgres`           |
| `DB_PASSWORD`               | Database password                    | **Required**         |
| `DB_NAME`                   | Database name                        | `urutix`             |
| `REDIS_HOST`                | Redis host                           | `redis`              |
| `REDIS_PORT`                | Redis port                           | `6379`               |
| `REDIS_PASSWORD`            | Redis password                       | (empty)              |
| `JWT_SECRET`                | JWT signing secret                   | **Required**         |
| `JWT_REFRESH_SECRET`        | JWT refresh token secret             | **Required**         |
| `ALLOWED_ORIGINS`           | CORS allowed origins (comma-sep)     | **Required**         |
| `SMTP_HOST`                 | SMTP server host                     | `smtp.gmail.com`     |
| `SMTP_PORT`                 | SMTP server port                     | `465`                |
| `SMTP_USER`                 | SMTP username                        | **Required**         |
| `SMTP_PASS`                 | SMTP password                        | **Required**         |

#### Frontend Environment Variables

| Variable                | Description                      | Default                          |
|-------------------------|----------------------------------|----------------------------------|
| `VITE_API_BASE_URL`     | Backend API URL                  | `http://localhost:3005/api`      |
| `VITE_WEBSOCKET_URL`    | WebSocket URL                    | `ws://localhost:3005`            |

### Docker Compose Profiles

The production compose file supports profiles for optional services:

```bash
# Start with Nginx reverse proxy
docker-compose -f docker-compose.production.yml --profile with-nginx up -d
```

---

## 🗄️ Database Management

### Dump Local Database and Use on Server

If you want to use your local database on the production server, follow these steps:

#### Step 1: Dump Your Local Database

```bash
# On your LOCAL machine (Windows with PostgreSQL installed)

# Option 1: If you have PostgreSQL installed locally
pg_dump -U postgres -d urutix -F c -b -v -f urutix_local_dump.backup

# Option 2: If using Docker locally
docker exec -t your_local_postgres_container pg_dump -U postgres -d urutix -F c -b -v > urutix_local_dump.backup

# Option 3: Plain SQL format (easier to edit if needed)
pg_dump -U postgres -d urutix --clean --if-exists -f urutix_local_dump.sql

# Option 4: Docker with plain SQL
docker exec -t your_local_postgres_container pg_dump -U postgres -d urutix --clean --if-exists > urutix_local_dump.sql
```

#### Step 2: Transfer Dump to Server

```bash
# On your LOCAL machine

# Using SCP (Secure Copy)
scp urutix_local_dump.backup root@38.242.224.199:/root/urutix-smart-logistics/

# OR using SCP with plain SQL
scp urutix_local_dump.sql root@38.242.224.199:/root/urutix-smart-logistics/

# OR using SFTP
sftp root@38.242.224.199
put urutix_local_dump.backup /root/urutix-smart-logistics/
exit
```

#### Step 3: Restore Database on Server

```bash
# On the SERVER (after SSH into server)
ssh root@38.242.224.199
cd /root/urutix-smart-logistics

# Make sure containers are running
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
sleep 10

# Option 1: Restore from custom format backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_restore -U postgres -d urutix --clean --if-exists -v < urutix_local_dump.backup

# Option 2: Restore from SQL file
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres -d urutix < urutix_local_dump.sql

# Option 3: Copy file into container first, then restore
docker cp urutix_local_dump.backup urutix_postgres:/tmp/
docker-compose -f docker-compose.production.yml exec postgres \
  pg_restore -U postgres -d urutix --clean --if-exists -v /tmp/urutix_local_dump.backup
```

#### Step 4: Verify Database Restoration

```bash
# Check database connection
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# List all tables
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "\dt"

# Check specific table data (example: users table)
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT COUNT(*) FROM users;"

# Verify migrations table
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
```

#### Step 5: Restart Backend to Apply Changes

```bash
# Restart backend service
docker-compose -f docker-compose.production.yml restart backend

# Check backend logs
docker-compose -f docker-compose.production.yml logs -f backend
```

---

### Alternative: Direct Database Connection (Without Docker)

If you want to connect directly to your local database and dump it:

```bash
# On LOCAL machine - Get your local database connection details
# Default PostgreSQL connection: localhost:5432

# Dump with connection string
pg_dump postgresql://postgres:your_password@localhost:5432/urutix -F c -b -v -f urutix_local_dump.backup

# OR plain SQL
pg_dump postgresql://postgres:your_password@localhost:5432/urutix --clean --if-exists -f urutix_local_dump.sql
```

---

### Backup Production Database

```bash
# Using Makefile
make db-backup

# Manual backup (custom format - recommended)
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres -d urutix -F c -b -v > backup_$(date +%Y%m%d_%H%M%S).backup

# Manual backup (SQL format)
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Production Database

```bash
# Using Makefile (interactive)
make db-restore

# Manual restore from custom format
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_restore -U postgres -d urutix --clean --if-exists -v < backup_file.backup

# Manual restore from SQL
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres urutix < backup_file.sql

# Restore from compressed backup
gunzip < backup_file.sql.gz | docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres urutix
```

### Run Migrations

```bash
# Production
make migrate

# Development
make migrate-dev

# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run migration:show
```

### Access Database Shell

```bash
# Production
make db-shell

# Development
make db-shell-dev

# Direct access
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
make logs

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
docker-compose -f docker-compose.production.yml logs -f postgres

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Container Statistics

```bash
# Real-time stats
make stats

# OR
docker stats
```

### Health Checks

```bash
# Backend health
curl http://localhost:3005/api/health

# Frontend health
curl http://localhost:5173/health

# Database health
docker-compose -f docker-compose.production.yml exec postgres \
  pg_isready -U postgres -d urutix
```

### Inspect Containers

```bash
# Backend shell
make inspect-backend

# Frontend shell
make inspect-frontend

# Database shell
make inspect-db
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution**:
```bash
# Find process using the port
lsof -i :5432  # On macOS/Linux
netstat -ano | findstr :5432  # On Windows

# Stop the process or change the port in docker-compose.yml
```

#### 2. Database Connection Failed

**Error**: `ECONNREFUSED` or `Connection refused`

**Solution**:
```bash
# Check if database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Restart database
docker-compose -f docker-compose.production.yml restart postgres
```

#### 3. Frontend Can't Connect to Backend

**Error**: `Network Error` or `CORS Error`

**Solution**:
```bash
# Check ALLOWED_ORIGINS in backend .env
# Ensure frontend URL is included

# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Verify network connectivity
docker-compose -f docker-compose.production.yml exec frontend ping backend
```

#### 4. Out of Memory

**Error**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Docker memory limit in Docker Desktop settings
# Or add to docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### 5. Permission Denied

**Error**: `Permission denied` when accessing volumes

**Solution**:
```bash
# Fix permissions on host
sudo chown -R $USER:$USER ./backend/uploads
sudo chmod -R 755 ./backend/uploads

# Or rebuild with correct user
docker-compose -f docker-compose.production.yml up -d --build
```

### Debugging Commands

```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# Inspect container
docker inspect urutix_backend

# View container processes
docker-compose -f docker-compose.production.yml top

# Check network
docker network inspect urutix_network

# View volumes
docker volume ls
docker volume inspect urutix_postgres_data
```

### Reset Everything

```bash
# Stop and remove everything
make clean

# Remove all Docker data (CAUTION!)
make prune
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

- ✅ **Never commit** `.env` files to version control
- ✅ Use **strong passwords** (minimum 32 characters)
- ✅ Generate JWT secrets with: `openssl rand -base64 32`
- ✅ Rotate secrets regularly

### 2. Database Security

```bash
# Use strong passwords
DB_PASSWORD=$(openssl rand -base64 32)

# Limit database access
# Don't expose database port in production
# Use internal Docker network only
```

### 3. SSL/TLS Configuration

```bash
# Use Let's Encrypt for free SSL certificates
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Start with Nginx
make prod-nginx
```

### 4. Network Security

- ✅ Use internal Docker networks
- ✅ Only expose necessary ports
- ✅ Enable firewall rules
- ✅ Use reverse proxy (Nginx) for SSL termination

### 5. Container Security

- ✅ Run containers as non-root users (already configured)
- ✅ Use official base images
- ✅ Keep images updated
- ✅ Scan images for vulnerabilities

```bash
# Scan images
docker scan urutix-backend:latest
docker scan urutix-frontend:latest
```

### 6. Backup Strategy

```bash
# Automated daily backups
# Add to crontab:
0 2 * * * cd /path/to/project && make db-backup

# Keep backups for 30 days
find ./backups -name "*.sql" -mtime +30 -delete
```

---

## 📚 Additional Resources

### Useful Commands Reference

```bash
# Development
make dev              # Start dev environment
make dev-build        # Build and start dev
make dev-logs         # View dev logs
make dev-down         # Stop dev environment

# Production
make prod             # Start production
make prod-build       # Build and start production
make prod-logs        # View production logs
make prod-down        # Stop production

# Database
make migrate          # Run migrations
make seed             # Seed database
make db-backup        # Backup database
make db-restore       # Restore database
make db-shell         # Open database shell

# Utilities
make logs             # View all logs
make ps               # List containers
make restart          # Restart services
make clean            # Remove everything
make prune            # Clean Docker system
```

### Docker Compose Commands

```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# Stop services
docker-compose -f docker-compose.production.yml down

# Rebuild specific service
docker-compose -f docker-compose.production.yml up -d --build backend

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# View service logs
docker-compose -f docker-compose.production.yml logs -f backend
```

---

## 🎓 Best Practices

### Development Workflow

1. **Start with clean state**: `make dev-down && make dev-build`
2. **Make changes**: Edit code (hot reload active)
3. **Test changes**: Verify in browser
4. **Run migrations**: `make migrate-dev` (if schema changed)
5. **Commit changes**: Git commit
6. **Stop services**: `make dev-down`

### Production Deployment Workflow

1. **Test locally**: Ensure everything works in dev
2. **Build production images**: `make prod-build`
3. **Run migrations**: `make migrate`
4. **Seed data** (if needed): `make seed`
5. **Verify deployment**: Check logs and health endpoints
6. **Backup database**: `make db-backup`
7. **Monitor**: Watch logs for errors

### Maintenance

```bash
# Weekly tasks
- Check logs for errors
- Review resource usage (make stats)
- Update dependencies
- Backup database

# Monthly tasks
- Rotate secrets
- Update Docker images
- Review security patches
- Clean up old backups
```

---

## 📞 Support

For issues or questions:

1. Check this guide first
2. Review logs: `make logs`
3. Check Docker documentation
4. Contact development team

---

## 📝 License

Copyright © 2024 UrutiX Smart Logistics. All rights reserved.
