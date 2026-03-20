# Commission Calculation Verification Test
# This script specifically tests commission calculation accuracy

$BASE_URL = "http://localhost:3002/api"
$TOKEN = ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Commission Calculation Verification Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "Login" -ForegroundColor Yellow
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

# Create broker
Write-Host "Creating test broker..." -ForegroundColor Yellow
$testBroker = @{
    firstName = "Calc"
    lastName = "Test Broker"
    email = "calc.test.$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    defaultCommissionRate = 5.0
} | ConvertTo-Json

try {
    $createBrokerResponse = Invoke-RestMethod -Uri "$BASE_URL/brokers" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $TOKEN" } `
        -ContentType "application/json" `
        -Body $testBroker
    
    $BROKER_ID = $createBrokerResponse.broker.id
    Write-Host "✅ Broker created: $BROKER_ID" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create broker: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test cases for commission calculation
$testCases = @(
    @{ loadValue = 10000; commissionRate = 5.0; expected = 500 },
    @{ loadValue = 25000; commissionRate = 7.5; expected = 1875 },
    @{ loadValue = 5000; commissionRate = 3.0; expected = 150 },
    @{ loadValue = 100000; commissionRate = 10.0; expected = 10000 },
    @{ loadValue = 1500; commissionRate = 2.5; expected = 37.5 }
)

Write-Host "Testing commission calculations with multiple loads..." -ForegroundColor Yellow
Write-Host ""

$results = @()

foreach ($testCase in $testCases) {
    Write-Host "Test Case: Load Value = $($testCase.loadValue), Rate = $($testCase.commissionRate)%" -ForegroundColor Cyan
    
    # Create a load
    $loadData = @{
        title = "Test Load - $($testCase.loadValue)"
        description = "Commission calculation test"
        weight = 1000
        loadValue = $testCase.loadValue
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
                    name = "Pickup"
                    address = "123 Main St"
                    city = "New York"
                    state = "NY"
                    country = "USA"
                    coordinates = @{ latitude = 40.7128; longitude = -74.0060 }
                }
                pickupDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
            },
            @{
                type = "DELIVERY"
                locationData = @{
                    name = "Delivery"
                    address = "456 Oak Ave"
                    city = "Los Angeles"
                    state = "CA"
                    country = "USA"
                    coordinates = @{ latitude = 34.0522; longitude = -118.2437 }
                }
                deliveryDate = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
        )
        pickupDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        deliveryDate = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json -Depth 10
    
    try {
        $loadResponse = Invoke-RestMethod -Uri "$BASE_URL/loads" `
            -Method POST `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json" `
            -Body $loadData
        
        $LOAD_ID = $loadResponse.load.id
        
        # Assign broker with specific commission rate
        $assignBody = @{
            brokerId = $BROKER_ID
            commissionRate = $testCase.commissionRate
        } | ConvertTo-Json
        
        Start-Sleep -Milliseconds 500  # Small delay
        
        $assignResponse = Invoke-RestMethod -Uri "$BASE_URL/brokers/loads/$LOAD_ID/assign" `
            -Method POST `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json" `
            -Body $assignBody
        
        $actualCommission = $assignResponse.brokerCommissionAmount
        $calculatedCommission = [math]::Round(($testCase.loadValue * $testCase.commissionRate) / 100, 2)
        
        $isCorrect = [math]::Abs($actualCommission - $testCase.expected) -lt 0.01
        
        $result = @{
            LoadValue = $testCase.loadValue
            CommissionRate = $testCase.commissionRate
            Expected = $testCase.expected
            Actual = $actualCommission
            Calculated = $calculatedCommission
            IsCorrect = $isCorrect
        }
        
        $results += $result
        
        if ($isCorrect) {
            Write-Host "  ✅ PASS: Expected $($testCase.expected), Got $actualCommission" -ForegroundColor Green
        } else {
            Write-Host "  ❌ FAIL: Expected $($testCase.expected), Got $actualCommission" -ForegroundColor Red
        }
        
        # Verify commission record
        Start-Sleep -Seconds 1
        $commissions = Invoke-RestMethod -Uri "$BASE_URL/brokers/$BROKER_ID/commissions?loadId=$LOAD_ID" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $TOKEN" } `
            -ContentType "application/json"
        
        if ($commissions.commissions.Count -gt 0) {
            $commissionRecord = $commissions.commissions[0]
            if ([math]::Abs($commissionRecord.commissionAmount - $testCase.expected) -lt 0.01) {
                Write-Host "  ✅ Commission record verified" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Commission record mismatch: $($commissionRecord.commissionAmount)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️  Commission record not found yet" -ForegroundColor Yellow
        }
        
        Write-Host ""
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.IsCorrect }).Count
$failed = ($results | Where-Object { -not $_.IsCorrect }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor Gray
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✅ All commission calculations are correct!" -ForegroundColor Green
} else {
    Write-Host "❌ Some calculations failed. Details:" -ForegroundColor Red
    $results | Where-Object { -not $_.IsCorrect } | ForEach-Object {
        Write-Host "  Load Value: $($_.LoadValue), Rate: $($_.CommissionRate)%, Expected: $($_.Expected), Got: $($_.Actual)" -ForegroundColor Red
    }
}

Write-Host "=========================================" -ForegroundColor Cyan

