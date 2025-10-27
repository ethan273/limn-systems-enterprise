import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/server/api/trpc/context';
import type { NextRequest } from 'next/server';

/**
 * Vercel-optimized configuration for tRPC
 */
export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility
export const dynamic = 'force-dynamic'; // Prevent static optimization of API routes
export const maxDuration = 30; // Set explicit 30-second timeout for Vercel
export const revalidate = 0; // Disable ISR caching - we want real-time data

/**
 * Handle tRPC requests
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({
      req: req as any,
      res: undefined,
    }),
    batching: {
      enabled: true,
    },
    onError: ({ path, error }) => {
      // CRITICAL: Log errors in ALL environments (production included)
      // Suppress expected UNAUTHORIZED errors to reduce console noise
      if (error.code !== 'UNAUTHORIZED' && error.message !== 'UNAUTHORIZED') {
        console.error(
          `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
          error.cause ? `\nCause: ${JSON.stringify(error.cause)}` : ''
        );
      }
    },
  });

export { handler as GET, handler as POST };
