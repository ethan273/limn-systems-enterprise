'use client';

import { useEffect, useState } from 'react';

export default function ClearCachePage() {
  const [status, setStatus] = useState('Clearing cache...');

  useEffect(() => {
    async function clearEverything() {
      try {
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        setStatus(`✅ Unregistered ${registrations.length} service worker(s)`);

        // Clear all caches
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }

        setStatus(`✅ Cleared ${cacheNames.length} cache(s) and ${registrations.length} service worker(s)`);

        // Wait 2 seconds then redirect
        setTimeout(() => {
          setStatus('✅ Cache cleared! Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }, 2000);

      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    clearEverything();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Cache Cleaner</h1>
      <p>{status}</p>
      <p style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        This page automatically clears service workers and caches,<br />
        then redirects you to login.
      </p>
    </div>
  );
}
