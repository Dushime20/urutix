# Test Subscription Integration
# PowerShell script to verify subscription system is working

Write-Host "🧪 Testing Subscription System Integration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3002/api"
$errors = 0
$success = 0

# Test 1: Get Subscription Plans
Write-Host "Test 1: GET /subscriptions/plans" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/subscriptions/plans" -Method Get
    if ($response.Count -ge 3) {
        Write-Host "  ✅ Success: Found $($response.Count) subscription plans" -ForegroundColor Green
        $success++
    } else {
        Write-Host "  ⚠️  Warning: Expected 3 plans, found $($response.Count)" -ForegroundColor Yellow
        $errors++
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Test 2: Get Credit Packages
Write-Host "Test 2: GET /credits/packages" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/credits/packages" -Method Get
    if ($response.Count -ge 4) {
        Write-Host "  ✅ Success: Found $($response.Count) credit packages" -ForegroundColor Green
        $success++
    } else {
        Write-Host "  ⚠️  Warning: Expected 4 packages, found $($response.Count)" -ForegroundColor Yellow
        $errors++
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Test 3: Get Feature Credit Costs
Write-Host "Test 3: GET /credits/feature-costs" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/credits/feature-costs" -Method Get
    if ($response.Count -ge 10) {
        Write-Host "  ✅ Success: Found $($response.Count) feature costs" -ForegroundColor Green
        $success++
    } else {
        Write-Host "  ⚠️  Warning: Expected 10 features, found $($response.Count)" -ForegroundColor Yellow
        $errors++
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Test 4: Check Backend Health
Write-Host "Test 4: Backend Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002" -Method Get
    Write-Host "  ✅ Success: Backend is running" -ForegroundColor Green
    $success++
} catch {
    Write-Host "  ❌ Failed: Backend not responding" -ForegroundColor Red
    Write-Host "  💡 Tip: Run 'npm run start:dev' in backend directory" -ForegroundColor Cyan
    $errors++
}
Write-Host ""

# Test 5: Check Database Connection
Write-Host "Test 5: Database Connection" -ForegroundColor Yellow
try {
    # Try to query subscription plans (requires DB connection)
    $response = Invoke-RestMethod -Uri "$baseUrl/subscriptions/plans" -Method Get
    Write-Host "  ✅ Success: Database connected" -ForegroundColor Green
    $success++
} catch {
    Write-Host "  ❌ Failed: Database connection issue" -ForegroundColor Red
    Write-Host "  💡 Tip: Check DATABASE_URL in .env" -ForegroundColor Cyan
    $errors++
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $success" -ForegroundColor Green
Write-Host "  ❌ Failed: $errors" -ForegroundColor Red
Write-Host ""

if ($errors -eq 0) {
    Write-Host "🎉 All tests passed! Subscription system is working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open http://localhost:5173/subscription/plans" -ForegroundColor White
    Write-Host "  2. Open http://localhost:5173/admin/billing" -ForegroundColor White
    Write-Host "  3. Open http://localhost:5173/admin/subscriptions" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Make sure backend is running: npm run start:dev" -ForegroundColor White
    Write-Host "  2. Make sure database is running and seeded: npm run seed:subscriptions" -ForegroundColor White
    Write-Host "  3. Check DATABASE_URL in backend/.env" -ForegroundColor White
}
Write-Host ""

# Display sample data
if ($success -gt 0) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "📦 Sample Data" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    try {
        Write-Host ""
        Write-Host "Subscription Plans:" -ForegroundColor Yellow
        $plans = Invoke-RestMethod -Uri "$baseUrl/subscriptions/plans" -Method Get
        foreach ($plan in $plans) {
            Write-Host "  - $($plan.name): `$$($plan.price_monthly)/mo, $($plan.included_credits) credits" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "Credit Packages:" -ForegroundColor Yellow
        $packages = Invoke-RestMethod -Uri "$baseUrl/credits/packages" -Method Get
        foreach ($pkg in $packages) {
            Write-Host "  - $($pkg.name): $($pkg.credits) credits for `$$($pkg.price)" -ForegroundColor White
        }
    } catch {
        # Silently fail if we can't get sample data
    }
    Write-Host ""
}

exit $errors
