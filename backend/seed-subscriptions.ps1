# Subscription Seed Script for Windows
# Run: .\seed-subscriptions.ps1

Write-Host "🌱 Seeding Subscription System..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "seed-all-subscriptions.js")) {
    Write-Host "❌ Error: seed-all-subscriptions.js not found" -ForegroundColor Red
    Write-Host "   Please run this script from the backend directory" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   .\seed-subscriptions.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "   Make sure DATABASE_URL is configured" -ForegroundColor Yellow
    Write-Host ""
}

# Run the seed script
Write-Host "Running seed script..." -ForegroundColor Green
node seed-all-subscriptions.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Seeding completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start the backend: npm run start:dev" -ForegroundColor White
    Write-Host "2. Test the API: http://localhost:3002/api/subscriptions/plans" -ForegroundColor White
    Write-Host "3. Check the frontend: http://localhost:5173/subscription/plans" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Seeding failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
