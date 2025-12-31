# Quick Broker API Test (PowerShell)
# This script demonstrates how to test broker endpoints

$BASE_URL = "http://localhost:3002/api"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Quick Broker API Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Login" -ForegroundColor Yellow
Write-Host "Enter your credentials (must be TENANT_ADMIN, ADMIN, or SUPER_ADMIN):" -ForegroundColor Gray
$EMAIL = Read-Host "Email"
$PASSWORD = Read-Host "Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PASSWORD)
$PLAIN_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$loginBody = @{
    email = $EMAIL
    password = $PLAIN_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $TOKEN = $loginResponse.accessToken
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 2: Get all brokers
Write-Host "Step 2: Get all brokers" -ForegroundColor Yellow
try {
    $brokers = Invoke-RestMethod -Uri "$BASE_URL/brokers" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    
    Write-Host "✅ Found $($brokers.Count) broker(s)" -ForegroundColor Green
    if ($brokers.Count -gt 0) {
        Write-Host "Brokers:" -ForegroundColor Gray
        $brokers | ForEach-Object {
            Write-Host "  - $($_.email) (ID: $($_.id))" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Create a test broker
Write-Host "Step 3: Create a test broker" -ForegroundColor Yellow
$testBroker = @{
    firstName = "Test"
    lastName = "Broker"
    email = "test.broker.$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    phone = "+1234567890"
    defaultCommissionRate = 5.0
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE_URL/brokers" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -Body $testBroker
    
    $BROKER_ID = $createResponse.broker.id
    Write-Host "✅ Broker created successfully!" -ForegroundColor Green
    Write-Host "Broker ID: $BROKER_ID" -ForegroundColor Gray
    Write-Host "Email: $($createResponse.broker.email)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create broker: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
    $BROKER_ID = $null
}

# Step 4: Get broker details
if ($BROKER_ID) {
    Write-Host "Step 4: Get broker details" -ForegroundColor Yellow
    try {
        $broker = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        Write-Host "✅ Broker details retrieved" -ForegroundColor Green
        Write-Host "Name: $($broker.profile.firstName) $($broker.profile.lastName)" -ForegroundColor Gray
        Write-Host "Commission Rate: $($broker.defaultCommissionRate)%" -ForegroundColor Gray
        Write-Host "Total Earned: $($broker.totalCommissionEarned)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 5: Get broker statistics
if ($BROKER_ID) {
    Write-Host "Step 5: Get broker statistics" -ForegroundColor Yellow
    try {
        $stats = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/statistics" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        Write-Host "✅ Statistics retrieved" -ForegroundColor Green
        Write-Host "Total Loads: $($stats.totalLoads)" -ForegroundColor Gray
        Write-Host "Total Commissions: $($stats.totalCommissions)" -ForegroundColor Gray
        Write-Host "Total Pending: $($stats.totalPending)" -ForegroundColor Gray
        Write-Host "Total Earned: $($stats.totalEarned)" -ForegroundColor Gray
        Write-Host "Average Commission Rate: $($stats.averageCommissionRate)%" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 6: Get broker commissions
if ($BROKER_ID) {
    Write-Host "Step 6: Get broker commissions" -ForegroundColor Yellow
    try {
        $commissions = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/commissions" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        Write-Host "✅ Commissions retrieved" -ForegroundColor Green
        Write-Host "Total Commissions: $($commissions.total)" -ForegroundColor Gray
        Write-Host "Total Earned: $($commissions.totalEarned)" -ForegroundColor Gray
        Write-Host "Total Pending: $($commissions.totalPending)" -ForegroundColor Gray
        Write-Host "Commission Records: $($commissions.commissions.Count)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Test completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a load (POST /api/loads)" -ForegroundColor Gray
Write-Host "2. Assign broker to load (POST /api/brokers/loads/:loadId/assign)" -ForegroundColor Gray
Write-Host "3. Check commissions (GET /api/brokers/:brokerId/commissions)" -ForegroundColor Gray
Write-Host "4. Update commission status (PUT /api/brokers/commissions/:id/status)" -ForegroundColor Gray

