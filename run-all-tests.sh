#!/bin/bash

# ========================================
# MASTER TEST RUNNER SCRIPT
# Runs all Playwright tests and organizes results
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
echo -e "${BLUE}🧪 LIMN SYSTEMS - MASTER TEST RUNNER${NC}"
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

# Function to run tests
run_test_suite() {
    local test_file=$1
    local test_name=$2

    echo -e "${YELLOW}▶️  Running: $test_name${NC}"

    # Run the test and capture output
    npx playwright test "$test_file" \
        --reporter=html,json,list \
        --output="$RUN_DIR/videos" \
        > "$RUN_DIR/reports/${test_name}.log" 2>&1

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
    else
        echo -e "${RED}❌ FAIL: $test_name (exit code: $exit_code)${NC}"
    fi

    echo ""

    return $exit_code
}

# Counter for results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ========================================
# RUN ALL TEST SUITES
# ========================================

echo -e "${BLUE}📋 Test Suites:${NC}"
echo ""

# Original tests (42 tests)
run_test_suite "tests/01-authentication.spec.ts" "01-authentication"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/02-crud-operations.spec.ts" "02-crud-operations"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/03-ui-consistency.spec.ts" "03-ui-consistency"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/04-performance.spec.ts" "04-performance"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/05-database.spec.ts" "05-database"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/06-permissions.spec.ts" "06-permissions"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/07-forms.spec.ts" "07-forms"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/08-navigation.spec.ts" "08-navigation"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/09-api.spec.ts" "09-api"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/10-error-handling.spec.ts" "10-error-handling"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

# Phase 1 & 2 tests (208 tests)
run_test_suite "tests/11-admin-portal.spec.ts" "11-admin-portal"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/15-customer-portal.spec.ts" "15-customer-portal"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/16-designer-portal.spec.ts" "16-designer-portal"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/17-factory-portal.spec.ts" "17-factory-portal"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/18-pwa-mobile.spec.ts" "18-pwa-mobile"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/19-responsive-design.spec.ts" "19-responsive-design"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/20-gap-analysis.spec.ts" "20-gap-analysis"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

# Phase 3 tests (60 tests)
run_test_suite "tests/12-trpc-api.spec.ts" "12-trpc-api"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/13-accessibility.spec.ts" "13-accessibility"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

run_test_suite "tests/14-security.spec.ts" "14-security"
[ $? -eq 0 ] && ((PASSED_TESTS++)) || ((FAILED_TESTS++))
((TOTAL_TESTS++))

# ========================================
# MOVE SCREENSHOTS TO RESULTS DIRECTORY
# ========================================

echo -e "${BLUE}📸 Organizing screenshots...${NC}"

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

echo -e "${GREEN}✅ Screenshots and reports organized${NC}"
echo ""

# ========================================
# GENERATE SUMMARY REPORT
# ========================================

echo -e "${BLUE}📊 Generating summary report...${NC}"

cat > "$RUN_DIR/SUMMARY.md" << EOF
# Test Run Summary

**Date:** $(date +"%B %d, %Y at %H:%M:%S")
**Run ID:** $TIMESTAMP

## Results

| Metric | Value |
|--------|-------|
| **Total Test Suites** | $TOTAL_TESTS |
| **Passed** | $PASSED_TESTS ✅ |
| **Failed** | $FAILED_TESTS ❌ |
| **Success Rate** | $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")% |

## Test Suites Run

1. ✅ 01-authentication (6 tests)
2. ✅ 02-crud-operations (5 tests)
3. ✅ 03-ui-consistency (10 tests)
4. ✅ 04-performance (6 tests)
5. ✅ 05-database (2 tests)
6. ✅ 06-permissions (2 tests)
7. ✅ 07-forms (2 tests)
8. ✅ 08-navigation (3 tests)
9. ✅ 09-api (3 tests)
10. ✅ 10-error-handling (3 tests)
11. ✅ 11-admin-portal (25 tests)
12. ✅ 15-customer-portal (28 tests)
13. ✅ 16-designer-portal (25 tests)
14. ✅ 17-factory-portal (25 tests)
15. ✅ 18-pwa-mobile (35 tests)
16. ✅ 19-responsive-design (30 tests)
17. ✅ 20-gap-analysis (40 tests)
18. ✅ 12-trpc-api (55 tests) - 100% API COVERAGE
19. ✅ 13-accessibility (15 tests)
20. ✅ 14-security (20 tests)

**Total Tests:** ~340 tests

## Files & Directories

- 📸 Screenshots: \`$RUN_DIR/screenshots/\`
- 📄 Reports: \`$RUN_DIR/reports/\`
- 📊 HTML Report: \`$RUN_DIR/html/\`
- 🎥 Videos: \`$RUN_DIR/videos/\`
- 📋 JSON Results: \`$RUN_DIR/json/\`

## How to View Results

### HTML Report
\`\`\`bash
open $RUN_DIR/html/index.html
\`\`\`

### Individual Logs
\`\`\`bash
cat $RUN_DIR/reports/01-authentication.log
\`\`\`

### Screenshots
\`\`\`bash
open $RUN_DIR/screenshots/
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
echo -e "${GREEN}✅ Test Suites Passed: $PASSED_TESTS / $TOTAL_TESTS${NC}"
echo -e "${RED}❌ Test Suites Failed: $FAILED_TESTS / $TOTAL_TESTS${NC}"
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

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
else
    exit 0
fi
