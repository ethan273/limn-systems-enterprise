const puppeteer = require('puppeteer');

async function detailedFormTest() {
  console.log('🔍 Starting detailed form test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    devtools: true
  });

  const page = await browser.newPage();

  // Listen to console messages
  page.on('console', (msg) => {
    console.log(`🖥️ Console [${msg.type()}]:`, msg.text());
  });

  // Listen to network failures
  page.on('requestfailed', (request) => {
    console.log(`❌ Network failed: ${request.url()}`);
  });

  // Listen to responses
  page.on('response', (response) => {
    if (!response.ok()) {
      console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    // Navigate to the request access page
    console.log('📱 Navigating to request access page...');
    await page.goto('http://localhost:3007/auth/request-access', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });

    // Wait for form to load
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('✅ Form loaded successfully');

    // Check environment variables on the client side
    const envCheck = await page.evaluate(() => {
      return {
        supabaseUrl: window.location.hostname,
        hasNextPublicSupabaseUrl: !!process?.env?.NEXT_PUBLIC_SUPABASE_URL,
        userAgent: navigator.userAgent.substring(0, 50)
      };
    });
    console.log('🔧 Environment check:', envCheck);

    console.log('⏸️ Pausing for manual inspection...');
    console.log('📌 Please check the browser window and press Enter to continue...');

    // Wait for user input
    await new Promise(resolve => {
      process.stdin.resume();
      process.stdin.once('data', resolve);
    });

    console.log('▶️ Continuing with automated test...');

    // Fill form fields
    await page.waitForSelector('button[type="button"]');

    // Select client type
    const clientButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
      return buttons.find(button => button.textContent?.includes('Client'));
    });

    await clientButton.click();
    console.log('✅ Selected Client');

    // Fill form fields
    await page.type('#email', 'detailed-test@example.com');
    await page.type('#company_name', 'Detailed Test Company');
    await page.type('#phone', '+1555123456');
    await page.type('#reason', 'Detailed testing of the form submission with full error tracking');
    console.log('✅ Filled all form fields');

    // Take screenshot before submission
    await page.screenshot({ path: 'before-submit.png', fullPage: true });

    // Submit form
    console.log('🚀 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for response and capture any changes
    await page.waitForTimeout(5000);

    // Take screenshot after submission
    await page.screenshot({ path: 'after-submit.png', fullPage: true });

    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Check page content
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);

    // Check for any error messages or success indicators
    const status = await page.evaluate(() => {
      const body = document.body;
      return {
        hasSuccess: body.innerText.toLowerCase().includes('success'),
        hasError: body.innerText.toLowerCase().includes('error'),
        hasSubmitted: body.innerText.toLowerCase().includes('submitted'),
        hasRequest: body.innerText.toLowerCase().includes('request'),
        bodyText: body.innerText.substring(0, 500)
      };
    });

    console.log('📊 Page status:', status);

    console.log('✅ Detailed test completed!');

  } catch (error) {
    console.error('❌ Detailed test failed:', error.message);
    await page.screenshot({ path: 'error-state.png', fullPage: true });
  } finally {
    console.log('🏁 Closing browser...');
    await browser.close();
  }
}

detailedFormTest().catch(console.error);