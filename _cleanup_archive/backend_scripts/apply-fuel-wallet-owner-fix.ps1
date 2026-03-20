Write-Host "🚀 Applying Fuel Wallet Owner ID Fix" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run the migration
Write-Host "📊 Step 1: Running database migration..." -ForegroundColor Yellow
node run-fuel-wallet-owner-migration.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Restart the backend
Write-Host "🔄 Step 2: Restarting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please restart your backend server manually:" -ForegroundColor Cyan
Write-Host "  1. Stop the current backend process (Ctrl+C)" -ForegroundColor White
Write-Host "  2. Run: npm run start:dev" -ForegroundColor White
Write-Host ""

Write-Host "✅ Migration applied! Restart backend to complete the fix." -ForegroundColor Green
Write-Host ""
Write-Host "📝 What was fixed:" -ForegroundColor Cyan
Write-Host "  - Added owner_id column to fuel_wallets table" -ForegroundColor White
Write-Host "  - Updated FuelWallet entity with ownerId field" -ForegroundColor White
Write-Host "  - Wallets now properly belong to truck owners" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart backend server" -ForegroundColor White
Write-Host "  2. Login as a truck owner" -ForegroundColor White
Write-Host "  3. Go to Fuel Wallets page" -ForegroundColor White
Write-Host "  4. Click 'Add to Wallet' button" -ForegroundColor White
Write-Host "  5. Fill in the form and submit" -ForegroundColor White
Write-Host ""
