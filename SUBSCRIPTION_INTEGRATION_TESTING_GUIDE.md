# UrutiX Subscription System - Integration Testing Guide

## 🎯 **Overview**

This guide provides comprehensive integration testing for the UrutiX subscription and notification systems. The testing suite covers database migrations, API endpoints, notification flows, user journeys, and system performance.

## 🧪 **Test Suite Components**

### **1. Database Migration Tests**
- **File**: `run-notification-migration.js`
- **Purpose**: Tests notification system database schema creation
- **Coverage**: 
  - `notification_preferences` table creation
  - `notification_logs` table creation
  - Default preference seeding
  - Index creation and constraints

### **2. Backend Integration Tests**
- **File**: `test-subscription-notification-integration.js`
- **Purpose**: Tests all subscription and notification API endpoints
- **Coverage**:
  - Authentication flow
  - Subscription management endpoints
  - Credit system endpoints
  - Notification system endpoints
  - Notification preferences API
  - Integration flows
  - Performance testing

### **3. Notification System Tests**
- **File**: `test-notification-system-comprehensive.js`
- **Purpose**: Comprehensive testing of notification features
- **Coverage**:
  - Notification preferences CRUD operations
  - Notification delivery API
  - Notification history and statistics
  - Error handling and validation
  - Security and permissions

### **4. End-to-End Tests**
- **File**: `test-subscription-system-end-to-end.js`
- **Purpose**: Complete user journey testing
- **Coverage**:
  - New user credit purchase journey
  - Credit usage monitoring journey
  - Subscription management scenarios
  - Notification configuration flows
  - Error recovery scenarios
  - Performance and load testing

### **5. Master Test Runner**
- **File**: `test-subscription-integration-complete.ps1`
- **Purpose**: Orchestrates all tests and provides comprehensive reporting
- **Features**:
  - Sequential test execution
  - Result aggregation
  - Performance metrics
  - Failure analysis
  - Deployment readiness assessment

## 🚀 **Running the Tests**

### **Prerequisites**
1. **Database Running**: PostgreSQL server must be running
2. **Backend Server**: NestJS backend must be running on port 3000
3. **Environment Variables**: Proper database configuration in `.env`
4. **Test User**: Ensure test user exists with credentials:
   - Email: `deborahrutagengwa.admin@urutix.com`
   - Password: `password123`

### **Quick Start**
```powershell
# Run complete integration test suite
./test-subscription-integration-complete.ps1
```

### **Individual Test Execution**

#### **1. Database Migration Test**
```bash
cd urutix/backend
node run-notification-migration.js
```

#### **2. Backend Integration Tests**
```bash
cd urutix/backend
node test-subscription-notification-integration.js
```

#### **3. Notification System Tests**
```bash
cd urutix/backend
node test-notification-system-comprehensive.js
```

#### **4. End-to-End Tests**
```bash
cd urutix/backend
node test-subscription-system-end-to-end.js
```

## 📊 **Test Coverage**

### **API Endpoints Tested**

#### **Authentication**
- `POST /auth/login` - User authentication

#### **Subscription Management**
- `GET /subscription/plans` - Available subscription plans
- `GET /subscription/current` - Current subscription details
- `GET /subscription/history` - Subscription history

#### **Credit System**
- `GET /credits/balance` - Current credit balance
- `GET /credits/packages` - Available credit packages
- `POST /credits/purchase` - Credit purchase flow
- `GET /credits/transactions` - Transaction history
- `GET /credits/usage-stats` - Usage statistics

#### **Notification System**
- `GET /notifications/balance-alerts` - Balance alert status
- `GET /notifications/usage-forecast` - Usage predictions
- `GET /notifications/subscription-status` - Subscription alerts
- `GET /notifications/low-balance-partners` - Partner monitoring
- `POST /notifications/test/:type` - Test notifications

#### **Notification Preferences**
- `GET /notification-preferences` - Get user preferences
- `POST /notification-preferences` - Update preferences
- `GET /notification-preferences/history` - Notification history
- `GET /notification-preferences/stats` - Delivery statistics
- `POST /notification-preferences/test` - Send test notification

### **User Journey Scenarios**

#### **Scenario 1: New User Credit Purchase**
1. Check initial credit balance
2. Browse available credit packages
3. Select and purchase credits
4. Verify balance update
5. Check transaction history

#### **Scenario 2: Credit Usage Monitoring**
1. Check usage statistics
2. Get usage forecast
3. Set up balance alerts
4. Monitor consumption patterns

#### **Scenario 3: Subscription Management**
1. Get current subscription
2. Browse available plans
3. Check subscription history

#### **Scenario 4: Notification Configuration**
1. Get current preferences
2. Update notification settings
3. Send test notifications
4. Check notification history

#### **Scenario 5: Error Handling**
1. Test invalid requests
2. Test unauthorized access
3. Test malformed data
4. Verify proper error responses

#### **Scenario 6: Performance Testing**
1. Test response times
2. Test concurrent requests
3. Test data pagination
4. Verify system stability

## 🔍 **Test Results Interpretation**

### **Success Criteria**
- **Database Migration**: All tables created successfully
- **API Endpoints**: All endpoints return expected responses
- **Authentication**: Login successful with valid credentials
- **Data Integrity**: Consistent data across related endpoints
- **Performance**: Response times under 2 seconds
- **Error Handling**: Proper error responses for invalid requests
- **Security**: Unauthorized access properly blocked

### **Performance Benchmarks**
- **API Response Time**: < 2000ms
- **Database Queries**: < 500ms
- **Concurrent Requests**: 5 simultaneous requests handled
- **Memory Usage**: Stable during test execution
- **Error Rate**: < 5% for expected failures

### **Expected Results**

#### **Passing Tests (Expected)**
- User authentication
- Credit balance retrieval
- Notification preferences management
- Basic API endpoint functionality
- Error handling for invalid data
- Security access controls

#### **Potentially Failing Tests (Expected)**
- Credit purchase (without payment gateway setup)
- SMS/Email notifications (without provider configuration)
- Admin-only endpoints (for non-admin users)
- External service integrations

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Database Connection Errors**
```
Error: connect ECONNREFUSED ::1:5432
```
**Solution**: Ensure PostgreSQL is running and accessible

#### **Authentication Failures**
```
Error: 401 Unauthorized
```
**Solution**: Verify test user credentials exist in database

#### **Migration Failures**
```
Error: relation "notification_preferences" already exists
```
**Solution**: Migration already applied, continue with tests

#### **API Endpoint Errors**
```
Error: 404 Not Found
```
**Solution**: Ensure backend server is running on correct port

### **Debug Commands**

#### **Check Database Connection**
```bash
cd urutix/backend
node -e "const { Pool } = require('pg'); const pool = new Pool(); pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(e => console.error('DB Error:', e.message))"
```

#### **Check Backend Server**
```bash
curl http://localhost:3000/health
```

#### **Check Test User**
```bash
cd urutix/backend
node -e "const axios = require('axios'); axios.post('http://localhost:3000/auth/login', {email: 'deborahrutagengwa.admin@urutix.com', password: 'password123'}).then(r => console.log('Auth OK')).catch(e => console.error('Auth Error:', e.response?.status))"
```

## 📈 **Performance Monitoring**

### **Metrics Collected**
- **Response Times**: Per endpoint timing
- **Success Rates**: Pass/fail ratios
- **Concurrent Performance**: Multi-request handling
- **Memory Usage**: System resource consumption
- **Error Patterns**: Common failure points

### **Performance Thresholds**
- **Excellent**: > 95% success rate, < 500ms average response
- **Good**: > 90% success rate, < 1000ms average response
- **Acceptable**: > 80% success rate, < 2000ms average response
- **Needs Improvement**: < 80% success rate or > 2000ms response

## 🎯 **Deployment Readiness**

### **Green Light Criteria (Ready for Production)**
- ✅ All database migrations successful
- ✅ > 90% test pass rate
- ✅ All critical endpoints functional
- ✅ Authentication working properly
- ✅ Error handling robust
- ✅ Performance within acceptable limits

### **Yellow Light Criteria (Needs Review)**
- ⚠️ 80-90% test pass rate
- ⚠️ Some non-critical features failing
- ⚠️ Performance borderline acceptable
- ⚠️ Minor configuration issues

### **Red Light Criteria (Not Ready)**
- ❌ < 80% test pass rate
- ❌ Critical endpoints failing
- ❌ Authentication issues
- ❌ Database connection problems
- ❌ Major performance issues

## 📋 **Test Maintenance**

### **Regular Updates Needed**
- Update test credentials when changed
- Modify API endpoints when routes change
- Adjust performance thresholds based on requirements
- Add new test scenarios for new features

### **Test Data Management**
- Clean up test notifications after runs
- Reset test user preferences periodically
- Monitor test database growth
- Archive old test results

## 🔄 **Continuous Integration**

### **CI/CD Integration**
```yaml
# Example GitHub Actions workflow
name: Subscription System Tests
on: [push, pull_request]
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd urutix/backend && npm install
      - name: Run integration tests
        run: ./test-subscription-integration-complete.ps1
```

### **Automated Monitoring**
- Schedule daily integration test runs
- Alert on test failures
- Track performance trends
- Monitor success rate changes

## 🎉 **Conclusion**

This comprehensive integration testing suite ensures the UrutiX subscription and notification systems are production-ready. Regular execution of these tests provides confidence in system stability, performance, and reliability.

**Next Steps After Testing:**
1. Address any failing tests
2. Configure external service providers (email, SMS)
3. Set up monitoring and alerting
4. Deploy to staging environment
5. Conduct user acceptance testing
6. Deploy to production with confidence