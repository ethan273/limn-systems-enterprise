#!/bin/bash
# Fix Breadcrumbs import in all files that were batch updated

files=(
  "src/app/crm/orders/page.tsx"
  "src/app/production/dashboard/page.tsx"
  "src/app/production/factory-reviews/page.tsx"
  "src/app/production/ordered-items/page.tsx"
  "src/app/production/orders/page.tsx"
  "src/app/production/packing-lists/page.tsx"
  "src/app/production/shipments/page.tsx"
  "src/app/shipping/shipments/page.tsx"
  "src/app/shipping/tracking/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Change import { Breadcrumb } to import { Breadcrumbs }
    sed -i '' 's/import { Breadcrumb }/import { Breadcrumbs }/g' "$file"
    echo "✓ Fixed import in $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo "Done! Fixed Breadcrumbs imports in ${#files[@]} files."
