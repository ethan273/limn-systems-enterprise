"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { type AppRouter } from '@/server/api/root';
import superjson from 'superjson';

// Create tRPC React client
export const api = createTRPCReact<AppRouter>();

// Get base URL for API
function getBaseUrl() {
 if (typeof window !== 'undefined') return ''; // browser should use relative url
 if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
 return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
 const [queryClient] = useState(() =>
 new QueryClient({
 defaultOptions: {
 queries: {
 staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
 gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection time (was cacheTime in v4)
 refetchOnWindowFocus: false, // Don't refetch on window focus
 refetchOnReconnect: false, // Don't refetch on reconnect
 retry: 1, // Only retry failed requests once
 },
 },
 })
 );

 const [trpcClient] = useState(() =>
 api.createClient({
 links: [
 // Logger disabled to reduce console noise
 // Uncomment for debugging: loggerLink({ enabled: () => true }),
 httpBatchLink({
 url: `${getBaseUrl()}/api/trpc`,
 transformer: superjson,
 maxURLLength: 2083, // Prevent URLs from getting too long
 headers() {
 return {
 // Add auth headers here if needed
 };
 },
 }),
 ],
 })
 );

 return (
 <api.Provider client={trpcClient} queryClient={queryClient}>
 <QueryClientProvider client={queryClient}>
 {children}
 </QueryClientProvider>
 </api.Provider>
 );
}
