# Fuel Wallets Seeding Script
# This script seeds test data for fuel wallets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FUEL WALLETS SEEDING SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the backend directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env file" -ForegroundColor Green
Write-Host "📦 Installing dotenv package (if needed)..." -ForegroundColor Yellow
npm install dotenv --save-dev 2>&1 | Out-Null

Write-Host "🚀 Running seeding script..." -ForegroundColor Yellow
Write-Host ""

node seed-fuel-wallets.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ SEEDING COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Refresh your browser (Ctrl+F5)" -ForegroundColor White
    Write-Host "2. Navigate to Fuel Management → Fuel Wallets" -ForegroundColor White
    Write-Host "3. You should now see wallet data!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ SEEDING FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure PostgreSQL is running on port 5433" -ForegroundColor White
    Write-Host "2. Check your .env file has correct credentials" -ForegroundColor White
    Write-Host "3. Verify you have tenants and drivers/trucks in the database" -ForegroundColor White
    Write-Host ""
}
