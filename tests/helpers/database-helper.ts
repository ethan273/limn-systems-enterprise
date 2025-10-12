/**
 * Database Helper for E2E Tests
 *
 * Provides direct database access for verification in tests
 * Uses Supabase Admin Client to bypass RLS for test verification
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ensure test environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Admin client - bypasses RLS for test verification
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Regular client - enforces RLS
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Query database directly (bypasses RLS)
 * Use for verifying data was saved correctly in tests
 */
export async function queryDatabase<T = any>(
  table: string,
  filters: Record<string, any>
): Promise<T | null> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .match(filters)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data as T;
}

/**
 * Query database with multiple results (bypasses RLS)
 */
export async function queryDatabaseMany<T = any>(
  table: string,
  filters: Record<string, any> = {}
): Promise<T[]> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .match(filters);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return (data as T[]) || [];
}

/**
 * Query database with specific user context (enforces RLS)
 * Use for testing RLS policies
 *
 * CRITICAL: Must use setSession() to properly establish auth.uid() context
 * Just using Bearer token in headers doesn't set auth.uid() for RLS policies
 */
export async function queryAsUser<T = any>(
  table: string,
  accessToken: string,
  refreshToken: string,
  filters: Record<string, any> = {}
): Promise<T[]> {
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Set session to establish auth.uid() context for RLS
  const { error: sessionError } = await userClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    console.error(`[queryAsUser] Failed to set session: ${sessionError.message}`);
    return [];
  }

  const { data, error } = await userClient
    .from(table)
    .select('*')
    .match(filters);

  if (error) {
    // RLS might cause errors - that's expected
    console.log(`[queryAsUser] RLS Query Error (expected): ${error.message}`);
    return [];
  }

  return (data as T[]) || [];
}

/**
 * Insert test data into database (bypasses RLS)
 */
export async function insertTestData<T = any>(
  table: string,
  data: Partial<T>
): Promise<T> {
  const { data: inserted, error } = await supabaseAdmin
    .from(table)
    .insert(data as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert test data: ${error.message}`);
  }

  return inserted as T;
}

/**
 * Update test data in database (bypasses RLS)
 */
export async function updateTestData<T = any>(
  table: string,
  id: string,
  updates: Partial<T>
): Promise<T> {
  const { data: updated, error } = await supabaseAdmin
    .from(table)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update test data: ${error.message}`);
  }

  return updated as T;
}

/**
 * Delete test data from database (bypasses RLS)
 */
export async function deleteTestData(
  table: string,
  id: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete test data: ${error.message}`);
  }
}

/**
 * Clean up test data by pattern (e.g., all records with email ending in @test.com)
 */
export async function cleanupTestDataByPattern(
  table: string,
  column: string,
  pattern: string
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .delete()
    .ilike(column, pattern)
    .select();

  if (error) {
    throw new Error(`Failed to cleanup test data: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Count records in table (bypasses RLS)
 */
export async function countRecords(
  table: string,
  filters: Record<string, any> = {}
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .match(filters);

  if (error) {
    throw new Error(`Failed to count records: ${error.message}`);
  }

  return count || 0;
}

/**
 * Execute raw SQL query (admin only - use sparingly)
 */
export async function executeSQL<T = any>(query: string): Promise<T[]> {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', {
    sql_query: query,
  });

  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`);
  }

  return data as T[];
}

/**
 * Verify foreign key relationship exists
 */
export async function verifyForeignKey(
  childTable: string,
  childId: string,
  parentTable: string,
  foreignKeyColumn: string
): Promise<boolean> {
  const child = await queryDatabase(childTable, { id: childId });
  if (!child) return false;

  const parentId = child[foreignKeyColumn];
  if (!parentId) return false;

  const parent = await queryDatabase(parentTable, { id: parentId });
  return parent !== null;
}

/**
 * Verify cascade delete works
 */
export async function verifyCascadeDelete(
  parentTable: string,
  parentId: string,
  childTable: string,
  foreignKeyColumn: string
): Promise<boolean> {
  // Check child records exist before delete
  const childrenBefore = await queryDatabaseMany(childTable, {
    [foreignKeyColumn]: parentId,
  });

  if (childrenBefore.length === 0) {
    throw new Error('No child records found to test cascade');
  }

  // Delete parent
  await deleteTestData(parentTable, parentId);

  // Check child records deleted
  const childrenAfter = await queryDatabaseMany(childTable, {
    [foreignKeyColumn]: parentId,
  });

  return childrenAfter.length === 0;
}

/**
 * Get test user access token and refresh token for RLS testing
 * Returns both tokens needed for proper session-based authentication
 */
export async function getTestUserAccessToken(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
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
 * Create test customer (let database generate UUID)
 * Use timestamp in email for uniqueness
 */
export async function createTestCustomer(customerId?: string) {
  const timestamp = Date.now();
  const testId = customerId || `test-${timestamp}`;

  return await insertTestData('customers', {
    // Don't pass id - let database generate UUID
    name: `Test Customer ${testId.slice(-8)}`,
    email: `${testId}@test.com`,
    phone: '555-TEST',
    status: 'active',
    portal_access: true,
  });
}

/**
 * Create test order linked to customer
 */
export async function createTestOrder(customerId: string) {
  const orderNumber = `TEST-${Date.now()}`;

  return await insertTestData('orders', {
    customer_id: customerId,
    order_number: orderNumber,
    status: 'pending',
    total_amount: 1000.00,
    notes: 'Test order for E2E testing',
  });
}

/**
 * Create test invoice linked to customer and order
 * NOTE: balance_due is auto-calculated (total_amount - amount_paid)
 */
export async function createTestInvoice(customerId: string, orderId?: string) {
  const invoiceNumber = `INV-TEST-${Date.now()}`;

  return await insertTestData('invoices', {
    customer_id: customerId,
    order_id: orderId,
    invoice_number: invoiceNumber,
    status: 'pending',
    subtotal: 900.00,
    tax_total: 100.00,
    total_amount: 1000.00,
    amount_paid: 0,
    // balance_due is auto-generated - don't insert
  });
}

/**
 * Create test shipment linked to order
 */
export async function createTestShipment(orderId: string) {
  return await insertTestData('shipments', {
    order_id: orderId,
    tracking_number: `TEST-TRACK-${Date.now()}`,
    status: 'pending',
    carrier: 'Test Carrier',
    package_count: 1,
    weight: 10.5,
    tracking_events: [],
  });
}

/**
 * Cleanup all test data (run after each test suite)
 * CRITICAL: Delete in order of dependencies (children → parents)
 */
export async function cleanupAllTestData() {
  const results: Record<string, number> = {};

  // STEP 1: Get all test customers first (needed for cascade cleanup)
  const testCustomers = await supabaseAdmin
    .from('customers')
    .select('id')
    .ilike('email', '%@test.com');

  const testCustomerIds = testCustomers.data?.map((c: any) => c.id) || [];

  // STEP 2: Delete payment_allocations for test invoices
  try {
    const testInvoices = await supabaseAdmin
      .from('invoices')
      .select('id')
      .ilike('invoice_number', 'INV-TEST-%');

    if (testInvoices.data && testInvoices.data.length > 0) {
      const invoiceIds = testInvoices.data.map((inv: any) => inv.id);
      const { data } = await supabaseAdmin
        .from('payment_allocations')
        .delete()
        .in('invoice_id', invoiceIds)
        .select();
      results['payment_allocations'] = data?.length || 0;
    }
  } catch (error) {
    console.warn('Cleanup failed for payment_allocations:', error);
    results['payment_allocations'] = 0;
  }

  // STEP 3: Delete invoices referencing test customers (must be before orders)
  try {
    if (testCustomerIds.length > 0) {
      const { data: invoicesDeleted } = await supabaseAdmin
        .from('invoices')
        .delete()
        .in('customer_id', testCustomerIds)
        .select();
      results['invoices_by_customer'] = invoicesDeleted?.length || 0;
    }
  } catch (error) {
    console.warn('Cleanup failed for invoices (by customer):', error);
    results['invoices_by_customer'] = 0;
  }

  // STEP 4: Delete orders referencing test customers (not just pattern-based)
  // This ensures we delete ALL orders linked to test customers
  try {
    if (testCustomerIds.length > 0) {
      const { data: ordersDeleted } = await supabaseAdmin
        .from('orders')
        .delete()
        .in('customer_id', testCustomerIds)
        .select();
      results['orders_by_customer'] = ordersDeleted?.length || 0;
    }
  } catch (error) {
    console.warn('Cleanup failed for orders (by customer):', error);
    results['orders_by_customer'] = 0;
  }

  // STEP 5: Delete remaining pattern-based data
  const testPatterns = [
    // Level 3: Delete grandchildren
    { table: 'production_orders', column: 'order_number', pattern: 'PROD-%' },
    { table: 'shipments', column: 'tracking_number', pattern: 'TEST-TRACK-%' },
    { table: 'invoices', column: 'invoice_number', pattern: 'INV-TEST-%' },

    // Level 2: Delete remaining children (pattern-based)
    { table: 'orders', column: 'order_number', pattern: 'TEST-%' },

    // Level 1: Delete parents last
    { table: 'customers', column: 'email', pattern: '%@test.com' },
    { table: 'user_profiles', column: 'email', pattern: 'test-%@test.com' },
  ];

  for (const { table, column, pattern } of testPatterns) {
    try {
      const deleted = await cleanupTestDataByPattern(table, column, pattern);
      results[table] = deleted;
    } catch (error) {
      console.warn(`Cleanup failed for ${table}:`, error);
      results[table] = 0;
    }
  }

  return results;
}
