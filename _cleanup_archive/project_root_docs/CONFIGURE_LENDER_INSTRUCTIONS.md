# Configure External Lender - Step by Step

## Quick Method: Using the Script

1. **Get your Admin JWT Token:**
   - Open your browser
   - Go to DevTools (F12)
   - Application tab → Local Storage
   - Copy the `accessToken` value

2. **Get External System Credentials:**
   - Contact your external lending system team
   - Get:
     - API Key
     - Webhook Secret
     - Base URL (e.g., `https://api.urutilending.com`)

3. **Edit `configure-external-lender.js`:**
   - Update `adminToken` with your JWT token
   - Update `apiKey` with external system API key
   - Update `webhookSecret` with external system secret
   - Update `baseUrl` with external system URL
   - (Optional) Change `lenderId` if you want to use a different lender

4. **Run the script:**
   ```bash
   cd backend
   node ../configure-external-lender.js
   ```

## Alternative: Using curl/Postman

```bash
POST http://localhost:3002/api/admin/uruti-lending/configure
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "lenderId": "2d6a9dd1-7a81-4e5a-affe-289b2dea80f8",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "YOUR_API_KEY",
  "webhookSecret": "YOUR_SECRET",
  "loanProductCode": "PL-001"
}
```

## Available Lender IDs (from your logs):

- `2d6a9dd1-7a81-4e5a-affe-289b2dea80f8` - Uruti Lender
- `addedfac-bbd1-476f-907e-4e8defe336d6` - Debbie
- `5d8c6515-85fa-49b0-a5ba-e4ef70b994bf` - Alpha Capital Lending
- `3afcf554-9bfe-4cce-8bd4-05b52bfdff2e` - Beta Finance Solutions
- `4c2d19c9-c728-41f7-9422-f76ab9f3056d` - Gamma Investment Group

## After Configuration

1. Restart backend
2. Check logs - you should see:
   ```
   [getTenantLenders] ✅ External system lender found: ...
   [getTenantLenders] Fetching loan officers...
   ```
3. Loan officers should appear in External Lending System tab

## If You Don't Have Credentials Yet

You need to contact your external lending system team and ask for:
1. API Key for integration
2. Webhook Secret
3. Base URL of their API

Then use the script or API call above to configure.

