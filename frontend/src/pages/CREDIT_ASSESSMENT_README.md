# Credit Assessment Page - Quick Reference

## 📍 Location
- **File**: `frontend/src/pages/CreditAssessmentPage.tsx`
- **Route**: `/lender/credit`
- **Component**: Uses `CreditAssessmentEnlite` from `frontend/src/components/LenderDashboard/`

## 🎯 Purpose

This page provides lenders with a comprehensive credit assessment interface to:
- View pending loan applications
- Evaluate borrower creditworthiness
- Calculate credit scores automatically
- Assess risk levels
- Export application data
- Track portfolio statistics

## 🔑 Key Features

### 1. Real-Time Data Loading
```typescript
// Fetches loan requests from backend
const loanRequests = await lendingApi.getLenderLoanRequests(
  lenderId,           // Authenticated lender ID
  'pending,in-review', // Status filter
  1,                  // Page number
  100                 // Results per page
);
```

### 2. Automatic Credit Scoring
The page calculates credit scores based on:
- **Loan Amount**: Lower amounts = higher scores
- **Borrower History**: Previous repayment performance
- **Business Age**: Established businesses score higher
- **Verification**: Verified cargo/trip details boost score

**Score Range**: 300 - 850 (similar to FICO)

### 3. Risk Assessment
- **Low Risk**: Score ≥ 750, Amount < RWF 20M
- **Medium Risk**: Score ≥ 650, Amount < RWF 30M
- **High Risk**: All other cases

### 4. Statistics Dashboard
Displays real-time metrics:
- Total Applications
- Average Credit Score
- Total Exposure (sum of requested amounts)
- Approval Rate

### 5. Export to CSV
Export all application data with one click for offline analysis.

## 🔄 Data Flow

```
User Login (Lender Role)
        ↓
Page Loads → Extract Lender ID from Auth Context
        ↓
API Call → GET /api/lending/lenders/:lenderId/loan-requests
        ↓
Backend Returns → Array of Loan Requests
        ↓
Transform Data → Calculate Scores & Risk Levels
        ↓
Display in UI → Table with Search & Filter
```

## 📊 Data Transformation

### Input (Backend Loan Request)
```json
{
  "id": "uuid-123",
  "requested_amount": 15000000,
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "borrower": {
    "contact_name": "John Doe",
    "company_name": "ABC Logistics"
  },
  "metadata": {
    "businessAge": 5,
    "industry": "Transportation"
  }
}
```

### Output (Credit Application)
```json
{
  "id": "uuid-123",
  "applicantName": "John Doe",
  "businessName": "ABC Logistics",
  "applicationDate": "2024-01-15",
  "requestedAmount": 15000000,
  "purpose": "Cargo Transportation",
  "status": "pending",
  "riskLevel": "medium",
  "creditScore": 720,
  "industry": "Transportation",
  "businessAge": 5
}
```

## 🛠️ Backend Integration

### API Endpoint
```
GET /api/lending/lenders/:lenderId/loan-requests
```

### Query Parameters
- `status`: Filter by status (comma-separated: 'pending,in-review')
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10, max: 100)

### Response Format
```typescript
{
  data: LoanRequest[],
  total: number,
  page: number,
  limit: number
}
```

## 🎨 UI Components

### Header
- Title: "Credit Assessment Engine"
- Subtitle: "Risk analysis and borrower eligibility terminal"
- Export Button
- Refresh Button

### Statistics Cards (4 cards)
1. **Total Applications** - Count of pending/in-review applications
2. **Avg Credit Score** - Mean score across all applications
3. **Total Exposure** - Sum of all requested amounts
4. **Approval Rate** - Percentage of approved applications

### Main Interface (3 tabs)
1. **Active Queue** - Table view with search and filter
2. **Credit Engine** - Score calculator and simulation
3. **Analytics & BI** - Reports and insights (coming soon)

### Application Table Columns
- Applicant & Profile (name, business)
- Loan Exposure (amount, purpose)
- Risk Score (credit score, risk badge)
- Workflow State (status badge)
- Actions (assess button)

## 🔐 Security

- **Authentication Required**: User must be logged in with LENDER role
- **Authorization**: Backend validates lender access to loan requests
- **Data Privacy**: Sensitive data handled securely
- **Tenant Isolation**: Lenders only see their assigned applications

## 🚨 Error Handling

### Scenarios Handled
1. **No Lender ID**: Shows error toast, stops loading
2. **API Failure**: Logs error, shows toast, displays empty state
3. **No Data**: Shows info message
4. **Export Failure**: Shows error toast

### User Feedback
Uses `react-hot-toast` for notifications:
- ✅ Success: Green toast with checkmark
- ℹ️ Info: Blue toast with info icon
- ❌ Error: Red toast with error icon

## 📱 Responsive Design

- **Desktop**: Full table view with all columns
- **Tablet**: Condensed table, stacked cards
- **Mobile**: Card-based layout, bottom navigation

## 🧪 Testing

### Manual Testing Checklist
- [ ] Page loads without errors
- [ ] Lender ID is correctly extracted
- [ ] API call succeeds and returns data
- [ ] Credit scores are calculated correctly
- [ ] Risk levels are assigned properly
- [ ] Statistics are accurate
- [ ] Search and filter work
- [ ] Export generates valid CSV
- [ ] Refresh button reloads data
- [ ] Error states display correctly

### Test Data
To test with mock data, create loan requests via:
```bash
POST /api/lending/loan-requests
{
  "tenant_id": "tenant-uuid",
  "cargo_id": "cargo-uuid",
  "trip_id": "trip-uuid",
  "requested_amount": 15000000,
  "lender_id": "lender-uuid"
}
```

## 🐛 Troubleshooting

### Issue: No applications showing
**Solution**: 
1. Check if lender has assigned loan requests in database
2. Verify lender ID matches user ID
3. Check backend logs for API errors
4. Ensure loan requests have status 'pending' or 'in-review'

### Issue: Credit scores seem wrong
**Solution**:
1. Review scoring algorithm in `calculateCreditScore()`
2. Check if loan metadata is properly populated
3. Verify loan amounts are in correct currency (RWF)

### Issue: Export not working
**Solution**:
1. Check browser console for errors
2. Verify applications array is populated
3. Test with smaller dataset
4. Check browser download settings

## 📈 Future Enhancements

### Planned Features
1. **Detailed Assessment Modal** - Full borrower profile and analysis
2. **Real-Time Updates** - WebSocket integration for live updates
3. **Advanced Filtering** - Filter by risk, amount, industry, score
4. **Batch Operations** - Approve/reject multiple applications
5. **Analytics Dashboard** - Trend analysis and portfolio performance
6. **ML Integration** - Predictive scoring and fraud detection

### Enhancement Ideas
- Automated decision recommendations
- Risk distribution charts
- Approval rate trends over time
- Borrower credit history timeline
- Integration with external credit bureaus

## 📚 Related Documentation

- [Full Documentation](../../../docs/CREDIT_ASSESSMENT_PAGE_DOCUMENTATION.md)
- [Backend Lending API](../../../backend/src/modules/lending/README.md)
- [Lending Service](../../../backend/src/modules/lending/lending.service.ts)
- [Credit Assessment Component](../components/LenderDashboard/CreditAssessment.enlite.tsx)

## 👥 Support

For questions or issues:
1. Check this README and full documentation
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Contact development team

## 📝 Code Quality

### Best Practices
- ✅ Full TypeScript typing
- ✅ Comprehensive error handling
- ✅ JSDoc comments for all functions
- ✅ Separation of concerns
- ✅ Reusable utility functions
- ✅ Performance optimizations
- ✅ Accessibility features
- ✅ Responsive design

### Code Structure
```
CreditAssessmentPage.tsx
├── State Management (useState, useEffect)
├── Utility Functions
│   ├── calculateCreditScore()
│   ├── calculateRiskLevel()
│   ├── getBorrowerName()
│   ├── getBusinessName()
│   └── getLoanPurpose()
├── Data Fetching
│   └── fetchApplications()
├── Event Handlers
│   ├── handleAssess()
│   └── handleExport()
└── UI Rendering
    ├── Header
    ├── Statistics Cards
    └── CreditAssessmentEnlite Component
```

## 🎓 Learning Resources

### Understanding Credit Scoring
- Credit scores range from 300-850
- Higher scores indicate lower risk
- Multiple factors influence the score
- Scores are dynamic and can change

### Risk Assessment
- Risk levels help prioritize applications
- Low risk = faster approval
- High risk = additional review required
- Risk is relative to loan amount

### Lending Best Practices
- Always verify borrower information
- Review payment history
- Consider business stability
- Assess collateral value
- Monitor portfolio diversification

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintainer**: Development Team
