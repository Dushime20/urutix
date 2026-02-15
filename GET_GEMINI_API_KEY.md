# Get Your Free Gemini API Key 🔑

## Quick Steps (2 minutes)

### 1. Visit Google AI Studio
🔗 https://makersuite.google.com/app/apikey

### 2. Sign In
- Use any Google account
- No credit card required
- Completely free

### 3. Create API Key
- Click "Create API Key" button
- Choose "Create API key in new project" (or select existing)
- Copy the generated key

### 4. Add to Backend
Open `backend/.env` and add:

```env
GEMINI_API_KEY=AIzaSyC...your-key-here
```

### 5. Restart Backend
```bash
cd backend
npm run start:dev
```

Look for:
```
✅ AI Email Assistant initialized with Google Gemini
```

---

## ✅ Free Tier Limits

- **60 requests per minute**
- **1,500 requests per day**
- **No credit card needed**
- **No expiration**

Perfect for the bulk email system!

---

## 🔒 Security Tips

1. **Never commit API key to git**
   - Already in .gitignore
   - Keep in .env file only

2. **Regenerate if exposed**
   - Easy to create new key
   - Revoke old key in console

3. **Use environment variables**
   - Never hardcode in source
   - Different keys for dev/prod

---

## 🎯 What You Get

With your free Gemini API key, the AI Email Assistant can:

✅ Generate professional emails from key points  
✅ Improve existing email content  
✅ Create 5 subject line variations  
✅ Analyze email effectiveness with scoring  

All at ZERO cost!

---

## 📞 Need Help?

- **API Key Issues:** https://ai.google.dev/docs
- **Rate Limits:** Upgrade to paid tier if needed
- **Technical Support:** Check backend logs

---

**Time to Setup:** 2 minutes  
**Cost:** FREE forever  
**Quality:** Production-ready
