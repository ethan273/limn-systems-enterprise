import { Page, Cookie } from '@playwright/test';
import { TEST_CONFIG } from '../config/test-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PORTAL AUTH HELPER
 * For customer/designer/factory portals that use email/password authentication
 * Now uses file-based session persistence like auth-helper for zero rate limiting
 */

// Global session cache to avoid repeated auth API calls
const portalSessionCache = new Map<string, { cookies: Cookie[], storageState: any, timestamp: number }>();
const SESSION_TTL = 45 * 60 * 1000; // 45 minutes

// Session file directory (same as auth-helper)
const SESSION_DIR = path.join(__dirname, '../.auth-sessions');

interface SessionData {
  cookies: Cookie[];
  storageState: any;
  timestamp: number;
}

function getSessionFilePath(userType: string): string {
  return path.join(SESSION_DIR, `${userType}-session.json`);
}

function loadSessionFromFile(userType: string): SessionData | null {
  const filePath = getSessionFilePath(userType);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const session: SessionData = JSON.parse(data);

      // Check if session is still valid (< 45 minutes old)
      const age = Date.now() - session.timestamp;
      if (age < SESSION_TTL) {
        return session;
      }
      // Session expired, delete file
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Ignore errors, will create new session
  }
  return null;
}

export async function portalLogin(page: Page, email: string, password: string, portalType: 'customer' | 'designer' | 'factory' = 'customer') {
  // Map portalType to userType for file-based session
  let userType = portalType; // customer, designer, factory

  // Try to load session from file first (ZERO rate limiting!)
  const savedSession = loadSessionFromFile(userType);
  if (savedSession) {
    try {
      await page.context().addCookies(savedSession.cookies);

      // Navigate to appropriate portal
      let portalUrl = `${TEST_CONFIG.BASE_URL}/portal`;
      if (portalType === 'designer') {
        portalUrl = `${TEST_CONFIG.BASE_URL}/portal/designer`;
      } else if (portalType === 'factory') {
        portalUrl = `${TEST_CONFIG.BASE_URL}/portal/factory`;
      }

      await page.goto(portalUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(500);

      // Verify session is still valid
      const currentUrl = page.url();
      if (!currentUrl.includes('/login') && currentUrl.includes('/portal')) {
        return; // ✅ SESSION REUSED FROM FILE - NO API CALL!
      }
      // Session expired, delete file and create new
      try {
        fs.unlinkSync(getSessionFilePath(userType));
      } catch {}
    } catch (e) {
      // Session invalid, delete file and create new
      try {
        fs.unlinkSync(getSessionFilePath(userType));
      } catch {}
    }
  }
  // Listen to ALL browser console logs for diagnostics
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
  });

  // Use dev-login API endpoint (creates users if needed + generates session)
  // userType already set to portalType at line 52
  const response = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/auth/dev-login`, {
    data: {
      userType
    }
  });

  if (!response.ok()) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Portal login failed: ${error.error || response.statusText()}`);
  }

  const data = await response.json();
  const token = data.token;

  if (!token) {
    throw new Error('No auth token returned from API');
  }

  // Navigate to auth callback with token to establish session
  // Use 'load' instead of 'networkidle' because the page redirects immediately
  await page.goto(`${TEST_CONFIG.BASE_URL}/auth/callback?token=${token}&type=${userType}`, {
    waitUntil: 'load',
    timeout: 30000
  });

  // Wait for redirect after auth callback
  await page.waitForTimeout(1000);

  // Navigate to appropriate portal
  let portalUrl = `${TEST_CONFIG.BASE_URL}/portal`;
  if (portalType === 'designer') {
    portalUrl = `${TEST_CONFIG.BASE_URL}/portal/designer`;
  } else if (portalType === 'factory') {
    portalUrl = `${TEST_CONFIG.BASE_URL}/portal/factory`;
  }

  await page.goto(portalUrl);

  // Wait for portal layout to load (not networkidle, which may never happen with tRPC refetching)
  // Check for navigation or sidebar which indicates layout is loaded
  await page.waitForSelector('nav, aside, [role="navigation"]', { timeout: 30000 }).catch(async () => {
    // Check for error messages on page
    const errorText = await page.locator('[role="alert"], .error, .alert-destructive').textContent().catch(() => null);
    if (errorText) {
      throw new Error(`Portal error: ${errorText}`);
    }
    throw new Error(`Portal login may have failed - no authenticated content found for ${email} after 30s`);
  });

  // Cache the session to reuse across tests
  try {
    const cookies = await page.context().cookies();
    const storageState = await page.context().storageState();
    portalSessionCache.set(cacheKey, {
      cookies,
      storageState,
      timestamp: Date.now()
    });
  } catch (e) {
    // Ignore caching errors
  }
}

export async function portalLogout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]').first();
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForURL(/login/, { timeout: 5000 }).catch(() => {});
  }
}

// Test credentials (automatically created by dev-login API)
export const PORTAL_TEST_USERS = {
  customer: {
    email: 'customer-user@limn.us.com',
    password: 'not-needed' // dev-login creates session without password
  },
  designer: {
    email: 'designer-user@limn.us.com',
    password: 'not-needed'
  },
  factory: {
    email: 'factory-user@limn.us.com',
    password: 'not-needed'
  }
};
