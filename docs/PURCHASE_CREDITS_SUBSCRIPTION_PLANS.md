# Purchase Credits Page - Subscription Plans Integration

## Feature Overview
Added subscription plans display to the tenant-admin purchase-credits page, allowing tenants to view and select subscription plans alongside credit packages.

## Implementation

### Page Location
`/tenant-admin/purchase-credits`

### New Section Added
A "Subscription Plans" section displaying all available subscription plans with:
- Plan details (name, description, pricing)
- Included credits
- Feature limits (trucks, users, drivers)
- Feature toggles (AI matching, analytics, etc.)
- Call-to-action buttons

### API Integration

#### Fetch Subscription Plans
```typescript
const { data: plansData, isLoading: plansLoading } = useQuery({
  queryKey: ['subscription-plans'],
  queryFn: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },
});
```

**Endpoint**: `GET /subscriptions/plans`
**Returns**: Array of active subscription plans

### UI Components

#### Section Header
```tsx
<div className="flex items-center justify-between">
  <div>
    <h2>Subscription Plans</h2>
    <p>Upgrade your plan to get more features and included credits</p>
  </div>
  <button onClick={() => navigate('/tenant-admin/subscription-plans')}>
    View All Plans →
  </button>
</div>
```

#### Plan Cards
Each plan displays:

1. **Popular Badge** (for professional plan)
   - Positioned at top center
   - Blue background with star icon

2. **Plan Header**
   - Plan name (Starter, Professional, Enterprise)
   - Description text

3. **Pricing Section**
   - Monthly price (large, prominent)
   - Yearly price with savings calculation
   - Example: "or $1499/year (Save $300)"

4. **Features List**
   - Included Credits (highlighted in blue)
   - Max Trucks/Users/Drivers (shows "Unlimited" for -1)
   - Feature checkmarks:
     - ✓ AI Matching
     - ✓ Advanced Analytics
     - ✓ Broker Management
     - ✓ API Access
     - ✓ Priority Support

5. **CTA Button**
   - "SELECT PLAN →" button
   - Navigates to `/tenant-admin/subscription-plans`
   - Popular plan has blue background
   - Other plans have dark background

### Styling

#### Card Styling
```tsx
className={`
  relative bg-white rounded-[32px] p-8 
  flex flex-col transition-all duration-300 
  hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] 
  border ${
    isPopular
      ? 'border-[#345E85]/20 shadow-[0_4px_20px_rgba(52,94,133,0.15)] ring-2 ring-[#345E85]/10'
      : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
  }
`}
```

#### Grid Layout
- Desktop: 3 columns (`md:grid-cols-3`)
- Mobile: 1 column (stacked)
- Gap: 6 units between cards

### User Flow

1. **Navigate to Purchase Credits**
   - User goes to `/tenant-admin/purchase-credits`

2. **View Credit Packages**
   - See available credit packages (100, 500, 1000, 5000)
   - Use credit calculator if needed

3. **Scroll to Subscription Plans**
   - See all available subscription plans
   - Compare features and pricing

4. **Select a Plan**
   - Click "SELECT PLAN" button
   - Redirected to `/tenant-admin/subscription-plans`
   - Can complete subscription purchase

### Benefits

#### For Tenants
1. ✅ One-stop shop for credits and subscriptions
2. ✅ Easy comparison of plans
3. ✅ Clear feature visibility
4. ✅ Understand included credits per plan
5. ✅ See savings on yearly billing

#### For Business
1. ✅ Increased subscription visibility
2. ✅ Cross-sell opportunities (credits → subscriptions)
3. ✅ Better conversion funnel
4. ✅ Reduced friction in upgrade path

### Data Flow

```
User visits /tenant-admin/purchase-credits
    ↓
Component fetches:
  - Credit packages (/credits/packages)
  - Credit balance (/credits/balance)
  - Subscription plans (/subscriptions/plans)
    ↓
Display both sections:
  - Credit Packages (existing)
  - Subscription Plans (new)
    ↓
User clicks "SELECT PLAN"
    ↓
Navigate to /tenant-admin/subscription-plans
    ↓
Complete subscription purchase
```

### Example Plan Display

#### Starter Plan
```
┌─────────────────────────────┐
│         Starter             │
│  Perfect for small fleets   │
│                             │
│      $49.99/month          │
│  or $499.99/year (Save $100)│
│                             │
│  Included Credits: 100      │
│  Max Trucks: 5              │
│  Max Users: 3               │
│  Max Drivers: 5             │
│                             │
│  ✓ Insurance Tracking       │
│                             │
│  [  SELECT PLAN →  ]       │
└─────────────────────────────┘
```

#### Professional Plan (Popular)
```
┌─────────────────────────────┐
│    ⭐ MOST POPULAR ⭐       │
│      Professional           │
│  Advanced features for      │
│  growing operations         │
│                             │
│     $149.99/month          │
│ or $1499.99/year (Save $300)│
│                             │
│  Included Credits: 500      │
│  Max Trucks: 25             │
│  Max Users: 10              │
│  Max Drivers: 25            │
│                             │
│  ✓ AI Matching              │
│  ✓ Advanced Analytics       │
│  ✓ Broker Management        │
│  ✓ API Access               │
│  ✓ Priority Support         │
│                             │
│  [  SELECT PLAN →  ]       │
└─────────────────────────────┘
```

### Navigation Links

The page now has multiple navigation options:

1. **Back to Billing** (top right)
   - Returns to `/tenant-admin/billing`

2. **View All Plans** (subscription section)
   - Goes to `/tenant-admin/subscription-plans`

3. **View Subscription Plans** (benefits section)
   - Also goes to `/tenant-admin/subscription-plans`

4. **SELECT PLAN** (on each plan card)
   - Goes to `/tenant-admin/subscription-plans`

### Responsive Design

#### Desktop (md and up)
- 3-column grid for plans
- Side-by-side layout for header elements
- Full feature lists visible

#### Mobile
- Single column stack
- Vertical layout for header
- Compact feature lists
- Touch-friendly buttons

### Future Enhancements

1. **Current Plan Indicator**
   - Show which plan user is currently on
   - Disable "SELECT PLAN" for current plan
   - Show "CURRENT PLAN" badge

2. **Upgrade/Downgrade Logic**
   - Show "UPGRADE" or "DOWNGRADE" based on current plan
   - Calculate prorated pricing
   - Show credit difference

3. **Plan Comparison**
   - Add comparison table
   - Side-by-side feature comparison
   - Highlight differences

4. **Trial Offers**
   - Show trial availability
   - "Start 14-day trial" button
   - Trial countdown for active trials

5. **Custom Plans**
   - "Contact Sales" for enterprise
   - Custom pricing calculator
   - Request quote form

## Files Modified
- `frontend/src/pages/subscription/PurchaseCredits.tsx`

## Testing Checklist
- [x] Subscription plans load correctly
- [x] Plan cards display all information
- [x] Popular badge shows on correct plan
- [x] Feature checkmarks display correctly
- [x] Unlimited values show as "Unlimited"
- [x] Navigation buttons work
- [x] Responsive layout works on mobile
- [ ] Test with different plan configurations
- [ ] Test loading states
- [ ] Test error states

## Date
April 9, 2026
