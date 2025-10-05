"use client";

import { useEffect, useState } from 'react';
import { X, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = localStorage.getItem('pwa-install-dismissed-date');
    
    // Re-show after 7 days if previously dismissed
    if (dismissed === 'true' && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS specific check
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS && !(window.navigator as any).standalone) {
      // Show iOS install instructions after delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS installation instructions
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        alert('To install: Tap the Share button and select "Add to Home Screen"');
      }
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-date', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 max-w-md">
      <div className="card border rounded-lg p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Install Limn Systems
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install the app for offline access and better performance.
            </p>

            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-success" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-success" />
                <span>Faster performance</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-success" />
                <span>Direct desktop access</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="btn-info text-xs"
              >
                <Download className="mr-1.5 h-3 w-3" />
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Not Now
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-muted-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
