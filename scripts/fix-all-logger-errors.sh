#!/bin/bash

# Fix all TypeScript logger errors
# This script wraps error/string arguments in objects

set -e

echo "🔧 Fixing all logger TypeScript errors..."

# Get unique list of files with errors
FILES=$(grep "error TS" /tmp/typescript-errors.log | sed 's/(.*//' | sort -u)

FIXED_COUNT=0

for FILE in $FILES; do
  if [[ -f "$FILE" ]]; then
    echo "  Fixing: $FILE"

    # Pattern 1: log.X('message', error) where error is unknown -> log.X('message', { error })
    perl -i -pe 's/log\.(error|warn|info|debug)\(([^,]+),\s*error\s*\)/log.$1($2, { error })/g' "$FILE"

    # Pattern 2: log.X('message', err) where err is unknown -> log.X('message', { error: err })
    perl -i -pe 's/log\.(error|warn|info|debug)\(([^,]+),\s*err\s*\)/log.$1($2, { error: err })/g' "$FILE"

    # Pattern 3: log.X('message', e) where e is unknown -> log.X('message', { error: e })
    perl -i -pe 's/log\.(error|warn|info|debug)\(([^,]+),\s*e\s*\)/log.$1($2, { error: e })/g' "$FILE"

    # Pattern 4: log.X('message', 'string') -> log.X('message', { details: 'string' })
    perl -i -pe "s/log\\.(error|warn|info|debug)\\(([^,]+),\\s*'([^']+)'\\s*\\)/log.\$1(\$2, { details: '\$3' })/g" "$FILE"
    perl -i -pe 's/log\.(error|warn|info|debug)\(([^,]+),\s*"([^"]+)"\s*\)/log.$1($2, { details: "$3" })/g' "$FILE"

    # Pattern 5: log.X('message', variable) where variable is string -> log.X('message', { details: variable })
    # This is more complex, will handle specific cases below

    FIXED_COUNT=$((FIXED_COUNT + 1))
  fi
done

echo "✅ Fixed patterns in $FIXED_COUNT files"
echo "⚠️  Some complex patterns may need manual review"
