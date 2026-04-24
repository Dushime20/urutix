# Payments Page - Visual Mockup

## 🎨 Complete Page Layout

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         💰 FINANCIAL HUB - PAYMENTS                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                        📊 FINANCIAL OVERVIEW                                 │
├──────────────┬──────────────┬──────────────┬──────────────────────────────┤
│  🔴 OVERDUE  │  🟡 DUE SOON │  ✅ PAID     │  💰 TOTAL TRANSACTIONS       │
│              │              │              │                               │
│  $5,000.00   │  $15,700.00  │  $45,600.00  │  $66,300.00                  │
│  1 payment   │  2 payments  │  12 payments │  15 total                    │
└──────────────┴──────────────┴──────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🔴 PENDING PAYMENTS - ACTION REQUIRED                    [Filter ▼] [Sort] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  🔴 OVERDUE - URGENT ACTION REQUIRED                                │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  🏦 Loan Repayment #LN-2024-001                                     │    │
│  │  Lender: ABC Finance Corp                                           │    │
│  │  Amount: $5,000.00 USD                                              │    │
│  │  Due Date: Apr 21, 2026 (3 days overdue)                           │    │
│  │  Late Fee: $150.00                                                  │    │
│  │                                                                      │    │
│  │  [💳 Pay Now]  [📄 View Details]  [📞 Request Extension]           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  🟡 DUE SOON - PAYMENT REQUIRED                                     │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  📦 Load Payment #LD-2024-045                                       │    │
│  │  Truck Owner: XYZ Logistics                                         │    │
│  │  Amount: $12,500.00 USD                                             │    │
│  │  Due Date: Apr 26, 2026 (In 2 days)                                │    │
│  │  Trip: TRIP-2024-089 (Lagos → Abuja)                               │    │
│  │                                                                      │    │
│  │  [💳 Pay Now]  [📄 View Details]  [💰 Request Loan]                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  ⚪ PENDING - NO URGENCY                                            │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  💵 Advance Payment #AP-2024-089                                    │    │
│  │  Driver: John Doe                                                   │    │
│  │  Amount: $3,200.00 USD                                              │    │
│  │  Due Date: May 1, 2026 (In 7 days)                                 │    │
│  │  Trip: TRIP-2024-092 (Kano → Port Harcourt)                        │    │
│  │                                                                      │    │
│  │  [💳 Pay Now]  [📄 View Details]  [⏰ Set Reminder]                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Showing 3 pending payments • Total: $20,700.00                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ✅ COMPLETED TRANSACTIONS - HISTORY                      [🔍 Search] [📥]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────┬──────────┬─────────────────┬───────────┬──────────┬──────────┐   │
│  │Date │   Type   │   Description   │  Amount   │  Method  │  Actions │   │
│  ├─────┼──────────┼─────────────────┼───────────┼──────────┼──────────┤   │
│  │Apr  │ 📦 Load  │ Payment to XYZ  │ $12,500   │ 💳 Wallet│ 👁️ 📥    │   │
│  │ 24  │ Payment  │ Logistics       │           │          │          │   │
│  │     │          │ Ref: #LD-001    │           │          │          │   │
│  ├─────┼──────────┼─────────────────┼───────────┼──────────┼──────────┤   │
│  │Apr  │ 🏦 Loan  │ Repayment to    │ $5,000    │ 🏦 Bank  │ 👁️ 📥    │   │
│  │ 23  │ Repay    │ ABC Finance     │           │ Transfer │          │   │
│  │     │          │ Ref: #LN-002    │           │          │          │   │
│  ├─────┼──────────┼─────────────────┼───────────┼──────────┼──────────┤   │
│  │Apr  │ 💵 Adv   │ Payment to      │ $3,200    │ 💳 Card  │ 👁️ 📥    │   │
│  │ 22  │ Payment  │ Driver John     │           │          │          │   │
│  │     │          │ Ref: #AP-003    │           │          │          │   │
│  ├─────┼──────────┼─────────────────┼───────────┼──────────┼──────────┤   │
│  │Apr  │ 📦 Load  │ Payment to DEF  │ $8,900    │ 💳 Wallet│ 👁️ 📥    │   │
│  │ 21  │ Payment  │ Transport       │           │          │          │   │
│  │     │          │ Ref: #LD-004    │           │          │          │   │
│  └─────┴──────────┴─────────────────┴───────────┴──────────┴──────────┘   │
│                                                                              │
│  Showing 4 of 12 transactions                    [← Previous] [Next →]     │
│                                                                              │
│  [📊 Export to CSV] [📄 Export to PDF] [📧 Email Report]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding Guide

### Status Colors:
- 🔴 **Red (Overdue)**: `bg-rose-50 border-rose-200 text-rose-900`
- 🟡 **Yellow (Due Soon)**: `bg-amber-50 border-amber-200 text-amber-900`
- ⚪ **Gray (Pending)**: `bg-slate-50 border-slate-200 text-slate-700`
- ✅ **Green (Completed)**: `bg-emerald-50 border-emerald-200 text-emerald-900`

### Payment Type Icons:
- 🏦 **Loan Repayment**: Purple badge
- 📦 **Load Payment**: Blue badge
- 💵 **Advance Payment**: Green badge
- 🔄 **Refund**: Orange badge

---

## 📱 Mobile View (< 768px)

```
╔═══════════════════════════════════════╗
║     💰 PAYMENTS                        ║
╚═══════════════════════════════════════╝

┌───────────────────────────────────────┐
│  📊 OVERVIEW                           │
├───────────────────────────────────────┤
│  🔴 Overdue: $5,000 (1)               │
│  🟡 Due Soon: $15,700 (2)             │
│  ✅ Paid: $45,600 (12)                │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  🔴 PENDING PAYMENTS                   │
├───────────────────────────────────────┤
│                                        │
│  ┌─────────────────────────────────┐  │
│  │ 🔴 OVERDUE                       │  │
│  │ Loan Repayment #LN-001          │  │
│  │ $5,000.00                        │  │
│  │ 3 days overdue                   │  │
│  │                                  │  │
│  │ [Pay Now]      [Details]        │  │
│  └─────────────────────────────────┘  │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │ 🟡 DUE SOON                      │  │
│  │ Load Payment #LD-045            │  │
│  │ $12,500.00                       │  │
│  │ Due in 2 days                    │  │
│  │                                  │  │
│  │ [Pay Now]      [Details]        │  │
│  └─────────────────────────────────┘  │
│                                        │
│  [View All (3)]                        │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  ✅ COMPLETED                          │
├───────────────────────────────────────┤
│                                        │
│  Apr 24 • Load Payment                │
│  $12,500 • Wallet • #LD-001           │
│  [View] [Receipt]                     │
│  ─────────────────────────────────    │
│  Apr 23 • Loan Repayment              │
│  $5,000 • Bank • #LN-002              │
│  [View] [Receipt]                     │
│  ─────────────────────────────────    │
│                                        │
│  [Load More]                           │
└───────────────────────────────────────┘
```

---

## 🎯 Interactive Elements

### Pending Payment Card (Hover State):
```
┌────────────────────────────────────────────────────────┐
│  🔴 OVERDUE - URGENT ACTION REQUIRED                    │
│  ─────────────────────────────────────────────────────  │
│  🏦 Loan Repayment #LN-2024-001                         │
│  Lender: ABC Finance Corp                               │
│  Amount: $5,000.00 USD                                  │
│  Due Date: Apr 21, 2026 (3 days overdue)               │
│  Late Fee: $150.00                                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  💡 Quick Actions:                                │  │
│  │  • Pay full amount ($5,150.00 with late fee)     │  │
│  │  • Pay partial amount                             │  │
│  │  • Request payment extension                      │  │
│  │  • Contact lender                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [💳 Pay Now]  [📄 View Details]  [📞 Request Extension]│
└────────────────────────────────────────────────────────┘
```

### Payment Modal (When "Pay Now" clicked):
```
╔═══════════════════════════════════════════════════════╗
║              💳 COMPLETE PAYMENT                       ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Payment Details:                                      ║
║  ─────────────────────────────────────────────────    ║
║  Type: Loan Repayment                                  ║
║  Reference: #LN-2024-001                               ║
║  Amount: $5,000.00                                     ║
║  Late Fee: $150.00                                     ║
║  ─────────────────────────────────────────────────    ║
║  Total: $5,150.00 USD                                  ║
║                                                        ║
║  Payment Method:                                       ║
║  ○ Wallet Balance ($12,450.00 available)              ║
║  ○ Bank Transfer                                       ║
║  ○ Credit/Debit Card                                   ║
║  ○ Request Loan from Lender                            ║
║                                                        ║
║  [Cancel]                    [Confirm Payment →]      ║
╚═══════════════════════════════════════════════════════╝
```

---

## 📊 Filter & Sort Options

### Pending Payments Filters:
```
┌─────────────────────────────────────────────────────┐
│  Filter By:                                          │
│  ☑️ Overdue                                          │
│  ☑️ Due Soon (Next 7 days)                          │
│  ☑️ Pending (7+ days)                               │
│                                                      │
│  Payment Type:                                       │
│  ☑️ Loan Repayments                                 │
│  ☑️ Load Payments                                   │
│  ☑️ Advance Payments                                │
│                                                      │
│  Amount Range:                                       │
│  Min: $_____ Max: $_____                            │
│                                                      │
│  [Clear All]              [Apply Filters]           │
└─────────────────────────────────────────────────────┘
```

### Completed Transactions Filters:
```
┌─────────────────────────────────────────────────────┐
│  Date Range:                                         │
│  From: [Apr 1, 2026] To: [Apr 24, 2026]            │
│                                                      │
│  Payment Type:                                       │
│  ☑️ All Types                                       │
│  ☐ Loan Repayments                                  │
│  ☐ Load Payments                                    │
│  ☐ Advance Payments                                 │
│  ☐ Refunds                                          │
│                                                      │
│  Payment Method:                                     │
│  ☑️ All Methods                                     │
│  ☐ Wallet                                           │
│  ☐ Bank Transfer                                    │
│  ☐ Credit/Debit Card                                │
│                                                      │
│  [Clear All]              [Apply Filters]           │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Component Breakdown

### 1. FinancialOverviewCards
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
    icon={<AlertCircle />}
    label="Overdue"
    amount="$5,000.00"
    count={1}
    color="rose"
    trend="urgent"
  />
  <StatCard
    icon={<Clock />}
    label="Due Soon"
    amount="$15,700.00"
    count={2}
    color="amber"
    trend="warning"
  />
  <StatCard
    icon={<CheckCircle />}
    label="Paid"
    amount="$45,600.00"
    count={12}
    color="emerald"
    trend="success"
  />
  <StatCard
    icon={<DollarSign />}
    label="Total"
    amount="$66,300.00"
    count={15}
    color="blue"
    trend="neutral"
  />
</div>
```

### 2. PendingPaymentCard
```typescript
<div className={cn(
  "rounded-3xl border-2 p-6 transition-all hover:shadow-lg",
  status === 'overdue' && "bg-rose-50 border-rose-200",
  status === 'dueSoon' && "bg-amber-50 border-amber-200",
  status === 'pending' && "bg-slate-50 border-slate-200"
)}>
  <StatusBadge status={status} />
  <PaymentTypeIcon type={type} />
  <PaymentDetails {...payment} />
  <ActionButtons>
    <Button variant="primary">Pay Now</Button>
    <Button variant="secondary">View Details</Button>
  </ActionButtons>
</div>
```

### 3. CompletedTransactionsTable
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Description</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Method</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {transactions.map(tx => (
      <TableRow key={tx.id}>
        <TableCell>{formatDate(tx.date)}</TableCell>
        <TableCell><PaymentTypeBadge type={tx.type} /></TableCell>
        <TableCell>{tx.description}</TableCell>
        <TableCell>{formatCurrency(tx.amount)}</TableCell>
        <TableCell><PaymentMethodIcon method={tx.method} /></TableCell>
        <TableCell>
          <IconButton icon={<Eye />} onClick={() => viewDetails(tx)} />
          <IconButton icon={<Download />} onClick={() => downloadReceipt(tx)} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## ✨ Animation & Transitions

### Card Entrance:
- Fade in + slide up
- Stagger delay (100ms between cards)
- Duration: 300ms

### Hover Effects:
- Scale: 1.02
- Shadow: Increase elevation
- Border: Brighten color
- Duration: 200ms

### Status Badge Pulse:
- Overdue: Continuous pulse
- Due Soon: Slow pulse
- Pending: No pulse

---

This design provides clear visual hierarchy, actionable insights, and a modern, professional appearance! 🎨✨
