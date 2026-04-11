# Script to restart the backend server

Write-Host "🔍 Finding backend Node processes..." -ForegroundColor Cyan

# Find Node processes running from the backend directory
$backendProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmdLine -like "*backend*" -or $cmdLine -like "*nest*" -or $cmdLine -like "*dist/main*"
}

if ($backendProcesses) {
    Write-Host "Found $($backendProcesses.Count) backend process(es)" -ForegroundColor Yellow
    
    foreach ($proc in $backendProcesses) {
        Write-Host "  Stopping process $($proc.Id)..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force
    }
    
    Write-Host "✅ Backend processes stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "⚠️  No backend processes found running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host ""

# Start the backend server
Set-Location $PSScriptRoot
npm run dev
