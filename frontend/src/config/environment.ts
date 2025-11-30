// Environment configuration
export const config = {
  // PostHog Analytics
  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_API_KEY,
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && !!import.meta.env.VITE_POSTHOG_API_KEY,
  },
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'UrutiX Fleet Management',
    environment: import.meta.env.VITE_APP_ENV || 'development',
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },
  
  // Feature Flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    websocket: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false', // Default: true, can be disabled
  },
  
  // WebSocket Configuration
  websocket: {
    enabled: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false', // Default: true
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
  },
};

// Helper function to check if PostHog should be initialized
export const shouldInitializePostHog = () => {
  const hasValidApiKey = config.posthog.apiKey && 
                        config.posthog.apiKey !== 'YOUR_POSTHOG_API_KEY' && 
                        config.posthog.apiKey !== 'your_posthog_api_key_here' &&
                        config.posthog.apiKey.length > 10; // Basic validation
  
  const isEnabled = config.posthog.enabled;
  
  console.log('📊 PostHog Configuration Check:', {
    hasValidApiKey,
    isEnabled,
    apiKey: config.posthog.apiKey ? `${config.posthog.apiKey.substring(0, 8)}...` : 'None',
    shouldInit: isEnabled && hasValidApiKey
  });
  
  return isEnabled && hasValidApiKey;
};

// Helper function to get API base URL
export const getApiBaseUrl = () => {
  return config.api.baseUrl;
}; 