#!/bin/bash

# Simple Pino Logger Migration Script
# Migrates all console statements to Pino logger
# Date: October 30, 2025

set -e

echo "🔍 Finding all files with console statements..."

# Find all TypeScript files with console statements (excluding logger.ts itself)
FILES=$(grep -r "console\.\(log\|error\|warn\|info\|debug\)" src \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  -l | grep -v "src/lib/logger.ts" || true)

FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "✅ No files with console statements found!"
  exit 0
fi

echo "📊 Found $FILE_COUNT files with console statements"
echo ""
echo "🔧 Starting migration..."
echo ""

# Counter for processed files
PROCESSED=0

# Process each file
for FILE in $FILES; do
  PROCESSED=$((PROCESSED + 1))
  echo "[$PROCESSED/$FILE_COUNT] Processing: $FILE"

  # Check if file already has logger import
  if grep -q "from '@/lib/logger'" "$FILE"; then
    echo "  ⏭️  Already has logger import"
  else
    # Add logger import at the top (after 'use client' if present)
    if grep -q "'use client'" "$FILE"; then
      # Insert after 'use client'
      sed -i '' "/'use client'/a\\
import { log } from '@/lib/logger';
" "$FILE"
    else
      # Insert at line 1
      sed -i '' "1i\\
import { log } from '@/lib/logger';
" "$FILE"
    fi
    echo "  ✅ Added logger import"
  fi

  # Replace console statements
  sed -i '' 's/console\.log(/log.info(/g' "$FILE"
  sed -i '' 's/console\.error(/log.error(/g' "$FILE"
  sed -i '' 's/console\.warn(/log.warn(/g' "$FILE"
  sed -i '' 's/console\.info(/log.info(/g' "$FILE"
  sed -i '' 's/console\.debug(/log.debug(/g' "$FILE"

  echo "  ✅ Replaced console statements"
  echo ""
done

echo ""
echo "📈 Migration Summary:"
echo "  Total files processed: $PROCESSED"
echo ""
echo "✅ All files migrated!"
echo ""
echo "⚠️  Next steps:"
echo "  1. Run TypeScript check: NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit"
echo "  2. Fix any TypeScript errors"
echo "  3. Run build: npm run build"
echo "  4. Commit changes"
