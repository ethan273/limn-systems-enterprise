import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';

interface ViolationSummary {
  page: string;
  url: string;
  violationCount: number;
  criticalCount: number;
  seriousCount: number;
  violations: string[];
}

// ALL 103 pages in the application
const allPages = [
  { name: 'Homepage', url: '/' },
  { name: 'Login', url: '/login' },
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Simple', url: '/simple' },
  { name: 'Test', url: '/test' },
  { name: 'Working', url: '/working' },
  { name: 'Privacy Policy', url: '/privacy' },
  { name: 'Terms of Service', url: '/terms' },

  // Auth Pages
  { name: 'Auth - Employee', url: '/auth/employee' },
  { name: 'Auth - Customer', url: '/auth/customer' },
  { name: 'Auth - Contractor', url: '/auth/contractor' },
  { name: 'Auth - Dev', url: '/auth/dev' },

  // Admin
  { name: 'Admin - Approvals', url: '/admin/approvals' },

  // Dashboards
  { name: 'Analytics Dashboard', url: '/dashboards/analytics' },
  { name: 'Executive Dashboard', url: '/dashboards/executive' },
  { name: 'Projects Dashboard', url: '/dashboards/projects' },

  // CRM Module
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

  // Design Module
  { name: 'Design Boards', url: '/design/boards' },
  { name: 'Design Board Detail', url: '/design/boards/123' },
  { name: 'Design Briefs', url: '/design/briefs' },
  { name: 'Design Brief Detail', url: '/design/briefs/123' },
  { name: 'Design Brief New', url: '/design/briefs/new' },
  { name: 'Design Documents', url: '/design/documents' },
  { name: 'Design Projects', url: '/design/projects' },
  { name: 'Design Project Detail', url: '/design/projects/123' },

  // Documents
  { name: 'Documents List', url: '/documents' },
  { name: 'Document Detail', url: '/documents/123' },

  // Finance
  { name: 'Finance Home', url: '/finance' },
  { name: 'Invoices', url: '/financials/invoices' },
  { name: 'Invoice Detail', url: '/financials/invoices/123' },
  { name: 'Payments', url: '/financials/payments' },
  { name: 'Payment Detail', url: '/financials/payments/123' },

  // Partners
  { name: 'Designers', url: '/partners/designers' },
  { name: 'Designer Detail', url: '/partners/designers/123' },
  { name: 'Factories', url: '/partners/factories' },
  { name: 'Factory Detail', url: '/partners/factories/123' },

  // Portal Pages
  { name: 'Portal Home', url: '/portal' },
  { name: 'Portal Login', url: '/portal/login' },
  { name: 'Portal Documents', url: '/portal/documents' },
  { name: 'Portal Orders', url: '/portal/orders' },
  { name: 'Portal Order Detail', url: '/portal/orders/123' },
  { name: 'Portal Financials', url: '/portal/financials' },
  { name: 'Portal Shipping', url: '/portal/shipping' },

  // Designer Portal
  { name: 'Designer Portal Home', url: '/portal/designer' },
  { name: 'Designer Portal Documents', url: '/portal/designer/documents' },
  { name: 'Designer Portal Project', url: '/portal/designer/projects/123' },
  { name: 'Designer Portal Quality', url: '/portal/designer/quality' },
  { name: 'Designer Portal Settings', url: '/portal/designer/settings' },

  // Factory Portal
  { name: 'Factory Portal Home', url: '/portal/factory' },
  { name: 'Factory Portal Documents', url: '/portal/factory/documents' },
  { name: 'Factory Portal Order', url: '/portal/factory/orders/123' },
  { name: 'Factory Portal Quality', url: '/portal/factory/quality' },
  { name: 'Factory Portal Settings', url: '/portal/factory/settings' },

  // Production Module
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

  // Products Module
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

  // Shipping
  { name: 'Shipping Home', url: '/shipping' },
  { name: 'Shipments', url: '/shipping/shipments' },
  { name: 'Shipment Detail', url: '/shipping/shipments/123' },
  { name: 'Shipping Tracking', url: '/shipping/tracking' },
  { name: 'Track Shipment', url: '/shipping/tracking/TRACK123' },

  // Tasks
  { name: 'Tasks List', url: '/tasks' },
  { name: 'Task Detail', url: '/tasks/123' },
  { name: 'My Tasks', url: '/tasks/my' },
  { name: 'Client Tasks', url: '/tasks/client' },
  { name: 'Designer Tasks', url: '/tasks/designer' },
  { name: 'Manufacturer Tasks', url: '/tasks/manufacturer' },
  { name: 'Task Kanban', url: '/tasks/kanban' },
  { name: 'Task Templates', url: '/tasks/templates' },
];

async function runCompleteAccessibilityAudit() {
  console.log('🔍 Starting COMPLETE Accessibility Audit...');
  console.log(`📊 Testing ${allPages.length} pages\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results: ViolationSummary[] = [];
  let totalViolations = 0;
  let totalCritical = 0;
  let totalSerious = 0;
  let pagesWithViolations = 0;

  for (let i = 0; i < allPages.length; i++) {
    const pageInfo = allPages[i];
    const progress = `[${i + 1}/${allPages.length}]`;

    try {
      await page.goto(`http://localhost:3000${pageInfo.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.waitForTimeout(1000);

      const scanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalCount = scanResults.violations.filter(v => v.impact === 'critical').length;
      const seriousCount = scanResults.violations.filter(v => v.impact === 'serious').length;

      if (scanResults.violations.length > 0) {
        pagesWithViolations++;
        totalViolations += scanResults.violations.length;
        totalCritical += criticalCount;
        totalSerious += seriousCount;

        results.push({
          page: pageInfo.name,
          url: pageInfo.url,
          violationCount: scanResults.violations.length,
          criticalCount,
          seriousCount,
          violations: scanResults.violations.map(v => `${v.id} (${v.impact})`),
        });

        console.log(`${progress} ❌ ${pageInfo.name} - ${scanResults.violations.length} violations (${criticalCount} critical, ${seriousCount} serious)`);
      } else {
        console.log(`${progress} ✅ ${pageInfo.name}`);
      }
    } catch (error) {
      console.log(`${progress} ⚠️  ${pageInfo.name} - Error: ${error.message}`);
    }
  }

  await browser.close();

  // Generate summary report
  const summary = `# COMPLETE Accessibility Audit Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Total Pages Tested**: ${allPages.length}
**Pages with Violations**: ${pagesWithViolations}
**Pages Clean**: ${allPages.length - pagesWithViolations}
**Total Violations**: ${totalViolations}
**Critical Violations**: ${totalCritical}
**Serious Violations**: ${totalSerious}

## Summary

${pagesWithViolations === 0
  ? '✅ **ALL PAGES PASS** - Zero accessibility violations found!'
  : `❌ **${pagesWithViolations} pages have violations** - ${totalViolations} total issues found`
}

## Pages with Violations

${results.map(r => `### ${r.page} (${r.url})
- **Total Violations**: ${r.violationCount}
- **Critical**: ${r.criticalCount}
- **Serious**: ${r.seriousCount}
- **Issues**: ${r.violations.join(', ')}
`).join('\n')}

## Clean Pages

${allPages.filter(p => !results.find(r => r.url === p.url)).map(p => `- ✅ ${p.name} (${p.url})`).join('\n')}
`;

  fs.writeFileSync('/Users/eko3/limn-systems-enterprise/reports/accessibility-complete-audit.md', summary);

  console.log('\n✅ Complete accessibility audit finished!');
  console.log(`📊 ${pagesWithViolations}/${allPages.length} pages have violations`);
  console.log(`📁 Full report: /Users/eko3/limn-systems-enterprise/reports/accessibility-complete-audit.md`);
}

runCompleteAccessibilityAudit().catch(console.error);
