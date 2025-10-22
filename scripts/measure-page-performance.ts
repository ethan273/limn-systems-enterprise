/**
 * Page Performance Measurement Script
 *
 * Uses Playwright to measure real page load times for all major routes
 * and identify performance bottlenecks.
 */

import { chromium, Browser, Page } from 'playwright';

interface PageMetrics {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  apiCalls: number;
  slowestApiCall: string;
  slowestApiTime: number;
}

const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/admin/dashboard', name: 'Admin Dashboard' },
  { path: '/admin/users', name: 'Admin Users' },
  { path: '/admin/customers', name: 'Admin Customers' },
  { path: '/admin/orders', name: 'Admin Orders' },
  { path: '/admin/inventory', name: 'Admin Inventory' },
  { path: '/crm/customers', name: 'CRM Customers' },
  { path: '/crm/orders', name: 'CRM Orders' },
  { path: '/design/projects', name: 'Design Projects' },
  { path: '/design/briefs', name: 'Design Briefs' },
  { path: '/design/boards', name: 'Design Boards' },
  { path: '/flipbooks', name: 'Flipbooks' },
  { path: '/tasks', name: 'Tasks' },
];

async function measurePagePerformance(page: Page, url: string): Promise<PageMetrics> {
  const apiCalls: { url: string; duration: number }[] = [];

  // Track API calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/trpc/')) {
      const timing = response.timing();
      apiCalls.push({
        url,
        duration: timing.responseEnd - timing.requestStart,
      });
    }
  });

  // Navigate and measure
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;

  // Get Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise<any>((resolve) => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      // Get FCP and LCP from PerformanceObserver
      let fcp = 0;
      let lcp = 0;

      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      setTimeout(() => {
        resolve({
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstContentfulPaint: fcp,
          largestContentfulPaint: lcp,
          timeToInteractive: perfData.domInteractive - perfData.fetchStart,
        });
      }, 1000);
    });
  });

  // Find slowest API call
  const sortedCalls = apiCalls.sort((a, b) => b.duration - a.duration);
  const slowestCall = sortedCalls[0];

  return {
    url,
    loadTime,
    domContentLoaded: metrics.domContentLoaded,
    firstContentfulPaint: metrics.firstContentfulPaint,
    largestContentfulPaint: metrics.largestContentfulPaint,
    timeToInteractive: metrics.timeToInteractive,
    totalBlockingTime: 0, // Requires more complex measurement
    cumulativeLayoutShift: 0, // Requires more complex measurement
    apiCalls: apiCalls.length,
    slowestApiCall: slowestCall?.url || 'N/A',
    slowestApiTime: slowestCall?.duration || 0,
  };
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: PageMetrics[] = [];

  // Test login first (required for authenticated pages)
  console.log('🔐 Logging in...');
  await page.goto('http://localhost:3000/login');

  // Wait for manual login or use environment credentials
  if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
    await page.fill('input[type="email"]', process.env.TEST_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  } else {
    console.log('⚠️  No credentials provided. Please set TEST_EMAIL and TEST_PASSWORD environment variables.');
    console.log('   Or login manually in the browser (you have 30 seconds)...');
    await page.waitForTimeout(30000);
  }

  // Test each page
  for (const testPage of PAGES_TO_TEST) {
    const url = `http://localhost:3000${testPage.path}`;
    console.log(`📊 Testing: ${testPage.name} (${testPage.path})`);

    try {
      const metrics = await measurePagePerformance(page, url);
      results.push(metrics);

      console.log(`   ⏱️  Load Time: ${metrics.loadTime}ms`);
      console.log(`   🎨 FCP: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
      console.log(`   🖼️  LCP: ${metrics.largestContentfulPaint.toFixed(0)}ms`);
      console.log(`   🔌 API Calls: ${metrics.apiCalls}`);
      console.log(`   🐌 Slowest API: ${metrics.slowestApiTime.toFixed(0)}ms`);
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  await browser.close();

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('='.repeat(80) + '\n');

  // Sort by load time (slowest first)
  const sortedResults = results.sort((a, b) => b.loadTime - a.loadTime);

  console.log('🐌 SLOWEST PAGES:\n');
  sortedResults.slice(0, 10).forEach((result, index) => {
    console.log(`${index + 1}. ${result.url}`);
    console.log(`   Load Time: ${result.loadTime}ms`);
    console.log(`   LCP: ${result.largestContentfulPaint.toFixed(0)}ms`);
    console.log(`   API Calls: ${result.apiCalls}`);
    console.log(`   Slowest API: ${result.slowestApiTime.toFixed(0)}ms - ${result.slowestApiCall}`);
    console.log('');
  });

  console.log('\n⚡ PERFORMANCE RECOMMENDATIONS:\n');

  // Analyze and provide recommendations
  const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
  const avgApiCalls = results.reduce((sum, r) => sum + r.apiCalls, 0) / results.length;

  if (avgLoadTime > 3000) {
    console.log('❌ Average load time is high (>3s). Consider:');
    console.log('   - Adding database indexes');
    console.log('   - Implementing query result caching');
    console.log('   - Reducing API payload sizes');
  }

  if (avgApiCalls > 10) {
    console.log('❌ High number of API calls per page. Consider:');
    console.log('   - Batching related queries');
    console.log('   - Using server-side data fetching');
    console.log('   - Implementing pagination');
  }

  const slowPages = results.filter(r => r.loadTime > 5000);
  if (slowPages.length > 0) {
    console.log(`\n❌ ${slowPages.length} pages take >5 seconds to load:`);
    slowPages.forEach(p => console.log(`   - ${p.url}`));
  }

  console.log('\n✅ Test Complete!\n');
}

runPerformanceTests().catch(console.error);
