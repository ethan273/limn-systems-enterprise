import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * QuickBooks OAuth Connection Initiation
 *
 * Initiates the OAuth 2.0 flow for connecting to QuickBooks Online.
 * Generates a state token for CSRF protection and stores it in the database.
 *
 * GET /api/quickbooks/connect
 *
 * Query Parameters:
 * - redirect_after?: URL to redirect to after successful connection (optional)
 *
 * Response:
 * - Redirects to QuickBooks authorization page
 */

const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || '';
const QB_REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI!;
const QB_ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
const QB_AUTH_URL =
  QB_ENVIRONMENT === 'production'
    ? 'https://appcenter.intuit.com/connect/oauth2'
    : 'https://appcenter.intuit.com/connect/oauth2';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate QuickBooks credentials are configured
    if (!QB_CLIENT_ID) {
      return NextResponse.json(
        { error: 'QuickBooks integration not configured. Please set QUICKBOOKS_CLIENT_ID.' },
        { status: 500 }
      );
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Get optional redirect URL
    const searchParams = request.nextUrl.searchParams;
    const redirectAfter = searchParams.get('redirect_after') || '/admin/integrations/quickbooks';

    // Store state in database for verification (expires in 10 minutes)
    await prisma.quickbooks_oauth_states.create({
      data: {
        state,
        user_id: user.id,
        redirect_url: redirectAfter,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      } as any,
    });

    // Build QuickBooks authorization URL
    const authUrl = new URL(QB_AUTH_URL);
    authUrl.searchParams.set('client_id', QB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', QB_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.set('state', state);

    console.log('[QuickBooks] Initiating OAuth flow for user:', user.id);

    // Redirect to QuickBooks authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[QuickBooks Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks connection' },
      { status: 500 }
    );
  }
}
