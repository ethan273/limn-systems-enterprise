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
 */
export async function queryAsUser<T = any>(
  table: string,
  accessToken: string,
  filters: Record<string, any> = {}
): Promise<T[]> {
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await userClient
    .from(table)
    .select('*')
    .match(filters);

  if (error) {
    // RLS might cause errors - that's expected
    console.log(`RLS Query Error (expected): ${error.message}`);
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
 * Get test user access token for RLS testing
 */
export async function getTestUserAccessToken(userId: string): Promise<string> {
  // Use dev-login endpoint to get token
  const response = await fetch('http://localhost:3000/api/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userType: 'dev', userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get test user token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
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
  // Order matters! Delete children before parents to avoid foreign key violations

  // Special handling for payment_allocations (no good filter column)
  // Delete payment_allocations for test invoices manually
  try {
    const testInvoices = await supabaseAdmin
      .from('invoices')
      .select('id')
      .ilike('invoice_number', 'INV-TEST-%');

    if (testInvoices.data && testInvoices.data.length > 0) {
      const invoiceIds = testInvoices.data.map((inv: any) => inv.id);
      await supabaseAdmin
        .from('payment_allocations')
        .delete()
        .in('invoice_id', invoiceIds);
    }
  } catch (error) {
    console.warn('Cleanup failed for payment_allocations:', error);
  }

  const testPatterns = [
    // Level 3: Delete grandchildren
    { table: 'production_orders', column: 'order_number', pattern: 'PROD-%' },
    { table: 'shipments', column: 'tracking_number', pattern: 'TEST-TRACK-%' },
    { table: 'invoices', column: 'invoice_number', pattern: 'INV-TEST-%' },

    // Level 2: Delete children
    { table: 'orders', column: 'order_number', pattern: 'TEST-%' },

    // Portal access cleanup (skip if tables don't exist or have wrong schema)
    // These are cleaned up by security tests, not needed here

    // Level 1: Delete parents last
    { table: 'customers', column: 'email', pattern: '%@test.com' },
    { table: 'user_profiles', column: 'email', pattern: 'test-%@test.com' },
  ];

  const results: Record<string, number> = {};

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
