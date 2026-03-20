# How to Get Your Admin JWT Token

## Quick Steps:

1. **Open your UrutiX app in browser** (where you're logged in as admin)

2. **Open DevTools:**
   - Press `F12` OR
   - Right-click → Inspect

3. **Go to Application tab:**
   - Click "Application" tab at the top
   - (If you don't see it, click the `>>` icon to see more tabs)

4. **Find Local Storage:**
   - In the left sidebar, expand "Local Storage"
   - Click on your domain (e.g., `http://localhost:5173`)

5. **Copy the token:**
   - Look for `accessToken` in the list
   - Double-click the Value column
   - Copy the entire token (it's a long string starting with `eyJ...`)

6. **Use it:**
   - Replace `YOUR_ADMIN_JWT_TOKEN_HERE` in `configure-lender-now.ps1`
   - OR share it with me and I'll run the configuration

## Token Format:
The token looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

It's a long string with dots (.) separating parts.

