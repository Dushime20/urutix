# Credit Assessment Page - Visual Guide

## 🎨 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  CREDIT ASSESSMENT ENGINE                    [Export] [Refresh]   │ │
│  │  Risk analysis and borrower eligibility terminal                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ 🔔           │ │ 📈           │ │ 💰           │ │ ✓            │ │
│  │ Total Apps   │ │ Avg Score    │ │ Total Exp    │ │ Approval %   │ │
│  │              │ │              │ │              │ │              │ │
│  │     12       │ │     720      │ │   45.2M      │ │     85%      │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ 🔍 SEARCH APPLICATIONS...          [Filter: All Stages ▼]  │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ Applicant & Profile │ Loan Exposure │ Risk Score │ Status │ │ │ │
│  │  ├─────────────────────────────────────────────────────────────┤ │ │
│  │  │ 👤 John Doe         │ RWF 15.0M     │ 720        │ Pending│ │ │ │
│  │  │    ABC Logistics    │ Fleet Exp     │ 🟡 MEDIUM  │        │ │ │ │
│  │  │                     │               │            │  [→]   │ │ │ │
│  │  ├─────────────────────────────────────────────────────────────┤ │ │
│  │  │ 👤 Jane Smith       │ RWF 25.0M     │ 780        │ Review │ │ │ │
│  │  │    XYZ Transport    │ Warehouse     │ 🟢 LOW     │        │ │ │ │
│  │  │                     │               │            │  [→]   │ │ │ │
│  │  ├─────────────────────────────────────────────────────────────┤ │ │
│  │  │ 👤 Bob Wilson       │ RWF 35.0M     │ 640        │ Pending│ │ │ │
│  │  │    Wilson Freight   │ Equipment     │ 🔴 HIGH    │        │ │ │ │
│  │  │                     │               │            │  [→]   │ │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION                          │
│                         (Lender Role Required)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACT LENDER ID                                 │
│                    from Auth Context                                 │
│                    (user.id)                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API CALL TO BACKEND                               │
│   GET /api/lending/lenders/:lenderId/loan-requests                  │
│   Params: { status: 'pending,in-review', page: 1, limit: 100 }      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESSING                                │
│   • Validate lender ID                                               │
│   • Query database for loan requests                                 │
│   • Filter by status                                                 │
│   • Apply pagination                                                 │
│   • Return results                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA TRANSFORMATION                               │
│   For each loan request:                                             │
│   • Extract borrower name                                            │
│   • Extract business name                                            │
│   • Calculate credit score                                           │
│   • Determine risk level                                             │
│   • Format dates and amounts                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CALCULATE STATISTICS                              │
│   • Total applications = count(applications)                         │
│   • Avg credit score = mean(credit_scores)                           │
│   • Total exposure = sum(requested_amounts)                          │
│   • Approval rate = (approved / total) * 100                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DISPLAY IN UI                                     │
│   • Render statistics cards                                          │
│   • Render application table                                         │
│   • Enable search and filter                                         │
│   • Enable export and refresh                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## 🧮 Credit Score Calculation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREDIT SCORE CALCULATION                          │
└─────────────────────────────────────────────────────────────────────┘

                         START: Base Score = 650
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │         FACTOR 1: LOAN AMOUNT                     │
        ├───────────────────────────────────────────────────┤
        │  Amount < RWF 5M    →  +50 points                │
        │  Amount < RWF 15M   →  +30 points                │
        │  Amount > RWF 30M   →  -30 points                │
        └───────────────────────┬───────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────┐
        │         FACTOR 2: BORROWER HISTORY                │
        ├───────────────────────────────────────────────────┤
        │  Each on-time repayment  →  +10 points (max +100)│
        │  Each default            →  -50 points            │
        └───────────────────────┬───────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────┐
        │         FACTOR 3: BUSINESS AGE                    │
        ├───────────────────────────────────────────────────┤
        │  Age > 5 years  →  +30 points                     │
        │  Age > 2 years  →  +15 points                     │
        └───────────────────────┬───────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────┐
        │         FACTOR 4: VERIFICATION                    │
        ├───────────────────────────────────────────────────┤
        │  Has cargo_id AND trip_id  →  +20 points          │
        └───────────────────────┬───────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────┐
        │         APPLY CONSTRAINTS                         │
        ├───────────────────────────────────────────────────┤
        │  Minimum Score: 300                               │
        │  Maximum Score: 850                               │
        │  Final Score = min(850, max(300, calculated))     │
        └───────────────────────┬───────────────────────────┘
                                │
                                ▼
                         FINAL CREDIT SCORE
```

## 🎯 Risk Level Determination

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RISK LEVEL ASSESSMENT                             │
└─────────────────────────────────────────────────────────────────────┘

                         INPUT: Credit Score + Loan Amount
                                        │
                                        ▼
                    ┌───────────────────────────────────┐
                    │  Credit Score >= 750?             │
                    │  AND                              │
                    │  Amount < RWF 20M?                │
                    └───────────┬───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                     NO
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌───────────────────────────┐
        │   🟢 LOW RISK     │   │  Credit Score >= 650?     │
        │                   │   │  AND                      │
        │  • Fast approval  │   │  Amount < RWF 30M?        │
        │  • Lower interest │   └───────────┬───────────────┘
        │  • Higher limits  │               │
        └───────────────────┘   ┌───────────┴───────────┐
                                │                       │
                               YES                     NO
                                │                       │
                                ▼                       ▼
                    ┌───────────────────┐   ┌───────────────────┐
                    │ 🟡 MEDIUM RISK    │   │  🔴 HIGH RISK     │
                    │                   │   │                   │
                    │ • Standard review │   │ • Detailed review │
                    │ • Normal terms    │   │ • Higher interest │
                    │ • Moderate limits │   │ • Lower limits    │
                    └───────────────────┘   │ • More collateral │
                                            └───────────────────┘
```

## 📊 Statistics Calculation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATISTICS DASHBOARD                              │
└─────────────────────────────────────────────────────────────────────┘

Input: Array of Credit Applications
         │
         ├─────────────────────────────────────────────────────────┐
         │                                                         │
         ▼                                                         │
┌──────────────────────┐                                          │
│  TOTAL APPLICATIONS  │                                          │
├──────────────────────┤                                          │
│  Count all apps      │                                          │
│  in array            │                                          │
│                      │                                          │
│  Result: 12          │                                          │
└──────────────────────┘                                          │
                                                                  │
         ▼                                                         │
┌──────────────────────┐                                          │
│  AVG CREDIT SCORE    │                                          │
├──────────────────────┤                                          │
│  Sum all scores      │                                          │
│  Divide by count     │                                          │
│  Round to integer    │                                          │
│                      │                                          │
│  Result: 720         │                                          │
└──────────────────────┘                                          │
                                                                  │
         ▼                                                         │
┌──────────────────────┐                                          │
│  TOTAL EXPOSURE      │                                          │
├──────────────────────┤                                          │
│  Sum all requested   │                                          │
│  amounts             │                                          │
│  Convert to millions │                                          │
│                      │                                          │
│  Result: 45.2M       │                                          │
└──────────────────────┘                                          │
                                                                  │
         ▼                                                         │
┌──────────────────────┐                                          │
│  APPROVAL RATE       │                                          │
├──────────────────────┤                                          │
│  Count approved apps │                                          │
│  Divide by total     │                                          │
│  Multiply by 100     │                                          │
│  Round to integer    │                                          │
│                      │                                          │
│  Result: 85%         │                                          │
└──────────────────────┘                                          │
                                                                  │
         └─────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         DISPLAY IN UI CARDS
```

## 🔍 Search and Filter Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SEARCH AND FILTER                                 │
└─────────────────────────────────────────────────────────────────────┘

User Input: Search Term + Status Filter
                    │
                    ▼
        ┌───────────────────────────┐
        │  For each application:    │
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  SEARCH MATCH?   │   │  STATUS MATCH?   │
├──────────────────┤   ├──────────────────┤
│  Check if search │   │  Check if status │
│  term appears in:│   │  matches filter  │
│  • Applicant name│   │  (or filter is   │
│  • Business name │   │   'all')         │
│  • Application ID│   │                  │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │  Both conditions TRUE?    │
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
       YES                     NO
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  INCLUDE IN      │   │  EXCLUDE FROM    │
│  RESULTS         │   │  RESULTS         │
└──────────────────┘   └──────────────────┘
        │
        └───────────────────────┐
                                │
                                ▼
                    ┌───────────────────────────┐
                    │  Display filtered results │
                    │  in table                 │
                    └───────────────────────────┘
```

## 📤 Export Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPORT TO CSV                                     │
└─────────────────────────────────────────────────────────────────────┘

User clicks "Export" button
            │
            ▼
┌───────────────────────────┐
│  Check if applications    │
│  array is not empty       │
└───────────┬───────────────┘
            │
    ┌───────┴───────┐
    │               │
   YES             NO
    │               │
    ▼               ▼
┌─────────────┐   ┌─────────────┐
│  PROCEED    │   │  SHOW ERROR │
└──────┬──────┘   └─────────────┘
       │
       ▼
┌───────────────────────────┐
│  Create CSV headers       │
│  ['ID', 'Applicant', ...] │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  For each application:    │
│  Extract data fields      │
│  Create row array         │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Join headers and rows    │
│  with commas and newlines │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Create Blob object       │
│  with CSV content         │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Create download link     │
│  Set filename with date   │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Trigger download         │
│  Clean up resources       │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Show success toast       │
└───────────────────────────┘
```

## 🔄 Refresh Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REFRESH DATA                                      │
└─────────────────────────────────────────────────────────────────────┘

User clicks "Refresh" button
            │
            ▼
┌───────────────────────────┐
│  Set loading = true       │
│  Disable refresh button   │
│  Show loading spinner     │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Call fetchApplications() │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  API call to backend      │
└───────────┬───────────────┘
            │
    ┌───────┴───────┐
    │               │
 SUCCESS          ERROR
    │               │
    ▼               ▼
┌─────────────┐   ┌─────────────┐
│  Transform  │   │  Log error  │
│  data       │   │  Show toast │
│  Calculate  │   │  Set empty  │
│  stats      │   │  state      │
│  Update UI  │   └─────────────┘
│  Show toast │
└──────┬──────┘
       │
       └───────────────────────┐
                               │
                               ▼
                   ┌───────────────────────────┐
                   │  Set loading = false      │
                   │  Enable refresh button    │
                   │  Hide loading spinner     │
                   └───────────────────────────┘
```

## 🎨 Color Coding

### Risk Levels
```
🟢 LOW RISK
   Background: emerald-50
   Text: emerald-700
   Border: emerald-200
   
🟡 MEDIUM RISK
   Background: amber-50
   Text: amber-700
   Border: amber-200
   
🔴 HIGH RISK
   Background: rose-50
   Text: rose-700
   Border: rose-200
```

### Status Badges
```
✅ APPROVED
   Background: emerald-50
   Text: emerald-700
   Border: emerald-100
   
❌ REJECTED
   Background: rose-50
   Text: rose-700
   Border: rose-100
   
🔵 IN REVIEW
   Background: blue-50
   Text: blue-700
   Border: blue-100
   
⏳ PENDING
   Background: amber-50
   Text: amber-700
   Border: amber-100
```

### Credit Score Colors
```
750-850: text-emerald-600 (Excellent)
650-749: text-amber-600   (Good)
300-649: text-rose-600    (Fair/Poor)
```

## 📱 Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE DESIGN                                 │
└─────────────────────────────────────────────────────────────────────┘

MOBILE (< 768px)
├── Single column layout
├── Stacked statistics cards
├── Simplified table (card view)
├── Bottom navigation
└── Touch-optimized buttons

TABLET (768px - 1024px)
├── Two column layout
├── 2x2 statistics grid
├── Condensed table
├── Side navigation
└── Medium-sized buttons

DESKTOP (> 1024px)
├── Full width layout
├── 4 column statistics
├── Full table with all columns
├── Top navigation
└── Standard buttons

LARGE DESKTOP (> 1536px)
├── Max-width container (1536px)
├── Centered content
├── Spacious layout
├── Enhanced visuals
└── Larger fonts
```

---

**Visual Guide Version**: 1.0.0
**Last Updated**: January 2024
**Purpose**: Help developers and users understand the Credit Assessment Page visually
