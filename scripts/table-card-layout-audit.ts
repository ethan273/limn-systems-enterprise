import { chromium } from '@playwright/test';
import * as fs from 'fs';

interface TableLayoutIssue {
  page: string;
  selector: string;
  issue: string;
  screenshot?: string;
}

const pagesToTest = [
  '/crm/contacts',
  '/crm/leads',
  '/crm/customers',
  '/crm/prospects',
  '/tasks',
  '/tasks/my',
  '/financials/invoices',
  '/financials/payments',
  '/production/orders',
  '/production/ordered-items',
  '/products/catalog',
  '/shipping/shipments',
  '/documents',
];

async function auditTableCardLayouts() {
  console.log('🔍 Auditing Table & Card Layouts...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const issues: TableLayoutIssue[] = [];

  for (const url of pagesToTest) {
    console.log(`Testing: ${url}`);

    try {
      await page.goto(`http://localhost:3000${url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.waitForTimeout(1000);

      // Check for vertical stacking in table cells
      const tableCells = await page.locator('td, th').all();

      for (let i = 0; i < Math.min(tableCells.length, 10); i++) {
        const cell = tableCells[i];
        const box = await cell.boundingBox();

        if (box) {
          // Check if cell height is unusually large (might indicate vertical stacking)
          if (box.height > 100) {
            const html = await cell.innerHTML();
            const className = await cell.getAttribute('class');

            issues.push({
              page: url,
              selector: `td/th with class: ${className}`,
              issue: `Table cell has excessive height (${box.height}px) - likely stacking vertically. Content: ${html.substring(0, 100)}...`,
            });
          }

          // Check if cell contains flex-col (vertical flex)
          const hasFlexCol = className?.includes('flex-col');
          if (hasFlexCol && !className?.includes('space-y')) {
            issues.push({
              page: url,
              selector: `td/th with class: ${className}`,
              issue: 'Cell uses flex-col which may cause vertical stacking',
            });
          }
        }
      }

      // Check for cards with vertical layout issues
      const cards = await page.locator('[class*="card"]').all();

      for (const card of cards.slice(0, 5)) {
        const className = await card.getAttribute('class');
        const box = await card.boundingBox();

        if (box && box.height > box.width) {
          // Card is taller than wide - might be stacking
          const childDivs = await card.locator('div').all();
          let hasFlexCol = false;

          for (const div of childDivs) {
            const divClass = await div.getAttribute('class');
            if (divClass?.includes('flex-col')) {
              hasFlexCol = true;
              break;
            }
          }

          if (hasFlexCol) {
            issues.push({
              page: url,
              selector: `card with class: ${className}`,
              issue: `Card contains flex-col and is taller than wide (${box.height}px × ${box.width}px) - content may be stacking`,
            });
          }
        }
      }

      // Check for grid layouts that might be single column
      const grids = await page.locator('[class*="grid"]:not([class*="grid-cols-1"])').all();

      for (const grid of grids.slice(0, 5)) {
        const className = await grid.getAttribute('class');
        const children = await grid.locator('> *').all();

        if (children.length > 1) {
          const firstBox = await children[0].boundingBox();
          const secondBox = await children[1].boundingBox();

          if (firstBox && secondBox) {
            // Check if second child is below first (vertical stacking)
            if (secondBox.y > firstBox.y + firstBox.height - 10) {
              issues.push({
                page: url,
                selector: `grid with class: ${className}`,
                issue: `Grid children are stacking vertically despite not being grid-cols-1. May be missing responsive breakpoints (md:grid-cols-*, lg:grid-cols-*)`,
              });
            }
          }
        }
      }

      const pageIssues = issues.filter(i => i.page === url).length;
      if (pageIssues > 0) {
        console.log(`  ❌ ${pageIssues} layout issues found`);
      } else {
        console.log(`  ✅ No obvious layout issues`);
      }

    } catch (error) {
      console.log(`  ⚠️  Error: ${error.message}`);
    }
  }

  await browser.close();

  // Generate report
  const report = `# Table & Card Layout Audit

**Date**: ${new Date().toISOString().split('T')[0]}
**Pages Tested**: ${pagesToTest.length}
**Issues Found**: ${issues.length}

## Issues by Page

${issues.length === 0 ? '✅ No layout issues detected!' : ''}

${pagesToTest.map(url => {
  const pageIssues = issues.filter(i => i.page === url);
  if (pageIssues.length === 0) return `### ${url}\n✅ No issues\n`;

  return `### ${url}

**Issues Found**: ${pageIssues.length}

${pageIssues.map((issue, i) => `${i + 1}. **${issue.selector}**
   - ${issue.issue}
`).join('\n')}
`;
}).join('\n')}

## Common Patterns Causing Vertical Stacking

### 1. Table Cells with flex-col
\`\`\`tsx
// ❌ WRONG - Causes vertical stacking
<td className="flex flex-col">
  <span>Label</span>
  <span>Value</span>
</td>

// ✅ CORRECT - Keeps horizontal
<td className="flex items-center gap-2">
  <span>Label:</span>
  <span>Value</span>
</td>
\`\`\`

### 2. Missing Responsive Grid Classes
\`\`\`tsx
// ❌ WRONG - Stacks on all screen sizes
<div className="grid grid-cols-1">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// ✅ CORRECT - Horizontal on medium+ screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
\`\`\`

### 3. Cards with Vertical Flex
\`\`\`tsx
// ❌ WRONG - Content stacks vertically
<div className="card flex flex-col">
  <div>Field 1</div>
  <div>Field 2</div>
</div>

// ✅ CORRECT - Content flows horizontally
<div className="card">
  <div className="grid grid-cols-2 gap-4">
    <div>Field 1</div>
    <div>Field 2</div>
  </div>
</div>
\`\`\`

## Recommended Fixes

1. **Search for**: \`<td className=".*flex-col.*"\`
   - Replace with: \`<td className="flex items-center gap-2"\`

2. **Search for**: \`grid-cols-1\` (without responsive variants)
   - Add: \`md:grid-cols-2 lg:grid-cols-3\` as appropriate

3. **Search for**: Cards with \`flex-col\` that should be horizontal
   - Replace with: \`grid grid-cols-2\` or horizontal flex

4. **Add to globals.css**:
\`\`\`css
/* Prevent table cells from stacking */
td, th {
  vertical-align: middle;
}

/* Ensure table content doesn't wrap unnecessarily */
.table-cell-nowrap {
  white-space: nowrap;
}
\`\`\`

## Files Likely Affected

Based on common patterns, check these files:
- Table components in list pages
- Detail page card layouts
- Status badge containers
- Action button groups
- Form field layouts in tables

## Next Steps

1. Run this audit with authentication to see actual data
2. Manually inspect flagged pages in browser
3. Apply fixes systematically by pattern
4. Test responsive behavior at different breakpoints
`;

  fs.writeFileSync('/Users/eko3/limn-systems-enterprise/reports/table-card-layout-audit.md', report);

  console.log(`\n✅ Audit complete!`);
  console.log(`📊 Found ${issues.length} potential layout issues`);
  console.log(`📁 Report: /Users/eko3/limn-systems-enterprise/reports/table-card-layout-audit.md`);
}

auditTableCardLayouts().catch(console.error);
