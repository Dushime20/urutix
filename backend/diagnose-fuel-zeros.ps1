# Quick diagnostic for fuel wallet zeros issue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FUEL WALLET ZEROS DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please run this from the backend directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Running diagnostic..." -ForegroundColor Yellow
Write-Host ""

node diagnose-fuel-wallet-zeros.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed solutions, see:" -ForegroundColor Yellow
Write-Host "   FUEL_WALLET_ZEROS_DESPITE_DATA.md" -ForegroundColor White
Write-Host ""
