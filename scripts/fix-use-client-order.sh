#!/bin/bash
set -e

echo "🔍 Finding files with logger import before 'use client'..."

# Find all files that have both logger import and 'use client'
FILES=$(grep -l "^import { log } from '@/lib/logger';" src --include="*.tsx" --include="*.ts" -r 2>/dev/null || true)

FIXED=0

for FILE in $FILES; do
  # Check if file has 'use client' directive
  if grep -q "^['\"]use client['\"]" "$FILE"; then
    # Check if import is before 'use client'
    IMPORT_LINE=$(grep -n "^import { log } from '@/lib/logger';" "$FILE" | cut -d: -f1 | head -1)
    USE_CLIENT_LINE=$(grep -n "^['\"]use client['\"]" "$FILE" | cut -d: -f1 | head -1)

    if [ -n "$IMPORT_LINE" ] && [ -n "$USE_CLIENT_LINE" ] && [ "$IMPORT_LINE" -lt "$USE_CLIENT_LINE" ]; then
      echo "Fixing: $FILE"

      # Remove the logger import line
      sed -i '' "/^import { log } from '@\/lib\/logger';$/d" "$FILE"

      # Add it back after 'use client' directive
      sed -i '' "/^['\"]use client['\"];$/a\\
import { log } from '@/lib/logger';
" "$FILE"

      FIXED=$((FIXED + 1))
    fi
  fi
done

echo "✅ Fixed $FIXED files"
