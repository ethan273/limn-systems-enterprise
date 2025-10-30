#!/bin/bash
# Fix Breadcrumbs import paths

files=(
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
    # Change import path from "@/components/common/Breadcrumb" to "@/components/common"
    sed -i '' 's|from "@/components/common/Breadcrumb"|from "@/components/common"|g' "$file"
    echo "✓ Fixed import path in $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo "Done! Fixed import paths in ${#files[@]} files."
