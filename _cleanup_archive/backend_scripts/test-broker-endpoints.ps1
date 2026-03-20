# Broker API Endpoints Test Script (PowerShell)
# Usage: .\test-broker-endpoints.ps1

$BASE_URL = "http://localhost:3002/api"
$TOKEN = ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Broker API Endpoints Test Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get token
Write-Host "Step 1: Login to get authentication token" -ForegroundColor Yellow
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
    Write-Host "Token: $($TOKEN.Substring(0, [Math]::Min(50, $TOKEN.Length)))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get all brokers
Write-Host "Step 2: Get all brokers" -ForegroundColor Yellow
try {
    $brokers = Invoke-RestMethod -Uri "$BASE_URL/brokers" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    $brokers | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get brokers: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Create a broker
Write-Host "Step 3: Create a new broker" -ForegroundColor Yellow
$FIRST_NAME = Read-Host "Broker First Name"
$LAST_NAME = Read-Host "Broker Last Name"
$BROKER_EMAIL = Read-Host "Broker Email"
$BROKER_PHONE = Read-Host "Broker Phone (optional)"
$COMMISSION_RATE = Read-Host "Default Commission Rate % (optional, default 5)"
if ([string]::IsNullOrWhiteSpace($COMMISSION_RATE)) {
    $COMMISSION_RATE = 5
}

$createBody = @{
    firstName = $FIRST_NAME
    lastName = $LAST_NAME
    email = $BROKER_EMAIL
    phone = $BROKER_PHONE
    defaultCommissionRate = [int]$COMMISSION_RATE
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE_URL/brokers" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -Body $createBody
    
    $BROKER_ID = $createResponse.broker.id
    Write-Host "✅ Broker created successfully!" -ForegroundColor Green
    Write-Host "Broker ID: $BROKER_ID" -ForegroundColor Gray
    $createResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create broker: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host ""
    $BROKER_ID = $null
}

# Step 4: Get broker by ID
if ($BROKER_ID) {
    Write-Host "Step 4: Get broker by ID" -ForegroundColor Yellow
    try {
        $broker = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        $broker | ConvertTo-Json -Depth 10
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to get broker: $($_.Exception.Message)" -ForegroundColor Red
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
        $stats | ConvertTo-Json -Depth 10
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
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
        $commissions | ConvertTo-Json -Depth 10
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to get commissions: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 7: Get broker loads
if ($BROKER_ID) {
    Write-Host "Step 7: Get broker loads" -ForegroundColor Yellow
    try {
        $loads = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/loads" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        $loads | ConvertTo-Json -Depth 10
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to get loads: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Test completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

