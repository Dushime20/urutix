# Cargo AI Matching Frontend

## PostHog Analytics Setup

To enable analytics tracking, you need to configure PostHog:

1. **Get your PostHog API key:**
   - Go to [PostHog](https://app.posthog.com/project/settings)
   - Copy your project API key

2. **Create environment file:**
   ```bash
   # Create .env file in frontend directory
   echo "VITE_POSTHOG_API_KEY=your_actual_api_key_here" > .env
   ```

3. **Features enabled:**
   - User identification on login/register
   - Event tracking (login, logout, registration)
   - Session recording
   - Page view tracking
   - Automatic user properties

## Development

```bash
npm install
npm run dev
```

## Environment Variables

- `VITE_POSTHOG_API_KEY`: Your PostHog project API key
- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:3000/api)
