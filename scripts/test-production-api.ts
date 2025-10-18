#!/usr/bin/env ts-node
/**
 * Test production API endpoints to diagnose errors
 */

import fetch from 'node-fetch';

const PROD_URL = 'https://limn-systems-enterprise.vercel.app';

async function testProduction() {
  console.log('========================================');
  console.log('  Production API Test');
  console.log('========================================\n');

  // Test 1: Check environment variables
  console.log('📋 Test 1: Check environment variables');
  try {
    const response = await fetch(`${PROD_URL}/api/test-env`);
    const data = await response.json();
    console.log('✅ Environment check:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n📋 Test 2: Check if tRPC endpoints return DOMMatrix error');

  // Test a tRPC endpoint (without auth - should fail with UNAUTHORIZED, not 500)
  const testQueries = [
    'userProfile.getCurrentUser',
    'tasks.getAllTasks',
    'dashboards.getAnalytics',
  ];

  for (const query of testQueries) {
    try {
      const response = await fetch(`${PROD_URL}/api/trpc/${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`\n${query}:`);
      console.log(`  Status: ${response.status}`);

      const text = await response.text();

      if (response.status === 500) {
        // Try to parse as JSON to get error details
        try {
          const errorData = JSON.parse(text);
          console.log('  ❌ 500 Error Details:', JSON.stringify(errorData, null, 2));

          // Check if it's DOMMatrix error
          if (text.includes('DOMMatrix')) {
            console.log('  ⚠️  STILL HAS DOMMatrix ERROR - FIX NOT DEPLOYED YET');
          }
        } catch {
          console.log('  ❌ 500 Error (raw):', text.substring(0, 500));

          if (text.includes('DOMMatrix')) {
            console.log('  ⚠️  STILL HAS DOMMatrix ERROR - FIX NOT DEPLOYED YET');
          }
        }
      } else {
        console.log(`  ✅ Response (not 500):`, text.substring(0, 200));
      }
    } catch (error) {
      console.error(`  ❌ Request failed:`, error);
    }
  }

  console.log('\n========================================\n');
}

testProduction().catch(console.error);
