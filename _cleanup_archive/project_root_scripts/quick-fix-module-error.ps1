# Quick Fix for Module Import Error
Write-Host "🔧 Fixing module import error..." -ForegroundColor Yellow

cd frontend

# Clear Vite cache
if (Test-Path "node_modules/.vite") { Remove-Item -Recurse -Force "node_modules/.vite" }
if (Test-Path ".vite") { Remove-Item -Recurse -Force ".vite" }

Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Now:" -ForegroundColor Yellow
Write-Host "1. Restart frontend: npm run dev" -ForegroundColor White
Write-Host "2. Press Ctrl + Shift + R in browser" -ForegroundColor White
