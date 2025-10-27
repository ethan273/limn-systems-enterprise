import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { hasRole, SYSTEM_ROLES } from '@/lib/services/rbac-service';

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

// Middleware to check if user is super admin (HIGHEST security level)
const enforceUserIsSuperAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  // ✅ RBAC Migration: Check user has super_admin role
  const userProfile = await ctx.db.user_profiles.findUnique({
    where: { id: ctx.session.user.id },
    select: { id: true, full_name: true },
  });

  // Check super_admin role via RBAC system
  const isSuperAdmin = userProfile ? await hasRole(userProfile.id, SYSTEM_ROLES.SUPER_ADMIN) : false;

  if (!isSuperAdmin) {
    // Log unauthorized access attempt
    console.error(`[SECURITY] Unauthorized access attempt to super admin endpoint by user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`);
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Super admin access required. This incident has been logged.'
    });
  }

  // Log authorized access for audit trail
  console.log(`[SECURITY] Super admin access granted to user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`);

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userProfile,
    },
  });
});

export const superAdminProcedure = t.procedure.use(enforceUserIsSuperAdmin);

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
export const monitoredSuperAdminProcedure = superAdminProcedure.use(sentryMiddleware);
