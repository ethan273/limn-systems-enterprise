
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals-limn-brand.css"; // Switched to Limn brand theme
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ErrorBoundary } from "@/components/common";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // Prevent FOIT (Flash of Invisible Text)
  preload: true, // Preload font for faster initial render
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: "Limn Systems Enterprise",
  description: "Modern Enterprise Management System for Production, CRM, Finance, and Design Operations",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Limn Systems',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Limn Systems Enterprise',
    description: 'Modern Enterprise Management System',
    type: 'website',
    siteName: 'Limn Systems',
    images: [{
      url: '/icons/icon-512.png',
      width: 512,
      height: 512,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Limn Systems Enterprise',
    description: 'Modern Enterprise Management System',
    images: ['/icons/icon-512.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Immediately unregister old Service Workers to prevent stale cache */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  log.info('[SW Force Clear] Checking for service workers...');
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    log.info('[SW Force Clear] Found', registrations.length, 'service worker(s)');
                    var unregistered = 0;
                    registrations.forEach(function(registration) {
                      log.info('[SW Force Clear] Unregistering service worker:', registration.scope);
                      registration.unregister().then(function(success) {
                        if (success) {
                          unregistered++;
                          log.info('[SW Force Clear] Successfully unregistered service worker');
                        }
                      });
                    });
                    if (unregistered > 0) {
                      log.info('[SW Force Clear] Unregistered', unregistered, 'service worker(s)');
                      // Clear all caches
                      if ('caches' in window) {
                        caches.keys().then(function(names) {
                          log.info('[SW Force Clear] Clearing', names.length, 'cache(s)');
                          names.forEach(function(name) {
                            caches.delete(name);
                          });
                        });
                      }
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ErrorBoundary>
          <Providers>
            <ServiceWorkerRegistration />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
