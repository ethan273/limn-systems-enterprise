#!/bin/bash

# TypeScript Relation Name Fix Script
# This script systematically fixes all incorrect Prisma relation names in the codebase

set -e

echo "🔧 Starting TypeScript Relation Name Fixes..."

# Define file patterns to fix
ROUTER_FILES="src/server/api/routers/*.ts"
PAGE_FILES="src/app/**/*.tsx"

# Pattern 1: Fix prototype_production.prototype → prototype_production.prototypes
echo "📝 Fixing prototype_production.prototype patterns..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/prototype_production\.prototype\([^s]\)/prototype_production.prototypes\1/g' {} +

# Pattern 2: Fix accessing .prototype (standalone) → .prototypes
echo "📝 Fixing standalone .prototype references..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\([^_]\)\.prototype\([^_s]\)/\1.prototypes\2/g' {} +

# Pattern 3: Fix .factory → .partners (in prototype_production context)
echo "📝 Fixing .factory references to .partners..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/prototype_production\.factory\([^_]\)/prototype_production.partners\1/g' {} +

# Pattern 4: Fix production_items → production_order_items (common mistake)
echo "📝 Fixing production_items references..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/production_items\([^_]\)/production_order_items\1/g' {} +

echo "✅ All pattern-based fixes completed!"
echo "🔍 Please review changes and run: npx tsc --noEmit"
