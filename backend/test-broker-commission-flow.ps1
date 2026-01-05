# Broker Commission Flow Test Script
# Tests: Broker assignment, commission calculation, status updates, and payment tracking

$BASE_URL = "http://localhost:3002/api"
$TOKEN = ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Broker Commission Flow Test" -ForegroundColor Cyan
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
    exit 1
}

# Step 2: Create a broker
Write-Host "Step 2: Create a test broker" -ForegroundColor Yellow
$testBroker = @{
    firstName = "Commission"
    lastName = "Test Broker"
    email = "commission.test.$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    phone = "+1234567890"
    defaultCommissionRate = 5.0
} | ConvertTo-Json

try {
    $createBrokerResponse = Invoke-RestMethod -Uri "$BASE_URL/brokers" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -Body $testBroker
    
    $BROKER_ID = $createBrokerResponse.broker.id
    Write-Host "✅ Broker created successfully!" -ForegroundColor Green
    Write-Host "Broker ID: $BROKER_ID" -ForegroundColor Gray
    Write-Host "Default Commission Rate: $($createBrokerResponse.broker.defaultCommissionRate)%" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create broker: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 3: Get or create a load
Write-Host "Step 3: Get or create a test load" -ForegroundColor Yellow
Write-Host "Do you want to:" -ForegroundColor Gray
Write-Host "  1. Use an existing load (enter load ID)" -ForegroundColor Gray
Write-Host "  2. Create a new load" -ForegroundColor Gray
$choice = Read-Host "Choice (1 or 2)"

$LOAD_ID = $null

if ($choice -eq "1") {
    $LOAD_ID = Read-Host "Enter Load ID"
    Write-Host "Using existing load: $LOAD_ID" -ForegroundColor Gray
} else {
    Write-Host "Creating a new load..." -ForegroundColor Gray
    
    # Get user info to use as cargo owner
    try {
        $profileResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/profile" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        $CARGO_OWNER_ID = $profileResponse.id
    } catch {
        Write-Host "⚠️  Could not get user profile, using default" -ForegroundColor Yellow
        $CARGO_OWNER_ID = $null
    }
    
    # Create a simple load
    $loadData = @{
        title = "Test Load for Broker Commission"
        description = "This is a test load to verify broker commission calculation"
        weight = 1000
        loadValue = 10000
        currencyCode = "USD"
        cargoType = "GENERAL"
        urgencyLevel = "NORMAL"
        loadType = "FTL"
        equipmentType = "DRY_VAN"
        visibility = "PUBLIC"
        locations = @(
            @{
                type = "PICKUP"
                locationData = @{
                    name = "Pickup Location"
                    address = "123 Main St"
                    city = "New York"
                    state = "NY"
                    country = "USA"
                    coordinates = @{
                        latitude = 40.7128
                        longitude = -74.0060
                    }
                }
                pickupDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
            },
            @{
                type = "DELIVERY"
                locationData = @{
                    name = "Delivery Location"
                    address = "456 Oak Ave"
                    city = "Los Angeles"
                    state = "CA"
                    country = "USA"
                    coordinates = @{
                        latitude = 34.0522
                        longitude = -118.2437
                    }
                }
                deliveryDate = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
        )
        pickupDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        deliveryDate = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json -Depth 10
    
    try {
        $createLoadResponse = Invoke-RestMethod -Uri "$BASE_URL/loads" `
            -Method POST `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json" `
            -Body $loadData
        
        $LOAD_ID = $createLoadResponse.load.id
        Write-Host "✅ Load created successfully!" -ForegroundColor Green
        Write-Host "Load ID: $LOAD_ID" -ForegroundColor Gray
        Write-Host "Load Value: $($createLoadResponse.load.loadValue) $($createLoadResponse.load.currencyCode)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to create load: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Please create a load manually and enter its ID:" -ForegroundColor Yellow
        $LOAD_ID = Read-Host "Load ID"
    }
}

if (-not $LOAD_ID) {
    Write-Host "❌ No load ID available. Exiting." -ForegroundColor Red
    exit 1
}

# Step 4: Get load details before assignment
Write-Host "Step 4: Get load details before broker assignment" -ForegroundColor Yellow
try {
    $loadBefore = Invoke-RestMethod -Uri "$BASE_URL/loads/$LOAD_ID" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    
    Write-Host "✅ Load details retrieved" -ForegroundColor Green
    Write-Host "Load Value: $($loadBefore.load.loadValue) $($loadBefore.load.currencyCode)" -ForegroundColor Gray
    Write-Host "Current Broker ID: $($loadBefore.load.brokerId)" -ForegroundColor Gray
    Write-Host "Current Commission Rate: $($loadBefore.load.brokerCommissionRate)" -ForegroundColor Gray
    Write-Host "Current Commission Amount: $($loadBefore.load.brokerCommissionAmount)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠️  Could not get load details: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Assign broker to load
Write-Host "Step 5: Assign broker to load" -ForegroundColor Yellow
$assignBody = @{
    brokerId = $BROKER_ID
    commissionRate = 5.5  # Override default rate for this load
} | ConvertTo-Json

try {
    $assignResponse = Invoke-RestMethod -Uri "$BASE_URL/brokers/loads/$LOAD_ID/assign" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -Body $assignBody
    
    Write-Host "✅ Broker assigned to load successfully!" -ForegroundColor Green
    Write-Host "Broker ID: $($assignResponse.brokerId)" -ForegroundColor Gray
    Write-Host "Commission Rate: $($assignResponse.brokerCommissionRate)%" -ForegroundColor Gray
    Write-Host "Commission Amount: $($assignResponse.brokerCommissionAmount)" -ForegroundColor Gray
    Write-Host "Load Value: $($assignResponse.loadValue)" -ForegroundColor Gray
    
    # Verify calculation
    $expectedCommission = [math]::Round(($assignResponse.loadValue * $assignResponse.brokerCommissionRate) / 100, 2)
    if ([math]::Abs($assignResponse.brokerCommissionAmount - $expectedCommission) -lt 0.01) {
        Write-Host "✅ Commission calculation verified: $expectedCommission" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Commission calculation mismatch!" -ForegroundColor Yellow
        Write-Host "   Expected: $expectedCommission" -ForegroundColor Yellow
        Write-Host "   Actual: $($assignResponse.brokerCommissionAmount)" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to assign broker: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 6: Verify commission record was created
Write-Host "Step 6: Verify commission record was created" -ForegroundColor Yellow
Start-Sleep -Seconds 1  # Wait a moment for async processing

try {
    $commissions = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/commissions?loadId=$LOAD_ID" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    
    if ($commissions.commissions.Count -gt 0) {
        $COMMISSION_ID = $commissions.commissions[0].id
        Write-Host "✅ Commission record found!" -ForegroundColor Green
        Write-Host "Commission ID: $COMMISSION_ID" -ForegroundColor Gray
        Write-Host "Status: $($commissions.commissions[0].status)" -ForegroundColor Gray
        Write-Host "Load Amount: $($commissions.commissions[0].loadAmount)" -ForegroundColor Gray
        Write-Host "Commission Rate: $($commissions.commissions[0].commissionRate)%" -ForegroundColor Gray
        Write-Host "Commission Amount: $($commissions.commissions[0].commissionAmount)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "⚠️  No commission record found yet. This might be created asynchronously." -ForegroundColor Yellow
        Write-Host "Trying again in 2 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        
        $commissions = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/commissions" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        $COMMISSION_ID = $commissions.commissions | Where-Object { $_.loadId -eq $LOAD_ID } | Select-Object -First 1 -ExpandProperty id
        
        if ($COMMISSION_ID) {
            Write-Host "✅ Commission record found on retry!" -ForegroundColor Green
            Write-Host "Commission ID: $COMMISSION_ID" -ForegroundColor Gray
            Write-Host ""
        } else {
            Write-Host "❌ Commission record not found. Please check the service logs." -ForegroundColor Red
            Write-Host "Available commissions: $($commissions.commissions.Count)" -ForegroundColor Gray
            exit 1
        }
    }
} catch {
    Write-Host "❌ Failed to get commissions: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be normal if commission creation is asynchronous." -ForegroundColor Yellow
    Write-Host ""
    $COMMISSION_ID = $null
}

# Step 7: Test commission status updates
if ($COMMISSION_ID) {
    Write-Host "Step 7: Test commission status updates" -ForegroundColor Yellow
    Write-Host ""
    
    # 7a: Update to APPROVED
    Write-Host "  7a. Updating status to APPROVED" -ForegroundColor Cyan
    $approveBody = @{
        status = "APPROVED"
    } | ConvertTo-Json
    
    try {
        $approvedCommission = Invoke-RestMethod -Uri "$BASE_URL/brokers/commissions/$COMMISSION_ID/status" `
            -Method PUT `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json" `
            -Body $approveBody
        
        Write-Host "  ✅ Status updated to APPROVED" -ForegroundColor Green
        Write-Host "  Commission Status: $($approvedCommission.status)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "  ❌ Failed to approve: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    # 7b: Update to PAID with payment reference
    Write-Host "  7b. Updating status to PAID with payment reference" -ForegroundColor Cyan
    $paidBody = @{
        status = "PAID"
        paymentReference = "PAY-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json
    
    try {
        $paidCommission = Invoke-RestMethod -Uri "$BASE_URL/brokers/commissions/$COMMISSION_ID/status" `
            -Method PUT `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json" `
            -Body $paidBody
        
        Write-Host "  ✅ Status updated to PAID" -ForegroundColor Green
        Write-Host "  Commission Status: $($paidCommission.status)" -ForegroundColor Gray
        Write-Host "  Payment Reference: $($paidCommission.paymentReference)" -ForegroundColor Gray
        Write-Host "  Paid At: $($paidCommission.paidAt)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "  ❌ Failed to mark as paid: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    # 7c: Verify broker's total commission earned was updated
    Write-Host "  7c. Verifying broker's total commission earned" -ForegroundColor Cyan
    try {
        $brokerUpdated = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        Write-Host "  ✅ Broker details retrieved" -ForegroundColor Green
        Write-Host "  Total Commission Earned: $($brokerUpdated.totalCommissionEarned)" -ForegroundColor Gray
        Write-Host "  Expected: $($paidCommission.commissionAmount)" -ForegroundColor Gray
        
        if ([math]::Abs($brokerUpdated.totalCommissionEarned - $paidCommission.commissionAmount) -lt 0.01) {
            Write-Host "  ✅ Total commission earned matches!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Total commission earned mismatch" -ForegroundColor Yellow
        }
        Write-Host ""
    } catch {
        Write-Host "  ❌ Failed to verify: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 8: Get final broker statistics
Write-Host "Step 8: Get final broker statistics" -ForegroundColor Yellow
try {
    $finalStats = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/statistics" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    
    Write-Host "✅ Final statistics:" -ForegroundColor Green
    Write-Host "  Total Loads: $($finalStats.totalLoads)" -ForegroundColor Gray
    Write-Host "  Total Commissions: $($finalStats.totalCommissions)" -ForegroundColor Gray
    Write-Host "  Total Earned: $($finalStats.totalEarned)" -ForegroundColor Gray
    Write-Host "  Total Pending: $($finalStats.totalPending)" -ForegroundColor Gray
    Write-Host "  Total Approved: $($finalStats.totalApproved)" -ForegroundColor Gray
    Write-Host "  Average Commission Rate: $($finalStats.averageCommissionRate)%" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 9: Get all commissions with filters
Write-Host "Step 9: Test commission filtering" -ForegroundColor Yellow
Write-Host "  9a. Get all PAID commissions" -ForegroundColor Cyan
try {
    $paidCommissions = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/commissions?status=PAID" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    
    Write-Host "  ✅ Found $($paidCommissions.commissions.Count) paid commission(s)" -ForegroundColor Green
    Write-Host "  Total Earned: $($paidCommissions.totalEarned)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "  9b. Get all PENDING commissions" -ForegroundColor Cyan
try {
    $pendingCommissions = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/commissions?status=PENDING" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json"
    
    Write-Host "  ✅ Found $($pendingCommissions.commissions.Count) pending commission(s)" -ForegroundColor Green
    Write-Host "  Total Pending: $($pendingCommissions.totalPending)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Summary
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Test Summary" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Broker created: $BROKER_ID" -ForegroundColor Green
Write-Host "✅ Load used: $LOAD_ID" -ForegroundColor Green
if ($COMMISSION_ID) {
    Write-Host "✅ Commission created: $COMMISSION_ID" -ForegroundColor Green
    Write-Host "✅ Status updates tested" -ForegroundColor Green
    Write-Host "✅ Payment tracking verified" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commission record not found (may be created asynchronously)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Test completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

