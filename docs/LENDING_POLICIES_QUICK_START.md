# Lending Policies System - Quick Start Guide

## 🚀 Quick Setup

### 1. Backend Setup
```bash
cd backend
npm install
npm run migrate  # Run database migrations
npm run start:dev  # Start backend server
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Start frontend dev server
```

### 3. Access the System
Open browser: `http://localhost:5173/lender/policies`

## 📋 Policy Types Overview

| Policy Type | Purpose | Key Fields |
|------------|---------|------------|
| **Interest Rates** | Loan pricing | Base rate, min/max rates, risk level |
| **Loan Limits** | Risk management | Min/max amounts, business type |
| **Eligibility** | Approval criteria | Category, requirements, min/max values |
| **Risk Assessment** | Credit scoring | Factor, weight, scoring criteria |
| **Repayment** | Collection rules | Frequency, grace period, late fees |
| **Cargo Type** | Industry rules | Cargo type, risk multiplier, insurance |
| **System Config** | Global settings | Approval limits, concurrent loans |

## 🔧 Common Operations

### Create a New Policy
1. Navigate to the appropriate tab
2. Click "NEW CONFIGURATION"
3. Fill in the form
4. Click "Create Policy"

### Toggle Policy Status
- Click the toggle switch next to any policy
- Active policies are used in loan validation
- Inactive policies are ignored

### Export Policies
- Click "Export Scheme" button
- Downloads JSON file with all policies

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/lending/policies/:lenderId
```

### Get All Policies
```http
GET /lending/policies/:lenderId/all?activeOnly=true
```

### Create Interest Rate Policy
```http
POST /lending/policies/:lenderId/interest-rates
Content-Type: application/json

{
  "name": "Standard Rate",
  "risk_level": "medium",
  "base_rate": 12.0,
  "min_rate": 10.0,
  "max_rate": 15.0,
  "adjustment_factors": {
    "creditScore": 0.5,
    "loanHistory": 0.3,
    "collateral": 0.4,
    "businessType": 0.2
  }
}
```

### Validate Loan
```http
POST /lending/policies/:lenderId/validate-loan
Content-Type: application/json

{
  "amount": 500000,
  "borrowerData": {...},
  "businessType": "individual",
  "cargoType": "electronics"
}
```

## 📁 File Structure

### Backend
```
backend/src/
├── entities/
│   ├── lending-policy-interest-rate.entity.ts
│   ├── lending-policy-loan-limit.entity.ts
│   ├── lending-policy-eligibility.entity.ts
│   ├── lending-policy-risk-assessment.entity.ts
│   ├── lending-policy-repayment.entity.ts
│   ├── lending-policy-cargo-type.entity.ts
│   └── lending-policy-system-config.entity.ts
├── modules/lending/
│   ├── controllers/
│   │   └── lending-policies.controller.ts
│   ├── services/
│   │   └── lending-policies.service.ts
│   └── dto/
│       └── lending-policy.dto.ts
└── database/migrations/
    └── 1734567890123-CreateLendingPolicyTables.ts
```

### Frontend
```
frontend/src/
├── pages/
│   └── LendingPoliciesPage.tsx
├── components/LenderDashboard/
│   ├── PolicyConfigurationModal.tsx
│   └── LendingPolicies.enlite.tsx
└── services/lending/
    └── lendingApi.ts
```

## 🎯 Example Use Cases

### Use Case 1: Set Up Basic Lending Rules
1. Create Interest Rate Policy (12% base rate)
2. Create Loan Limit Policy (50K-500K for individuals)
3. Create Repayment Policy (monthly, 7-day grace period)
4. Create System Config (200K auto-approval limit)

### Use Case 2: Add Risk-Based Pricing
1. Create multiple Interest Rate Policies for different risk levels:
   - Low Risk: 8-10%
   - Medium Risk: 10-15%
   - High Risk: 15-20%
2. Create Risk Assessment Rules with scoring criteria
3. System automatically selects appropriate rate based on borrower score

### Use Case 3: Industry-Specific Rules
1. Create Cargo Type Policies:
   - Electronics: High risk, insurance required
   - Food: Medium risk, special conditions
   - Textiles: Low risk, standard terms
2. System applies appropriate rules based on cargo type

## 🔍 Debugging Tips

### Check Backend Logs
```bash
cd backend
npm run start:dev
# Watch console for errors
```

### Verify Database Tables
```sql
SELECT * FROM lending_policy_interest_rates;
SELECT * FROM lending_policy_loan_limits;
-- etc.
```

### Test API with cURL
```bash
# Get all policies
curl -X GET http://localhost:3000/lending/policies/{lenderId}/all \
  -H "Authorization: Bearer {token}"

# Create policy
curl -X POST http://localhost:3000/lending/policies/{lenderId}/interest-rates \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Policy","risk_level":"medium","base_rate":12.0,"min_rate":10.0,"max_rate":15.0}'
```

## 🛡️ Security Notes

- All endpoints require JWT authentication
- Role-based access: SUPER_ADMIN, ADMIN, TENANT_ADMIN, LENDER
- Input validation on both frontend and backend
- SQL injection protection via TypeORM
- XSS protection via React

## 📊 Database Schema Quick Reference

### Interest Rates Table
```sql
CREATE TABLE lending_policy_interest_rates (
  id UUID PRIMARY KEY,
  lender_id UUID REFERENCES lenders(id),
  name VARCHAR(255),
  risk_level VARCHAR(50),
  base_rate DECIMAL(5,2),
  min_rate DECIMAL(5,2),
  max_rate DECIMAL(5,2),
  adjustment_factors JSONB,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### System Config Table
```sql
CREATE TABLE lending_policy_system_config (
  id UUID PRIMARY KEY,
  lender_id UUID REFERENCES lenders(id),
  name VARCHAR(255),
  auto_approval_limit DECIMAL(15,2),
  manual_review_threshold DECIMAL(15,2),
  max_concurrent_loans INTEGER,
  total_exposure_limit DECIMAL(15,2),
  cooldown_period INTEGER,
  compliance_mode BOOLEAN,
  audit_trail BOOLEAN,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 UI Components

### Main Page
- **Location**: `/lender/policies`
- **Features**: Tab navigation, policy tables, create buttons
- **State**: Policies, active tab, modal visibility

### Configuration Modal
- **Trigger**: "NEW CONFIGURATION" button
- **Features**: Dynamic forms, validation, error handling
- **Submission**: Creates policy via API

### Policy Tables
- **Display**: All policies for selected type
- **Actions**: Toggle status, edit, view details
- **Styling**: Professional, responsive design

## 💡 Pro Tips

1. **Start with System Config**: Set global limits first
2. **Use Priority**: Higher priority policies are evaluated first
3. **Test with Validation**: Use validate-loan endpoint before going live
4. **Export Regularly**: Backup your policies
5. **Monitor Active Status**: Only active policies affect loans
6. **Use Descriptive Names**: Makes management easier
7. **Document Special Conditions**: Add notes for cargo type policies

## 🆘 Support

For issues or questions:
1. Check backend logs
2. Verify database migrations ran
3. Confirm JWT token is valid
4. Review API response errors
5. Check browser console for frontend errors

## 📚 Related Documentation

- [Complete Implementation Guide](./LENDING_POLICIES_IMPLEMENTATION_COMPLETE.md)
- [API Documentation](./BACKEND_ENDPOINTS_DOCUMENTATION.md)
- [Database Schema](./database/schema.md)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
