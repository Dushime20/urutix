# Quick test script to verify subdomain setup
# Run this after updating hosts file and restarting backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUBDOMAIN SETUP VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend is NOT running" -ForegroundColor Red
    Write-Host "    Start backend: cd backend && npm run start:dev" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Test 2: Check hosts file entries
Write-Host "Test 2: Checking hosts file entries..." -ForegroundColor Yellow
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath

$requiredSubdomains = @("gasa.localhost", "demo-b.localhost", "admin.localhost")
$missingSubdomains = @()

foreach ($subdomain in $requiredSubdomains) {
    $exists = $hostsContent | Where-Object { $_ -match [regex]::Escape($subdomain) }
    if ($exists) {
        Write-Host "  ✓ $subdomain configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $subdomain NOT configured" -ForegroundColor Red
        $missingSubdomains += $subdomain
    }
}

if ($missingSubdomains.Count -gt 0) {
    Write-Host ""
    Write-Host "  Missing entries! Run update-hosts-file.ps1 as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Test 3: Test subdomain routing
Write-Host "Test 3: Testing subdomain routing..." -ForegroundColor Yellow

# Test with subdomain header
try {
    $headers = @{
        "X-Tenant-Subdomain" = "gasa"
        "Host" = "gasa.localhost"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Headers $headers -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Subdomain header accepted" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Subdomain routing failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check database tenants
Write-Host "Test 4: Checking database tenants..." -ForegroundColor Yellow
try {
    $env:NODE_ENV = "development"
    $output = node backend/check-tenant-subdomains.js 2>&1
    
    if ($output -match "Found (\d+) tenants") {
        $tenantCount = $matches[1]
        Write-Host "  ✓ Found $tenantCount tenants in database" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Could not verify tenants" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Database check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open browser to: http://gasa.localhost:5173" -ForegroundColor White
Write-Host "2. Open DevTools Console (F12)" -ForegroundColor White
Write-Host "3. Check for subdomain detection logs" -ForegroundColor White
Write-Host "4. Check Network tab for X-Tenant-Subdomain header" -ForegroundColor White
Write-Host ""
Write-Host "Available tenant URLs:" -ForegroundColor Cyan
Write-Host "  http://gasa.localhost:5173" -ForegroundColor White
Write-Host "  http://demo-b.localhost:5173" -ForegroundColor White
Write-Host "  http://davidurutix.localhost:5173" -ForegroundColor White
Write-Host "  http://admin.localhost:5173" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
