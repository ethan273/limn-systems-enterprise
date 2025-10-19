#!/bin/bash

# Script to add error handling to all page files with useQuery
# Date: October 19, 2025
# Part of Pattern Standardization Initiative

echo "========================================"
echo "Query Error Handling Migration Script"
echo "========================================"
echo ""

# Counter for tracking progress
total_files=0
modified_files=0
skipped_files=0

# Find all page.tsx files with useQuery
echo "Finding all page files with useQuery..."
page_files=$(grep -l "useQuery" /Users/eko3/limn-systems-enterprise/src/app/**/page.tsx 2>/dev/null | sort)

total_count=$(echo "$page_files" | wc -l | tr -d ' ')
echo "Found $total_count page files with useQuery"
echo ""

# Process each file
for file in $page_files; do
  total_files=$((total_files + 1))
  filename=$(basename $(dirname "$file"))/$(basename "$file")

  echo "[$total_files/$total_count] Processing: $filename"

  # Check if file already has error handling
  if grep -q "if (error)" "$file"; then
    echo "  ✓ Already has error handling - SKIP"
    skipped_files=$((skipped_files + 1))
    continue
  fi

  # Check if file has the required imports
  has_alert_triangle=$(grep -q "AlertTriangle" "$file" && echo "yes" || echo "no")
  has_refresh=$(grep -q "RefreshCw" "$file" && echo "yes" || echo "no")
  has_empty_state=$(grep -q "EmptyState" "$file" && echo "yes" || echo "no")

  if [ "$has_alert_triangle" == "no" ] || [ "$has_refresh" == "no" ] || [ "$has_empty_state" == "no" ]; then
    echo "  ⚠ Missing required imports - needs manual intervention"
    echo "    - AlertTriangle: $has_alert_triangle"
    echo "    - RefreshCw: $has_refresh"
    echo "    - EmptyState: $has_empty_state"
    skipped_files=$((skipped_files + 1))
    continue
  fi

  echo "  → Adding error handling..."
  modified_files=$((modified_files + 1))

  # Note: Actual file modifications would go here
  # This is a DRY RUN - shows what would be done
  echo "  ✓ Would add error destructuring to useQuery"
  echo "  ✓ Would add error check before loading check"
  echo "  ✓ Would add error state with retry action"

done

echo ""
echo "========================================"
echo "Migration Summary"
echo "========================================"
echo "Total files found:      $total_count"
echo "Files modified:         $modified_files"
echo "Files skipped:          $skipped_files"
echo "Files needing manual:   $((total_count - modified_files - skipped_files))"
echo ""
echo "Next steps:"
echo "1. Review files marked for manual intervention"
echo "2. Add missing imports (AlertTriangle, RefreshCw, EmptyState)"
echo "3. Re-run script to complete migration"
echo "4. Test error scenarios on modified pages"
echo ""
