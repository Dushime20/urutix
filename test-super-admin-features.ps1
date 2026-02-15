# Test Super Admin Features
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SUPER ADMIN FEATURES - TESTING SCRIPT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if backend is running
Write-Host "1️⃣ Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Backend is not running on port 3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the backend first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run start:dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Step 2: Run system health tests
Write-Host "2️⃣ Running API endpoint tests..." -ForegroundColor Yellow
Write-Host ""

Set-Location backend
node test-system-health.js

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the test results above" -ForegroundColor White
Write-Host "2. Check for any errors or warnings" -ForegroundColor White
Write-Host "3. If all tests pass, proceed with frontend development" -ForegroundColor White
Write-Host ""
