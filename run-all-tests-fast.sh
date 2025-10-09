#!/bin/bash

# ========================================
# FAST TEST RUNNER - Runs all tests in parallel
# ========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp for this test run
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Base directories
DOCS_DIR="/Users/eko3/limn-systems-enterprise-docs"
RESULTS_DIR="$DOCS_DIR/02-TESTING/test-results"
RUN_DIR="$RESULTS_DIR/run-$TIMESTAMP"

# Create directories for this test run
mkdir -p "$RUN_DIR"/{screenshots,reports,json,html,videos}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 LIMN SYSTEMS - FAST TEST RUNNER${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}📅 Test Run: $TIMESTAMP${NC}"
echo -e "${GREEN}📁 Results Directory: $RUN_DIR${NC}"
echo ""

# Check if dev server is running
echo -e "${YELLOW}🔍 Checking if dev server is running...${NC}"
if ! curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: Dev server not running on http://localhost:3000${NC}"
    echo -e "${YELLOW}Please start the dev server first:${NC}"
    echo -e "${YELLOW}   npm run dev${NC}"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Dev server is running${NC}"
echo ""

# ========================================
# RUN ALL TESTS IN PARALLEL
# ========================================

echo -e "${BLUE}🚀 Running all test suites (using 3 parallel workers)...${NC}"
echo ""

# Run ALL tests at once - Playwright will handle parallelization
npx playwright test \
    --reporter=html,json,list \
    --output="$RUN_DIR/videos" \
    > "$RUN_DIR/reports/all-tests.log" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
else
    echo -e "${RED}❌ SOME TESTS FAILED (exit code: $EXIT_CODE)${NC}"
fi

echo ""

# ========================================
# ORGANIZE RESULTS
# ========================================

echo -e "${BLUE}📸 Organizing results...${NC}"

# Move screenshots if they exist
if [ -d "test-results" ]; then
    cp -r test-results/screenshots/* "$RUN_DIR/screenshots/" 2>/dev/null || true
fi

# Move Playwright HTML report if it exists
if [ -d "playwright-report" ]; then
    cp -r playwright-report/* "$RUN_DIR/html/" 2>/dev/null || true
fi

# Move JSON results if they exist
if [ -f "test-results.json" ]; then
    cp test-results.json "$RUN_DIR/json/test-results.json" 2>/dev/null || true
fi

echo -e "${GREEN}✅ Results organized${NC}"
echo ""

# ========================================
# GENERATE SUMMARY REPORT
# ========================================

echo -e "${BLUE}📊 Generating summary report...${NC}"

cat > "$RUN_DIR/SUMMARY.md" << EOF
# Fast Test Run Summary

**Date:** $(date +"%B %d, %Y at %H:%M:%S")
**Run ID:** $TIMESTAMP

## Results

All tests run in parallel using 3 workers for maximum speed.

Exit Code: $EXIT_CODE
- 0 = All passed ✅
- Non-zero = Some failed ❌

## Test Suites

Total: 20 test suites, ~340 tests

### Original Tests (42 tests)
- 01-authentication
- 02-crud-operations
- 03-ui-consistency
- 04-performance
- 05-database
- 06-permissions
- 07-forms
- 08-navigation
- 09-api
- 10-error-handling

### Portal Tests (103 tests)
- 11-admin-portal
- 15-customer-portal
- 16-designer-portal
- 17-factory-portal

### Advanced Tests (105 tests)
- 18-pwa-mobile
- 19-responsive-design
- 20-gap-analysis

### Security Tests (90 tests)
- 12-trpc-api
- 13-accessibility
- 14-security

## Files & Directories

- 📸 Screenshots: \`$RUN_DIR/screenshots/\`
- 📄 Logs: \`$RUN_DIR/reports/all-tests.log\`
- 📊 HTML Report: \`$RUN_DIR/html/\`
- 🎥 Videos: \`$RUN_DIR/videos/\`
- 📋 JSON Results: \`$RUN_DIR/json/\`

## View Results

### HTML Report
\`\`\`bash
open $RUN_DIR/html/index.html
\`\`\`

### Test Log
\`\`\`bash
cat $RUN_DIR/reports/all-tests.log
\`\`\`

---

**Run completed at:** $(date +"%H:%M:%S")
EOF

echo -e "${GREEN}✅ Summary report generated: $RUN_DIR/SUMMARY.md${NC}"
echo ""

# ========================================
# CREATE LATEST SYMLINK
# ========================================

echo -e "${BLUE}🔗 Creating 'latest' symlink...${NC}"

# Remove old symlink if exists
rm -f "$RESULTS_DIR/latest"

# Create new symlink
ln -s "$RUN_DIR" "$RESULTS_DIR/latest"

echo -e "${GREEN}✅ Symlink created: $RESULTS_DIR/latest${NC}"
echo ""

# ========================================
# FINAL SUMMARY
# ========================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 TEST RUN COMPLETE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📁 Results Location:${NC}"
echo -e "   $RUN_DIR"
echo ""
echo -e "${YELLOW}🔗 Quick Access:${NC}"
echo -e "   $RESULTS_DIR/latest"
echo ""
echo -e "${YELLOW}📖 View Summary:${NC}"
echo -e "   cat $RUN_DIR/SUMMARY.md"
echo ""
echo -e "${YELLOW}🌐 View HTML Report:${NC}"
echo -e "   open $RUN_DIR/html/index.html"
echo ""
echo -e "${BLUE}========================================${NC}"

# Exit with same code as tests
exit $EXIT_CODE
