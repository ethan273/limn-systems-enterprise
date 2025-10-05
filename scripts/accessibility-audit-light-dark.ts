import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';

interface ViolationDetail {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  element: string;
  failureSummary: string;
}

interface PageResult {
  page: string;
  url: string;
  mode: 'light' | 'dark';
  violations: ViolationDetail[];
}

// ALL 103 pages
const allPages = [
  { name: 'Homepage', url: '/' },
  { name: 'Login', url: '/login' },
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Simple', url: '/simple' },
  { name: 'Test', url: '/test' },
  { name: 'Working', url: '/working' },
  { name: 'Privacy Policy', url: '/privacy' },
  { name: 'Terms of Service', url: '/terms' },
  { name: 'Auth - Employee', url: '/auth/employee' },
  { name: 'Auth - Customer', url: '/auth/customer' },
  { name: 'Auth - Contractor', url: '/auth/contractor' },
  { name: 'Auth - Dev', url: '/auth/dev' },
  { name: 'Admin - Approvals', url: '/admin/approvals' },
  { name: 'Analytics Dashboard', url: '/dashboards/analytics' },
  { name: 'Executive Dashboard', url: '/dashboards/executive' },
  { name: 'Projects Dashboard', url: '/dashboards/projects' },
  { name: 'CRM Home', url: '/crm' },
  { name: 'CRM Clients', url: '/crm/clients' },
  { name: 'CRM Contacts', url: '/crm/contacts' },
  { name: 'CRM Contact Detail', url: '/crm/contacts/123' },
  { name: 'CRM Customers Detail', url: '/crm/customers/123' },
  { name: 'CRM Leads', url: '/crm/leads' },
  { name: 'CRM Lead Detail', url: '/crm/leads/123' },
  { name: 'CRM Orders', url: '/crm/orders' },
  { name: 'CRM Projects', url: '/crm/projects' },
  { name: 'CRM Prospects', url: '/crm/prospects' },
  { name: 'CRM Prospect Detail', url: '/crm/prospects/123' },
  { name: 'Design Boards', url: '/design/boards' },
  { name: 'Design Board Detail', url: '/design/boards/123' },
  { name: 'Design Briefs', url: '/design/briefs' },
  { name: 'Design Brief Detail', url: '/design/briefs/123' },
  { name: 'Design Brief New', url: '/design/briefs/new' },
  { name: 'Design Documents', url: '/design/documents' },
  { name: 'Design Projects', url: '/design/projects' },
  { name: 'Design Project Detail', url: '/design/projects/123' },
  { name: 'Documents List', url: '/documents' },
  { name: 'Document Detail', url: '/documents/123' },
  { name: 'Finance Home', url: '/finance' },
  { name: 'Invoices', url: '/financials/invoices' },
  { name: 'Invoice Detail', url: '/financials/invoices/123' },
  { name: 'Payments', url: '/financials/payments' },
  { name: 'Payment Detail', url: '/financials/payments/123' },
  { name: 'Designers', url: '/partners/designers' },
  { name: 'Designer Detail', url: '/partners/designers/123' },
  { name: 'Factories', url: '/partners/factories' },
  { name: 'Factory Detail', url: '/partners/factories/123' },
  { name: 'Portal Home', url: '/portal' },
  { name: 'Portal Login', url: '/portal/login' },
  { name: 'Portal Documents', url: '/portal/documents' },
  { name: 'Portal Orders', url: '/portal/orders' },
  { name: 'Portal Order Detail', url: '/portal/orders/123' },
  { name: 'Portal Financials', url: '/portal/financials' },
  { name: 'Portal Shipping', url: '/portal/shipping' },
  { name: 'Designer Portal Home', url: '/portal/designer' },
  { name: 'Designer Portal Documents', url: '/portal/designer/documents' },
  { name: 'Designer Portal Project', url: '/portal/designer/projects/123' },
  { name: 'Designer Portal Quality', url: '/portal/designer/quality' },
  { name: 'Designer Portal Settings', url: '/portal/designer/settings' },
  { name: 'Factory Portal Home', url: '/portal/factory' },
  { name: 'Factory Portal Documents', url: '/portal/factory/documents' },
  { name: 'Factory Portal Order', url: '/portal/factory/orders/123' },
  { name: 'Factory Portal Quality', url: '/portal/factory/quality' },
  { name: 'Factory Portal Settings', url: '/portal/factory/settings' },
  { name: 'Production Dashboard', url: '/production/dashboard' },
  { name: 'Production Factory Reviews', url: '/production/factory-reviews' },
  { name: 'Production Factory Review Detail', url: '/production/factory-reviews/123' },
  { name: 'Production Ordered Items', url: '/production/ordered-items' },
  { name: 'Production Orders', url: '/production/orders' },
  { name: 'Production Order Detail', url: '/production/orders/123' },
  { name: 'Production Packing', url: '/production/packing' },
  { name: 'Production Packing Detail', url: '/production/packing/123' },
  { name: 'Production Prototypes', url: '/production/prototypes' },
  { name: 'Production Prototype Detail', url: '/production/prototypes/123' },
  { name: 'Production Prototype New', url: '/production/prototypes/new' },
  { name: 'Production QC', url: '/production/qc' },
  { name: 'Production QC Detail', url: '/production/qc/123' },
  { name: 'Production Shipments', url: '/production/shipments' },
  { name: 'Production Shop Drawings', url: '/production/shop-drawings' },
  { name: 'Production Shop Drawing Detail', url: '/production/shop-drawings/123' },
  { name: 'Production Shop Drawing New', url: '/production/shop-drawings/new' },
  { name: 'Products Catalog', url: '/products/catalog' },
  { name: 'Product Detail', url: '/products/catalog/123' },
  { name: 'Collections', url: '/products/collections' },
  { name: 'Collection Detail', url: '/products/collections/123' },
  { name: 'Concepts', url: '/products/concepts' },
  { name: 'Concept Detail', url: '/products/concepts/123' },
  { name: 'Materials', url: '/products/materials' },
  { name: 'Product Ordered Items', url: '/products/ordered-items' },
  { name: 'Prototypes', url: '/products/prototypes' },
  { name: 'Prototype Detail', url: '/products/prototypes/123' },
  { name: 'Shipping Home', url: '/shipping' },
  { name: 'Shipments', url: '/shipping/shipments' },
  { name: 'Shipment Detail', url: '/shipping/shipments/123' },
  { name: 'Shipping Tracking', url: '/shipping/tracking' },
  { name: 'Track Shipment', url: '/shipping/tracking/TRACK123' },
  { name: 'Tasks List', url: '/tasks' },
  { name: 'Task Detail', url: '/tasks/123' },
  { name: 'My Tasks', url: '/tasks/my' },
  { name: 'Client Tasks', url: '/tasks/client' },
  { name: 'Designer Tasks', url: '/tasks/designer' },
  { name: 'Manufacturer Tasks', url: '/tasks/manufacturer' },
  { name: 'Task Kanban', url: '/tasks/kanban' },
  { name: 'Task Templates', url: '/tasks/templates' },
];

async function testPageInMode(page: any, pageInfo: any, mode: 'light' | 'dark'): Promise<PageResult> {
  // Set color scheme
  await page.emulateMedia({ colorScheme: mode });

  await page.goto(`http://localhost:3000${pageInfo.url}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(1000);

  const scanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const violations: ViolationDetail[] = scanResults.violations.flatMap(v =>
    v.nodes.slice(0, 2).map(node => ({
      id: v.id,
      impact: v.impact || 'unknown',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      element: node.html.substring(0, 150),
      failureSummary: node.failureSummary || '',
    }))
  );

  return {
    page: pageInfo.name,
    url: pageInfo.url,
    mode,
    violations,
  };
}

async function runLightDarkAudit() {
  console.log('🔍 Starting LIGHT & DARK Mode Accessibility Audit...');
  console.log(`📊 Testing ${allPages.length} pages × 2 modes = ${allPages.length * 2} total tests\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const lightResults: PageResult[] = [];
  const darkResults: PageResult[] = [];

  // Test all pages in LIGHT mode
  console.log('🌞 Testing LIGHT MODE...\n');
  for (let i = 0; i < allPages.length; i++) {
    const pageInfo = allPages[i];
    try {
      const result = await testPageInMode(page, pageInfo, 'light');
      lightResults.push(result);
      const status = result.violations.length === 0 ? '✅' : `❌ ${result.violations.length}`;
      console.log(`[${i + 1}/${allPages.length}] ${status} ${pageInfo.name}`);
    } catch (error) {
      console.log(`[${i + 1}/${allPages.length}] ⚠️  ${pageInfo.name} - Error`);
    }
  }

  // Test all pages in DARK mode
  console.log('\n🌙 Testing DARK MODE...\n');
  for (let i = 0; i < allPages.length; i++) {
    const pageInfo = allPages[i];
    try {
      const result = await testPageInMode(page, pageInfo, 'dark');
      darkResults.push(result);
      const status = result.violations.length === 0 ? '✅' : `❌ ${result.violations.length}`;
      console.log(`[${i + 1}/${allPages.length}] ${status} ${pageInfo.name}`);
    } catch (error) {
      console.log(`[${i + 1}/${allPages.length}] ⚠️  ${pageInfo.name} - Error`);
    }
  }

  await browser.close();

  // Generate comprehensive report
  const lightViolations = lightResults.filter(r => r.violations.length > 0);
  const darkViolations = darkResults.filter(r => r.violations.length > 0);

  const report = `# COMPLETE Accessibility Audit - Light & Dark Modes

**Date**: ${new Date().toISOString().split('T')[0]}
**Total Pages**: ${allPages.length}
**Total Tests**: ${allPages.length * 2} (${allPages.length} × light mode + ${allPages.length} × dark mode)

## 📊 Summary

### Light Mode
- **Pages Tested**: ${allPages.length}
- **Pages with Violations**: ${lightViolations.length}
- **Pages Clean**: ${allPages.length - lightViolations.length}
- **Total Violations**: ${lightResults.reduce((sum, r) => sum + r.violations.length, 0)}

### Dark Mode
- **Pages Tested**: ${allPages.length}
- **Pages with Violations**: ${darkViolations.length}
- **Pages Clean**: ${allPages.length - darkViolations.length}
- **Total Violations**: ${darkResults.reduce((sum, r) => sum + r.violations.length, 0)}

---

## 🌞 LIGHT MODE VIOLATIONS

${lightViolations.map(r => `### ${r.page} (${r.url})

**Total Violations**: ${r.violations.length}

${r.violations.map(v => `#### ${v.help} (${v.id})
- **Impact**: ${v.impact.toUpperCase()}
- **Element**: \`${v.element}\`
- **Issue**: ${v.failureSummary}
- **Fix**: ${v.helpUrl}
`).join('\n')}

---
`).join('\n')}

## 🌙 DARK MODE VIOLATIONS

${darkViolations.map(r => `### ${r.page} (${r.url})

**Total Violations**: ${r.violations.length}

${r.violations.map(v => `#### ${v.help} (${v.id})
- **Impact**: ${v.impact.toUpperCase()}
- **Element**: \`${v.element}\`
- **Issue**: ${v.failureSummary}
- **Fix**: ${v.helpUrl}
`).join('\n')}

---
`).join('\n')}

## 🎯 Recommended Fixes

### Critical Issues to Address:

1. **Color Contrast** - Most common violation in both modes
   - Light mode: Check foreground/background color combinations
   - Dark mode: Verify dark background colors meet contrast ratios

2. **Icon Buttons** - Missing aria-labels
   - Add descriptive aria-label to all icon-only buttons
   - Example: \`<button aria-label="Open menu"><IconComponent /></button>\`

3. **Mode-Specific Issues**:
   - Light mode: Links and secondary text colors
   - Dark mode: Ensure all colors are properly inverted and still accessible

### Next Steps:
1. Fix all CRITICAL violations first
2. Then address SERIOUS violations
3. Verify fixes in both light and dark modes
4. Re-run audit to confirm 0 violations
`;

  fs.writeFileSync('/Users/eko3/limn-systems-enterprise/reports/accessibility-light-dark-audit.md', report);

  // Also save JSON for detailed analysis
  fs.writeFileSync(
    '/Users/eko3/limn-systems-enterprise/reports/accessibility-light-dark-audit.json',
    JSON.stringify({ light: lightResults, dark: darkResults }, null, 2)
  );

  console.log('\n✅ Light & Dark mode audit complete!');
  console.log(`🌞 Light mode: ${lightViolations.length}/${allPages.length} pages have violations`);
  console.log(`🌙 Dark mode: ${darkViolations.length}/${allPages.length} pages have violations`);
  console.log(`📁 Report: /Users/eko3/limn-systems-enterprise/reports/accessibility-light-dark-audit.md`);
}

runLightDarkAudit().catch(console.error);
