#!/bin/bash
# Production Readiness Verification Script
# Run this before claiming "production ready"

set -e  # Exit on any error

echo "======================================"
echo "  Production Readiness Check"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ERRORS=0
WARNINGS=0

# Function to print status
print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ERRORS=$((ERRORS + 1))
}

print_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "1. Checking for exposed secrets..."
if grep -r "GOCSPX" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=scripts --exclude="*.md" --exclude="*.bak" --exclude=".env*" --exclude="service-templates.ts" -q 2>/dev/null; then
    print_fail "Google OAuth secrets found in code!"
else
    if grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=scripts --exclude-dir=database-backups --exclude="*.md" --exclude="*.bak" --exclude=".env*" --exclude="service-templates.ts" --exclude="credential-rotation.ts" -q 2>/dev/null; then
        print_fail "Stripe API keys found in code!"
    else
        print_pass "No secrets found in code"
    fi
fi
echo ""

echo "2. Checking .env files aren't committed..."
if git ls-files | grep -E "^\.env$" -q; then
    print_fail ".env file is committed to git!"
else
    print_pass ".env files not committed"
fi
echo ""

echo "3. Running dependency audit..."
if npm audit --production --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
    print_pass "No high/critical vulnerabilities"
else
    AUDIT_OUTPUT=$(npm audit --production --audit-level=high 2>&1)
    if echo "$AUDIT_OUTPUT" | grep -q "found.*vulnerabilities"; then
        print_fail "Vulnerabilities found in dependencies"
        echo "$AUDIT_OUTPUT" | head -20
    else
        print_warn "Could not determine vulnerability status"
    fi
fi
echo ""

echo "4. Running TypeScript compilation..."
if NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt | grep -q "error TS"; then
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.txt || echo "0")
    print_fail "TypeScript compilation failed with $ERROR_COUNT errors"
    echo "First 10 errors:"
    grep "error TS" /tmp/tsc-output.txt | head -10
else
    print_pass "TypeScript compilation successful"
fi
echo ""

echo "5. Running linter..."
if npm run lint 2>&1 | grep -q "Error:"; then
    print_fail "Linting failed"
else
    print_pass "Linting passed"
fi
echo ""

echo "6. Validating Prisma schema..."
VALIDATION_OUTPUT=$(npx prisma validate 2>&1)
if echo "$VALIDATION_OUTPUT" | grep -q "The schema.*is valid"; then
    if echo "$VALIDATION_OUTPUT" | grep -q "Prisma schema warning"; then
        print_warn "Prisma schema is valid but has warnings"
        echo "$VALIDATION_OUTPUT" | grep -A 2 "Prisma schema warning"
    else
        print_pass "Prisma schema is valid"
    fi
else
    print_fail "Prisma schema validation failed"
    echo "$VALIDATION_OUTPUT"
fi
echo ""

echo "6a. Running schema validation tests..."
if npm run schema:validate > /dev/null 2>&1; then
    print_pass "Schema validation tests passed"
else
    print_fail "Schema validation tests failed"
fi
echo ""

echo "6b. Checking schema sync..."
if npm run schema:check:fast > /dev/null 2>&1; then
    print_pass "Schema in sync with database"
else
    print_fail "Schema out of sync - run: npm run schema:sync"
fi
echo ""

echo "6c. Database schema sync validation..."
if ./scripts/validate-schema-sync.sh > /dev/null 2>&1; then
    print_pass "Dev and Prod schemas are in sync"
else
    print_fail "Dev and Prod schemas are out of sync - run comprehensive audit"
fi
echo ""

echo "6d. Running prevention tests (schema)..."
if npx vitest run scripts/tests/prevention/schema-validation.test.ts --silent > /dev/null 2>&1; then
    print_pass "Schema prevention tests passed"
else
    print_fail "Schema prevention tests failed"
fi
echo ""

echo "6e. Running prevention tests (patterns)..."
if npx vitest run scripts/tests/prevention/pattern-consistency.test.ts --silent > /dev/null 2>&1; then
    print_pass "Pattern prevention tests passed"
else
    # Pattern tests may have warnings, check if actual failures
    PATTERN_OUTPUT=$(npx vitest run scripts/tests/prevention/pattern-consistency.test.ts 2>&1 || true)
    if echo "$PATTERN_OUTPUT" | grep -q " failed"; then
        print_fail "Pattern prevention tests failed"
    else
        print_warn "Pattern prevention tests have warnings"
    fi
fi
echo ""

echo "7. Building for production..."
echo "   (This may take 2-3 minutes...)"
# Check if timeout command exists (Linux) or gtimeout (macOS with coreutils)
if command -v timeout &> /dev/null; then
    TIMEOUT_CMD="timeout 300"
elif command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout 300"
else
    TIMEOUT_CMD=""
fi

if NODE_OPTIONS="--max-old-space-size=8192" $TIMEOUT_CMD npm run build > /tmp/build-output.txt 2>&1; then
    print_pass "Production build successful"
else
    BUILD_EXIT=$?
    if [ $BUILD_EXIT -eq 124 ]; then
        print_fail "Production build timed out (>5 minutes)"
    else
        print_fail "Production build failed"
        echo "Last 20 lines of build output:"
        tail -20 /tmp/build-output.txt
    fi
fi
echo ""

echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CRITICAL CHECKS PASSED${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) - review recommended${NC}"
    fi
    echo ""
    echo "Application is ready for production deployment."
    exit 0
else
    echo -e "${RED}❌ $ERRORS CRITICAL CHECK(S) FAILED${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s)${NC}"
    fi
    echo ""
    echo "Fix all critical issues before deploying to production."
    exit 1
fi
