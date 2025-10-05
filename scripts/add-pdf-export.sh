#!/bin/bash
# Script to add PDF export functionality to a dashboard
# Usage: ./add-pdf-export.sh <dashboard-name>

DASHBOARD=$1
FILE="/Users/eko3/limn-systems-enterprise/src/app/dashboards/${DASHBOARD}/page.tsx"

if [ ! -f "$FILE" ]; then
  echo "Error: Dashboard file not found: $FILE"
  exit 1
fi

echo "Adding PDF export to $DASHBOARD dashboard..."

# 1. Add ExportPDFButton import
if ! grep -q "ExportPDFButton" "$FILE"; then
  sed -i '' "/import { DateRangeSelector }/a\\
import { ExportPDFButton } from '@/components/ExportPDFButton';
" "$FILE"
  echo "  ✓ Added ExportPDFButton import"
else
  echo "  - ExportPDFButton already imported"
fi

# 2. Add PDF button to dashboard-actions
if ! grep -q "ExportPDFButton dashboardName" "$FILE"; then
  # Find the line with RefreshCw button closing tag and add ExportPDFButton after it
  sed -i '' '/<RefreshCw className="h-4 w-4" \/>/,/<\/Button>/{
    /<\/Button>/a\
          <ExportPDFButton dashboardName="PLACEHOLDER Dashboard" dateRange={dateRange} />
  }' "$FILE"
  echo "  ✓ Added ExportPDFButton to dashboard-actions"
else
  echo "  - ExportPDFButton already in dashboard-actions"
fi

# 3. Add export container wrapper
if ! grep -q "dashboard-export-container" "$FILE"; then
  # Add opening div after dashboard-page
  sed -i '' 's/<div className="dashboard-page">/<div className="dashboard-page">\
      <div id="dashboard-export-container">/' "$FILE"

  # Add closing div before final </div>
  # Find the last occurrence of </div> before the closing function brace
  LINE_COUNT=$(wc -l < "$FILE")
  LAST_DIV_LINE=$(grep -n "^  );$" "$FILE" | tail -1 | cut -d: -f1)

  if [ ! -z "$LAST_DIV_LINE" ]; then
    sed -i '' "${LAST_DIV_LINE}i\\
      </div>
" "$FILE"
    echo "  ✓ Added export container wrapper"
  fi
else
  echo "  - Export container already exists"
fi

echo "Done! Please manually update dashboard name in ExportPDFButton."
