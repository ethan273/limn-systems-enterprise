import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/server/api/trpc/context';
import type { NextRequest } from 'next/server';

/**
 * Use Node.js runtime for Prisma compatibility
 */
export const runtime = 'nodejs';

/**
 * Handle tRPC requests
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({
      session: null, // TODO: Get session from Supabase auth
      req: req as any,
      res: undefined,
    }),
    batching: {
      enabled: true,
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
