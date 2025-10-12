#!/usr/bin/env ts-node

/**
 * Session Warmup Script
 *
 * Pre-generates session files for all test user types to eliminate Supabase rate limiting.
 *
 * How it works:
 * 1. Calls /api/auth/dev-login for each user type with 3-second delays
 * 2. Navigates to callback URL to establish session
 * 3. Saves cookies and storage to /tests/.auth-sessions/
 * 4. All future tests reuse these sessions (ZERO Supabase API calls!)
 *
 * Run once before test suite. Sessions last 45 minutes.
 */

import { chromium, type Browser, type BrowserContext, type Cookie } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SESSION_DIR = path.join(__dirname, '../tests/.auth-sessions');
const USER_TYPES = ['dev', 'designer', 'customer', 'factory', 'contractor', 'user'];
const DELAY_BETWEEN_USERS = 3000; // 3 seconds to avoid rate limits

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  console.log(`✅ Created session directory: ${SESSION_DIR}`);
}

interface SessionData {
  cookies: Cookie[];
  storageState: any;
  timestamp: number;
}

/**
 * Save session to file
 */
function saveSessionToFile(userType: string, cookies: Cookie[], storageState: any): void {
  const filePath = path.join(SESSION_DIR, `${userType}-session.json`);
  const session: SessionData = {
    cookies,
    storageState,
    timestamp: Date.now()
  };

  fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  console.log(`   ✅ Saved session file: ${userType}-session.json`);
}

/**
 * Create session for a specific user type
 */
async function createSession(browser: Browser, userType: string): Promise<void> {
  console.log(`\n🔐 Creating session for: ${userType}`);

  const context: BrowserContext = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Call dev-login API
    console.log(`   📡 Calling /api/auth/dev-login...`);
    const response = await page.request.post(`${BASE_URL}/api/auth/dev-login`, {
      data: { userType },
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok()) {
      throw new Error(`API call failed: ${response.status()} ${response.statusText()}`);
    }

    const data = await response.json();
    console.log(`   ✅ API response: ${data.message}`);

    // Step 2: Navigate to set-session URL (no verification needed - bypasses rate limits!)
    const sessionUrl = `${BASE_URL}${data.redirect_url}`;

    console.log(`   🌐 Setting session...`);
    await page.goto(sessionUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Step 3: Wait for auth to process and redirect
    await page.waitForTimeout(2000);

    // Step 4: Verify we're authenticated (not on login page)
    let retries = 3;
    let currentUrl = page.url();

    while (retries > 0 && (currentUrl.includes('/auth/callback') || currentUrl.includes('/login') || currentUrl.includes('/auth/dev'))) {
      console.log(`   ⏳ Waiting for auth to complete... (${retries} retries left)`);

      // If still on callback or login page, navigate to dashboard
      if (currentUrl.includes('/auth/callback') || currentUrl.includes('/login') || currentUrl.includes('/auth/dev')) {
        await page.goto(`${BASE_URL}/dashboard`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        }).catch(() => {});
        await page.waitForTimeout(1500);
      }

      currentUrl = page.url();
      retries--;

      // Only throw error if we've exhausted retries AND still on login/auth page
      if (retries === 0 && (currentUrl.includes('/login') || currentUrl.includes('/auth/dev'))) {
        throw new Error('Auth failed - session not established after retries');
      }
    }

    // Step 5: Wait for page content to confirm auth
    await page.waitForSelector('nav, aside, [role="navigation"], h1, h2', {
      timeout: 5000
    }).catch(() => {
      // If no selector found, check URL one more time
      const url = page.url();
      if (url.includes('/login')) {
        throw new Error('Auth failed - no authenticated content found');
      }
    });

    console.log(`   ✅ Authentication successful!`);
    console.log(`   📍 Current URL: ${page.url()}`);

    // Step 6: Save session to file
    const cookies = await context.cookies();
    const storageState = await context.storageState();

    console.log(`   💾 Saving session...`);
    saveSessionToFile(userType, cookies, storageState);

    console.log(`   ✅ ${userType} session created successfully!`);

  } catch (error) {
    console.error(`   ❌ Failed to create ${userType} session:`, error);
    throw error;
  } finally {
    await context.close();
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Session Warmup Script Starting...\n');
  console.log(`📂 Session directory: ${SESSION_DIR}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`👥 User types: ${USER_TYPES.join(', ')}`);
  console.log(`⏱️  Delay between users: ${DELAY_BETWEEN_USERS}ms\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    for (let i = 0; i < USER_TYPES.length; i++) {
      const userType = USER_TYPES[i];

      await createSession(browser, userType);

      // Add delay between users to avoid rate limiting (except after last user)
      if (i < USER_TYPES.length - 1) {
        console.log(`\n⏸️  Waiting ${DELAY_BETWEEN_USERS}ms before next user...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_USERS));
      }
    }

    console.log('\n\n✅ ✅ ✅  ALL SESSIONS CREATED SUCCESSFULLY! ✅ ✅ ✅\n');
    console.log('📁 Session files saved to:', SESSION_DIR);
    console.log('⏱️  Sessions valid for: 45 minutes');
    console.log('🎯 Tests will now reuse these sessions (no Supabase API calls!)');
    console.log('\n🚀 Ready to run: npx playwright test --workers=2\n');

  } catch (error) {
    console.error('\n❌ Session warmup failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
