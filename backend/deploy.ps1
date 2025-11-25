# Production Deployment Script for UrutiX SmartCargo Backend (PowerShell)
# Usage: .\deploy.ps1 [environment]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UrutiX SmartCargo Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Function to print colored output
function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor White
}

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Print-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Print-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

Print-Success "Docker and Docker Compose are installed"

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Print-Warning ".env.production file not found"
    if (Test-Path ".env.production.example") {
        Print-Info "Creating .env.production from example..."
        Copy-Item ".env.production.example" ".env.production"
        Print-Warning "Please update .env.production with your production values before continuing"
        exit 1
    } else {
        Print-Error ".env.production.example not found. Cannot proceed."
        exit 1
    }
}

Print-Success ".env.production file found"

# Create necessary directories
Print-Info "Creating necessary directories..."
$directories = @("uploads", "logs", "data/postgres", "nginx/logs", "nginx/ssl")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Print-Success "Directories created"

# Build Docker images
Print-Info "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache
if ($LASTEXITCODE -ne 0) {
    Print-Error "Failed to build Docker images"
    exit 1
}
Print-Success "Docker images built"

# Stop existing containers
Print-Info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down
Print-Success "Existing containers stopped"

# Start services
Print-Info "Starting services..."
docker-compose -f docker-compose.prod.yml up -d
if ($LASTEXITCODE -ne 0) {
    Print-Error "Failed to start services"
    exit 1
}
Print-Success "Services started"

# Wait for services to be healthy
Print-Info "Waiting for services to be healthy..."
Start-Sleep -Seconds 10

# Check service health
Print-Info "Checking service health..."

# Check PostgreSQL
$pgCheck = docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres 2>&1
if ($LASTEXITCODE -eq 0) {
    Print-Success "PostgreSQL is healthy"
} else {
    Print-Warning "PostgreSQL health check failed. It may still be starting up."
}

# Check Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Print-Success "Backend is healthy"
    }
} catch {
    Print-Warning "Backend health check failed. It may still be starting up."
}

# Display service status
Write-Host ""
Print-Info "Service Status:"
docker-compose -f docker-compose.prod.yml ps

Write-Host ""
Print-Success "Deployment completed successfully!"
Print-Info "API: http://localhost/api"
Print-Info "Health: http://localhost/api/health"
Print-Info "Docs: http://localhost/api/docs"

Write-Host ""
Print-Info "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
Print-Info "To stop services: docker-compose -f docker-compose.prod.yml down"

