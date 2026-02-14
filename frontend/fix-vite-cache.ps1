# Fix Vite Cache Issues
# This script clears Vite's cache and node_modules to resolve import errors

Write-Host "🧹 Clearing Vite cache and rebuilding..." -ForegroundColor Cyan

# Remove Vite cache
if (Test-Path "node_modules/.vite") {
    Write-Host "Removing node_modules/.vite..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.vite"
}

# Remove dist folder
if (Test-Path "dist") {
    Write-Host "Removing dist..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}

Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
