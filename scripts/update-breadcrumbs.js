#!/usr/bin/env node

/**
 * Batch update Breadcrumb to Breadcrumbs in all module pages
 * Part of Phase 1A implementation
 */

const fs = require('fs');
const path = require('path');

// Define file mappings with breadcrumb hierarchies
const pages = [
  { file: 'src/app/crm/leads/page.tsx', module: 'CRM', href: '/crm', current: 'Leads' },
  { file: 'src/app/crm/orders/page.tsx', module: 'CRM', href: '/crm', current: 'Orders' },
  { file: 'src/app/crm/projects/page.tsx', module: 'CRM', href: '/crm', current: 'Projects' },
  { file: 'src/app/production/dashboard/page.tsx', module: 'Production', href: '/production', current: 'Dashboard' },
  { file: 'src/app/production/orders/page.tsx', module: 'Production', href: '/production', current: 'Production Orders' },
  { file: 'src/app/production/ordered-items/page.tsx', module: 'Production', href: '/production', current: 'Ordered Items' },
  { file: 'src/app/production/packing-lists/page.tsx', module: 'Production', href: '/production', current: 'Packing Lists' },
  { file: 'src/app/production/factory-reviews/page.tsx', module: 'Production', href: '/production', current: 'Factory Reviews' },
  { file: 'src/app/production/quality-inspections/page.tsx', module: 'Production', href: '/production', current: 'Quality Inspections' },
  { file: 'src/app/production/shipments/page.tsx', module: 'Production', href: '/production', current: 'Shipments' },
  { file: 'src/app/production/tasks/page.tsx', module: 'Production', href: '/production', current: 'Tasks' },
  { file: 'src/app/shipping/dashboard/page.tsx', module: 'Shipping', href: '/shipping', current: 'Dashboard' },
  { file: 'src/app/shipping/shipments/page.tsx', module: 'Shipping', href: '/shipping', current: 'Shipments' },
  { file: 'src/app/shipping/tracking/page.tsx', module: 'Shipping', href: '/shipping', current: 'Tracking' },
  { file: 'src/app/products/catalog/page.tsx', module: 'Products', href: '/products', current: 'Catalog' },
  { file: 'src/app/products/materials/page.tsx', module: 'Products', href: '/products', current: 'Materials' },
  { file: 'src/app/products/ordered-items/page.tsx', module: 'Products', href: '/products', current: 'Ordered Items' },
  { file: 'src/app/finance/invoices/page.tsx', module: 'Finance', href: '/finance', current: 'Invoices' },
  { file: 'src/app/finance/payments/page.tsx', module: 'Finance', href: '/finance', current: 'Payments' },
  { file: 'src/app/finance/expenses/page.tsx', module: 'Finance', href: '/finance', current: 'Expenses' },
  { file: 'src/app/marketing/flipbooks/page.tsx', module: 'Marketing', href: '/flipbooks', current: 'Flipbook Library' },
];

let successCount = 0;
let skipCount = 0;

console.log('🔄 Updating Breadcrumb to Breadcrumbs in module pages...\n');

pages.forEach(({ file, module, href, current }) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    skipCount++;
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Update import: Breadcrumb -> Breadcrumbs
    if (content.includes('Breadcrumb,')) {
      content = content.replace(/Breadcrumb,/g, 'Breadcrumbs,');
      modified = true;
    }

    // Update usage: <Breadcrumb /> -> <Breadcrumbs items={...} />
    const breadcrumbRegex = /<Breadcrumb\s*\/>/g;
    if (breadcrumbRegex.test(content)) {
      const newBreadcrumbs = `<Breadcrumbs
        items={[
          { label: '${module}', href: '${href}' },
          { label: '${current}' }, // Current page
        ]}
      />`;

      content = content.replace(breadcrumbRegex, newBreadcrumbs);
      modified = true;
    }

    // Also handle cases with comments
    const breadcrumbWithCommentRegex = /{\s*\/\*.*?\*\/\s*}\s*<Breadcrumb\s*\/>/g;
    if (breadcrumbWithCommentRegex.test(content)) {
      const newBreadcrumbs = `<Breadcrumbs
        items={[
          { label: '${module}', href: '${href}' },
          { label: '${current}' }, // Current page
        ]}
      />`;

      content = content.replace(breadcrumbWithCommentRegex, newBreadcrumbs);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${file}`);
      successCount++;
    } else {
      console.log(`⏭️  Skipped (no changes needed): ${file}`);
      skipCount++;
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Updated: ${successCount}`);
console.log(`   ⏭️  Skipped: ${skipCount}`);
console.log(`   📄 Total: ${pages.length}`);
