#!/bin/bash

# OVERNIGHT TESTING PROGRESS MONITOR
# Usage: ./check-overnight-progress.sh

echo "🌙 OVERNIGHT TESTING PROGRESS MONITOR"
echo "======================================"
echo ""

# Check if overnight tests are running
PROCESS_COUNT=$(ps aux | grep -E "run-overnight-tests|test:overnight" | grep -v grep | wc -l)

if [ "$PROCESS_COUNT" -gt 0 ]; then
    echo "✅ Overnight tests are RUNNING"
    echo ""

    # Show running processes
    echo "Active Processes:"
    ps aux | grep -E "run-overnight-tests|test:overnight|playwright test|npm run test" | grep -v grep | head -10
    echo ""

    # Check for report files
    DOCS_DIR="../limn-systems-enterprise-docs/02-TESTING"

    echo "Test Reports Generated:"
    ls -lht "$DOCS_DIR/CRITICAL-TESTS/reports/" 2>/dev/null | head -5
    echo ""

    ls -lht "$DOCS_DIR/FUNCTIONAL-TESTING/reports/" 2>/dev/null | head -5
    echo ""

    ls -lht "$DOCS_DIR/CONSOLE-ERROR-AUDITING/reports/" 2>/dev/null | head -5
    echo ""

    # Check for overnight reports
    if [ -d "$DOCS_DIR/OVERNIGHT-REPORTS" ]; then
        echo "Overnight Reports:"
        ls -lht "$DOCS_DIR/OVERNIGHT-REPORTS/" | grep "overnight-report" | head -1
    fi

else
    echo "⏸️  Overnight tests are NOT running"
    echo ""

    # Check for completed reports
    DOCS_DIR="../limn-systems-enterprise-docs/02-TESTING/OVERNIGHT-REPORTS"

    if [ -d "$DOCS_DIR" ]; then
        LATEST_REPORT=$(ls -t "$DOCS_DIR"/overnight-report-*.md 2>/dev/null | head -1)

        if [ -n "$LATEST_REPORT" ]; then
            echo "✅ Latest overnight report found:"
            echo "   $LATEST_REPORT"
            echo ""
            echo "To view:"
            echo "   cat \"$LATEST_REPORT\""
        else
            echo "❌ No overnight reports found yet"
            echo ""
            echo "To start overnight tests:"
            echo "   npm run test:overnight"
        fi
    fi
fi

echo ""
echo "======================================"
echo "💡 Commands:"
echo "   npm run test:overnight          - Start overnight tests"
echo "   ./check-overnight-progress.sh   - Check progress (this script)"
echo "   tail -f playwright-report/      - Watch Playwright logs"
echo ""
