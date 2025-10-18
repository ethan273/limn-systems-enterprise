#!/bin/bash

# Script to find all findFirst usage in production code (src/)
# Helps identify files that need manual fixing

echo "🔍 Searching for findFirst usage in production code (src/)..."
echo ""

grep -r "\.findFirst(" src/ --include="*.ts" --include="*.tsx" -n | grep -v "node_modules" | while IFS=: read -r file line content; do
    echo "📄 File: $file"
    echo "   Line $line: $(echo "$content" | xargs)"
    echo ""
done

echo "✅ Search complete"
echo ""
echo "💡 To fix: Replace findFirst with:"
echo "   const items = await db.table.findMany({ where: ... });"
echo "   const item = items.length > 0 ? items[0] : null;"
