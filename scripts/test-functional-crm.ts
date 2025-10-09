/**
 * FUNCTIONAL TEST - CRM MODULE
 *
 * Tests ALL functionality in the CRM module:
 * - Contacts
 * - Customers
 * - Leads
 * - Projects
 * - Prospects
 *
 * Verifies:
 * - All buttons work
 * - All forms submit data
 * - CRUD operations modify database correctly
 * - Data is displayed from correct sources
 */

import { FunctionalAuditor } from './lib/functional-auditor';

const CRM_ROUTES = [
  '/crm/contacts',
  '/crm/customers',
  '/crm/leads',
  '/crm/projects',
  '/crm/prospects',
];

async function main() {
  console.log('🚀 Starting CRM Module Functional Test\n');
  console.log('=' .repeat(80));
  console.log('\n');

  const auditor = new FunctionalAuditor({
    module: 'crm',
    baseUrl: 'http://localhost:3000',
    workers: 1,
    timeout: 30000,
    headless: false, // Show browser for visibility during testing
  });

  try {
    // Initialize
    await auditor.initialize();

    // Login
    await auditor.loginAsAdmin();

    // Test each CRM page
    for (const route of CRM_ROUTES) {
      console.log('\n' + '='.repeat(80));
      console.log(`📄 Testing: ${route}`);
      console.log('='.repeat(80) + '\n');

      // Discover interactions
      await auditor.discoverInteractions(route);

      // Test CRUD operations
      await auditor.testCRUDOperations(route);

      // Check memory after each page
      console.log('');
    }

    // Analyze patterns
    console.log('\n' + '='.repeat(80));
    console.log('🔬 PATTERN ANALYSIS');
    console.log('='.repeat(80) + '\n');
    auditor.analyzePatterns();

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('📝 GENERATING REPORT');
    console.log('='.repeat(80) + '\n');
    const reportPath = await auditor.saveReport();

    console.log('\n' + '='.repeat(80));
    console.log('✅ CRM MODULE TESTING COMPLETE');
    console.log('='.repeat(80) + '\n');
    console.log(`Report saved to: ${reportPath}\n`);

  } catch (error) {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  } finally {
    await auditor.fullCleanup();
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
