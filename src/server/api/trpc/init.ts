import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';
import { captureException, addBreadcrumb } from '@/lib/sentry';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError 
          ? error.cause.flatten() 
          : null,
      },
    };
  },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware to check if user is admin
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Check if user is admin (customize based on your role system)
  const isAdmin = ctx.session.user.email?.endsWith('@limn.us.com') ||
                  ctx.session.user.app_metadata?.role === 'admin' ||
                  ctx.session.user.user_metadata?.role === 'admin';

  if (!isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

// Performance monitoring middleware
const sentryMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  try {
    addBreadcrumb(`tRPC ${type}: ${path}`, 'trpc', 'info');

    const result = await next();

    const duration = Date.now() - start;
    addBreadcrumb(
      `tRPC ${type}: ${path} completed in ${duration}ms`,
      'trpc',
      'info',
      { duration, success: true }
    );

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Only capture non-auth errors to avoid spam
    if (error instanceof TRPCError && error.code !== 'UNAUTHORIZED') {
      captureException(error, {
        trpcPath: path,
        trpcType: type,
        duration,
        userId: (next as any).ctx?.session?.user?.id,
      });
    }

    addBreadcrumb(
      `tRPC ${type}: ${path} failed in ${duration}ms`,
      'trpc',
      'error',
      { duration, error: error instanceof Error ? error.message : String(error) }
    );

    throw error;
  }
});

// Enhanced procedures with monitoring
export const monitoredProcedure = publicProcedure.use(sentryMiddleware);
export const monitoredProtectedProcedure = protectedProcedure.use(sentryMiddleware);
export const monitoredAdminProcedure = adminProcedure.use(sentryMiddleware);
