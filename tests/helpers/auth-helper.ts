import { Page, Cookie } from '@playwright/test';
import { TEST_CONFIG } from '../config/test-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * NEW AUTH HELPER - Uses dev-login API endpoint with FILE-BASED SESSION PERSISTENCE
 * Eliminates Supabase rate limits by reusing sessions across ALL tests!
 */

// Session storage directory
const SESSION_DIR = path.join(__dirname, '../.auth-sessions');
const SESSION_TTL = 45 * 60 * 1000; // 45 minutes (shorter than Supabase session to be safe)

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Helper to get session file path
function getSessionFilePath(userType: string): string {
  return path.join(SESSION_DIR, `${userType}-session.json`);
}

// Helper to load session from file
function loadSessionFromFile(userType: string): { cookies: Cookie[], storageState: any, timestamp: number } | null {
  const filePath = getSessionFilePath(userType);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const session = JSON.parse(data);

    // Check if session is still valid (within TTL)
    if (Date.now() - session.timestamp < SESSION_TTL) {
      return session;
    }

    // Session expired, delete file
    fs.unlinkSync(filePath);
    return null;
  } catch (e) {
    // Corrupted file, delete it
    try { fs.unlinkSync(filePath); } catch {}
    return null;
  }
}

// Helper to save session to file
function saveSessionToFile(userType: string, cookies: Cookie[], storageState: any) {
  const filePath = getSessionFilePath(userType);
  const session = {
    cookies,
    storageState,
    timestamp: Date.now()
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  } catch (e) {
    // Ignore save errors, not critical
  }
}

export async function login(page: Page, email: string, password: string) {
  // Determine user type based on email
  let userType = 'user'; // default is non-admin user

  if (email.includes('admin')) {
    userType = 'dev'; // Admin uses dev user
  } else if (email.includes('designer')) {
    userType = 'designer';
  } else if (email.includes('customer')) {
    userType = 'customer';
  } else if (email.includes('factory')) {
    userType = 'factory';
  } else if (email.includes('contractor')) {
    userType = 'contractor';
  } else if (email.includes('manager') || email.includes('testuser')) {
    userType = 'dev';
  }

  // Try to load session from file first - this ELIMINATES rate limiting!
  const savedSession = loadSessionFromFile(userType);
  if (savedSession) {
    try {
      await page.context().addCookies(savedSession.cookies);
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(500);

      // Verify session is still valid (check if we're on dashboard, not redirected to login)
      const currentUrl = page.url();
      if (!currentUrl.includes('/login') && !currentUrl.includes('/auth/')) {
        // Session is valid, return early WITHOUT hitting Supabase API!
        return;
      }
      // Session expired or invalid, delete file and create new one
      const filePath = getSessionFilePath(userType);
      try { fs.unlinkSync(filePath); } catch {}
    } catch (e) {
      // Failed to reuse session, create new one
      const filePath = getSessionFilePath(userType);
      try { fs.unlinkSync(filePath); } catch {}
    }
  }

  // Call the dev-login API endpoint to get auth token
  const response = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/auth/dev-login`, {
    data: { userType },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok()) {
    let errorMessage = response.statusText();
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Response is not JSON (probably HTML error page)
      errorMessage = `${response.status()} ${errorMessage}`;
    }
    throw new Error(`Login API failed: ${errorMessage}`);
  }

  const data = await response.json();

  // Navigate to the callback URL with the token (this sets up the session)
  if (data.redirect_url) {
    await page.goto(`${TEST_CONFIG.BASE_URL}${data.redirect_url}`, { waitUntil: 'domcontentloaded' });
  } else if (data.magic_link) {
    await page.goto(data.magic_link, { waitUntil: 'domcontentloaded' });
  } else {
    throw new Error('No redirect_url or magic_link in API response');
  }

  // Wait for callback to process and redirect
  await page.waitForTimeout(2000);

  // Retry logic for session establishment (up to 3 attempts)
  let retries = 3;
  let finalUrl = page.url();

  while (retries > 0 && (finalUrl.includes('/auth/callback') || finalUrl.includes('/login') || finalUrl.includes('/auth/dev'))) {
    // If still on callback page, navigate to dashboard
    if (finalUrl.includes('/auth/callback')) {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }

    // If on login page, retry the auth flow
    if (finalUrl.includes('/login') || finalUrl.includes('/auth/dev')) {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }

    finalUrl = page.url();
    retries--;

    if (retries === 0 && (finalUrl.includes('/login') || finalUrl.includes('/auth/dev'))) {
      throw new Error('Login failed - session not established after retries');
    }
  }

  // Wait for authenticated page elements to confirm login
  try {
    // Wait for either sidebar navigation or dashboard content
    await page.waitForSelector('nav, aside, [role="navigation"], h1, h2', { timeout: 5000 });
  } catch (e) {
    // If no common elements found, one more URL check
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth/dev')) {
      throw new Error('Login failed - no authenticated content found');
    }
  }

  // Final wait to ensure page is fully loaded
  await page.waitForTimeout(500);

  // Save session to file for ALL tests to reuse (eliminates Supabase rate limiting!)
  try {
    const cookies = await page.context().cookies();
    const storageState = await page.context().storageState();
    saveSessionToFile(userType, cookies, storageState);
  } catch (e) {
    // Ignore save errors, not critical
  }
}

export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]').first();
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForURL(/login/, { timeout: 5000 }).catch(() => {});
  }
}
