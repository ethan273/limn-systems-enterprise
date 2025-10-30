import { log } from '@/lib/logger';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  SYSTEM_ROLES,
  type Permission,
} from '@/lib/services/rbac-service';
import {
  apiRateLimit,
  emailRateLimit,
  campaignRateLimit,
  checkRateLimit,
} from '@/lib/rate-limit';
import { validateSessionIP } from '@/lib/services/session-service';
import { getEffectiveRoles } from '@/lib/services/rbac-service';

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

// Middleware to check if user is admin (uses RBAC)
const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  // ✅ RBAC: Check user has admin or super_admin role
  const userProfile = await ctx.db.user_profiles.findUnique({
    where: { id: ctx.session.user.id },
    select: { id: true, full_name: true },
  });

  // Check admin role via RBAC system (admin or super_admin)
  const isAdmin = userProfile
    ? await hasAnyRole(userProfile.id, [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPER_ADMIN])
    : false;

  if (!isAdmin) {
    // Log unauthorized access attempt
    log.error(
      `[SECURITY] Unauthorized access attempt to admin endpoint by user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`
    );
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required. This incident has been logged.',
    });
  }

  // Log authorized access for audit trail
  log.info(
    `[SECURITY] Admin access granted to user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`
  );

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userProfile,
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
    log.error(`[SECURITY] Unauthorized access attempt to super admin endpoint by user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`);
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Super admin access required. This incident has been logged.'
    });
  }

  // Log authorized access for audit trail
  log.info(`[SECURITY] Super admin access granted to user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`);

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userProfile,
    },
  });
});

export const superAdminProcedure = t.procedure.use(enforceUserIsSuperAdmin);

// Middleware to check if user is manager (or higher)
const enforceUserIsManager = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  // ✅ RBAC: Check user has manager, admin, or super_admin role
  const userProfile = await ctx.db.user_profiles.findUnique({
    where: { id: ctx.session.user.id },
    select: { id: true, full_name: true },
  });

  // Check manager role via RBAC system (manager, admin, or super_admin)
  const isManager = userProfile
    ? await hasAnyRole(userProfile.id, [
        SYSTEM_ROLES.MANAGER,
        SYSTEM_ROLES.ADMIN,
        SYSTEM_ROLES.SUPER_ADMIN,
      ])
    : false;

  if (!isManager) {
    // Log unauthorized access attempt
    log.error(
      `[SECURITY] Unauthorized access attempt to manager endpoint by user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`
    );
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Manager access required. This incident has been logged.',
    });
  }

  // Log authorized access for audit trail
  log.info(
    `[SECURITY] Manager access granted to user: ${ctx.session.user.id} (${userProfile?.full_name || 'unknown'})`
  );

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userProfile,
    },
  });
});

export const managerProcedure = t.procedure.use(enforceUserIsManager);

// ============================================
// SESSION IP VALIDATION (RBAC Phase 2.2)
// ============================================

/**
 * Middleware to validate session IP address matches original login IP
 * - Applies role-based IP validation modes (STRICT, FLEXIBLE, DISABLED)
 * - Terminates sessions on suspicious IP changes
 * - Logs security events for audit trail
 */
const enforceSessionIPValidation = t.middleware(async ({ ctx, next }) => {
  // Only validate for authenticated users
  if (!ctx.session?.user) {
    return next();
  }

  try {
    // Extract current IP address from request
    const currentIP =
      ctx.req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
      ctx.req?.headers?.['x-real-ip']?.toString() ||
      '0.0.0.0';

    // Get session ID from session (using user.id as fallback for session identifier)
    // Note: In a full implementation, you'd extract the actual session ID from the JWT
    const sessionId = ctx.session.user.id;

    // Get user's effective roles for IP validation mode
    const roles = await getEffectiveRoles(ctx.session.user.id);
    const userRole = roles[0] || 'customer';

    // Validate session IP
    const validation = await validateSessionIP(sessionId, currentIP, userRole);

    if (!validation.valid) {
      log.error(
        `[SECURITY] Session IP validation failed for user ${ctx.session.user.id}: ${validation.reason}`
      );

      // Force logout when validation fails (IP mismatch)
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Session terminated due to suspicious activity. Please log in again.',
      });
    }

    return next();
  } catch (error) {
    // If IP validation fails catastrophically, log but don't block (fail open for availability)
    if (error instanceof TRPCError) {
      throw error; // Re-throw TRPC errors (like force_logout)
    }

    log.error('[SECURITY] IP validation error (non-blocking):', { error });
    return next();
  }
});

// Export IP-validated procedure
export const ipValidatedProcedure = protectedProcedure.use(enforceSessionIPValidation);

// ============================================
// PERMISSION-BASED PROCEDURES
// ============================================

/**
 * Create a procedure that requires a specific permission
 *
 * @example
 * ```ts
 * export const viewUsers = requirePermission(PERMISSIONS.USERS_VIEW)
 *   .input(z.object({ id: z.string() }))
 *   .query(async ({ input, ctx }) => {
 *     // User is guaranteed to have USERS_VIEW permission
 *   });
 * ```
 */
export function requirePermission(permission: Permission) {
  const middleware = t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const userProfile = await ctx.db.user_profiles.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, full_name: true },
    });

    if (!userProfile) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User profile not found' });
    }

    // Get IP and User Agent for audit logging
    const ipAddress = ctx.req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
                      ctx.req?.headers?.['x-real-ip']?.toString() ||
                      ctx.req?.connection?.remoteAddress;
    const userAgent = ctx.req?.headers?.['user-agent'];

    // Check permission (includes automatic permission denial logging)
    const hasAccess = await hasPermission(userProfile.id, permission, {
      action: 'access',
      ipAddress,
      userAgent,
    });

    if (!hasAccess) {
      log.error(
        `[SECURITY] Permission denied for user ${ctx.session.user.id} (${userProfile.full_name}): Required permission "${permission}" for ${path || 'endpoint'}`
      );
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission denied: ${permission}. This incident has been logged.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        userProfile,
      },
    });
  });

  return protectedProcedure.use(middleware);
}

/**
 * Create a procedure that requires ANY of the specified permissions
 *
 * @example
 * ```ts
 * export const viewData = requireAnyPermission([
 *   PERMISSIONS.PRODUCTION_VIEW,
 *   PERMISSIONS.ORDERS_VIEW
 * ])
 *   .query(async ({ ctx }) => {
 *     // User has at least one of the required permissions
 *   });
 * ```
 */
export function requireAnyPermission(permissions: Permission[]) {
  const middleware = t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const userProfile = await ctx.db.user_profiles.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, full_name: true },
    });

    if (!userProfile) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User profile not found' });
    }

    // Check if user has any of the required permissions
    const hasAccess = await hasAnyPermission(userProfile.id, permissions);

    if (!hasAccess) {
      log.error(
        `[SECURITY] Permission denied for user ${ctx.session.user.id} (${userProfile.full_name}): Required ANY of [${permissions.join(', ')}] for ${path || 'endpoint'}`
      );
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission denied: Requires one of [${permissions.join(', ')}]. This incident has been logged.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        userProfile,
      },
    });
  });

  return protectedProcedure.use(middleware);
}

/**
 * Create a procedure that requires ALL of the specified permissions
 *
 * @example
 * ```ts
 * export const approveOrder = requireAllPermissions([
 *   PERMISSIONS.ORDERS_VIEW,
 *   PERMISSIONS.ORDERS_APPROVE,
 *   PERMISSIONS.FINANCE_VIEW
 * ])
 *   .input(z.object({ orderId: z.string() }))
 *   .mutation(async ({ input, ctx }) => {
 *     // User has all three required permissions
 *   });
 * ```
 */
export function requireAllPermissions(permissions: Permission[]) {
  const middleware = t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const userProfile = await ctx.db.user_profiles.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, full_name: true },
    });

    if (!userProfile) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User profile not found' });
    }

    // Check if user has all of the required permissions
    const hasAccess = await hasAllPermissions(userProfile.id, permissions);

    if (!hasAccess) {
      log.error(
        `[SECURITY] Permission denied for user ${ctx.session.user.id} (${userProfile.full_name}): Required ALL of [${permissions.join(', ')}] for ${path || 'endpoint'}`
      );
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission denied: Requires all of [${permissions.join(', ')}]. This incident has been logged.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        userProfile,
      },
    });
  });

  return protectedProcedure.use(middleware);
}

// Rate limiting middleware
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path: _path }) => {
  // Only rate limit if user is authenticated
  if (!ctx.session?.user) {
    return next();
  }

  const identifier = ctx.session.user.id;
  const result = await checkRateLimit(apiRateLimit, identifier);

  if (!result.success) {
    const resetInSeconds = Math.ceil((result.reset - Date.now()) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
    });
  }

  return next();
});

// Email-specific rate limiting
const emailRateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const identifier = ctx.session.user.id;
  const result = await checkRateLimit(emailRateLimit, identifier);

  if (!result.success) {
    const resetInSeconds = Math.ceil((result.reset - Date.now()) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Email rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
    });
  }

  return next();
});

// Campaign-specific rate limiting
const campaignRateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const identifier = ctx.session.user.id;
  const result = await checkRateLimit(campaignRateLimit, identifier);

  if (!result.success) {
    const resetInSeconds = Math.ceil((result.reset - Date.now()) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Campaign operation limit exceeded. Try again in ${resetInSeconds} seconds.`,
    });
  }

  return next();
});

// Export rate-limited procedures
export const rateLimitedProcedure = protectedProcedure.use(rateLimitMiddleware);
export const emailRateLimitedProcedure = protectedProcedure.use(emailRateLimitMiddleware);
export const campaignRateLimitedProcedure = protectedProcedure.use(campaignRateLimitMiddleware);

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
