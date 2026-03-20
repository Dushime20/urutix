# Simple Phase 1 Integration Test
Write-Host "Phase 1 Integration Testing" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Login
Write-Host "`nStep 1: Login as Super Admin" -ForegroundColor Yellow
$loginBody = @{
    email = "superadmin@urutix.com"
    password = "SuperAdmin@123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $login.accessToken
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "OK Login successful" -ForegroundColor Green
}
catch {
    Write-Host "X Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test System Health
Write-Host "`nStep 2: Test System Health" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/admin/system-health/enhanced/current" -Headers $headers
    Write-Host "OK System Health: CPU $($health.server.cpuUsage)%, Memory $($health.server.memoryUsage)%" -ForegroundColor Green
}
catch {
    Write-Host "X System Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Tenants
Write-Host "`nStep 3: Test Tenant Management" -ForegroundColor Yellow
try {
    $tenants = Invoke-RestMethod -Uri "$baseUrl/api/admin/tenant-management" -Headers $headers
    Write-Host "OK Found $($tenants.Count) tenants" -ForegroundColor Green
}
catch {
    Write-Host "X Tenant Management failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Security Center
Write-Host "`nStep 4: Test Security Center" -ForegroundColor Yellow
try {
    $events = Invoke-RestMethod -Uri "$baseUrl/api/admin/security-center/events" -Headers $headers
    Write-Host "OK Found $($events.Count) security events" -ForegroundColor Green
}
catch {
    Write-Host "X Security Center failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $sessions = Invoke-RestMethod -Uri "$baseUrl/api/admin/security-center/sessions" -Headers $headers
    Write-Host "OK Found $($sessions.Count) active sessions" -ForegroundColor Green
}
catch {
    Write-Host "X Active Sessions failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test RBAC
Write-Host "`nStep 5: Test RBAC Protection" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/system-health/enhanced/current" -Method GET
    Write-Host "X Endpoint not protected!" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "OK Endpoint properly protected (401)" -ForegroundColor Green
    }
}

Write-Host "`nOK Phase 1 Integration Tests Complete" -ForegroundColor Green
