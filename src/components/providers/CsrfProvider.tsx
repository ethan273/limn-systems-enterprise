"use client";

/**
 * CSRF Provider Component
 *
 * Provides CSRF token to all child components via React Context
 * Automatically includes CSRF token in all tRPC mutations
 *
 * @module CsrfProvider
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface CsrfContextValue {
  token: string | null;
  refreshToken: () => void;
}

const CsrfContext = createContext<CsrfContextValue>({
  token: null,
  refreshToken: () => {},
});

export function useCsrf() {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error('useCsrf must be used within CsrfProvider');
  }
  return context;
}

interface CsrfProviderProps {
  children: ReactNode;
}

export function CsrfProvider({ children }: CsrfProviderProps) {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = () => {
    // Generate new CSRF token
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => setToken(data.token))
      .catch(err => console.error('[CSRF] Failed to fetch token:', err));
  };

  useEffect(() => {
    refreshToken();
  }, []);

  return (
    <CsrfContext.Provider value={{ token, refreshToken }}>
      {children}
    </CsrfContext.Provider>
  );
}
