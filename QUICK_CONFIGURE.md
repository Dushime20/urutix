# Quick Configure External Lender

## What You Need

1. **Admin JWT Token** - Get from browser DevTools → Application → Local Storage → `accessToken`
2. **External System API Key** - From your external lending system
3. **External System Webhook Secret** - From your external lending system  
4. **External System Base URL** - e.g., `https://api.urutilending.com`

## Quick Command (PowerShell)

```powershell
# Replace these values:
$token = "YOUR_ADMIN_JWT_TOKEN"
$lenderId = "2d6a9dd1-7a81-4e5a-affe-289b2dea80f8"
$baseUrl = "https://api.urutilending.com"
$apiKey = "YOUR_API_KEY"
$webhookSecret = "YOUR_SECRET"

# Run the configuration
$body = @{
    lenderId = $lenderId
    baseUrl = $baseUrl
    apiKey = $apiKey
    webhookSecret = $webhookSecret
    loanProductCode = "PL-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/admin/uruti-lending/configure" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

## Or Use the Script

1. Edit `configure-external-lender.js`
2. Fill in the values
3. Run: `node configure-external-lender.js`

