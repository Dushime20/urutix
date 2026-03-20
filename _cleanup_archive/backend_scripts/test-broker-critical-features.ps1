# Test Script for Broker Critical Features
# This script tests all the new broker endpoints

$baseUrl = "http://localhost:3002/api"
$token = "" # Will be set after login

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Broker Critical Features API Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Broker
Write-Host "Step 1: Login as Broker..." -ForegroundColor Yellow
$loginBody = @{
    email = "broker1@test.com"
    password = "test123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $brokerId = $loginResponse.user.id
    $tenantId = $loginResponse.user.tenantId
    Write-Host "✅ Login successful! Broker ID: $brokerId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get a load to work with
Write-Host "Step 2: Getting available loads..." -ForegroundColor Yellow
try {
    $loadsResponse = Invoke-RestMethod -Uri "$baseUrl/loads-v2?status=PUBLISHED&limit=1" -Method Get -Headers $headers
    if ($loadsResponse.data -and $loadsResponse.data.Count -gt 0) {
        $loadId = $loadsResponse.data[0].id
        $cargoOwnerId = $loadsResponse.data[0].cargoOwnerId
        Write-Host "✅ Found load: $loadId" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No loads found. Creating a test load..." -ForegroundColor Yellow
        # You may need to create a load first
        $loadId = "test-load-id"
        $cargoOwnerId = "test-cargo-owner-id"
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  Could not fetch loads: $_" -ForegroundColor Yellow
    $loadId = "test-load-id"
    $cargoOwnerId = "test-cargo-owner-id"
    Write-Host ""
}

# Step 3: Get a transporter
Write-Host "Step 3: Getting transporters..." -ForegroundColor Yellow
try {
    $trucksResponse = Invoke-RestMethod -Uri "$baseUrl/fleet/trucks?limit=1" -Method Get -Headers $headers
    if ($trucksResponse.data -and $trucksResponse.data.Count -gt 0) {
        $transporterId = $trucksResponse.data[0].truckOwnerId
        Write-Host "✅ Found transporter: $transporterId" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No transporters found. Using test ID..." -ForegroundColor Yellow
        $transporterId = "test-transporter-id"
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  Could not fetch transporters: $_" -ForegroundColor Yellow
    $transporterId = "test-transporter-id"
    Write-Host ""
}

# ==================== TEST 1: CONTRACT MANAGEMENT ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Contract Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Creating contract..." -ForegroundColor Yellow
$contractBody = @{
    loadId = $loadId
    transporterId = $transporterId
    agreedRate = 50000
    currencyCode = "KES"
    commissionRate = 5
    paymentTerms = "Net 30"
    pickupDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    deliveryDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
} | ConvertTo-Json

try {
    $contractResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/contracts" -Method Post -Body $contractBody -Headers $headers
    $contractId = $contractResponse.id
    Write-Host "✅ Contract created: $contractId" -ForegroundColor Green
    Write-Host "   Status: $($contractResponse.status)" -ForegroundColor Gray
    Write-Host "   Commission Amount: $($contractResponse.commissionAmount)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Contract creation failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Get contracts
Write-Host "Getting broker contracts..." -ForegroundColor Yellow
try {
    $contractsResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/contracts" -Method Get -Headers $headers
    Write-Host "✅ Found $($contractsResponse.Count) contracts" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get contracts: $_" -ForegroundColor Red
    Write-Host ""
}

# ==================== TEST 2: INSURANCE VERIFICATION ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Insurance Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Verifying insurance..." -ForegroundColor Yellow
$insuranceBody = @{
    transporterId = $transporterId
    loadId = $loadId
    verificationType = "INSURANCE"
    policyNumber = "POL-12345"
    insuranceCompany = "Test Insurance Co"
    coverageAmount = 1000000
    effectiveDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    expiryDate = (Get-Date).AddDays(335).ToString("yyyy-MM-dd")
    verificationNotes = "Insurance verified via API"
} | ConvertTo-Json

try {
    $insuranceResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/insurance/verify" -Method Post -Body $insuranceBody -Headers $headers
    Write-Host "✅ Insurance verified: $($insuranceResponse.id)" -ForegroundColor Green
    Write-Host "   Status: $($insuranceResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Insurance verification failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Check compliance
Write-Host "Checking compliance..." -ForegroundColor Yellow
try {
    $complianceResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/insurance/compliance/$transporterId?types=INSURANCE,LICENSE" -Method Get -Headers $headers
    Write-Host "✅ Compliance check completed" -ForegroundColor Green
    Write-Host "   Is Compliant: $($complianceResponse.isCompliant)" -ForegroundColor Gray
    Write-Host "   Missing Types: $($complianceResponse.missingTypes -join ', ')" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Compliance check failed: $_" -ForegroundColor Red
    Write-Host ""
}

# ==================== TEST 3: DISPUTE RESOLUTION ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Dispute Resolution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Creating dispute..." -ForegroundColor Yellow
$disputeBody = @{
    loadId = $loadId
    disputedWithId = $transporterId
    category = "DELAY"
    severity = "MEDIUM"
    description = "Test dispute: Delivery was delayed by 2 days"
    claimedAmount = 10000
    evidence = @(
        @{
            type = "DOCUMENT"
            url = "https://example.com/evidence.pdf"
            description = "Delivery delay documentation"
        }
    )
} | ConvertTo-Json

try {
    $disputeResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/disputes" -Method Post -Body $disputeBody -Headers $headers
    $disputeId = $disputeResponse.id
    Write-Host "✅ Dispute created: $disputeId" -ForegroundColor Green
    Write-Host "   Status: $($disputeResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Dispute creation failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Start mediation
if ($disputeId) {
    Write-Host "Starting mediation..." -ForegroundColor Yellow
    try {
        $mediationBody = @{ notes = "Broker starting mediation process" } | ConvertTo-Json
        $mediationResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/disputes/$disputeId/mediate" -Method Put -Body $mediationBody -Headers $headers
        Write-Host "✅ Mediation started" -ForegroundColor Green
        Write-Host "   Status: $($mediationResponse.status)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Mediation start failed: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# ==================== TEST 4: ESCROW MANAGEMENT ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 4: Escrow Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Creating escrow account..." -ForegroundColor Yellow
$escrowBody = @{
    loadId = $loadId
    payerId = $cargoOwnerId
    payeeId = $transporterId
    totalAmount = 50000
    currencyCode = "KES"
    commissionAmount = 2500
    paymentMethod = "Bank Transfer"
    releaseSchedule = @(
        @{
            milestone = "Delivery Confirmed"
            amount = 50000
            trigger = "DELIVERY_CONFIRMED"
        }
    )
} | ConvertTo-Json

try {
    $escrowResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/escrow" -Method Post -Body $escrowBody -Headers $headers
    $escrowId = $escrowResponse.id
    Write-Host "✅ Escrow account created: $escrowId" -ForegroundColor Green
    Write-Host "   Status: $($escrowResponse.status)" -ForegroundColor Gray
    Write-Host "   Total Amount: $($escrowResponse.totalAmount)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Escrow creation failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Fund escrow
if ($escrowId) {
    Write-Host "Funding escrow account..." -ForegroundColor Yellow
    $fundBody = @{
        amount = 50000
        paymentMethod = "Bank Transfer"
        paymentReference = "TXN-12345"
        transactionId = "TXN-12345"
    } | ConvertTo-Json

    try {
        $fundResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/escrow/$escrowId/fund" -Method Put -Body $fundBody -Headers $headers
        Write-Host "✅ Escrow funded" -ForegroundColor Green
        Write-Host "   Funded Amount: $($fundResponse.fundedAmount)" -ForegroundColor Gray
        Write-Host "   Status: $($fundResponse.status)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Escrow funding failed: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# ==================== TEST 5: DOCUMENT MANAGEMENT ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 5: Document Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Generating Bill of Lading..." -ForegroundColor Yellow
try {
    $bolResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/documents/bol/$loadId" -Method Post -Body (@{} | ConvertTo-Json) -Headers $headers
    Write-Host "✅ BOL generated: $($bolResponse.id)" -ForegroundColor Green
    Write-Host "   Document Type: $($bolResponse.documentType)" -ForegroundColor Gray
    Write-Host "   Status: $($bolResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ BOL generation failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Get load documents
Write-Host "Getting load documents..." -ForegroundColor Yellow
try {
    $documentsResponse = Invoke-RestMethod -Uri "$baseUrl/brokers/documents/load/$loadId" -Method Get -Headers $headers
    Write-Host "✅ Found $($documentsResponse.Count) documents" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get documents: $_" -ForegroundColor Red
    Write-Host ""
}

# ==================== SUMMARY ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All broker critical features have been tested." -ForegroundColor Green
Write-Host "Check the results above for any errors." -ForegroundColor Yellow
Write-Host ""

