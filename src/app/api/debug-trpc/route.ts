import { NextResponse } from 'next/server';
import { createContext } from '@/server/api/trpc/context';
import { appRouter } from '@/server/api/root';

/**
 * Debug endpoint to test tRPC query execution
 * Shows actual server-side errors
 */
export async function GET() {
  try {
    // Create tRPC context (same as production)
    const ctx = await createContext({});

    console.log('[DEBUG] Context created:', {
      hasSession: !!ctx.session,
      hasUser: !!ctx.user,
      userId: ctx.user?.id,
      userEmail: ctx.user?.email,
    });

    // Try to execute a simple query
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.userProfile.getCurrentUser();

      return NextResponse.json({
        success: true,
        message: 'tRPC query succeeded',
        result,
        context: {
          hasSession: !!ctx.session,
          userId: ctx.user?.id,
          userEmail: ctx.user?.email,
        }
      });
    } catch (queryError: any) {
      return NextResponse.json({
        success: false,
        error: 'tRPC query failed',
        message: queryError.message,
        code: queryError.code,
        stack: queryError.stack,
        context: {
          hasSession: !!ctx.session,
          userId: ctx.user?.id,
          userEmail: ctx.user?.email,
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create context',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
