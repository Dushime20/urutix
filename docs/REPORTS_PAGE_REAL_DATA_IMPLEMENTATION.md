# Reports Page - Real Data Implementation

## Overview
Replaced hardcoded report templates with real data from the backend API.

## Date
April 8, 2026

## Changes Made

### Backend
The backend already had the necessary endpoints:
- `GET /api/financial/reports/templates` - Returns available report templates
- `GET /api/financial/reports` - Returns generated reports
- `POST /api/financial/reports` - Generates a new report
- `GET /api/financial/reports/:id/download` - Downloads a report

### Frontend Updates

#### 1. Updated API Service (`frontend/src/services/financialReportsApi.ts`)
Added new method to fetch report templates:
```typescript
async getReportTemplates(): Promise<{ templates: ReportTemplate[] }> {
  const response = await api.get('/financial/reports/templates');
  return response.data.data;
}
```

#### 2. Updated Reports Page (`frontend/src/pages/FinancialReportsPage.tsx`)
- Removed hardcoded templates array
- Added `useQuery` hook to fetch templates from backend
- Added dynamic icon mapping based on template category
- Templates now come from `/api/financial/reports/templates` endpoint

### Report Templates Available

The backend provides 8 report templates:

1. **Portfolio Summary**
   - Category: portfolio
   - Type: summary
   - Frequency: on-demand
   - Format: PDF

2. **P&L Statement**
   - Category: financial
   - Type: detailed
   - Frequency: monthly
   - Format: Excel

3. **Cash Flow Analysis**
   - Category: financial
   - Type: detailed
   - Frequency: monthly
   - Format: Excel

4. **Risk Audit**
   - Category: risk
   - Type: analytical
   - Frequency: weekly
   - Format: PDF

5. **Entity Registry** (Borrower Performance)
   - Category: performance
   - Type: detailed
   - Frequency: monthly
   - Format: Excel

6. **Revenue Report**
   - Category: financial
   - Type: detailed
   - Frequency: monthly
   - Format: PDF

7. **Expense Analysis**
   - Category: financial
   - Type: detailed
   - Frequency: monthly
   - Format: Excel

8. **Profitability Analysis**
   - Category: financial
   - Type: analytical
   - Frequency: quarterly
   - Format: PDF

### Icon Mapping
Templates are automatically assigned icons based on their category:
- **portfolio** → PieChart icon
- **financial** → DollarSign icon
- **risk** → Shield icon
- **performance** → Users icon
- **default** → FileText icon

### Data Flow

1. **Page Load**:
   - Fetches templates from `/api/financial/reports/templates`
   - Fetches recent reports from `/api/financial/reports`
   - Displays loading state while fetching

2. **Generate Report**:
   - User clicks "Generate" on a template
   - Sends POST request to `/api/financial/reports` with:
     - type (template id)
     - period (frequency)
     - startDate
     - endDate
   - Refetches reports list after generation

3. **Download Report**:
   - User clicks download on a generated report
   - Fetches blob from `/api/financial/reports/:id/download`
   - Triggers browser download

### Benefits

1. **Dynamic Templates**: Templates can be added/modified in backend without frontend changes
2. **Real-Time Data**: Reports show actual financial data from the database
3. **Centralized Management**: All report configuration in one place (backend)
4. **Scalability**: Easy to add new report types
5. **Consistency**: Same templates available across all user roles

### Testing

To test the reports page:
1. Navigate to `/dashboard/reports`
2. Verify templates load from backend
3. Click "Generate" on any template
4. Verify report appears in recent reports list
5. Click download to test report download

### Future Enhancements

Potential improvements:
- Add report scheduling functionality
- Implement custom report builder
- Add email delivery for reports
- Support more export formats (CSV, JSON)
- Add report sharing between users
- Implement report templates customization UI
