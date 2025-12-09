# Mobile Money Payment - Setup Checklist

## ✅ Quick Setup Guide

After adding the environment variables, follow these steps to ensure everything works:

### Step 1: Environment Variables ✅
Add these to your `.env` file:
```env
MOBILE_MONEY_API_URL=https://api.payment.ishema.rw
MOBILE_MONEY_API_KEY=YOUR_API_KEY_HERE
MOBILE_MONEY_CALLBACK_URL=https://yourdomain.com/api/payments/webhooks/mobile-money
MOBILE_MONEY_CURRENCY=RWF
```

### Step 2: Verify Backend Starts Successfully
1. Start your backend: `npm run start:dev` or `yarn start:dev`
2. Check for any startup errors
3. Look for these log messages:
   - ✅ "Mobile Money Payment service initialized"
   - ✅ "Payments module loaded"

### Step 3: Test the Integration

#### Test 1: Health Check
```bash
# Check if service is available (this will be logged on startup)
# Look for: "Mobile Money Payment service ready"
```

#### Test 2: Create a Test Payment
Use your frontend or API client to create a payment with:
```json
{
  "paymentMethod": "DIGITAL_WALLET",
  "amount": 1000,
  "currency": "RWF",
  "meta": {
    "phoneNumber": "0783544364",
    "referenceId": "TEST-001",
    "senderMessage": "Test payment"
  }
}
```

#### Test 3: Webhook Endpoint
The webhook endpoint should be accessible at:
```
POST https://yourdomain.com/api/payments/webhooks/mobile-money
```

**Note**: This endpoint is PUBLIC (no authentication required) so external services can call it.

### Step 4: Common Issues & Solutions

#### Issue 1: "Mobile Money Payment API key is not configured"
**Solution**: Make sure `MOBILE_MONEY_API_KEY` is set in your `.env` file

#### Issue 2: Webhook not receiving callbacks
**Solution**: 
- Make sure `MOBILE_MONEY_CALLBACK_URL` is publicly accessible
- Use ngrok for local development: `ngrok http 3000`
- Update the callback URL in your payment provider dashboard

#### Issue 3: Payment creation fails
**Solution**:
- Check API key is correct
- Verify phone number format (will be auto-formatted to 250XXXXXXXXX)
- Check API URL is correct

### Step 5: Verify Integration Points

1. **Payment Processing**: When a payment is created with `paymentMethod: 'DIGITAL_WALLET'`, it should automatically use Mobile Money service
2. **Webhook Processing**: When payment provider sends callback, payment status should update automatically
3. **Invoice/Receipt Generation**: If payment is from lender, invoices and receipts should be generated

## 🚀 Ready to Use!

Once you've:
- ✅ Added environment variables
- ✅ Backend starts without errors
- ✅ Webhook URL is publicly accessible

Your Mobile Money payment integration is ready to process payments!

## 📝 Next Steps

1. Test with a small payment amount
2. Monitor logs for any errors
3. Verify webhook callbacks are received
4. Check payment status updates in database

---

**If you encounter any issues, check the logs for detailed error messages!**

