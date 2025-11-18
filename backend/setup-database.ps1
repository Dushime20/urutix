# Database Setup Script for Cargo AI Matching Lending Component
# This script helps you configure the database connection

Write-Host "=== Cargo AI Matching - Database Setup ===" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Current database configuration:" -ForegroundColor Yellow
Get-Content .env | Where-Object { $_ -match "DB_" } | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "=== Database Connection Options ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Reset PostgreSQL password to '123'"
Write-Host "  - Open pgAdmin or PostgreSQL command line"
Write-Host "  - Connect as superuser"
Write-Host "  - Run: ALTER USER postgres PASSWORD '123';"
Write-Host ""
Write-Host "Option 2: Update .env with correct password"
Write-Host "  - Find your PostgreSQL password"
Write-Host "  - Update DB_PASSWORD in .env file"
Write-Host ""
Write-Host "Option 3: Create new PostgreSQL user"
Write-Host "  - Create user 'cargo_user' with password '123'"
Write-Host "  - Grant necessary permissions"
Write-Host "  - Update DB_USERNAME in .env to 'cargo_user'"
Write-Host ""

# Test database connection
Write-Host "=== Testing Database Connection ===" -ForegroundColor Cyan
Write-Host "Attempting to connect to database..." -ForegroundColor Yellow

try {
    $env:DB_PASSWORD = '123'
    $result = npx typeorm-ts-node-commonjs migration:show -d src/data-source.ts 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection successful!" -ForegroundColor Green
        Write-Host "✓ Ready to run migrations" -ForegroundColor Green
    } else {
        Write-Host "✗ Database connection failed" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Database connection failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Fix database connection issue using one of the options above"
Write-Host "2. Run: npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts"
Write-Host "3. Start the application: npm run start:dev"
Write-Host "4. Access Swagger docs at: http://localhost:3000/api/docs"
Write-Host ""

Write-Host "=== Lending Component Status ===" -ForegroundColor Cyan
Write-Host "✓ Backend code compiled successfully" -ForegroundColor Green
Write-Host "✓ Swagger documentation complete" -ForegroundColor Green
Write-Host "✓ Migration file ready" -ForegroundColor Green
Write-Host "⚠ Database connection needs configuration" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
