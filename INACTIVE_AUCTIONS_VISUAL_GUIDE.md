# Inactive Auctions - Visual Guide

## Feature Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Bidding Dashboard - Cargo Owner View                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │ My       │ Create   │ Analytics│ Inactive │  ← NEW TAB      │
│  │ Auctions │          │          │          │                  │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Inactive Auctions                                      │    │
│  │  2 deleted auctions available for reactivation          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ 📦 Electronics Shipment - NYC to LA              │  │    │
│  │  │ Type: REVERSE  |  Deleted: May 3, 2026           │  │    │
│  │  │ Reserve: $5,000  |  Bids: 12                     │  │    │
│  │  │                                                    │  │    │
│  │  │ [🔄 Reactivate]                                   │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ 📦 Furniture Transport - Chicago to Miami        │  │    │
│  │  │ Type: SEALED  |  Deleted: May 2, 2026            │  │    │
│  │  │ Reserve: $3,500  |  Bids: 8                      │  │    │
│  │  │                                                    │  │    │
│  │  │ [🔄 Reactivate]                                   │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow

### Flow 1: View Inactive Auctions

```
User Action                    System Response
───────────────────────────────────────────────────────────────
1. Navigate to                 → Display bidding dashboard
   /dashboard/bidding

2. Click "Inactive" tab        → Load inactive auctions
                                 GET /api/bidding/auctions/inactive

3. View list                   → Show deleted auctions with:
                                 - Load details
                                 - Deletion date
                                 - Bid count
                                 - Cancellation reason
                                 - Reactivate button
```

### Flow 2: Reactivate Auction

```
User Action                    System Response
───────────────────────────────────────────────────────────────
1. Click "Reactivate"          → Show loading state
   button                        "Reactivating..."

2. System processes            → POST /api/bidding/auctions/:id/reactivate
                                 - Check permissions
                                 - Verify no active auction exists
                                 - Restore auction
                                 - Update status

3. Success                     → ✅ "Auction reactivated successfully!"
                                 - Remove from inactive list
                                 - Auction now in "My Auctions"

4. Error (conflict)            → ❌ "Cannot reactivate: An active 
                                    auction already exists..."
                                 - Show error message
                                 - Keep in inactive list
```

### Flow 3: Handle Conflict

```
Scenario: Active auction exists for the load
──────────────────────────────────────────────────────────────

Before Reactivation:
┌─────────────────────────────────────────────────────────┐
│ Load: Electronics Shipment                              │
├─────────────────────────────────────────────────────────┤
│ Active Auction:   ID: abc-123  Status: ACTIVE           │
│ Inactive Auction: ID: xyz-789  Status: DELETED          │
└─────────────────────────────────────────────────────────┘

User tries to reactivate xyz-789:
↓
❌ Error: "Cannot reactivate: An active auction already 
          exists for this load (Auction ID: abc-123). 
          Please delete the active auction first."

Options:
1. Delete active auction (abc-123) first
2. Choose different auction to reactivate
3. Keep inactive auction as is
```

## Component Structure

```
BiddingDashboard
├── Stats Cards
├── Tab Navigation
│   ├── My Auctions
│   ├── Create
│   ├── Analytics
│   └── Inactive ← NEW
└── Tab Content
    └── InactiveAuctions ← NEW COMPONENT
        ├── Header (title + count + refresh)
        ├── Auction Cards
        │   ├── Load Info
        │   ├── Auction Details
        │   ├── Deletion Info
        │   ├── Cancellation Reason
        │   └── Reactivate Button
        └── Empty State
```

## Auction Card Layout

```
┌────────────────────────────────────────────────────────────────┐
│  📦 Electronics Shipment - NYC to LA          [REVERSE]        │
│  High-value electronics requiring careful handling             │
│                                                                 │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐ │
│  │ 📅 Deleted   │ 💰 Reserve   │ 📊 Bids      │ ⚖️ Weight   │ │
│  │ May 3, 2026  │ $5,000       │ 12           │ 500 kg      │ │
│  └──────────────┴──────────────┴──────────────┴─────────────┘ │
│                                                                 │
│  ⚠️ Cancellation Reason:                                       │
│  Customer requested to postpone shipment                       │
│                                                                 │
│  Period: May 1, 2026 10:00 AM → May 5, 2026 5:00 PM          │
│                                                                 │
│                                    [🔄 Reactivate Auction]     │
└────────────────────────────────────────────────────────────────┘
```

## Status Update Logic

```
When Reactivating:
──────────────────────────────────────────────────────────────

Current Time: May 4, 2026 2:00 PM

Scenario 1: Auction Expired
┌─────────────────────────────────────────────────────────┐
│ Auction End: May 3, 2026 5:00 PM                        │
│ Current Time: May 4, 2026 2:00 PM                       │
│                                                          │
│ End < Now → Status: CLOSED                              │
└─────────────────────────────────────────────────────────┘

Scenario 2: Auction Active
┌─────────────────────────────────────────────────────────┐
│ Auction Start: May 1, 2026 10:00 AM                     │
│ Auction End: May 10, 2026 5:00 PM                       │
│ Current Time: May 4, 2026 2:00 PM                       │
│                                                          │
│ Start ≤ Now < End → Status: ACTIVE                      │
└─────────────────────────────────────────────────────────┘

Scenario 3: Auction Scheduled
┌─────────────────────────────────────────────────────────┐
│ Auction Start: May 5, 2026 10:00 AM                     │
│ Auction End: May 10, 2026 5:00 PM                       │
│ Current Time: May 4, 2026 2:00 PM                       │
│                                                          │
│ Now < Start → Status: SCHEDULED                         │
└─────────────────────────────────────────────────────────┘
```

## Permission Matrix

```
┌──────────────┬─────────────────┬─────────────────┐
│ Role         │ Can View        │ Can Reactivate  │
├──────────────┼─────────────────┼─────────────────┤
│ Cargo Owner  │ Own auctions    │ Own auctions    │
│ Broker       │ Managed loads   │ Managed loads   │
│ Admin        │ All in tenant   │ All in tenant   │
│ Super Admin  │ All in tenant   │ All in tenant   │
│ Truck Owner  │ None            │ None            │
└──────────────┴─────────────────┴─────────────────┘
```

## Empty State

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────┐                         │
│                    │     🔄      │                         │
│                    │  (icon)     │                         │
│                    └─────────────┘                         │
│                                                             │
│              No Inactive Auctions                          │
│                                                             │
│   You don't have any deleted auctions. Deleted             │
│   auctions will appear here and can be reactivated.        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Loading State

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────┐                         │
│                    │      ⟳      │                         │
│                    │  (spinner)  │                         │
│                    └─────────────┘                         │
│                                                             │
│            Loading inactive auctions...                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Reactivation States

### Before Click
```
┌──────────────────────────────────┐
│  🔄 Reactivate                   │
│  Restore this auction            │
└──────────────────────────────────┘
```

### During Reactivation
```
┌──────────────────────────────────┐
│  ⟳ Reactivating...               │
│  (disabled, gray)                │
└──────────────────────────────────┘
```

### After Success
```
✅ Auction reactivated successfully!
(Card removed from list)
```

### After Error
```
❌ Cannot reactivate: An active auction 
   already exists for this load...
(Card remains in list)
```

## Color Scheme

### Auction Type Badges
```
REVERSE  → Blue    (bg-blue-100 text-blue-700)
FORWARD  → Green   (bg-green-100 text-green-700)
DUTCH    → Orange  (bg-orange-100 text-orange-700)
SEALED   → Purple  (bg-purple-100 text-purple-700)
```

### Tab Colors
```
Inactive Tab (Active)   → Slate   (bg-slate-600)
Inactive Tab (Inactive) → Gray    (text-slate-400)
```

### Button Colors
```
Reactivate Button       → Emerald (bg-emerald-500)
Reactivate (Hover)      → Emerald (bg-emerald-600)
Reactivate (Disabled)   → Gray    (bg-slate-100)
```

## Responsive Design

### Desktop (lg+)
```
┌─────────────────────────────────────────────────────────┐
│ [Load Info]  [Details Grid]  [Reactivate Button]       │
└─────────────────────────────────────────────────────────┘
```

### Mobile (sm)
```
┌─────────────────────────────────────┐
│ [Load Info]                         │
│ [Details Grid - 2 columns]          │
│ [Reactivate Button - Full Width]   │
└─────────────────────────────────────┘
```

## Dark Mode Support

All components support dark mode with appropriate color adjustments:
- Background: `dark:bg-slate-900`
- Text: `dark:text-slate-100`
- Borders: `dark:border-slate-700`
- Cards: `dark:bg-slate-800`

---

**Visual Guide Complete** ✅
