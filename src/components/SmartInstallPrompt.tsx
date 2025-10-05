/**
 * Smart Install Prompt Component
 *
 * Intelligent PWA install prompt with user behavior tracking
 * Shows personalized value propositions based on usage patterns
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Zap, Lock, Cloud } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallCriteria {
  minVisits: number;
  minEngagementScore: number;
  daysSinceFirstVisit: number;
  specificActions?: string[];
}

interface UserBehavior {
  visitCount: number;
  engagementScore: number;
  firstVisitDate: number;
  lastPromptDate: number | null;
  promptDismissCount: number;
  topFeatures: string[];
}

export function SmartInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);

  useEffect(() => {
    // Load user behavior data
    loadUserBehavior();

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);

      // Check if we should show the prompt
      checkInstallCriteria();
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Track page engagement
    trackEngagement();

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load user behavior from localStorage
   */
  const loadUserBehavior = () => {
    const stored = localStorage.getItem('pwa-user-behavior');
    if (stored) {
      const behavior = JSON.parse(stored);
      setUserBehavior(behavior);
    } else {
      // Initialize new user
      const newBehavior: UserBehavior = {
        visitCount: 1,
        engagementScore: 0,
        firstVisitDate: Date.now(),
        lastPromptDate: null,
        promptDismissCount: 0,
        topFeatures: [],
      };
      setUserBehavior(newBehavior);
      saveUserBehavior(newBehavior);
    }
  };

  /**
   * Save user behavior to localStorage
   */
  const saveUserBehavior = (behavior: UserBehavior) => {
    localStorage.setItem('pwa-user-behavior', JSON.stringify(behavior));
  };

  /**
   * Track page engagement
   */
  const trackEngagement = () => {
    // Increment visit count
    const stored = localStorage.getItem('pwa-user-behavior');
    if (stored) {
      const behavior = JSON.parse(stored) as UserBehavior;
      behavior.visitCount++;
      saveUserBehavior(behavior);
    }

    // Track time on page
    const startTime = Date.now();
    const trackTime = () => {
      const timeSpent = Date.now() - startTime;
      if (timeSpent > 30000) { // 30 seconds
        incrementEngagementScore(1);
      }
    };

    // Track on page unload
    window.addEventListener('beforeunload', trackTime);

    // Track specific actions
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        incrementEngagementScore(0.5);
      }
    });
  };

  /**
   * Increment engagement score
   */
  const incrementEngagementScore = (points: number) => {
    const stored = localStorage.getItem('pwa-user-behavior');
    if (stored) {
      const behavior = JSON.parse(stored) as UserBehavior;
      behavior.engagementScore += points;
      saveUserBehavior(behavior);
      setUserBehavior(behavior);
    }
  };

  /**
   * Check if user meets install criteria
   */
  const checkInstallCriteria = () => {
    if (!userBehavior) return;

    const criteria: InstallCriteria = {
      minVisits: 3,
      minEngagementScore: 5,
      daysSinceFirstVisit: 1,
    };

    const daysSinceFirstVisit = (Date.now() - userBehavior.firstVisitDate) / (1000 * 60 * 60 * 24);
    const daysSinceLastPrompt = userBehavior.lastPromptDate
      ? (Date.now() - userBehavior.lastPromptDate) / (1000 * 60 * 60 * 24)
      : 999;

    const meetsVisits = userBehavior.visitCount >= criteria.minVisits;
    const meetsEngagement = userBehavior.engagementScore >= criteria.minEngagementScore;
    const meetsDays = daysSinceFirstVisit >= criteria.daysSinceFirstVisit;
    const notRecentlyDismissed = daysSinceLastPrompt >= 7; // Don't show again for 7 days
    const notDismissedTooMuch = userBehavior.promptDismissCount < 3;

    if (meetsVisits && meetsEngagement && meetsDays && notRecentlyDismissed && notDismissedTooMuch) {
      // Delay showing prompt for better UX
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Wait 3 seconds
    }
  };

  /**
   * Handle install click
   */
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);

    try {
      // Show native install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[Install] User accepted the install prompt');

        // Track successful install
        if (userBehavior) {
          userBehavior.lastPromptDate = Date.now();
          saveUserBehavior(userBehavior);
        }

        // Hide prompt
        setShowPrompt(false);
        setDeferredPrompt(null);
      } else {
        console.log('[Install] User dismissed the install prompt');
        handleDismiss();
      }
    } catch (error) {
      console.error('[Install] Error showing install prompt:', error);
    } finally {
      setInstalling(false);
    }
  };

  /**
   * Handle dismiss
   */
  const handleDismiss = () => {
    if (userBehavior) {
      userBehavior.lastPromptDate = Date.now();
      userBehavior.promptDismissCount++;
      saveUserBehavior(userBehavior);
      setUserBehavior(userBehavior);
    }

    setShowPrompt(false);
  };

  /**
   * Get personalized value proposition
   */
  const getValueProposition = () => {
    if (!userBehavior) {
      return {
        title: 'Install Limn Systems',
        description: 'Get faster access and work offline',
        benefits: [
          { icon: <Zap className="h-5 w-5" />, text: '10x faster loading' },
          { icon: <Cloud className="h-5 w-5" />, text: 'Work offline' },
          { icon: <Lock className="h-5 w-5" />, text: 'Secure & private' },
        ],
      };
    }

    // High engagement users
    if (userBehavior.engagementScore > 10) {
      return {
        title: 'You\'re a power user! 🚀',
        description: 'Install for the ultimate experience',
        benefits: [
          { icon: <Zap className="h-5 w-5" />, text: 'Instant app launch' },
          { icon: <Cloud className="h-5 w-5" />, text: 'Offline access to all data' },
          { icon: <Smartphone className="h-5 w-5" />, text: 'Native app experience' },
        ],
      };
    }

    // Regular users
    if (userBehavior.visitCount > 5) {
      return {
        title: 'Install for easier access',
        description: 'Add to your home screen for quick access',
        benefits: [
          { icon: <Smartphone className="h-5 w-5" />, text: 'One-tap access' },
          { icon: <Zap className="h-5 w-5" />, text: 'Faster performance' },
          { icon: <Cloud className="h-5 w-5" />, text: 'Work offline' },
        ],
      };
    }

    // New users
    return {
      title: 'Try our app!',
      description: 'Install for a better experience',
      benefits: [
        { icon: <Smartphone className="h-5 w-5" />, text: 'App-like experience' },
        { icon: <Zap className="h-5 w-5" />, text: 'Lightning fast' },
        { icon: <Lock className="h-5 w-5" />, text: 'Secure by default' },
      ],
    };
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  const { title, description, benefits } = getValueProposition();

  return (
    <div className="install-prompt-overlay">
      <Card className="install-prompt-card">
        <CardContent className="p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="install-prompt-close"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
              <div className="install-prompt-icon">
                <Download className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mt-3">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="text-primary">{benefit.icon}</div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1"
              >
                {installing ? (
                  <>Installing...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={installing}
              >
                Not Now
              </Button>
            </div>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground">
              Free • No account required • Works offline
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
