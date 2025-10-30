#!/bin/bash

# Script to batch update Breadcrumb to Breadcrumbs in all module pages
# Part of Phase 1A implementation

echo "🔄 Updating Breadcrumb imports to Breadcrumbs..."

# Define file mappings: file_path:breadcrumb_items
declare -A PAGES=(
  ["src/app/crm/leads/page.tsx"]="CRM:/crm|Leads"
  ["src/app/crm/orders/page.tsx"]="CRM:/crm|Orders"
  ["src/app/crm/projects/page.tsx"]="CRM:/crm|Projects"
  ["src/app/production/dashboard/page.tsx"]="Production:/production|Dashboard"
  ["src/app/production/orders/page.tsx"]="Production:/production|Production Orders"
  ["src/app/production/ordered-items/page.tsx"]="Production:/production|Ordered Items"
  ["src/app/production/packing-lists/page.tsx"]="Production:/production|Packing Lists"
  ["src/app/production/factory-reviews/page.tsx"]="Production:/production|Factory Reviews"
  ["src/app/production/quality-inspections/page.tsx"]="Production:/production|Quality Inspections"
  ["src/app/production/shipments/page.tsx"]="Production:/production|Shipments"
  ["src/app/production/tasks/page.tsx"]="Production:/production|Tasks"
  ["src/app/shipping/dashboard/page.tsx"]="Shipping:/shipping|Dashboard"
  ["src/app/shipping/shipments/page.tsx"]="Shipping:/shipping|Shipments"
  ["src/app/shipping/tracking/page.tsx"]="Shipping:/shipping|Tracking"
  ["src/app/products/catalog/page.tsx"]="Products:/products|Catalog"
  ["src/app/products/materials/page.tsx"]="Products:/products|Materials"
  ["src/app/products/ordered-items/page.tsx"]="Products:/products|Ordered Items"
  ["src/app/finance/invoices/page.tsx"]="Finance:/finance|Invoices"
  ["src/app/finance/payments/page.tsx"]="Finance:/finance|Payments"
  ["src/app/finance/expenses/page.tsx"]="Finance:/finance|Expenses"
  ["src/app/marketing/flipbooks/page.tsx"]="Marketing:/flipbooks|Flipbook Library"
)

for file in "${!PAGES[@]}"; do
  if [ -f "$file" ]; then
    breadcrumb_def="${PAGES[$file]}"
    IFS='|' read -r module current <<< "$breadcrumb_def"
    IFS=':' read -r module_label module_href <<< "$module"

    echo "  📄 Updating $file..."

    # Update import: Breadcrumb -> Breadcrumbs
    if grep -q "Breadcrumb," "$file"; then
      sed -i.breadcrumb-backup "s/Breadcrumb,/Breadcrumbs,/g" "$file"
    fi

    # Update usage: <Breadcrumb /> -> <Breadcrumbs items={...} />
    if grep -q "<Breadcrumb />" "$file"; then
      # Create breadcrumbs JSX
      breadcrumbs_jsx="<Breadcrumbs\n        items={[\n          { label: '$module_label', href: '$module_href' },\n          { label: '$current' }, \/\/ Current page\n        ]}\n      \/>"

      # This is complex to do with sed, so we'll just mark the file as needing manual update
      echo "    ⚠️  Needs manual Breadcrumb -> Breadcrumbs update"
    fi
  else
    echo "  ⚠️  File not found: $file"
  fi
done

# Clean up backup files
find src/app -name "*.breadcrumb-backup" -delete

echo "✅ Import updates complete! Manual updates may be needed for usage."
