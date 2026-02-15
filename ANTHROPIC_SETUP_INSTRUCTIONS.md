# Anthropic Claude AI - Setup Instructions

## 🎯 Quick Action Required

Your AI Email Assistant has been migrated to Anthropic Claude, but needs credits to work.

## ⚡ 3-Step Setup

### Step 1: Add Credits to Your Anthropic Account

1. Go to: **https://console.anthropic.com/**
2. Sign in with your account
3. Navigate to: **Settings → Plans & Billing**
4. Click: **"Add Credits"** or **"Upgrade Plan"**
5. Add at least **$5-10** to start (recommended: $20 for testing)

### Step 2: Verify API Key (Already Done)

Your API key is already configured in `backend/.env`:
```
ANTHROPIC_API_KEY=[REDACTED]
```

### Step 3: Test the Integration

After adding credits, run:

```bash
cd backend
node test-anthropic-ai.js
```

Expected output:
```
✅ API Key found
✅ Anthropic client initialized
✅ Email generated successfully!
✅ Subject lines generated!
✅ Email analyzed successfully!
✅ ALL TESTS PASSED!
```

## 💰 Pricing Information

**Claude 3.5 Sonnet** (the model we're using):
- **Input**: $3 per million tokens (~750,000 words)
- **Output**: $15 per million tokens (~750,000 words)

**Typical Usage**:
- Generate 1 email: ~$0.01 - $0.02
- Generate 5 subject lines: ~$0.005
- Analyze 1 email: ~$0.01
- **100 emails**: ~$1-2

**Recommendation**: Start with $10-20 for testing, then add more as needed.

## 🚀 Using the AI Assistant

Once credits are added and backend is restarted:

1. **Login as Super Admin**:
   - Email: `superadmin@urutix.com`
   - Password: `SuperAdmin@123`

2. **Navigate to**: Admin → Bulk Email

3. **Click**: "AI Assistant" button

4. **Choose a feature**:
   - **Generate**: Create emails from key points
   - **Improve**: Enhance existing content
   - **Subject Lines**: Get 5 variations
   - **Analyze**: Score effectiveness (0-100)

## 🔍 Troubleshooting

### "AI Assistant Not Available"
- Check if credits are added to Anthropic account
- Restart backend: `npm run start:dev`
- Check backend logs for initialization message

### "Credit balance too low"
- Add more credits at https://console.anthropic.com/
- Wait 1-2 minutes for credits to activate
- Restart backend

### Backend not starting
- Check if all dependencies are installed: `npm install`
- Verify `.env` file has `ANTHROPIC_API_KEY`
- Check for any compilation errors

## 📊 Monitoring Usage

Track your API usage at:
- **Console**: https://console.anthropic.com/
- **Usage Dashboard**: Shows requests, tokens, and costs
- **Billing**: View current balance and add credits

## 🎉 What You Get

With Anthropic Claude, you get:

✅ **Professional Email Generation**: Create complete emails from bullet points
✅ **Smart Improvements**: Enhance clarity, tone, and engagement
✅ **Subject Line Variations**: Get 5 compelling options instantly
✅ **Effectiveness Analysis**: Score emails 0-100 with actionable feedback
✅ **Better Quality**: Claude 3.5 Sonnet is one of the best AI models available
✅ **Reliable API**: Stable, production-ready service

## 📝 Next Steps

1. ✅ **Code Migration**: Complete (all files updated)
2. ⏳ **Add Credits**: Go to Anthropic console now
3. ⏳ **Test Integration**: Run test script after adding credits
4. ⏳ **Restart Backend**: `npm run start:dev`
5. ⏳ **Test Frontend**: Try AI Assistant in Bulk Email page

---

**Need Help?**
- Anthropic Support: https://support.anthropic.com/
- API Documentation: https://docs.anthropic.com/
- Pricing Details: https://www.anthropic.com/pricing
