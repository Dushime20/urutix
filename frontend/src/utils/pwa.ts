/**
 * Progressive Web App (PWA) Utilities
 * Handles service worker registration, installation prompts, and offline detection
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize PWA functionality
   */
  private init() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone) {
      this.isInstalled = true;
      console.log('[PWA] App is running in standalone mode');
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      console.log('[PWA] Install prompt ready');
      
      // Dispatch custom event that components can listen to
      window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('[PWA] App installed successfully');
      window.dispatchEvent(new CustomEvent('pwaInstalled'));
    });

    // Online/Offline detection
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      window.dispatchEvent(new CustomEvent('pwaOnline'));
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      window.dispatchEvent(new CustomEvent('pwaOffline'));
    });
  }

  /**
   * Check if app is installable
   */
  public canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  /**
   * Check if app is installed
   */
  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Prompt user to install app
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }

  /**
   * Register service worker
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PWA] Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available');
              window.dispatchEvent(new CustomEvent('pwaUpdateAvailable'));
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister service worker
   */
  public async unregisterServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const success = await registration.unregister();
      console.log('[PWA] Service Worker unregistered:', success);
      return success;
    } catch (error) {
      console.error('[PWA] Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Check if online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Request push notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPushNotifications(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'YOUR_VAPID_PUBLIC_KEY_HERE'
        )
      });

      console.log('[PWA] Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Cache important data for offline use
   */
  public async cacheData(cacheName: string, urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[PWA] Cache API not supported');
      return;
    }

    try {
      const cache = await caches.open(cacheName);
      await cache.addAll(urls);
      console.log(`[PWA] Cached ${urls.length} URLs in ${cacheName}`);
    } catch (error) {
      console.error('[PWA] Caching failed:', error);
    }
  }

  /**
   * Clear all caches
   */
  public async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Cache clearing failed:', error);
    }
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Export types
export type { NotificationPermission, PushSubscription, ServiceWorkerRegistration };

