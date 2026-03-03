#!/usr/bin/env pwsh

Write-Host "`n🔧 Fixing Trucks 403 Error - Final Fix`n" -ForegroundColor Cyan

# Step 1: Build backend
Write-Host "📦 Step 1: Building backend..." -ForegroundColor Yellow
Set-Location -Path "backend"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed! Please check for errors above.`n" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

Write-Host "`n✅ Backend built successfully!`n" -ForegroundColor Green

# Step 2: Instructions for restart
Write-Host "📋 Step 2: Restart Backend" -ForegroundColor Yellow
Write-Host "   1. Stop the current backend process (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Run: npm run start:dev" -ForegroundColor White
Write-Host "   3. Wait for 'Nest application successfully started'`n" -ForegroundColor White

# Step 3: Instructions for testing
Write-Host "📋 Step 3: Test the Fix" -ForegroundColor Yellow
Write-Host "   1. Open browser and clear cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   2. Or run in console: localStorage.clear(); sessionStorage.clear();" -ForegroundColor White
Write-Host "   3. Log out of the application" -ForegroundColor White
Write-Host "   4. Log back in with truck owner account:" -ForegroundColor White
Write-Host "      - truck.owner@test.com" -ForegroundColor Cyan
Write-Host "      - truck.owner2@test.com" -ForegroundColor Cyan
Write-Host "      - serge@gmail.com" -ForegroundColor Cyan
Write-Host "      - urutitruck@gmail.com" -ForegroundColor Cyan
Write-Host "   5. Navigate to Fleet Management → Trucks" -ForegroundColor White
Write-Host "   6. ✅ Trucks should now display!`n" -ForegroundColor Green

# Step 4: Verification
Write-Host "📋 Step 4: Verify JWT Token (Optional)" -ForegroundColor Yellow
Write-Host "   After logging in, run this in browser console:" -ForegroundColor White
Write-Host "   localStorage.getItem('token')" -ForegroundColor Cyan
Write-Host "   Then copy the token and run:" -ForegroundColor White
Write-Host "   node check-jwt-token-structure.js `"YOUR_TOKEN_HERE`"`n" -ForegroundColor Cyan

Write-Host "📄 For detailed instructions, see: TRUCKS_403_FINAL_FIX.md`n" -ForegroundColor Yellow

Set-Location -Path ".."

Write-Host "✅ Build complete! Now restart the backend and test.`n" -ForegroundColor Green
