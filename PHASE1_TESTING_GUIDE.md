# Phase 1 Testing Guide

## Overview

This guide provides instructions for completing Tasks 6.4 (Frontend Unit Tests) and 7.1 (Integration Testing) for the Super Admin Enhancement Phase 1.

## Task 6.4: Frontend Unit Tests

### Prerequisites

Ensure you have the testing dependencies installed:

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/ui jsdom
```

### Test Files to Create

#### 1. SystemHealthDashboard.test.tsx

**Location**: `frontend/src/pages/admin/__tests__/SystemHealthDashboard.test.tsx`

**Test Cases**:
- ✓ Renders dashboard with loading state
- ✓ Displays system metrics when data loads
- ✓ Shows threshold violations with correct severity colors
- ✓ Auto-refresh triggers data refetch
- ✓ Export button is clickable
- ✓ Handles API errors gracefully
- ✓ Displays historical trends chart

**Run Command**:
```bash
npm test SystemHealthDashboard.test.tsx
```

#### 2. AdminTenants.test.tsx

**Location**: `frontend/src/pages/__tests__/AdminTenants.test.tsx`

**Test Cases**:
- ✓ Renders tenant list with basic data
- ✓ Toggle between basic and enriched views
- ✓ Health scores display with correct colors
- ✓ Search filters tenants correctly
- ✓ Status filter works
- ✓ Create tenant modal opens and validates
- ✓ Edit tenant modal populates with data
- ✓ Handles empty tenant list
- ✓ Shows loading spinner while fetching

**Run Command**:
```bash
npm test AdminTenants.test.tsx
```

#### 3. SecurityCenter.test.tsx

**Location**: `frontend/src/pages/admin/__tests__/SecurityCenter.test.tsx`

**Test Cases**:
- ✓ Renders all 5 tabs
- ✓ Tab switching works correctly
- ✓ Security events display with severity colors
- ✓ Failed logins table renders
- ✓ Active sessions table shows data
- ✓ Session termination button triggers API call
- ✓ Flagged accounts display correctly
- ✓ Permission history shows RBAC changes
- ✓ Export button works
- ✓ Severity filter updates results

**Run Command**:
```bash
npm test SecurityCenter.test.tsx
```

### Running All Tests

```bash
# Run all Phase 1 frontend tests
npm test -- --run

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test
```

### Expected Coverage

- Minimum 80% line coverage
- All critical user interactions tested
- Error states covered
- Loading states covered

## Task 7.1: Integration Testing

### Manual Integration Testing Checklist

#### Prerequisites

1. **Start Backend**:
```bash
cd backend
npm run start:dev
```

2. **Start Frontend**:
```bash
cd frontend
npm run dev
```

3. **Login as Super Admin**:
- Email: `superadmin@urutix.com`
- Password: (from SUPER_ADMIN_CREDENTIALS.md)

### Test Scenarios

#### Scenario 1: System Health Dashboard

**Steps**:
1. Navigate to `/admin/system-health`
2. Verify dashboard loads within 2 seconds
3. Check that all metric cards display data
4. Verify charts render correctly
5. Wait 30 seconds and confirm auto-refresh works
6. Click export button and verify CSV downloads
7. Check browser console for errors

**Expected Results**:
- ✓ All metrics display real data
- ✓ No console errors
- ✓ Charts are interactive
- ✓ Auto-refresh updates data
- ✓ Export generates valid CSV

#### Scenario 2: Enhanced Tenant Management

**Steps**:
1. Navigate to `/admin/tenants`
2. Verify tenant list loads
3. Click "Enhanced View" toggle
4. Verify health scores appear
5. Verify credit balances display
6. Verify active user counts show
7. Search for a tenant by name
8. Filter by status
9. Click on a tenant to view details
10. Edit a tenant and save changes

**Expected Results**:
- ✓ Toggle switches between views
- ✓ Health scores show with colors
- ✓ Credits display correctly
- ✓ Search works instantly
- ✓ Filters update list
- ✓ Details modal opens
- ✓ Edit saves successfully

#### Scenario 3: Security Center

**Steps**:
1. Navigate to `/admin/security-center`
2. Verify "Security Events" tab loads
3. Click through all 5 tabs
4. Filter events by severity
5. View failed login attempts
6. Check active sessions
7. Attempt to terminate a session
8. View flagged accounts
9. Check permission history
10. Export security logs

**Expected Results**:
- ✓ All tabs load without errors
- ✓ Data displays in tables
- ✓ Filters work correctly
- ✓ Session termination triggers confirmation
- ✓ Export generates CSV

#### Scenario 4: Cross-Component Integration

**Steps**:
1. View system health → Note any issues
2. Go to tenants → Check if health scores reflect system state
3. Go to security center → Verify your login appears in active sessions
4. Make a change in tenant management
5. Check if activity appears in security center permission history

**Expected Results**:
- ✓ Data consistency across components
- ✓ Real-time updates work
- ✓ Activity logging captures actions

### API Integration Tests

#### Test Backend Endpoints

Create a test script: `test-phase1-integration.ps1`

```powershell
# Test System Health API
Write-Host "Testing System Health API..." -ForegroundColor Cyan
$token = "YOUR_SUPER_ADMIN_TOKEN"
$headers = @{ "Authorization" = "Bearer $token" }

# Test current metrics
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/enhanced-system-health/current" -Headers $headers
Write-Host "✓ Current metrics: $($response.database.connectionCount) connections" -ForegroundColor Green

# Test historical metrics
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/enhanced-system-health/historical?hours=24" -Headers $headers
Write-Host "✓ Historical metrics: $($response.Length) data points" -ForegroundColor Green

# Test Tenant Management API
Write-Host "`nTesting Tenant Management API..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/tenant-management" -Headers $headers
Write-Host "✓ Enriched tenants: $($response.Length) tenants" -ForegroundColor Green

# Test Security Center API
Write-Host "`nTesting Security Center API..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/security-center/events" -Headers $headers
Write-Host "✓ Security events: $($response.Length) events" -ForegroundColor Green

Write-Host "`n✓ All API integration tests passed!" -ForegroundColor Green
```

### Performance Testing

#### Load Testing

Test with multiple concurrent users:

```bash
# Install artillery if not already installed
npm install -g artillery

# Create artillery config: artillery-phase1.yml
# Run load test
artillery run artillery-phase1.yml
```

**Performance Targets**:
- Dashboard load time: < 2 seconds
- Tenant list (1000 tenants): < 3 seconds
- Security events query: < 1 second
- API response time (p95): < 500ms

### Browser Compatibility Testing

Test in:
- ✓ Chrome (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)

### Mobile Responsive Testing

Test on:
- ✓ Desktop (1920x1080)
- ✓ Tablet (768x1024)
- ✓ Mobile (375x667)

## Validation Checklist

### Frontend Tests (Task 6.4)

- [ ] All test files created
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] No console warnings in tests
- [ ] Tests run in CI/CD pipeline

### Integration Tests (Task 7.1)

- [ ] All manual scenarios completed
- [ ] API integration tests pass
- [ ] Performance targets met
- [ ] Cross-browser testing done
- [ ] Mobile responsive verified
- [ ] No console errors in any scenario
- [ ] Data consistency verified
- [ ] Real-time updates work

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Ensure all dependencies installed: `npm install`

**Issue**: API calls fail in tests
**Solution**: Mock API calls using MSW or jest.mock()

**Issue**: Components don't render in tests
**Solution**: Wrap with QueryClientProvider and BrowserRouter

**Issue**: Integration tests show CORS errors
**Solution**: Check backend CORS configuration in main.ts

**Issue**: Performance tests fail
**Solution**: Check database has sufficient test data

## Success Criteria

Phase 1 testing is complete when:

- ✅ All frontend unit tests pass
- ✅ Test coverage > 80%
- ✅ All integration scenarios pass
- ✅ No console errors in browser
- ✅ Performance targets met
- ✅ Cross-browser compatibility verified
- ✅ Mobile responsive layouts work
- ✅ API integration tests pass

## Next Steps

After completing Phase 1 testing:

1. Document any bugs found
2. Fix critical issues
3. Update tasks.md to mark 6.4 and 7.1 complete
4. Prepare for Phase 2 implementation
5. Create deployment plan for Phase 1

## Resources

- Jest Documentation: https://jestjs.io/
- React Testing Library: https://testing-library.com/react
- Vitest Documentation: https://vitest.dev/
- Integration Testing Best Practices: https://martinfowler.com/articles/practical-test-pyramid.html
