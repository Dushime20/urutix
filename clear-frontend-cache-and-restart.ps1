# Clear Frontend Cache and Restart Development Server

Write-Host "Clearing Frontend Cache and Restarting..." -ForegroundColor Yellow
Write-Host "=" * 50

# Navigate to frontend directory
Set-Location "frontend"

# Stop any running development server
Write-Host "Stopping any running development server..." -ForegroundColor Cyan
try {
    Get-Process -Name "node" | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "No running node processes found" -ForegroundColor Gray
}

# Clear Vite cache
Write-Host "Clearing Vite cache..." -ForegroundColor Cyan
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✓ Cleared node_modules/.vite" -ForegroundColor Green
}

# Clear dist folder
Write-Host "Clearing dist folder..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Cleared dist folder" -ForegroundColor Green
}

# Clear browser cache instructions
Write-Host ""
Write-Host "IMPORTANT: Clear Browser Cache" -ForegroundColor Red
Write-Host "1. Open browser developer tools (F12)" -ForegroundColor Yellow
Write-Host "2. Right-click refresh button" -ForegroundColor Yellow
Write-Host "3. Select 'Empty Cache and Hard Reload'" -ForegroundColor Yellow
Write-Host "OR press Ctrl+Shift+R (Chrome/Edge) or Ctrl+F5 (Firefox)" -ForegroundColor Yellow

Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Cyan
Write-Host "The Financial menu should now show with Purchase Credits option" -ForegroundColor Green

# Start development server
npm run dev