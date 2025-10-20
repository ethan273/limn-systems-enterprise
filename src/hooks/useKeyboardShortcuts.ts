"use client";

/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for power users
 * Provides quick navigation and actions
 *
 * @module useKeyboardShortcuts
 */

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandler {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: ShortcutHandler[] = useMemo(() => [
    // Navigation shortcuts
    {
      key: 'd',
      metaKey: true,
      handler: () => router.push('/dashboard'),
      description: 'Go to Dashboard',
    },
    {
      key: 't',
      metaKey: true,
      handler: () => router.push('/tasks'),
      description: 'Go to Tasks',
    },
    {
      key: 'p',
      metaKey: true,
      handler: () => router.push('/production/orders'),
      description: 'Go to Production Orders',
    },
    {
      key: 'c',
      metaKey: true,
      shiftKey: true,
      handler: () => router.push('/crm/customers'),
      description: 'Go to Clients',
    },
    // Action shortcuts
    {
      key: 'n',
      metaKey: true,
      handler: () => {
        // This will be handled by specific pages
        const event = new CustomEvent('keyboard-shortcut-new');
        window.dispatchEvent(event);
      },
      description: 'Create New (context-specific)',
    },
    {
      key: '/',
      metaKey: true,
      handler: () => {
        const event = new CustomEvent('keyboard-shortcut-search');
        window.dispatchEvent(event);
      },
      description: 'Focus Search',
    },
  ], [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const metaMatch = s.metaKey ? e.metaKey : !e.metaKey;
        const shiftMatch = s.shiftKey ? e.shiftKey : !e.shiftKey;

        return keyMatch && ctrlMatch && metaMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { shortcuts };
}

/**
 * Keyboard shortcuts help overlay
 */
export const KEYBOARD_SHORTCUTS_HELP = [
  { keys: ['⌘', 'K'], description: 'Global Search' },
  { keys: ['⌘', 'D'], description: 'Go to Dashboard' },
  { keys: ['⌘', 'T'], description: 'Go to Tasks' },
  { keys: ['⌘', 'P'], description: 'Go to Production' },
  { keys: ['⌘', '⇧', 'C'], description: 'Go to Clients' },
  { keys: ['⌘', 'N'], description: 'Create New' },
  { keys: ['⌘', '/'], description: 'Focus Search' },
  { keys: ['?'], description: 'Show Keyboard Shortcuts' },
];
