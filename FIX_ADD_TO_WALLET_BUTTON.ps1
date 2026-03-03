Write-Host "🔧 Fixing 'Add to Wallet' Button Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "📊 Step 1: Checking current status..." -ForegroundColor Yellow
cd urutix/backend
node check-wallet-button-issue.js

Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Step 2: Run migration
Write-Host "🔄 Step 2: Running database migration..." -ForegroundColor Yellow
node run-fuel-wallet-owner-migration.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions for restart
Write-Host "🔄 Step 3: Restart Backend Server" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "Please restart your backend server:" -ForegroundColor Cyan
Write-Host "  1. Stop the current backend (Ctrl+C)" -ForegroundColor White
Write-Host "  2. Run: npm run start:dev" -ForegroundColor White
Write-Host ""

# Step 4: Testing instructions
Write-Host "🧪 Step 4: Test the Button" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "After restarting backend:" -ForegroundColor Cyan
Write-Host "  1. Login as a truck owner" -ForegroundColor White
Write-Host "  2. Go to: Fleet Dashboard → Fuel Wallets" -ForegroundColor White
Write-Host "  3. Look for the blue 'Add to Wallet' button" -ForegroundColor White
Write-Host "  4. Click it to open the form" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 What was fixed:" -ForegroundColor Cyan
Write-Host "  ✅ Changed button color from indigo-purple to blue" -ForegroundColor White
Write-Host "  ✅ Added owner_id column to fuel_wallets table" -ForegroundColor White
Write-Host "  ✅ Updated wallet card styling to use blue" -ForegroundColor White
Write-Host "  ✅ Updated modal button to use blue" -ForegroundColor White
Write-Host ""
Write-Host "🎨 Button Style:" -ForegroundColor Cyan
Write-Host "  - Color: Blue (bg-blue-600)" -ForegroundColor White
Write-Host "  - Text: 'Add to Wallet'" -ForegroundColor White
Write-Host "  - Location: Next to wallet balance" -ForegroundColor White
Write-Host ""
