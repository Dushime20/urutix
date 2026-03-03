# Fix Frontend Cache and Module Issues
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FRONTEND CACHE FIX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop frontend if running
Write-Host "1️⃣ Checking for running frontend processes..." -ForegroundColor Yellow
$viteProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*frontend*" }
if ($viteProcess) {
    Write-Host "   Stopping frontend process..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "   ✅ Done" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Vite cache
Write-Host "2️⃣ Clearing Vite cache..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "   ✅ Cleared node_modules/.vite" -ForegroundColor Green
}

if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "   ✅ Cleared .vite" -ForegroundColor Green
}

if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ Cleared dist" -ForegroundColor Green
}
Write-Host ""

# Step 3: Clear browser cache instructions
Write-Host "3️⃣ Clear Browser Cache:" -ForegroundColor Yellow
Write-Host "   Press Ctrl + Shift + Delete in your browser" -ForegroundColor White
Write-Host "   OR" -ForegroundColor White
Write-Host "   Press Ctrl + Shift + R to hard refresh" -ForegroundColor White
Write-Host ""

# Step 4: Restart frontend
Write-Host "4️⃣ Starting frontend..." -ForegroundColor Yellow
Write-Host "   Running: npm run dev" -ForegroundColor White
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CACHE CLEARED - FRONTEND STARTING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for frontend to start (check new window)" -ForegroundColor White
Write-Host "2. Open browser and press Ctrl + Shift + R" -ForegroundColor White
Write-Host "3. Try accessing the page again" -ForegroundColor White
Write-Host ""
