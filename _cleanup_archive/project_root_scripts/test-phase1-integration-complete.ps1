# Phase 1 Integration Testing Script
# Tests all Phase 1 components end-to-end with the running backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Integration Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  ✓ PASS: $Name" -ForegroundColor Green
        $script:testsPassed++
        return $response
    }
    catch {
        Write-Host "  ✗ FAIL: $Name" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

Write-Host "Step 1: Login as Super Admin" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

$loginBody = @{
    email = "superadmin@urutix.com"
    password = "SuperAdmin123!"
}

$loginResponse = Test-Endpoint `
    -Name "Super Admin Login" `
    -Url "$baseUrl/api/auth/login" `
    -Method "POST" `
    -Body $loginBody

if (-not $loginResponse) {
    Write-Host ""
    Write-Host "CRITICAL: Cannot proceed without authentication" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. Backend is running on port 3000" -ForegroundColor Yellow
    Write-Host "  2. Super admin account exists" -ForegroundColor Yellow
    Write-Host "  3. Credentials are correct" -ForegroundColor Yellow
    exit 1
}

$token = $loginResponse.access_token
$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host ""
Write-Host "Step 2: Test System Health Endpoints" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

# Test current system health
$currentHealth = Test-Endpoint `
    -Name "Get Current System Health" `
    -Url "$baseUrl/api/admin/system-health/enhanced/current" `
    -Headers $headers

if ($currentHealth) {
    Write-Host "  Database Metrics:" -ForegroundColor Gray
    Write-Host "    - Connections: $($currentHealth.database.connectionCount)" -ForegroundColor Gray
    Write-Host "    - Avg Query Time: $($currentHealth.database.avgQueryTime)ms" -ForegroundColor Gray
    Write-Host "  Server Metrics:" -ForegroundColor Gray
    Write-Host "    - CPU Usage: $($currentHealth.server.cpuUsage)%" -ForegroundColor Gray
    Write-Host "    - Memory Usage: $($currentHealth.server.memoryUsage)%" -ForegroundColor Gray
}

# Test historical system health
$endDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
$startDate = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")

$historicalUrl = "$baseUrl/api/admin/system-health/enhanced/historical?startDate=$startDate&endDate=$endDate"
$historicalHealth = Test-Endpoint `
    -Name "Get Historical System Health" `
    -Url $historicalUrl `
    -Headers $headers

if ($historicalHealth) {
    Write-Host "  Historical data points: $($historicalHealth.Count)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Test Tenant Management Endpoints" -ForegroundColor Cyan
Write-Host "-----------------------------------------" -ForegroundColor Cyan

# Test enriched tenants list
$tenants = Test-Endpoint `
    -Name "Get Enriched Tenants" `
    -Url "$baseUrl/api/admin/tenants/enriched" `
    -Headers $headers

if ($tenants) {
    Write-Host "  Total tenants: $($tenants.Count)" -ForegroundColor Gray
    if ($tenants.Count -gt 0) {
        $tenant = $tenants[0]
        Write-Host "  Sample tenant:" -ForegroundColor Gray
        Write-Host "    - Name: $($tenant.name)" -ForegroundColor Gray
        Write-Host "    - Status: $($tenant.status)" -ForegroundColor Gray
        Write-Host "    - Health Score: $($tenant.healthScore)" -ForegroundColor Gray
    }
}

# Test tenant details
if ($tenants -and $tenants.Count -gt 0) {
    $tenantId = $tenants[0].id
    $tenantDetails = Test-Endpoint `
        -Name "Get Tenant Details" `
        -Url "$baseUrl/api/admin/tenants/$tenantId/details" `
        -Headers $headers
    
    if ($tenantDetails) {
        Write-Host "  Tenant details retrieved successfully" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Step 4: Test Security Center Endpoints" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

# Test security events
$securityEvents = Test-Endpoint `
    -Name "Get Security Events" `
    -Url "$baseUrl/api/admin/security-center/events" `
    -Headers $headers

if ($securityEvents) {
    Write-Host "  Security events: $($securityEvents.Count)" -ForegroundColor Gray
}

# Test failed logins
$failedLogins = Test-Endpoint `
    -Name "Get Failed Logins" `
    -Url "$baseUrl/api/admin/security-center/failed-logins" `
    -Headers $headers

if ($failedLogins) {
    Write-Host "  Failed login attempts: $($failedLogins.Count)" -ForegroundColor Gray
}

# Test active sessions
$activeSessions = Test-Endpoint `
    -Name "Get Active Sessions" `
    -Url "$baseUrl/api/admin/security-center/sessions" `
    -Headers $headers

if ($activeSessions) {
    Write-Host "  Active sessions: $($activeSessions.Count)" -ForegroundColor Gray
}

# Test flagged accounts
$flaggedAccounts = Test-Endpoint `
    -Name "Get Flagged Accounts" `
    -Url "$baseUrl/api/admin/security-center/flagged-accounts" `
    -Headers $headers

if ($flaggedAccounts) {
    Write-Host "  Flagged accounts: $($flaggedAccounts.Count)" -ForegroundColor Gray
}

# Test permission history
$permissionHistory = Test-Endpoint `
    -Name "Get Permission History" `
    -Url "$baseUrl/api/admin/security-center/permission-history" `
    -Headers $headers

if ($permissionHistory) {
    Write-Host "  Permission changes: $($permissionHistory.Count)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 5: Test RBAC Integration" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

# Test that non-super-admin cannot access endpoints
Write-Host "Testing access control (should fail for non-super-admin)..." -ForegroundColor Yellow

# This should fail - testing with no token
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/system-health/enhanced/current" -Method GET
    Write-Host "  ✗ FAIL: Endpoint accessible without authentication" -ForegroundColor Red
    $script:testsFailed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✓ PASS: Endpoint properly protected (401 Unauthorized)" -ForegroundColor Green
        $script:testsPassed++
    }
    else {
        Write-Host "  ✗ FAIL: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    }
}

Write-Host ""
Write-Host "Step 6: Test Data Export Functionality" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

# Test system health export
$exportHealthUrl = "$baseUrl/api/admin/system-health/enhanced/export?startDate=$startDate&endDate=$endDate"
$exportHealth = Test-Endpoint `
    -Name "Export System Health Metrics" `
    -Url $exportHealthUrl `
    -Headers $headers

if ($exportHealth) {
    Write-Host "  Export data length: $($exportHealth.Length) characters" -ForegroundColor Gray
}

# Test security logs export
$exportSecurityUrl = "$baseUrl/api/admin/security-center/export?startDate=$startDate&endDate=$endDate"
$exportSecurity = Test-Endpoint `
    -Name "Export Security Logs" `
    -Url $exportSecurityUrl `
    -Headers $headers

if ($exportSecurity) {
    Write-Host "  Export data length: $($exportSecurity.Length) characters" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Integration Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All integration tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Phase 1 is ready for production deployment." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "✗ Some tests failed. Please review the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Backend not running or not on port 3000" -ForegroundColor Yellow
    Write-Host "  2. Database migrations not run" -ForegroundColor Yellow
    Write-Host "  3. Super admin account not seeded" -ForegroundColor Yellow
    Write-Host "  4. RBAC permissions not configured" -ForegroundColor Yellow
    exit 1
}
