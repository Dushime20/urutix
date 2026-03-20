# Fix Vite Cache and Force Reload
# This script clears Vite cache and restarts the dev server

Write-Host "🔧 Fixing Vite Cache Issue..." -ForegroundColor Cyan
Write-Host ""

# Stop any running dev servers
Write-Host "1️⃣  Stopping any running dev servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*frontend*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Vite cache
Write-Host "2️⃣  Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "   ✅ Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No Vite cache found" -ForegroundColor Gray
}

# Clear dist folder
Write-Host "3️⃣  Clearing dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ Dist folder cleared" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No dist folder found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Cache cleared successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npm run dev" -ForegroundColor White
Write-Host "   2. Open browser and press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "   3. Test the credit usage history feature" -ForegroundColor White
Write-Host ""
