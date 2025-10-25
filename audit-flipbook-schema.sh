#!/bin/bash

# Comprehensive audit of flipbook-related queries against Prisma schema
# This script identifies ALL field/table name mismatches

echo "========================================"
echo "Flipbook Schema Audit"
echo "========================================"
echo ""

# Extract schema definitions for reference
echo "📋 Schema Reference:"
echo ""
echo "=== flipbooks table fields ==="
grep -A 30 "model flipbooks {" prisma/schema.prisma | grep -E "^\s+\w+\s+" | sed 's/^  //' | awk '{print "  - " $1}'
echo ""

echo "=== flipbook_pages table fields ==="
grep -A 30 "model flipbook_pages {" prisma/schema.prisma | grep -E "^\s+\w+\s+" | sed 's/^  //' | awk '{print "  - " $1}'
echo ""

echo "=== hotspots table fields ==="
grep -A 25 "model hotspots {" prisma/schema.prisma | grep -E "^\s+\w+\s+" | sed 's/^  //' | awk '{print "  - " $1}'
echo ""

echo "=== flipbook_share_links table fields ==="
grep -A 30 "model flipbook_share_links {" prisma/schema.prisma | grep -E "^\s+\w+\s+" | sed 's/^  //' | awk '{print "  - " $1}'
echo ""

echo "========================================"
echo "🔍 Checking for field references in code"
echo "========================================"
echo ""

# Check flipbooks table queries
echo "=== Checking ctx.db.flipbooks queries ==="
grep -n "ctx\.db\.flipbooks\." src/server/api/routers/flipbooks.ts | head -20
echo ""

# Check flipbook_pages table queries
echo "=== Checking ctx.db.flipbook_pages queries ==="
grep -n "ctx\.db\.flipbook_pages\." src/server/api/routers/flipbooks.ts | head -20
echo ""

# Check hotspots table queries
echo "=== Checking ctx.db.hotspots queries ==="
grep -n "ctx\.db\.hotspots\." src/server/api/routers/flipbooks.ts | head -20
echo ""

# Check for common field name errors
echo "========================================"
echo "⚠️  Checking for common field name errors"
echo "========================================"
echo ""

echo "Checking for incorrect 'product_id' (should be 'target_product_id'):"
grep -n "product_id" src/server/api/routers/flipbooks.ts | grep -v "target_product_id" | grep -v "//"
echo ""

echo "Checking for incorrect 'page_hotspots' (should be 'hotspots'):"
grep -n "page_hotspots" src/server/api/routers/flipbooks.ts
echo ""

echo "Checking for 'hotspot_type' in select (Unsupported field - cannot select):"
grep -n "hotspot_type.*true" src/server/api/routers/flipbooks.ts
echo ""

echo "Checking for 'status' in select (Unsupported field on flipbooks):"
grep -A 5 "ctx\.db\.flipbooks\.findMany\|ctx\.db\.flipbooks\.findUnique" src/server/api/routers/flipbooks.ts | grep "status.*true"
echo ""

echo "Checking for 'page_type' in select (Unsupported field on flipbook_pages):"
grep -A 5 "ctx\.db\.flipbook_pages\.findMany" src/server/api/routers/flipbooks.ts | grep "page_type.*true"
echo ""

echo "========================================"
echo "📊 Summary"
echo "========================================"
echo ""
echo "✅ Schema tables identified:"
echo "   - flipbooks"
echo "   - flipbook_pages"
echo "   - hotspots"
echo "   - flipbook_share_links"
echo ""
echo "⚠️  Unsupported fields that CANNOT be selected:"
echo "   - flipbooks.status (Unsupported('flipbook_status'))"
echo "   - flipbook_pages.page_type (Unsupported('page_type'))"
echo "   - hotspots.hotspot_type (Unsupported('hotspot_type'))"
echo ""
echo "Audit complete!"
