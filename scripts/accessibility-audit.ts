import { chromium, Browser, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

interface AccessibilityViolation {
  page: string;
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AccessibilityReport {
  totalPages: number;
  pagesWithViolations: number;
  totalViolations: number;
  violationsByImpact: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  violationsByType: Record<string, number>;
  pageReports: Array<{
    page: string;
    url: string;
    violations: AccessibilityViolation[];
  }>;
}

const pagesToTest = [
  // Public Pages
  { name: 'Homepage', url: '/' },
  { name: 'Login', url: '/login' },

  // Portal Pages
  { name: 'Portal Login', url: '/portal/login' },
  { name: 'Portal Home', url: '/portal' },
  { name: 'Portal Orders', url: '/portal/orders' },
  { name: 'Portal Documents', url: '/portal/documents' },

  // CRM Module
  { name: 'CRM Contacts', url: '/crm/contacts' },
  { name: 'CRM Leads', url: '/crm/leads' },
  { name: 'CRM Customers', url: '/crm/customers' },
  { name: 'CRM Prospects', url: '/crm/prospects' },

  // Orders & Financial
  { name: 'Orders', url: '/orders' },
  { name: 'Invoices', url: '/financials/invoices' },
  { name: 'Payments', url: '/financials/payments' },
  { name: 'Quotes', url: '/quotes' },

  // Production Module
  { name: 'Production Orders', url: '/production/orders' },
  { name: 'Ordered Items', url: '/production/ordered-items' },
  { name: 'Production Shipments', url: '/production/shipments' },
  { name: 'Quality Inspections', url: '/quality/inspections' },

  // Products Module
  { name: 'Products Catalog', url: '/products/catalog' },
  { name: 'Collections', url: '/products/collections' },
  { name: 'Concepts', url: '/products/concepts' },
  { name: 'Prototypes', url: '/products/prototypes' },

  // Projects & Tasks
  { name: 'Projects', url: '/projects' },
  { name: 'Tasks', url: '/tasks' },
  { name: 'My Tasks', url: '/tasks/my' },

  // Design Module
  { name: 'Design Projects', url: '/design/projects' },
  { name: 'Shop Drawings', url: '/design/shop-drawings' },
  { name: 'Design Reviews', url: '/design/reviews' },

  // Partners Module
  { name: 'Factories', url: '/partners/factories' },
  { name: 'Designers', url: '/partners/designers' },

  // Documents & Communication
  { name: 'Documents', url: '/documents' },
  { name: 'Communications', url: '/communications' },

  // Shipping
  { name: 'Shipping', url: '/shipping' },
  { name: 'Shipments', url: '/shipping/shipments' },

  // Settings
  { name: 'Settings', url: '/settings' },
];

async function runAccessibilityAudit() {
  console.log('🔍 Starting Comprehensive Accessibility Audit...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const report: AccessibilityReport = {
    totalPages: pagesToTest.length,
    pagesWithViolations: 0,
    totalViolations: 0,
    violationsByImpact: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    },
    violationsByType: {},
    pageReports: [],
  };

  for (const pageInfo of pagesToTest) {
    console.log(`Testing: ${pageInfo.name} (${pageInfo.url})`);

    try {
      await page.goto(`http://localhost:3000${pageInfo.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        report.pagesWithViolations++;
        report.totalViolations += accessibilityScanResults.violations.length;

        const pageViolations: AccessibilityViolation[] = accessibilityScanResults.violations.map(v => {
          // Count by impact
          const impact = v.impact as 'critical' | 'serious' | 'moderate' | 'minor';
          if (impact) {
            report.violationsByImpact[impact]++;
          }

          // Count by type
          report.violationsByType[v.id] = (report.violationsByType[v.id] || 0) + 1;

          return {
            page: pageInfo.name,
            id: v.id,
            impact: v.impact || 'unknown',
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map(n => ({
              html: n.html,
              target: Array.isArray(n.target) ? n.target.map(String) : [String(n.target)],
              failureSummary: n.failureSummary || '',
            })) as Array<{ html: string; target: string[]; failureSummary: string }>,
          };
        });

        report.pageReports.push({
          page: pageInfo.name,
          url: pageInfo.url,
          violations: pageViolations,
        });

        console.log(`  ❌ ${accessibilityScanResults.violations.length} violations found`);
      } else {
        console.log(`  ✅ No violations`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error testing page: ${error}`);
    }
  }

  await browser.close();

  // Generate detailed report
  generateDetailedReport(report);

  console.log('\n✅ Accessibility audit complete!');
  console.log(`📊 Results saved to: /Users/eko3/limn-systems-enterprise/reports/accessibility-audit-report.md`);
}

function generateDetailedReport(report: AccessibilityReport) {
  const reportDir = '/Users/eko3/limn-systems-enterprise/reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  let markdown = `# Comprehensive Accessibility Audit Report\n\n`;
  markdown += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  markdown += `**Total Pages Tested**: ${report.totalPages}\n`;
  markdown += `**Pages with Violations**: ${report.pagesWithViolations}\n`;
  markdown += `**Total Violations**: ${report.totalViolations}\n\n`;

  markdown += `## Summary by Impact\n\n`;
  markdown += `| Impact | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Critical | ${report.violationsByImpact.critical} |\n`;
  markdown += `| Serious | ${report.violationsByImpact.serious} |\n`;
  markdown += `| Moderate | ${report.violationsByImpact.moderate} |\n`;
  markdown += `| Minor | ${report.violationsByImpact.minor} |\n\n`;

  markdown += `## Summary by Violation Type\n\n`;
  markdown += `| Violation Type | Count | Priority |\n`;
  markdown += `|----------------|-------|----------|\n`;

  const sortedViolations = Object.entries(report.violationsByType)
    .sort(([, a], [, b]) => b - a);

  for (const [type, count] of sortedViolations) {
    const priority = count > 10 ? '🔴 HIGH' : count > 5 ? '🟡 MEDIUM' : '🟢 LOW';
    markdown += `| ${type} | ${count} | ${priority} |\n`;
  }

  markdown += `\n## Detailed Violations by Page\n\n`;

  for (const pageReport of report.pageReports) {
    markdown += `### ${pageReport.page} (${pageReport.url})\n\n`;
    markdown += `**Total Violations**: ${pageReport.violations.length}\n\n`;

    // Group violations by type
    const violationsByType = pageReport.violations.reduce((acc, v) => {
      if (!acc[v.id]) {
        acc[v.id] = [];
      }
      acc[v.id].push(v);
      return acc;
    }, {} as Record<string, AccessibilityViolation[]>);

    for (const [type, violations] of Object.entries(violationsByType)) {
      const firstViolation = violations[0];
      markdown += `#### ${firstViolation.help} (${type})\n\n`;
      markdown += `**Impact**: ${firstViolation.impact.toUpperCase()}\n\n`;
      markdown += `**Description**: ${firstViolation.description}\n\n`;
      markdown += `**Affected Elements** (${violations.length}):\n\n`;

      for (const violation of violations.slice(0, 3)) { // Show first 3 examples
        for (const vNode of violation.nodes.slice(0, 1)) { // Show first node
          markdown += `- \`${vNode.html.substring(0, 100)}${vNode.html.length > 100 ? '...' : ''}\`\n`;
          markdown += `  - **Issue**: ${vNode.failureSummary}\n`;
        }
      }

      if (violations.length > 3) {
        markdown += `\n... and ${violations.length - 3} more instances\n`;
      }

      markdown += `\n**How to Fix**: [${firstViolation.helpUrl}](${firstViolation.helpUrl})\n\n`;
      markdown += `---\n\n`;
    }
  }

  // Add recommendations section
  markdown += `## Recommended Fixes\n\n`;
  markdown += `### Priority 1: Color Contrast Issues (CRITICAL)\n\n`;

  if (report.violationsByType['color-contrast']) {
    markdown += `**Found ${report.violationsByType['color-contrast']} color contrast violations**\n\n`;
    markdown += `**Fix**: Update CSS to meet WCAG AA contrast ratios:\n\n`;
    markdown += `\`\`\`css\n`;
    markdown += `/* BEFORE: Insufficient contrast */\n`;
    markdown += `.text-secondary { color: #f1f2f4; } /* 1.12:1 ratio - FAILS */\n`;
    markdown += `.bg-blue-500 { background: #3b82f6; color: #262626; } /* 4.11:1 - FAILS */\n\n`;
    markdown += `/* AFTER: WCAG AA compliant */\n`;
    markdown += `.text-secondary { color: #6b7280; } /* 4.5:1+ ratio - PASSES */\n`;
    markdown += `.bg-blue-500 { background: #3b82f6; color: #ffffff; } /* 4.5:1+ ratio - PASSES */\n`;
    markdown += `\`\`\`\n\n`;
  }

  markdown += `### Priority 2: Form Labels & ARIA\n\n`;

  if (report.violationsByType['label'] || report.violationsByType['aria-required-attr']) {
    markdown += `**Fix**: Add proper labels and ARIA attributes:\n\n`;
    markdown += `\`\`\`jsx\n`;
    markdown += `// BEFORE\n`;
    markdown += `<input type="text" placeholder="Search..." />\n\n`;
    markdown += `// AFTER\n`;
    markdown += `<label htmlFor="search">Search</label>\n`;
    markdown += `<input id="search" type="text" placeholder="Search..." aria-label="Search" />\n`;
    markdown += `\`\`\`\n\n`;
  }

  markdown += `### Priority 3: Heading Hierarchy\n\n`;

  if (report.violationsByType['heading-order']) {
    markdown += `**Fix**: Ensure logical heading structure (h1 → h2 → h3):\n\n`;
    markdown += `\`\`\`jsx\n`;
    markdown += `// BEFORE: Skips from h1 to h3\n`;
    markdown += `<h1>Page Title</h1>\n`;
    markdown += `<h3>Section Title</h3> {/* ERROR */}\n\n`;
    markdown += `// AFTER: Proper hierarchy\n`;
    markdown += `<h1>Page Title</h1>\n`;
    markdown += `<h2>Section Title</h2>\n`;
    markdown += `<h3>Subsection</h3>\n`;
    markdown += `\`\`\`\n\n`;
  }

  markdown += `### Priority 4: Icon & Button Labels\n\n`;

  if (report.violationsByType['button-name'] || report.violationsByType['link-name']) {
    markdown += `**Fix**: Add accessible names to icon buttons:\n\n`;
    markdown += `\`\`\`jsx\n`;
    markdown += `// BEFORE: No accessible name\n`;
    markdown += `<button><Icon /></button>\n\n`;
    markdown += `// AFTER: Accessible name provided\n`;
    markdown += `<button aria-label="Delete item"><Icon /></button>\n`;
    markdown += `\`\`\`\n\n`;
  }

  markdown += `## Action Items\n\n`;
  markdown += `1. **Immediate**: Fix all CRITICAL & SERIOUS violations (${report.violationsByImpact.critical + report.violationsByImpact.serious} issues)\n`;
  markdown += `2. **Short-term**: Address MODERATE violations (${report.violationsByImpact.moderate} issues)\n`;
  markdown += `3. **Long-term**: Resolve MINOR violations (${report.violationsByImpact.minor} issues)\n`;
  markdown += `4. **Ongoing**: Integrate accessibility testing into CI/CD pipeline\n`;
  markdown += `5. **Training**: Educate team on WCAG 2.1 AA compliance requirements\n\n`;

  fs.writeFileSync(
    path.join(reportDir, 'accessibility-audit-report.md'),
    markdown
  );

  // Also save JSON for programmatic access
  fs.writeFileSync(
    path.join(reportDir, 'accessibility-audit-report.json'),
    JSON.stringify(report, null, 2)
  );
}

runAccessibilityAudit().catch(console.error);
