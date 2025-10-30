#!/bin/bash
set -e

echo "🔧 Fixing Pino logger signatures in all migrated files..."

# Get all TypeScript errors to find affected files
FILES=$(NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit 2>&1 | grep "^src/" | cut -d'(' -f1 | sort -u)

FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "✅ No TypeScript errors found!"
  exit 0
fi

echo "📊 Found $FILE_COUNT files with logger signature errors"
echo "🔧 Applying fixes..."

PROCESSED=0

for FILE in $FILES; do
  if [ ! -f "$FILE" ]; then
    continue
  fi

  PROCESSED=$((PROCESSED + 1))
  echo "[$PROCESSED/$FILE_COUNT] Fixing: $FILE"

  # Create a backup
  cp "$FILE" "$FILE.backup"

  # Use Node.js to do sophisticated replacements
  node -e "
    const fs = require('fs');
    const filePath = process.argv[1];
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;

    // Pattern 1: log.level('message', error) where error is not wrapped
    // Replace log.error('message', error) with log.error('message', { error })
    content = content.replace(
      /log\.(error|warn|info|debug)\(([^,)]+),\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g,
      (match, level, message, varName) => {
        // Skip if already wrapped in object or if it looks like it's already an object
        if (varName.includes('{') || varName.includes(':')) {
          return match;
        }
        changes++;
        return \`log.\${level}(\${message}, { \${varName} })\`;
      }
    );

    // Pattern 2: log.level('message', string_literal)
    // Replace log.info('msg', 'value') with log.info('msg value')
    content = content.replace(
      /log\.(error|warn|info|debug)\(([^,)]+),\s*('[^']*'|\"[^\"]*\")\s*\)/g,
      (match, level, message, literal) => {
        changes++;
        // Remove quotes from message if present, combine, re-quote
        const msg = message.trim().replace(/^['\""]/, '').replace(/['\"]$/, '');
        const lit = literal.trim().replace(/^['\""]/, '').replace(/['\"]$/, '');
        return \`log.\${level}('\${msg} \${lit}')\`;
      }
    );

    // Pattern 3: log.level(message, var1, var2, ...) - multiple args
    // This is complex - need to identify and wrap remaining args
    content = content.replace(
      /log\.(error|warn|info|debug)\(([^)]+)\)/g,
      (match, level, args) => {
        // Count commas to see if we have more than 2 arguments
        const argList = args.split(',').map(a => a.trim());

        if (argList.length <= 2) {
          return match; // Already handled or correct
        }

        changes++;
        const message = argList[0];
        const restArgs = argList.slice(1);

        // Try to intelligently create metadata object
        const metadataEntries = restArgs.map((arg, idx) => {
          // If arg looks like a variable name, use it
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg)) {
            return arg;
          }
          // Otherwise create a numbered entry
          return \`arg\${idx + 1}: \${arg}\`;
        });

        return \`log.\${level}(\${message}, { \${metadataEntries.join(', ')} })\`;
      }
    );

    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(\`  ✅ Applied \${changes} fixes\`);
    } else {
      console.log('  ⏭️  No automatic fixes applicable');
    }
  " "$FILE"

  # Remove backup if successful
  rm "$FILE.backup"
  echo ""
done

echo "✅ Automatic fixes complete!"
echo ""
echo "⚠️  Running TypeScript check to see remaining errors..."
echo ""

# Check remaining errors
REMAINING=$(NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit 2>&1 | grep "^src/" | wc -l | tr -d ' ')

echo ""
echo "📊 Remaining TypeScript errors: $REMAINING"

if [ "$REMAINING" -eq 0 ]; then
  echo "✅ All logger signature errors fixed!"
else
  echo "⚠️  Some errors remain - manual inspection needed"
  echo ""
  echo "Saving error report to /tmp/remaining-logger-errors.log"
  NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit 2>&1 | grep "^src/" > /tmp/remaining-logger-errors.log
fi
