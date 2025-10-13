import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * QuickBooks OAuth Callback Handler
 *
 * Handles the OAuth 2.0 callback from QuickBooks.
 * Exchanges authorization code for access/refresh tokens and stores them securely.
 *
 * GET /api/quickbooks/callback
 *
 * Query Parameters:
 * - code: Authorization code from QuickBooks
 * - state: CSRF protection token
 * - realmId: QuickBooks company ID
 *
 * Response:
 * - Redirects to success page or error page
 */

const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || '';
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || '';
const QB_REDIRECT_URI =
  process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/quickbooks/callback';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');

    // Handle user cancellation
    if (error) {
      console.log('[QuickBooks Callback] User cancelled authorization:', error);
      return NextResponse.redirect(
        new URL('/admin/integrations/quickbooks?error=cancelled', request.url)
      );
    }

    // Validate required parameters
    if (!code || !state || !realmId) {
      console.error('[QuickBooks Callback] Missing required parameters');
      return NextResponse.redirect(
        new URL('/admin/integrations/quickbooks?error=missing_params', request.url)
      );
    }

    // Verify state token and get user
    const oauthState = await prisma.quickbooks_oauth_states.findFirst({
      where: {
        state,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!oauthState) {
      console.error('[QuickBooks Callback] Invalid or expired state token');
      return NextResponse.redirect(
        new URL('/admin/integrations/quickbooks?error=invalid_state', request.url)
      );
    }

    // Exchange authorization code for tokens
    const authString = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authString}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: QB_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[QuickBooks Callback] Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/admin/integrations/quickbooks?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiry times
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    const refreshTokenExpiry = new Date(Date.now() + tokenData.x_refresh_token_expires_in * 1000);

    // Get company info from QuickBooks
    let companyName = `Company ${realmId}`;
    try {
      const companyResponse = await fetch(
        `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        companyName = companyData.CompanyInfo?.CompanyName || companyName;
      }
    } catch (error) {
      console.warn('[QuickBooks Callback] Failed to fetch company name:', error);
    }

    // Store connection in database
    await prisma.quickbooks_connections.upsert({
      where: {
        user_id_company_id: {
          user_id: oauthState.user_id,
          company_id: realmId,
        },
      },
      create: {
        user_id: oauthState.user_id,
        company_id: realmId,
        realm_id: realmId,
        company_name: companyName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenExpiry,
        scope: tokenData.scope || 'com.intuit.quickbooks.accounting',
        is_active: true,
      },
      update: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenExpiry,
        company_name: companyName,
        is_active: true,
        updated_at: new Date(),
      },
    });

    // Also store in quickbooks_auth table for backward compatibility
    await prisma.quickbooks_auth.upsert({
      where: {
        company_id: realmId,
      },
      create: {
        company_id: realmId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry,
        refresh_token_expiry: refreshTokenExpiry,
        company_name: companyName,
        is_active: true,
        connected_by: oauthState.user_id,
      },
      update: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry,
        refresh_token_expiry: refreshTokenExpiry,
        company_name: companyName,
        is_active: true,
        updated_at: new Date(),
      },
    });

    // Delete used state token
    await prisma.quickbooks_oauth_states.delete({
      where: {
        id: oauthState.id,
      },
    });

    console.log('[QuickBooks Callback] Successfully connected to QuickBooks:', {
      userId: oauthState.user_id,
      realmId,
      companyName,
    });

    // Redirect to success page
    const redirectUrl = (oauthState as any).redirect_url || '/admin/integrations/quickbooks';
    return NextResponse.redirect(new URL(`${redirectUrl}?success=true`, request.url));
  } catch (error) {
    console.error('[QuickBooks Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/admin/integrations/quickbooks?error=unexpected', request.url)
    );
  }
}
