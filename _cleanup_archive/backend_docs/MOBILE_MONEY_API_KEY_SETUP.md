# Mobile Money API Key Setup

## ✅ Your API Key
Your Mobile Money API key has been provided: `wT48JRMwtUMPCRDQLBIJ`

## 📝 Setup Instructions

### Step 1: Add to .env File

Add or update the following environment variables in your `backend/.env` file:

```env
# Mobile Money Payment Configuration
MOBILE_MONEY_API_URL=https://api.payment.ishema.rw
MOBILE_MONEY_API_KEY=wT48JRMwtUMPCRDQLBIJ
MOBILE_MONEY_CALLBACK_URL=http://localhost:3000/api/payments/webhooks/mobile-money
MOBILE_MONEY_CURRENCY=RWF
MOBILE_MONEY_ACCOUNT_PHONE=250783544364
```

**Important Notes:**
- Replace `MOBILE_MONEY_CALLBACK_URL` with your actual production URL when deploying
- Replace `MOBILE_MONEY_ACCOUNT_PHONE` with the phone number associated with your API account (the one that will receive the payment confirmation popup)
- For local development, you may need to use ngrok to make the webhook URL publicly accessible

### Step 2: Restart Backend

After adding the environment variables, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run start:dev
```

### Step 3: Verify Configuration

The backend will log an error if the API key is missing. Look for:
- ✅ No errors about "Mobile Money Payment API key is not configured"
- ✅ Service should initialize successfully

## 🔍 Where the API Key is Used

The API key is used in:
1. **MobileMoneyPaymentService** (`src/modules/payments/services/mobile-money-payment.service.ts`)
   - Used to authenticate API requests to the payment provider
   - Retrieved via `ConfigService.get('MOBILE_MONEY_API_KEY')`

2. **ProviderIntegrationService** (`src/modules/payments/services/provider-integration.service.ts`)
   - Used for provider configuration

## 🧪 Testing

After setup, test the payment flow:
1. Go to the frontend payment page
2. Select "Mobile Money" as payment method
3. Enter receiver phone number and amount
4. Submit payment
5. Check backend logs for API calls

## ⚠️ Security Note

- Never commit your `.env` file to version control
- Keep your API key secure
- Rotate keys if compromised

