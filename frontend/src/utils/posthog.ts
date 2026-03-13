import posthog from 'posthog-js';
import { shouldInitializePostHog } from '../config/environment';

// Flag to track if PostHog is properly set up
let isPostHogConfigured = false;

// Export function to check if PostHog is configured
export const isPostHogAvailable = () => {
  return isPostHogConfigured && typeof window !== 'undefined' && typeof posthog !== 'undefined' && posthog.__loaded;
};

// Initialize PostHog only if properly configured
if (typeof window !== 'undefined' && shouldInitializePostHog()) {
  const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
  
  try {
    posthog.init(POSTHOG_API_KEY!, {
      api_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        console.log('📊 PostHog loaded callback triggered');
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      },
      autocapture: import.meta.env.PROD, // Only enable in production
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: false,
      enable_recording_console_log: true,
      bootstrap: {
        // Ensure user identification is properly handled
        distinctID: undefined,
      },
    });
    
    isPostHogConfigured = true;
    console.log('📊 PostHog initialized successfully with API key:', POSTHOG_API_KEY ? `${POSTHOG_API_KEY.substring(0, 8)}...` : 'None');
  } catch (error) {
    console.error('📊 PostHog initialization failed:', error);
    isPostHogConfigured = false;
  }
} else if (typeof window !== 'undefined') {
  const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
  const analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS;
  console.log('📊 PostHog disabled:', {
    hasApiKey: !!POSTHOG_API_KEY,
    apiKey: POSTHOG_API_KEY ? `${POSTHOG_API_KEY.substring(0, 8)}...` : 'None',
    analyticsEnabled,
    shouldInit: shouldInitializePostHog()
  });
}

export function identifyUser(user: { id: string; email?: string; firstName?: string; lastName?: string; role?: string }) {
  if (!user?.id || typeof window === 'undefined') {
    if (isPostHogConfigured) {
      console.log('📊 PostHog: Cannot identify user - missing user ID or not in browser');
    }
    return;
  }

  // Check if PostHog is available and loaded
  if (typeof posthog === 'undefined' || !isPostHogConfigured) {
    if (isPostHogConfigured) {
      console.log('📊 PostHog: Not available, skipping user identification');
    }
    return;
  }

  // If PostHog is not loaded yet, wait for it
  if (!posthog.__loaded) {
    console.log('📊 PostHog: Not loaded yet, waiting...');
    // Try again after a short delay
    setTimeout(() => {
      if (posthog.__loaded) {
        identifyUser(user);
      } else {
        console.log('📊 PostHog: Still not loaded after delay, skipping identification');
      }
    }, 1000);
    return;
  }

  // Additional check to ensure PostHog is properly initialized
  if (!posthog.identify || typeof posthog.identify !== 'function') {
    console.log('📊 PostHog: identify function not available');
    return;
  }

  try {
    console.log('📊 PostHog: Identifying user:', user.id);
    posthog.identify(user.id, { 
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role,
      $set: {
        email: user.email,
        user_id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
      },
      $set_once: {
        first_login: new Date().toISOString(),
      }
    });
    console.log('📊 PostHog: User identified successfully');
  } catch (error) {
    console.error('📊 PostHog: Error identifying user:', error);
  }
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  
  try {
    if (typeof posthog !== 'undefined' && posthog.__loaded) {
      console.log('📊 PostHog: Resetting user');
      posthog.reset();
    } else {
      console.log('📊 PostHog: Not available for user reset');
    }
  } catch (error) {
    console.error('📊 PostHog: Error resetting user:', error);
  }
}

export function captureEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  try {
    if (typeof posthog !== 'undefined' && posthog.__loaded) {
      console.log('📊 PostHog: Capturing event:', eventName, properties);
      posthog.capture(eventName, properties);
    } else {
      console.log('📊 PostHog: Not available for event capture:', eventName);
    }
  } catch (error) {
    console.error('📊 PostHog: Error capturing event:', error);
  }
}
