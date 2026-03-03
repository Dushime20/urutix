# Phase 1 Integration Test Script
# Tests all Phase 1 Super Admin Enhancement APIs

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Token = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Integration Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if token is provided
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "ERROR: Please provide a Super Admin token" -ForegroundColor Red
    Write-Host "Usage: .\test-phase1-integration.ps1 -Token 'YOUR_TOKEN'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get a token:" -ForegroundColor Yellow
    Write-Host "1. Login as Super Admin at http://localhost:5173" -ForegroundColor Yellow
    Write-Host "2. Open browser DevTools > Application > Local Storage" -ForegroundColor Yellow
    Write-Host "3. Copy the 'accessToken' value" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    try {
        Write-Host "Testing: $Name..." -NoNewline
        
        $params = @{
            Uri = "$BaseUrl$Url"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host " ✓ PASS" -ForegroundColor Green
        $script:testsPassed++
        return $response
    }
    catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

Write-Host "1. System Health API Tests" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan

$currentMetrics = Test-Endpoint `
    -Name "Get current system metrics" `
    -Url "/api/admin/enhanced-system-health/current"

if ($currentMetrics) {
    Write-Host "  Database connections: $($currentMetrics.database.connectionCount)" -ForegroundColor Gray
    Write-Host "  CPU usage: $($currentMetrics.server.cpuUsage)%" -ForegroundColor Gray
    Write-Host "  Memory usage: $($currentMetrics.server.memoryUsage)%" -ForegroundColor Gray
}

$historicalMetrics = Test-Endpoint `
    -Name "Get historical metrics (24h)" `
    -Url "/api/admin/enhanced-system-health/historical?hours=24"

if ($historicalMetrics) {
    Write-Host "  Data points: $($historicalMetrics.Count)" -ForegroundColor Gray
}

Test-Endpoint `
    -Name "Get metrics by category (database)" `
    -Url "/api/admin/enhanced-system-health/metrics/database"

Write-Host ""
Write-Host "2. Tenant Management API Tests" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan

$enrichedTenants = Test-Endpoint `
    -Name "Get all tenants (enriched)" `
    -Url "/api/admin/tenant-management"

if ($enrichedTenants) {
    Write-Host "  Total tenants: $($enrichedTenants.Count)" -ForegroundColor Gray
    if ($enrichedTenants.Count -gt 0) {
        $tenant = $enrichedTenants[0]
        Write-Host "  First tenant: $($tenant.name)" -ForegroundColor Gray
        Write-Host "  Health score: $($tenant.healthScore)" -ForegroundColor Gray
        Write-Host "  Credit balance: $($tenant.credits.balance)" -ForegroundColor Gray
        
        # Test tenant details
        Test-Endpoint `
            -Name "Get tenant details" `
            -Url "/api/admin/tenant-management/$($tenant.id)"
        
        # Test tenant health
        Test-Endpoint `
            -Name "Get tenant health score" `
            -Url "/api/admin/tenant-management/$($tenant.id)/health"
        
        # Test tenant resources
        Test-Endpoint `
            -Name "Get tenant resources" `
            -Url "/api/admin/tenant-management/$($tenant.id)/resources"
    }
}

Test-Endpoint `
    -Name "Get all tenant health scores" `
    -Url "/api/admin/tenant-management/health/all"

Test-Endpoint `
    -Name "Search tenants" `
    -Url "/api/admin/tenant-management?search=test"

Test-Endpoint `
    -Name "Filter tenants by status" `
    -Url "/api/admin/tenant-management?status=ACTIVE"

Write-Host ""
Write-Host "3. Security Center API Tests" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Cyan

$securityEvents = Test-Endpoint `
    -Name "Get security events" `
    -Url "/api/admin/security-center/events"

if ($securityEvents) {
    Write-Host "  Total events: $($securityEvents.Count)" -ForegroundColor Gray
}

Test-Endpoint `
    -Name "Get security events (high severity)" `
    -Url "/api/admin/security-center/events?severity=high"

$failedLogins = Test-Endpoint `
    -Name "Get failed login attempts" `
    -Url "/api/admin/security-center/failed-logins"

if ($failedLogins) {
    Write-Host "  Failed logins: $($failedLogins.Count)" -ForegroundColor Gray
}

$activeSessions = Test-Endpoint `
    -Name "Get active sessions" `
    -Url "/api/admin/security-center/sessions"

if ($activeSessions) {
    Write-Host "  Active sessions: $($activeSessions.Count)" -ForegroundColor Gray
}

$flaggedAccounts = Test-Endpoint `
    -Name "Get flagged accounts" `
    -Url "/api/admin/security-center/flagged-accounts"

if ($flaggedAccounts) {
    Write-Host "  Flagged accounts: $($flaggedAccounts.Count)" -ForegroundColor Gray
}

$permissionHistory = Test-Endpoint `
    -Name "Get permission history" `
    -Url "/api/admin/security-center/permission-history"

if ($permissionHistory) {
    Write-Host "  Permission changes: $($permissionHistory.Count)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All integration tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some tests failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
