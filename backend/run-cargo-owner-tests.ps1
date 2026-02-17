# Cargo Owner Test Runner
# Runs all cargo owner tests: unit, integration, and performance

Write-Host "==========================================="  -ForegroundColor Cyan
Write-Host "Cargo Owner Comprehensive Test Suite"  -ForegroundColor Cyan
Write-Host "==========================================="  -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$allTestsPassed = $true

# Test 1: Unit Tests - CargoOwnerGuard
Write-Host "--- Test 1: CargoOwnerGuard Unit Tests ---"  -ForegroundColor Yellow
Write-Host "Running Jest tests for CargoOwnerGuard..."
npm test -- src/guards/__tests__/cargo-owner.guard.spec.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ CargoOwnerGuard unit tests FAILED" -ForegroundColor Red
    $allTestsPassed = $false
} else {
    Write-Host "✅ CargoOwnerGuard unit tests PASSED" -ForegroundColor Green
}
Write-Host ""

# Test 2: Unit Tests - TenantVerificationMiddleware
Write-Host "--- Test 2: TenantVerificationMiddleware Unit Tests ---"  -ForegroundColor Yellow
Write-Host "Running Jest tests for TenantVerificationMiddleware..."
npm test -- src/middleware/__tests__/tenant-verification.middleware.spec.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TenantVerificationMiddleware unit tests FAILED" -ForegroundColor Red
    $allTestsPassed = $false
} else {
    Write-Host "✅ TenantVerificationMiddleware unit tests PASSED" -ForegroundColor Green
}
Write-Host ""

# Test 3: Integration Tests - Security
Write-Host "--- Test 3: Security Integration Tests ---"  -ForegroundColor Yellow
Write-Host "Running security integration tests..."
node test-cargo-owner-security.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Security integration tests FAILED" -ForegroundColor Red
    $allTestsPassed = $false
} else {
    Write-Host "✅ Security integration tests PASSED" -ForegroundColor Green
}
Write-Host ""

# Test 4: Performance Tests
Write-Host "--- Test 4: Performance Tests ---"  -ForegroundColor Yellow
Write-Host "Running performance tests (N+1 query verification)..."
node test-cargo-owner-performance.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Performance tests FAILED" -ForegroundColor Red
    $allTestsPassed = $false
} else {
    Write-Host "✅ Performance tests PASSED" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "==========================================="  -ForegroundColor Cyan
Write-Host "Test Suite Summary"  -ForegroundColor Cyan
Write-Host "==========================================="  -ForegroundColor Cyan

if ($allTestsPassed) {
    Write-Host "✅ ALL TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cargo Owner Priority 1 fixes are verified and working:" -ForegroundColor Green
    Write-Host "  ✓ Authorization guards protecting endpoints" -ForegroundColor Green
    Write-Host "  ✓ Tenant verification preventing cross-tenant access" -ForegroundColor Green
    Write-Host "  ✓ Input validation rejecting invalid data" -ForegroundColor Green
    Write-Host "  ✓ N+1 queries eliminated via eager loading" -ForegroundColor Green
    Write-Host "  ✓ Pagination limits enforced" -ForegroundColor Green
    Write-Host ""
    Write-Host "System is READY FOR PRODUCTION DEPLOYMENT" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the test output above and fix failing tests." -ForegroundColor Yellow
    Write-Host "Do not deploy to production until all tests pass." -ForegroundColor Yellow
    exit 1
}
