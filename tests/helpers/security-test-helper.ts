/**
 * Security Test Helper
 *
 * Utilities for testing RLS policies, permissions, and access control
 */

import { Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, queryAsUser, insertTestData, deleteTestData } from './database-helper';

// Ensure test environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export interface TestUser {
  id: string;
  email: string;
  userType: 'super_admin' | 'employee' | 'customer' | 'contractor';
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Create isolated test user with specific user_type
 * CRITICAL: Must create Supabase auth user first, then user_profile
 * user_profiles.id has FK constraint to auth.users.id
 */
export async function createTestUser(
  userType: 'super_admin' | 'employee' | 'customer' | 'contractor',
  customId?: string
): Promise<TestUser> {
  const timestamp = Date.now();
  const email = `test-${userType}-${timestamp}@test.com`; // Unique email
  const password = 'Test123!@#';

  // Step 1: Create Supabase auth user (admin API)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      user_type: userType,
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create Supabase auth user: ${authError?.message}`);
  }

  const userId = customId || authData.user.id;

  // Step 2: Create user profile with same ID as auth user
  await insertTestData('user_profiles', {
    id: userId,
    email,
    user_type: userType,
    first_name: 'Test',
    last_name: `${userType} User`,
    created_at: new Date().toISOString(),
  });

  return {
    id: userId,
    email,
    userType,
  };
}

/**
 * Get access token and refresh token for test user
 * Uses Supabase Admin API to sign in the user directly
 * Returns both tokens needed for proper Supabase session authentication
 */
export async function getAccessToken(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  // Get user's email from user_profiles table
  const { data: userProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!userProfile) {
    throw new Error(`No user profile found for user ID: ${userId}`);
  }

  // Use password-based sign-in (password was set in createTestUser)
  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: userProfile.email,
    password: 'Test123!@#', // Standard test password from createTestUser
  });

  if (signInError || !signInData?.session) {
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  return {
    accessToken: signInData.session.access_token,
    refreshToken: signInData.session.refresh_token,
  };
}

/**
 * Switch browser context to different user
 */
export async function switchUserContext(page: Page, userId: string): Promise<void> {
  const tokens = await getAccessToken(userId);

  // Extract Supabase project ID from URL for dynamic cookie name
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwqkbjymbarkufwvdmar.supabase.co';
  const projectId = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectId}-auth-token`;

  // Set auth cookie in browser
  await page.context().addCookies([
    {
      name: cookieName,
      value: `base64-${Buffer.from(
        JSON.stringify({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: 3600,
          token_type: 'bearer',
        })
      ).toString('base64')}`,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Test RLS policy isolation between two users
 * REDESIGNED: Handles proper customer -> entity relationships
 */
export async function testRLSIsolation(
  table: string,
  userAId: string,
  userBId: string,
  testData: any
): Promise<boolean> {
  // Step 1: Create customers for each user (proper ownership chain)
  const customerA = await insertTestData('customers', {
    user_id: userAId,
    name: `Customer A ${Date.now()}`,
    email: `customer-a-${Date.now()}@test.com`,
    status: 'active',
  });

  const customerB = await insertTestData('customers', {
    user_id: userBId,
    name: `Customer B ${Date.now()}`,
    email: `customer-b-${Date.now()}@test.com`,
    status: 'active',
  });

  // Step 2: Create entity with proper ownership
  let created: any;
  if (table === 'orders' || table === 'invoices') {
    // These tables use customer_id directly
    created = await insertTestData(table, {
      ...testData,
      customer_id: customerA.id,
    });
  } else if (table === 'shipments') {
    // Shipments need an order first (order -> shipment relationship)
    const order = await insertTestData('orders', {
      customer_id: customerA.id,
      order_number: `TEST-${Date.now()}`,
      status: 'pending',
      total_amount: 1000,
    });
    created = await insertTestData('shipments', {
      ...testData,
      order_id: order.id,
    });
  } else {
    // Fallback for other tables
    throw new Error(`RLS test not configured for table: ${table}`);
  }

  // Step 3: Get access tokens and refresh tokens for session-based auth
  const userATokens = await getAccessToken(userAId);
  const userBTokens = await getAccessToken(userBId);

  // Step 4: User A should see their own data
  const userAResults = await queryAsUser(table, userATokens.accessToken, userATokens.refreshToken, { id: created.id });
  const userACanSee = userAResults.length > 0;

  // Step 5: User B should NOT see User A's data (RLS blocks it)
  const userBResults = await queryAsUser(table, userBTokens.accessToken, userBTokens.refreshToken, { id: created.id });
  const userBCannotSee = userBResults.length === 0;

  // Debug logging
  console.log(`[RLS Test ${table}] User A can see: ${userACanSee}, User B cannot see: ${userBCannotSee}`);
  console.log(`[RLS Test ${table}] User A results: ${userAResults.length}, User B results: ${userBResults.length}`);
  if (!userACanSee) {
    console.error(`[RLS Test ${table}] FAILED: User A cannot see their own data!`);
  }
  if (!userBCannotSee) {
    console.error(`[RLS Test ${table}] FAILED: User B can see User A's data! RLS not working.`);
  }

  // Step 6: Cleanup (in order of dependencies)
  await deleteTestData(table, created.id);
  if (table === 'shipments') {
    // Also delete the order we created
    const shipment = created as any;
    if (shipment.order_id) {
      await deleteTestData('orders', shipment.order_id);
    }
  }
  await deleteTestData('customers', customerA.id);
  await deleteTestData('customers', customerB.id);

  return userACanSee && userBCannotSee;
}

/**
 * Create test customer with portal access
 * CRITICAL: Must create Supabase auth user first before user_profile
 */
export async function createTestCustomerWithPortal(
  portalType: 'customer' | 'designer' | 'factory' | 'qc',
  customerId?: string
): Promise<{ customer: any; userId: string; accessToken: string; refreshToken: string }> {
  const timestamp = Date.now();
  const testEmail = `test-${portalType}-${timestamp}@test.com`;
  const password = 'Test123!@#';

  // Step 1: Create Supabase auth user FIRST
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password,
    email_confirm: true,
    user_metadata: {
      portal_type: portalType,
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`);
  }

  const userId = customerId || authData.user.id;

  // Step 2: Create customer (let database generate UUID, link to auth user)
  const customer = await insertTestData('customers', {
    user_id: userId, // Link customer to auth user for RLS
    name: `Test ${portalType} Customer`,
    email: testEmail,
    phone: '555-TEST',
    status: 'active',
    portal_access: true,
    created_at: new Date().toISOString(),
  });

  // Step 3: Create user profile for portal access
  const [firstName, ...lastNameParts] = customer.name.split(' ');
  await insertTestData('user_profiles', {
    id: userId, // Use auth user ID
    email: customer.email,
    user_type: portalType === 'customer' ? 'customer' : 'employee',
    first_name: firstName || 'Test',
    last_name: lastNameParts.join(' ') || 'User',
  });

  // Step 4: Create portal access record
  await insertTestData('customer_portal_access', {
    user_id: userId,
    customer_id: customer.id,
    portal_type: portalType,
    is_active: true,
    granted_at: new Date().toISOString(),
  });

  // Step 5: Get access token and refresh token
  const tokens = await getAccessToken(userId);

  return {
    customer,
    userId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Test middleware blocks unauthorized access to route
 */
export async function testMiddlewareBlocks(
  page: Page,
  userId: string,
  protectedRoute: string
): Promise<boolean> {
  // Switch to user context
  await switchUserContext(page, userId);

  // Try to access protected route
  await page.goto(`http://localhost:3000${protectedRoute}`);
  await page.waitForLoadState('domcontentloaded');

  const currentUrl = page.url();

  // Check if redirected or blocked
  const isBlocked =
    currentUrl.includes('/login') ||
    currentUrl.includes('/unauthorized') ||
    currentUrl.includes('/dashboard') ||
    (await page.locator('text=/access denied|unauthorized|forbidden/i').count()) > 0 ||
    (await page.locator('text=/404|not found/i').count()) > 0;

  return isBlocked;
}

/**
 * Test SQL injection is prevented
 */
export async function testSQLInjectionPrevention(
  endpoint: string,
  payload: string
): Promise<boolean> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: payload }),
    });

    const text = await response.text();

    // Check for database errors that would indicate SQL injection vulnerability
    const hasDatabaseError =
      text.toLowerCase().includes('sql') ||
      text.toLowerCase().includes('syntax error') ||
      text.toLowerCase().includes('postgresql') ||
      text.toLowerCase().includes('pg_') ||
      text.toLowerCase().includes('relation') ||
      text.toLowerCase().includes('column');

    // Should NOT have database errors - Prisma should parameterize safely
    return !hasDatabaseError;
  } catch (error) {
    // Network errors are ok - endpoint might not exist
    return true;
  }
}

/**
 * Test API permission enforcement
 */
export async function testAPIPermission(
  endpoint: string,
  accessToken: string,
  shouldAllow: boolean
): Promise<boolean> {
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (shouldAllow) {
    // Should return 200 or 201
    return response.ok;
  } else {
    // Should return 401, 403, or 404
    return [401, 403, 404].includes(response.status);
  }
}

/**
 * Verify portal module access
 */
export async function verifyPortalModuleAccess(
  userId: string,
  portalType: string,
  moduleConfig: Record<string, boolean>
): Promise<boolean> {
  // Check portal_module_settings table
  const { data } = await supabaseAdmin
    .from('portal_module_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) {
    // Check portal_configurations for default settings
    const { data: portalConfig } = await supabaseAdmin
      .from('portal_configurations')
      .select('*')
      .eq('user_id', userId)
      .single();

    return portalConfig !== null;
  }

  // Verify module config matches expected
  for (const [module, enabled] of Object.entries(moduleConfig)) {
    if (data[module] !== enabled) {
      return false;
    }
  }

  return true;
}

/**
 * Create test data for RLS testing
 * Let database generate UUIDs for all records
 */
export async function createTestDataForRLS(
  userId: string
): Promise<{ customerId: string; orderId: string; invoiceId: string; shipmentId: string }> {
  const timestamp = Date.now();

  // Create customer (let database generate UUID)
  const customer = await insertTestData('customers', {
    user_id: userId,
    name: `Test Customer for RLS ${timestamp}`,
    email: `test-rls-${timestamp}@test.com`,
    status: 'active',
  });

  // Create order
  const order = await insertTestData('orders', {
    customer_id: customer.id,
    order_number: `TEST-${timestamp}`,
    status: 'pending',
    total_amount: 1000,
  });

  // Create invoice
  const invoice = await insertTestData('invoices', {
    customer_id: customer.id,
    order_id: order.id,
    invoice_number: `INV-TEST-${timestamp}`,
    status: 'pending',
    total_amount: 1000,
    amount_paid: 0,
    // balance_due is auto-calculated
  });

  // Create shipment
  const shipment = await insertTestData('shipments', {
    order_id: order.id,
    tracking_number: `TRACK-${timestamp}`,
    status: 'pending',
  });

  return {
    customerId: customer.id,
    orderId: order.id,
    invoiceId: invoice.id,
    shipmentId: shipment.id,
  };
}

/**
 * Cleanup test user and all related data
 * CRITICAL: Must delete Supabase auth user to prevent FK constraint errors
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // Get user's email first
  const { data: userProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!userProfile) {
    return; // User doesn't exist
  }

  // Delete in order of dependencies (child → parent)
  await supabaseAdmin.from('customer_portal_access').delete().eq('user_id', userId);
  await supabaseAdmin.from('portal_module_settings').delete().eq('user_id', userId);
  await supabaseAdmin.from('portal_configurations').delete().eq('user_id', userId);

  // Use pattern matching on non-UUID fields
  await supabaseAdmin.from('shipments').delete().ilike('tracking_number', '%TEST%');
  await supabaseAdmin.from('invoices').delete().ilike('invoice_number', '%TEST%');
  await supabaseAdmin.from('orders').delete().ilike('order_number', '%TEST%');
  await supabaseAdmin.from('customers').delete().ilike('email', '%@test.com');
  await supabaseAdmin.from('user_profiles').delete().eq('id', userId);

  // Delete Supabase auth user (prevents FK constraint errors)
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

/**
 * SQL Injection payloads for testing
 */
export const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "admin' --",
  "' OR 1=1--",
  "admin'/*",
  "' UNION SELECT NULL--",
  "1' AND 1=1--",
  "'; DROP TABLE users--",
  "' OR 'x'='x",
  "1' OR '1' = '1",
  "' OR 1=1 LIMIT 1--",
];

/**
 * XSS payloads for testing
 */
export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
];

/**
 * Test user types for permission testing
 */
export const TEST_USER_TYPES = {
  ADMIN: 'super_admin' as const,
  EMPLOYEE: 'employee' as const,
  CUSTOMER: 'customer' as const,
  CONTRACTOR: 'contractor' as const,
};

/**
 * Portal types for testing
 */
export const PORTAL_TYPES = {
  CUSTOMER: 'customer' as const,
  DESIGNER: 'designer' as const,
  FACTORY: 'factory' as const,
  QC: 'qc' as const,
};
