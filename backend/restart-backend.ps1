# Restart Backend Script
# This script helps restart the NestJS backend after database migrations

Write-Host "🔄 Restarting Urutix Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
$backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*urutix*backend*" }

if ($backendProcess) {
    Write-Host "⏹️  Stopping existing backend process..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Backend stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No running backend process found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Starting backend..." -ForegroundColor Cyan
Write-Host "   Run this command manually:" -ForegroundColor Yellow
Write-Host "   cd urutix/backend" -ForegroundColor White
Write-Host "   npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "   Or press Ctrl+C to cancel and start manually" -ForegroundColor Gray
Write-Host ""

# Optionally start the backend (commented out by default)
# Uncomment the line below to auto-start
# npm run start:dev
