# Test Credit Usage Integration
# This script verifies the backend is working correctly

Write-Host "🧪 Testing Credit Usage Integration" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1️⃣  Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is not running!" -ForegroundColor Red
    Write-Host "   Please start backend: cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2️⃣  Running backend test script..." -ForegroundColor Yellow
Write-Host ""

Push-Location backend
node test-tenant-filter.js
$testResult = $LASTEXITCODE
Pop-Location

Write-Host ""

if ($testResult -eq 0) {
    Write-Host "✅ Backend test passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Clear Vite cache:" -ForegroundColor White
    Write-Host "      cd frontend" -ForegroundColor Gray
    Write-Host "      Remove-Item -Recurse -Force node_modules/.vite" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Restart frontend dev server:" -ForegroundColor White
    Write-Host "      npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Hard refresh browser:" -ForegroundColor White
    Write-Host "      Press Ctrl+Shift+R" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   4. Test the feature:" -ForegroundColor White
    Write-Host "      - Go to Admin → Tenant Subscriptions" -ForegroundColor Gray
    Write-Host "      - Click purple history icon for 'Demo Tenant B'" -ForegroundColor Gray
    Write-Host "      - Should see 1 CONSUMPTION transaction (-250 credits)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Backend test failed!" -ForegroundColor Red
    Write-Host "   Please check backend logs for errors" -ForegroundColor Yellow
}
