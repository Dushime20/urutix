# Clear Broker Dashboard Cache Script

Write-Host "🧹 Clearing Broker Dashboard Cache..." -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location frontend

# Clear Vite cache
Write-Host "`n1️⃣ Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force .vite
    Write-Host "✅ Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No Vite cache found" -ForegroundColor Gray
}

# Clear node_modules/.vite
Write-Host "`n2️⃣ Clearing node_modules Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force node_modules/.vite
    Write-Host "✅ node_modules Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No node_modules Vite cache found" -ForegroundColor Gray
}

# Clear dist folder
Write-Host "`n3️⃣ Clearing dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Write-Host "✅ Dist folder cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No dist folder found" -ForegroundColor Gray
}

Write-Host "`n✨ Cache cleared successfully!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   2. Hard refresh the page (Ctrl+Shift+R or Ctrl+F5)" -ForegroundColor White
Write-Host "   3. If still showing old version, restart the dev server" -ForegroundColor White

Set-Location ..
