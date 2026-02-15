# Check Backend Status Script

Write-Host "Checking Backend Status..." -ForegroundColor Cyan
Write-Host ""

# Check if port 3000 is in use
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "Backend is running on port 3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Process Details:" -ForegroundColor Yellow
    $processId = $port3000.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "  Process Name: $($process.ProcessName)" -ForegroundColor White
        Write-Host "  Process ID: $processId" -ForegroundColor White
        Write-Host "  Start Time: $($process.StartTime)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Backend needs to be restarted to load new entities!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To restart:" -ForegroundColor Cyan
    Write-Host "  1. Press Ctrl+C in the terminal where backend is running" -ForegroundColor White
    Write-Host "  2. Then run in backend folder:" -ForegroundColor White
    Write-Host "     npm run build" -ForegroundColor White
    Write-Host "     npm run start:prod" -ForegroundColor White
} else {
    Write-Host "Backend is NOT running on port 3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start backend:" -ForegroundColor Cyan
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run build" -ForegroundColor White
    Write-Host "  npm run start:prod" -ForegroundColor White
}

Write-Host ""
