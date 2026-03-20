# PowerShell script to reset super admin password

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUPER ADMIN PASSWORD RESET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you reset your super admin password." -ForegroundColor Yellow
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Host "Error: backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the urutix root directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Run the Node.js script
Write-Host "Starting password reset process..." -ForegroundColor Green
Write-Host ""

Set-Location backend
node reset-super-admin-password.js
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Password reset process complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
