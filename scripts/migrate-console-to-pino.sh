#!/bin/bash

# Pino Logger Migration Script
# Migrates all console.log/error/warn/info/debug statements to Pino logger
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
ERRORS=0

# Process each file
for FILE in $FILES; do
  PROCESSED=$((PROCESSED + 1))
  echo "[$PROCESSED/$FILE_COUNT] Processing: $FILE"

  # Check if file already has logger import
  if grep -q "from '@/lib/logger'" "$FILE"; then
    echo "  ⏭️  Already has logger import, skipping import addition"
    HAS_IMPORT=true
  else
    HAS_IMPORT=false
  fi

  # Backup original file
  cp "$FILE" "$FILE.bak"

  # Add logger import if not present
  if [ "$HAS_IMPORT" = false ]; then
    # Check if it's a React component (has 'use client' or JSX)
    if grep -q "'use client'" "$FILE" || grep -q "^import.*React" "$FILE"; then
      # It's a client component, add import after 'use client'
      if grep -q "'use client'" "$FILE"; then
        sed -i '' "/'use client'/a\\
import { log } from '@/lib/logger';\\
" "$FILE"
      else
        # Add at top after first import
        sed -i '' "1a\\
import { log } from '@/lib/logger';\\
" "$FILE"
      fi
    else
      # Server-side file, add at top
      sed -i '' "1i\\
import { log } from '@/lib/logger';\\
" "$FILE"
    fi
    echo "  ✅ Added logger import"
  fi

  # Replace console.log with log.info
  sed -i '' 's/console\.log(/log.info(/g' "$FILE"

  # Replace console.error with log.error
  sed -i '' 's/console\.error(/log.error(/g' "$FILE"

  # Replace console.warn with log.warn
  sed -i '' 's/console\.warn(/log.warn(/g' "$FILE"

  # Replace console.info with log.info
  sed -i '' 's/console\.info(/log.info(/g' "$FILE"

  # Replace console.debug with log.debug
  sed -i '' 's/console\.debug(/log.debug(/g' "$FILE"

  echo "  ✅ Replaced console statements"

  # Verify syntax (quick TypeScript check)
  if npx tsc --noEmit "$FILE" 2>/dev/null; then
    rm "$FILE.bak"
    echo "  ✅ Syntax validated"
  else
    echo "  ⚠️  TypeScript errors detected, restoring backup"
    mv "$FILE.bak" "$FILE"
    ERRORS=$((ERRORS + 1))
  fi

  echo ""
done

echo ""
echo "📈 Migration Summary:"
echo "  Total files processed: $PROCESSED"
echo "  Successful: $((PROCESSED - ERRORS))"
echo "  Errors: $ERRORS"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo "⚠️  Some files had errors and were not migrated"
  echo "   Please review the errors above and fix manually"
  exit 1
else
  echo "✅ All files migrated successfully!"
fi
