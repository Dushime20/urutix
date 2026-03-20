# Quick Verification Script for Broker Endpoints
# This script checks if the new broker endpoints are registered

$baseUrl = "http://localhost:3002/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Broker Endpoints Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login to get token
Write-Host "Step 1: Testing authentication..." -ForegroundColor Yellow
$loginBody = @{
    email = "broker1@test.com"
    password = "test123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Authentication successful" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Authentication failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 2: Check if new endpoints exist
Write-Host "Step 2: Verifying new endpoints..." -ForegroundColor Yellow
Write-Host ""

$endpoints = @(
    @{ Method = "GET"; Path = "/brokers/contracts"; Name = "Get Contracts" },
    @{ Method = "POST"; Path = "/brokers/contracts"; Name = "Create Contract" },
    @{ Method = "POST"; Path = "/brokers/insurance/verify"; Name = "Verify Insurance" },
    @{ Method = "GET"; Path = "/brokers/insurance/compliance/test-id"; Name = "Check Compliance" },
    @{ Method = "POST"; Path = "/brokers/disputes"; Name = "Create Dispute" },
    @{ Method = "GET"; Path = "/brokers/disputes"; Name = "Get Disputes" },
    @{ Method = "POST"; Path = "/brokers/escrow"; Name = "Create Escrow" },
    @{ Method = "GET"; Path = "/brokers/escrow"; Name = "Get Escrow" },
    @{ Method = "POST"; Path = "/brokers/documents/bol/test-id"; Name = "Generate BOL" },
    @{ Method = "GET"; Path = "/brokers/documents/load/test-id"; Name = "Get Documents" }
)

$successCount = 0
$failCount = 0

foreach ($endpoint in $endpoints) {
    $uri = "$baseUrl$($endpoint.Path)"
    Write-Host "Testing: $($endpoint.Method) $($endpoint.Path)..." -NoNewline
    
    try {
        if ($endpoint.Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
        } else {
            # For POST, send empty body to test if endpoint exists
            $response = Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body "{}" -ErrorAction Stop
        }
        
        # If we get here, endpoint exists (even if it returns validation error)
        if ($response.StatusCode -eq 400 -or $response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
            Write-Host " ✅ EXISTS" -ForegroundColor Green
            $successCount++
        } elseif ($response.StatusCode -eq 401) {
            Write-Host " ⚠️  EXISTS (Auth issue)" -ForegroundColor Yellow
            $successCount++
        } else {
            Write-Host " ❌ Status: $($response.StatusCode)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400 -or $statusCode -eq 404) {
            # 400 = Bad Request (endpoint exists, validation failed)
            # 404 = Not Found (endpoint doesn't exist)
            if ($statusCode -eq 400) {
                Write-Host " ✅ EXISTS (validation error expected)" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ❌ NOT FOUND" -ForegroundColor Red
                $failCount++
            }
        } elseif ($statusCode -eq 401) {
            Write-Host " ⚠️  EXISTS (auth required)" -ForegroundColor Yellow
            $successCount++
        } else {
            Write-Host " ❌ Error: $statusCode" -ForegroundColor Red
            $failCount++
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Endpoints Found: $successCount" -ForegroundColor Green
Write-Host "❌ Endpoints Missing: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All endpoints are registered and accessible!" -ForegroundColor Green
    Write-Host "You can now run the full test script: .\test-broker-critical-features.ps1" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some endpoints are missing. Please:" -ForegroundColor Yellow
    Write-Host "   1. Restart the server: npm run start:dev" -ForegroundColor Gray
    Write-Host "   2. Wait for 'Nest application successfully started'" -ForegroundColor Gray
    Write-Host "   3. Run this script again" -ForegroundColor Gray
}
Write-Host ""

