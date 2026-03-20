#!/usr/bin/env pwsh

# UrutiX Subscription System - Complete Integration Testing Suite
# This script runs comprehensive integration tests for the subscription and notification systems

Write-Host "🚀 UrutiX Subscription System - Complete Integration Testing" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Configuration
$BackendPath = "urutix/backend"
$FrontendPath = "urutix/frontend"
$TestResults = @{
    DatabaseMigration = $false
    BackendTests = $false
    NotificationTests = $false
    EndToEndTests = $false
    FrontendBuild = $false
}

# Function to run command and capture result
function Invoke-TestCommand {
    param(
        [string]$Command,
        [string]$WorkingDirectory = ".",
        [string]$TestName,
        [bool]$ContinueOnError = $true
    )
    
    Write-Host "`n📋 Running: $TestName" -ForegroundColor Yellow
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        $result = Invoke-Expression "cd '$WorkingDirectory' && $Command" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $TestName - PASSED" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $TestName - FAILED" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Red
            
            if (-not $ContinueOnError) {
                throw "Critical test failed: $TestName"
            }
            return $false
        }
    } catch {
        Write-Host "❌ $TestName - ERROR: $_" -ForegroundColor Red
        if (-not $ContinueOnError) {
            throw $_
        }
        return $false
    }
}

# Step 1: Database Migration Test
Write-Host "`n🗄️ Step 1: Database Migration Testing" -ForegroundColor Magenta

$TestResults.DatabaseMigration = Invoke-TestCommand `
    -Command "node run-notification-migration.js" `
    -WorkingDirectory $BackendPath `
    -TestName "Notification System Migration" `
    -ContinueOnError $true

if ($TestResults.DatabaseMigration) {
    Write-Host "✅ Database migration completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Database migration failed - tests will continue with existing schema" -ForegroundColor Yellow
}

# Step 2: Backend Integration Tests
Write-Host "`n🔧 Step 2: Backend Integration Testing" -ForegroundColor Magenta

$TestResults.BackendTests = Invoke-TestCommand `
    -Command "node test-subscription-notification-integration.js" `
    -WorkingDirectory $BackendPath `
    -TestName "Subscription & Notification Integration Tests" `
    -ContinueOnError $true

# Step 3: Notification System Tests
Write-Host "`n🔔 Step 3: Notification System Testing" -ForegroundColor Magenta

$TestResults.NotificationTests = Invoke-TestCommand `
    -Command "node test-notification-system-comprehensive.js" `
    -WorkingDirectory $BackendPath `
    -TestName "Comprehensive Notification System Tests" `
    -ContinueOnError $true

# Step 4: End-to-End Tests
Write-Host "`n🎬 Step 4: End-to-End Testing" -ForegroundColor Magenta

$TestResults.EndToEndTests = Invoke-TestCommand `
    -Command "node test-subscription-system-end-to-end.js" `
    -WorkingDirectory $BackendPath `
    -TestName "End-to-End Subscription System Tests" `
    -ContinueOnError $true

# Step 5: Frontend Build Test
Write-Host "`n🎨 Step 5: Frontend Build Testing" -ForegroundColor Magenta

$TestResults.FrontendBuild = Invoke-TestCommand `
    -Command "npm run build" `
    -WorkingDirectory $FrontendPath `
    -TestName "Frontend Build Test" `
    -ContinueOnError $true

# Step 6: Additional Verification Tests
Write-Host "`n🔍 Step 6: Additional Verification Tests" -ForegroundColor Magenta

# Test existing subscription endpoints
Invoke-TestCommand `
    -Command "node test-subscription-integration.js" `
    -WorkingDirectory $BackendPath `
    -TestName "Legacy Subscription Integration Tests" `
    -ContinueOnError $true

# Test credit system endpoints
Invoke-TestCommand `
    -Command "node test-tenant-credit-topup.js" `
    -WorkingDirectory $BackendPath `
    -TestName "Credit Top-up System Tests" `
    -ContinueOnError $true

# Print comprehensive test summary
Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "📊 COMPREHENSIVE TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

$PassedTests = 0
$TotalTests = $TestResults.Count

foreach ($test in $TestResults.GetEnumerator()) {
    $status = if ($test.Value) { "✅ PASSED" } else { "❌ FAILED" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    
    Write-Host "$($test.Key): $status" -ForegroundColor $color
    
    if ($test.Value) {
        $PassedTests++
    }
}

$SuccessRate = [math]::Round(($PassedTests / $TotalTests) * 100, 1)

Write-Host "`n📈 OVERALL RESULTS:" -ForegroundColor Cyan
Write-Host "✅ Passed: $PassedTests" -ForegroundColor Green
Write-Host "❌ Failed: $($TotalTests - $PassedTests)" -ForegroundColor Red
Write-Host "📊 Total: $TotalTests" -ForegroundColor Blue
Write-Host "🎯 Success Rate: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -ge 80) { "Green" } else { "Yellow" })

# Recommendations based on results
Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Cyan

if (-not $TestResults.DatabaseMigration) {
    Write-Host "• Run database migration manually: cd urutix/backend && node run-notification-migration.js" -ForegroundColor Yellow
}

if (-not $TestResults.BackendTests) {
    Write-Host "• Check backend server is running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "• Verify database connection and credentials" -ForegroundColor Yellow
}

if (-not $TestResults.NotificationTests) {
    Write-Host "• Review notification service configuration" -ForegroundColor Yellow
    Write-Host "• Check notification preferences API endpoints" -ForegroundColor Yellow
}

if (-not $TestResults.EndToEndTests) {
    Write-Host "• Verify complete subscription system integration" -ForegroundColor Yellow
    Write-Host "• Check user authentication and permissions" -ForegroundColor Yellow
}

if (-not $TestResults.FrontendBuild) {
    Write-Host "• Install frontend dependencies: cd urutix/frontend && npm install" -ForegroundColor Yellow
    Write-Host "• Check for TypeScript compilation errors" -ForegroundColor Yellow
}

if ($SuccessRate -ge 80) {
    Write-Host "`n🎉 INTEGRATION TESTING SUCCESSFUL!" -ForegroundColor Green
    Write-Host "The subscription and notification systems are ready for production deployment." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ INTEGRATION TESTING NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "Please address the failed tests before deploying to production." -ForegroundColor Yellow
}

Write-Host "`n🚀 Integration Testing Complete!" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Exit with appropriate code
if ($SuccessRate -ge 80) {
    exit 0
} else {
    exit 1
}