import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// All detail pages to test
const detailPages = [
  // CRM Detail Pages
  { name: 'Contact Detail', url: '/crm/contacts/[id]', listUrl: '/crm/contacts' },
  { name: 'Lead Detail', url: '/crm/leads/[id]', listUrl: '/crm/leads' },
  { name: 'Customer Detail', url: '/crm/customers/[id]', listUrl: '/crm/customers' },
  { name: 'Prospect Detail', url: '/crm/prospects/[id]', listUrl: '/crm/prospects' },

  // Task Detail Pages
  { name: 'Task Detail', url: '/tasks/[id]', listUrl: '/tasks' },

  // Design Detail Pages
  { name: 'Design Board Detail', url: '/design/boards/[id]', listUrl: '/design/boards' },
  { name: 'Design Brief Detail', url: '/design/briefs/[id]', listUrl: '/design/briefs' },
  { name: 'Design Project Detail', url: '/design/projects/[id]', listUrl: '/design/projects' },

  // Document Detail Pages
  { name: 'Document Detail', url: '/documents/[id]', listUrl: '/documents' },

  // Financial Detail Pages
  { name: 'Invoice Detail', url: '/financials/invoices/[id]', listUrl: '/financials/invoices' },
  { name: 'Payment Detail', url: '/financials/payments/[id]', listUrl: '/financials/payments' },

  // Partner Detail Pages
  { name: 'Designer Detail', url: '/partners/designers/[id]', listUrl: '/partners/designers' },
  { name: 'Factory Detail', url: '/partners/factories/[id]', listUrl: '/partners/factories' },

  // Portal Detail Pages
  { name: 'Portal Order Detail', url: '/portal/orders/[id]', listUrl: '/portal/orders' },
  { name: 'Designer Portal Project', url: '/portal/designer/projects/[id]', listUrl: '/portal/designer' },
  { name: 'Factory Portal Order', url: '/portal/factory/orders/[id]', listUrl: '/portal/factory' },

  // Production Detail Pages
  { name: 'Production Order Detail', url: '/production/orders/[id]', listUrl: '/production/orders' },
  { name: 'Production Factory Review Detail', url: '/production/factory-reviews/[id]', listUrl: '/production/factory-reviews' },
  { name: 'Production Packing Detail', url: '/production/packing/[id]', listUrl: '/production/packing' },
  { name: 'Production Prototype Detail', url: '/production/prototypes/[id]', listUrl: '/production/prototypes' },
  { name: 'Production QC Detail', url: '/production/qc/[id]', listUrl: '/production/qc' },
  { name: 'Production Shop Drawing Detail', url: '/production/shop-drawings/[id]', listUrl: '/production/shop-drawings' },

  // Product Detail Pages
  { name: 'Product Detail', url: '/products/catalog/[id]', listUrl: '/products/catalog' },
  { name: 'Collection Detail', url: '/products/collections/[id]', listUrl: '/products/collections' },
  { name: 'Concept Detail', url: '/products/concepts/[id]', listUrl: '/products/concepts' },
  { name: 'Prototype Detail', url: '/products/prototypes/[id]', listUrl: '/products/prototypes' },

  // Shipping Detail Pages
  { name: 'Shipment Detail', url: '/shipping/shipments/[id]', listUrl: '/shipping/shipments' },
];

interface LayoutIssue {
  page: string;
  url: string;
  issues: string[];
  screenshot: string;
}

async function runVisualLayoutAudit() {
  console.log('🔍 Starting Visual Layout Audit...');
  console.log(`📊 Testing ${detailPages.length} detail pages\n`);

  const browser = await chromium.launch({
    headless: false,  // Run in headed mode to see what's happening
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Try to use existing browser session if possible
    storageState: undefined
  });

  const page = await context.newPage();

  const screenshotDir = '/Users/eko3/limn-systems-enterprise/reports/layout-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const layoutIssues: LayoutIssue[] = [];

  // First, try to navigate to a list page to see if we can access data
  console.log('📋 Checking authentication and data access...\n');

  await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a moment for any redirects
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log(`Current URL after navigation: ${currentUrl}`);

  if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
    console.log('⚠️  Not authenticated - layout testing requires authentication');
    console.log('Please authenticate manually in the browser or provide auth credentials\n');
    await browser.close();
    return;
  }

  // For each detail page type, find an actual record ID from the list
  for (const pageInfo of detailPages) {
    console.log(`Testing: ${pageInfo.name}`);

    try {
      // Navigate to list page first
      await page.goto(`http://localhost:3000${pageInfo.listUrl}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await page.waitForTimeout(1000);

      // Try to find a link to a detail page (first row, view/edit link)
      const detailLink = await page.locator('a[href*="' + pageInfo.listUrl + '/"]').first();

      if (await detailLink.count() > 0) {
        // Click the first detail link
        await detailLink.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        // Capture screenshot
        const screenshotPath = path.join(screenshotDir, `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Analyze layout issues
        const issues: string[] = [];

        // Check 1: Are there grid containers that should be horizontal?
        const gridContainers = await page.locator('[class*="grid"]').count();
        if (gridContainers > 0) {
          // Check if grid items are stacking vertically when they shouldn't
          const gridElements = await page.locator('[class*="grid"]').all();
          for (const grid of gridElements) {
            const className = await grid.getAttribute('class');
            if (className?.includes('grid') && !className.includes('grid-cols-1')) {
              // This should be horizontal, check if it's actually rendering that way
              const boundingBox = await grid.boundingBox();
              if (boundingBox && boundingBox.height > boundingBox.width) {
                issues.push(`Grid container appears to be stacking vertically instead of horizontally: ${className}`);
              }
            }
          }
        }

        // Check 2: Are there flex containers that should be horizontal?
        const flexRows = await page.locator('[class*="flex-row"], [class*="flex"][class*="gap"]').count();
        if (flexRows > 0) {
          const flexElements = await page.locator('[class*="flex-row"], [class*="flex"][class*="gap"]').all();
          for (const flex of flexElements) {
            const className = await flex.getAttribute('class');
            if (className?.includes('flex') && !className.includes('flex-col')) {
              const boundingBox = await flex.boundingBox();
              if (boundingBox && boundingBox.height > boundingBox.width * 0.3) {
                issues.push(`Flex row container may be wrapping/stacking: ${className}`);
              }
            }
          }
        }

        // Check 3: Missing responsive classes
        const pageContent = await page.content();
        if (!pageContent.includes('md:') && !pageContent.includes('lg:')) {
          issues.push('Page may be missing responsive breakpoint classes (md:, lg:)');
        }

        if (issues.length > 0) {
          layoutIssues.push({
            page: pageInfo.name,
            url: page.url(),
            issues,
            screenshot: screenshotPath
          });
          console.log(`  ❌ ${issues.length} potential layout issues found`);
        } else {
          console.log(`  ✅ No obvious layout issues detected`);
        }
      } else {
        console.log(`  ⚠️  No detail records found to test`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error testing page: ${error.message}`);
    }
  }

  await browser.close();

  // Generate report
  const report = `# Visual Layout Audit Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Pages Tested**: ${detailPages.length}
**Pages with Issues**: ${layoutIssues.length}

## Layout Issues Found

${layoutIssues.length === 0
  ? '✅ No layout issues detected!'
  : layoutIssues.map(issue => `### ${issue.page}

**URL**: ${issue.url}

**Issues Detected**:
${issue.issues.map(i => `- ${i}`).join('\n')}

**Screenshot**: ![${issue.page}](${issue.screenshot})

---
`).join('\n')}

## Recommendations

${layoutIssues.length > 0 ? `
1. **Review Grid/Flex Layouts**: Check if grid-cols-* and flex-row classes are correctly applied
2. **Add Responsive Classes**: Ensure md: and lg: breakpoints are used for multi-column layouts
3. **Check Container Widths**: Verify containers have max-width or proper width constraints
4. **Inspect CSS**: Look for conflicting flex-col or display: block overrides
` : '✅ All layouts appear to be rendering correctly'}

## Manual Review Required

Screenshots have been saved to: ${screenshotDir}

Please manually review each screenshot to verify:
- Data is displayed in correct grid/row format
- Cards and sections are properly aligned horizontally
- No unexpected vertical stacking
- Responsive behavior is appropriate
`;

  fs.writeFileSync('/Users/eko3/limn-systems-enterprise/reports/visual-layout-audit.md', report);

  console.log('\n✅ Visual layout audit complete!');
  console.log(`📊 ${layoutIssues.length}/${detailPages.length} pages have potential layout issues`);
  console.log(`📁 Report: /Users/eko3/limn-systems-enterprise/reports/visual-layout-audit.md`);
  console.log(`📸 Screenshots: ${screenshotDir}`);
}

runVisualLayoutAudit().catch(console.error);
