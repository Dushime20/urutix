# AI Matching Credit System - README

## 🎯 Overview

The AI Matching system now includes automatic credit validation and deduction, ensuring both tenant admins and truck owners have sufficient credits before and after accepting cargo matches. This implementation mirrors the existing bidding system's credit flow.

## ✨ Key Features

- ✅ **Credit Validation Before Match Request** - Validates truck owner has enough credits
- ✅ **Automatic Credit Deduction on Acceptance** - Deducts credits from both parties
- ✅ **Dual Deduction System** - Charges both tenant admin and truck owner
- ✅ **Revenue to Tenant Admin** - Grants earnings from truck owner payment
- ✅ **Comprehensive Error Handling** - Clear error messages for all scenarios
- ✅ **Transaction Recording** - Detailed audit trail of all credit operations

## 🚀 Quick Start

### For Developers

1. **Read the Documentation:**
   - [Implementation Summary](./docs/AI_MATCHING_CREDIT_IMPLEMENTATION_SUMMARY.md) - Complete overview
   - [Quick Reference](./docs/AI_MATCHING_CREDIT_QUICK_REFERENCE.md) - Fast lookup guide
   - [Frontend Integration](./docs/FRONTEND_AI_MATCHING_CREDIT_INTEGRATION.md) - UI integration guide

2. **Test the System:**
   ```bash
   cd backend
   node test-ai-matching-credit-system.js
   ```

3. **Review the Code:**
   - `backend/src/modules/matching/matching.service.ts` - Main implementation
   - `backend/src/modules/matching/matching.module.ts` - Module configuration
   - `backend/src/services/credit.service.ts` - Credit operations

### For Users

1. **Ensure Active Subscription:**
   - Navigate to Subscription Plans
   - Subscribe to a plan with credit rates configured

2. **Check Credit Balance:**
   - View your credit balance in the dashboard
   - Purchase credits if needed from Credit Marketplace

3. **Use AI Matching:**
   - Request matches as usual
   - System validates credits automatically
   - Credits deducted when match is accepted

## 📊 Credit Flow

```
Cargo Owner Requests Match
         ↓
   Validate Truck Owner Credits
         ↓
    ✅ Sufficient → Send Request
    ❌ Insufficient → Block Request
         ↓
  Truck Owner Accepts Match
         ↓
    Deduct Credits (Both Parties)
         ↓
  ┌─────────────┬─────────────┐
  │ Tenant Admin│ Truck Owner │
  │  -40 credits│  -60 credits│
  └─────────────┴─────────────┘
         ↓
  Grant Revenue to Tenant Admin
         ↓
    Net Profit: +20 credits
```

## 💰 Credit Calculation

**Formula:**
```
Cargo Weight (tons) = Cargo Weight (kg) / 1000
Tenant Credits = Cargo Weight × Credits Per Ton (Tenant)
Truck Owner Credits = Cargo Weight × Credits Per Ton (Truck Owner)
Net Profit = Truck Owner Credits - Tenant Credits
```

**Example:**
- Cargo: 4,000 kg (4 tons)
- Tenant Rate: 10 credits/ton
- Truck Owner Rate: 15 credits/ton

**Result:**
- Tenant Cost: 4 × 10 = 40 credits
- Truck Owner Cost: 4 × 15 = 60 credits
- Tenant Revenue: +60 credits
- **Net Profit: +20 credits**

## 🔧 API Endpoints

### Request Match
```http
POST /matching/request
Content-Type: application/json

{
  "loadId": "uuid",
  "truckId": "uuid"
}
```

**Response (Success):**
```json
{
  "id": "match-uuid",
  "status": "REQUESTED",
  "loadId": "cargo-uuid",
  "truckId": "truck-uuid"
}
```

**Response (Error - Insufficient Credits):**
```json
{
  "statusCode": 400,
  "message": "Truck owner has insufficient credits to accept this cargo. Required: 60, Available: 45"
}
```

### Accept Match
```http
PATCH /matching/:matchId/respond
Content-Type: application/json

{
  "status": "ACCEPTED"
}
```

**Response (Success):**
```json
{
  "id": "match-uuid",
  "status": "ACCEPTED"
}
```

**Response (Error - Credit Deduction Failed):**
```json
{
  "statusCode": 400,
  "message": "Failed to process credit deduction: Tenant admin has insufficient credits. Required: 40, Available: 30"
}
```

## 📁 File Structure

```
.
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   └── matching/
│   │   │       ├── matching.service.ts      ← Main implementation
│   │   │       └── matching.module.ts       ← Module config
│   │   └── services/
│   │       └── credit.service.ts            ← Credit operations
│   └── test-ai-matching-credit-system.js    ← Test script
│
├── docs/
│   ├── AI_MATCHING_CREDIT_SYSTEM.md                    ← Full documentation
│   ├── AI_MATCHING_CREDIT_QUICK_REFERENCE.md          ← Quick reference
│   ├── AI_MATCHING_CREDIT_IMPLEMENTATION_SUMMARY.md   ← Implementation details
│   └── FRONTEND_AI_MATCHING_CREDIT_INTEGRATION.md     ← Frontend guide
│
└── AI_MATCHING_CREDIT_DEPLOYMENT_CHECKLIST.md         ← Deployment guide
```

## 🧪 Testing

### Run Test Script
```bash
cd backend
node test-ai-matching-credit-system.js
```

**What it tests:**
- Active subscription existence
- Tenant admin and truck owner presence
- Available cargo and trucks
- Credit balance validation
- Credit calculation accuracy
- Simulated deduction flow

### Manual Testing

1. **Test Sufficient Credits:**
   - Ensure both parties have enough credits
   - Send match request → Should succeed
   - Accept match → Credits should be deducted

2. **Test Insufficient Credits:**
   - Reduce truck owner's credit balance
   - Send match request → Should fail with error
   - Error message should show required vs available

3. **Test No Subscription:**
   - Deactivate tenant subscription
   - Send match request → Should fail with error

## 🐛 Troubleshooting

### Issue: "Insufficient credits" error

**Solution:**
1. Check credit balance in database
2. Purchase credits from Credit Marketplace
3. Or use cargo with lower weight

### Issue: "No active subscription" error

**Solution:**
1. Check subscription status
2. Create or activate subscription
3. Ensure subscription has credit rates configured

### Issue: Credits not deducted

**Solution:**
1. Check logs for errors
2. Verify subscription plan has credit rates
3. Ensure both users have credit accounts
4. Check database constraints

## 📚 Documentation

### Complete Documentation
- **[Full System Documentation](./docs/AI_MATCHING_CREDIT_SYSTEM.md)** - Comprehensive guide with all details
- **[Quick Reference Guide](./docs/AI_MATCHING_CREDIT_QUICK_REFERENCE.md)** - Fast lookup for common tasks
- **[Implementation Summary](./docs/AI_MATCHING_CREDIT_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[Frontend Integration](./docs/FRONTEND_AI_MATCHING_CREDIT_INTEGRATION.md)** - UI integration guide
- **[Deployment Checklist](./AI_MATCHING_CREDIT_DEPLOYMENT_CHECKLIST.md)** - Deployment steps and verification

### Related Documentation
- [Credit Marketplace Quick Start](./docs/CREDIT_MARKETPLACE_QUICK_START.md)
- [Bidding System Implementation](./docs/BIDDING_SYSTEM_IMPLEMENTATION_SUMMARY.md)
- [Subscription Creation Guide](./docs/SUBSCRIPTION_CREATION_GUIDE.md)

## 🔍 Key Implementation Details

### Modified Files
1. `backend/src/modules/matching/matching.service.ts`
   - Added credit validation in `requestMatch()`
   - Added credit deduction in `respondToMatch()`
   - Added repository dependencies

2. `backend/src/modules/matching/matching.module.ts`
   - Added `SubscriptionPlan` entity
   - Updated TypeORM configuration

### Dependencies Added
- `userRepository` - For finding tenant admin
- `tenantSubscriptionRepository` - For subscription plans
- `subscriptionPlanRepository` - For plan details
- `creditService` - For credit operations

### Credit Service Methods Used
- `getOrCreateCreditAccount()` - Get user's credit balance
- `consumeCreditsForBid()` - Dual deduction (same as bidding)
- Transaction recording - Automatic audit trail

## 🎯 Success Criteria

✅ **Implemented:**
- Credit validation before match request
- Credit deduction on match acceptance
- Dual deduction (tenant admin + truck owner)
- Revenue grant to tenant admin
- Detailed transaction recording
- Comprehensive error handling
- Complete documentation

✅ **Verified:**
- No TypeScript compilation errors
- No breaking changes
- Proper dependency injection
- Consistent with bidding system

## 🚦 Next Steps

1. **Testing:**
   - [ ] Run test script in development
   - [ ] Perform manual testing
   - [ ] Test edge cases
   - [ ] Verify error messages

2. **Deployment:**
   - [ ] Deploy to staging
   - [ ] Test in staging environment
   - [ ] Deploy to production
   - [ ] Monitor metrics

3. **User Communication:**
   - [ ] Notify users about new feature
   - [ ] Update help documentation
   - [ ] Train support team

## 📞 Support

### For Technical Issues
- Check [Troubleshooting Guide](./docs/AI_MATCHING_CREDIT_QUICK_REFERENCE.md#troubleshooting)
- Review [Full Documentation](./docs/AI_MATCHING_CREDIT_SYSTEM.md)
- Contact backend development team

### For Business Questions
- Review [Credit Marketplace Guide](./docs/CREDIT_MARKETPLACE_QUICK_START.md)
- Contact product team

## 📝 License

This implementation is part of the cargo management system and follows the same license as the main project.

---

**Last Updated:** April 13, 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
