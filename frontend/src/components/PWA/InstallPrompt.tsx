import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';
import { pwaManager } from '../../utils/pwa';

export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if can install
    const checkInstallability = () => {
      if (pwaManager.canInstall() && !sessionStorage.getItem('pwa-prompt-dismissed')) {
        // Show prompt after 30 seconds of usage
        setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    };

    // Listen for install available event
    const handleInstallAvailable = () => {
      checkInstallability();
    };

    // Listen for app installed event
    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setIsInstalling(false);
      // Show success message
      setTimeout(() => setIsInstalled(false), 5000);
    };

    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    window.addEventListener('pwaInstalled', handleInstalled);

    checkInstallability();

    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
      window.removeEventListener('pwaInstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await pwaManager.promptInstall();
    
    if (!success) {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-md">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold">Successfully Installed!</p>
            <p className="text-sm text-emerald-100">You can now use Urutix offline</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up px-4 w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install Urutix App</h3>
                <p className="text-sm text-violet-100">Get the full app experience</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Works Offline</p>
                <p className="text-sm text-gray-600">Access your shipments without internet</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Faster Performance</p>
                <p className="text-sm text-gray-600">Lightning-fast load times</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Stay updated on your shipments</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Install Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

