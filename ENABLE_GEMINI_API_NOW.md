# ⚠️ Enable Gemini API - Required Step

## Current Status

Your API key is valid, but the **Generative Language API** is not enabled yet.

**Error:** `models/gemini-pro is not found for API version v1`

---

## ✅ Solution (2 minutes)

### Step 1: Enable the API

Click this link and enable the API:

🔗 **https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com**

1. You'll be taken to Google Cloud Console
2. Click the blue **"ENABLE"** button
3. Wait 1-2 minutes for activation

### Step 2: Test Again

```bash
cd backend
node test-gemini-simple.js
```

You should see:
```
✅ SUCCESS!
📝 Generated text: Hello! How can I help you today?
```

### Step 3: Start Backend

```bash
npm run start:dev
```

Look for:
```
✅ AI Email Assistant initialized with Google Gemini Pro
```

### Step 4: Use in UI

1. Login: `superadmin@urutix.com` / `SuperAdmin@123`
2. Go to: http://localhost:5174/admin/bulk-email
3. Click "AI Assistant" button
4. Try all 4 AI features!

---

## 🎯 What This Does

Enabling the Generative Language API allows your API key to:
- Generate emails from key points
- Improve existing content
- Create subject line variations
- Analyze email effectiveness

All at **ZERO cost** (1,500 requests/day free)!

---

## 💡 Why This Step?

Google requires you to explicitly enable each API service before use. This is a one-time setup that takes 2 minutes.

---

## 🔗 Quick Links

- **Enable API:** https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
- **AI Studio:** https://makersuite.google.com/app/apikey
- **Docs:** https://ai.google.dev/docs

---

**Action Required:** Click the link above and enable the API  
**Time:** 2 minutes  
**Cost:** FREE forever
