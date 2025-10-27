#!/bin/bash

###############################################################################
# PRE-COMMIT PREVENTION CHECKS
#
# Purpose: Run prevention tests BEFORE allowing commit
# Priority: CRITICAL - Blocks commits with violations
#
# Checks:
# 1. Schema validation (orphaned tables, drift)
# 2. Pattern consistency (RBAC, auth, security)
# 3. Type safety (TypeScript errors)
# 4. Security scan (exposed secrets)
#
# Usage:
#   ./scripts/pre-commit-prevention.sh
#   git config core.hooksPath scripts/git-hooks  # To install as hook
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed (blocks commit)
###############################################################################

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🛡️  PRE-COMMIT PREVENTION CHECKS${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

###############################################################################
# CHECK 1: Schema Validation
###############################################################################
echo "${BLUE}[1/5]${NC} Schema Validation..."

if npm run schema:validate --silent 2>&1 | grep -q "✅"; then
  echo "${GREEN}✅ Schema validation passed${NC}"
  ((CHECKS_PASSED++))
else
  echo "${RED}❌ Schema validation failed${NC}"
  echo "${YELLOW}   Run: npm run schema:validate${NC}"
  ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 2: Schema Sync Check
###############################################################################
echo "${BLUE}[2/5]${NC} Schema Sync Check..."

if npm run schema:check:fast --silent 2>&1 | grep -q "✅"; then
  echo "${GREEN}✅ Schema in sync${NC}"
  ((CHECKS_PASSED++))
else
  echo "${RED}❌ Schema out of sync${NC}"
  echo "${YELLOW}   Run: npm run schema:sync${NC}"
  ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 3: Prevention Tests - Schema
###############################################################################
echo "${BLUE}[3/5]${NC} Prevention Tests (Schema)..."

if npx vitest run scripts/tests/prevention/schema-validation.test.ts --silent 2>&1 | grep -q "pass"; then
  echo "${GREEN}✅ Schema prevention tests passed${NC}"
  ((CHECKS_PASSED++))
else
  echo "${RED}❌ Schema prevention tests failed${NC}"
  echo "${YELLOW}   Run: npm test -- scripts/tests/prevention/schema-validation.test.ts${NC}"
  ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 4: Prevention Tests - Patterns
###############################################################################
echo "${BLUE}[4/5]${NC} Prevention Tests (Patterns)..."

if npx vitest run scripts/tests/prevention/pattern-consistency.test.ts --silent 2>&1 | grep -q "pass"; then
  echo "${GREEN}✅ Pattern prevention tests passed${NC}"
  ((CHECKS_PASSED++))
else
  echo "${YELLOW}⚠️  Pattern prevention tests have warnings${NC}"
  echo "${YELLOW}   Review: npm test -- scripts/tests/prevention/pattern-consistency.test.ts${NC}"
  ((CHECKS_WARNED++))
  # Don't block commit for pattern warnings
fi

echo ""

###############################################################################
# CHECK 5: Security Scan (Exposed Secrets)
###############################################################################
echo "${BLUE}[5/5]${NC} Security Scan (Exposed Secrets)..."

# Check for common secret patterns
EXPOSED_SECRETS=0

# Check for database URLs
if git diff --cached | grep -E "postgresql://.*:[^@]+@" > /dev/null 2>&1; then
  echo "${RED}❌ CRITICAL: Database URL with credentials detected${NC}"
  ((EXPOSED_SECRETS++))
fi

# Check for API keys
if git diff --cached | grep -E "(api_key|apiKey|API_KEY)\s*=\s*['\"][a-zA-Z0-9_-]{32,}['\"]" > /dev/null 2>&1; then
  echo "${RED}❌ CRITICAL: API key detected${NC}"
  ((EXPOSED_SECRETS++))
fi

# Check for Resend keys
if git diff --cached | grep -E "re_[a-zA-Z0-9_-]{32,}" > /dev/null 2>&1; then
  echo "${RED}❌ CRITICAL: Resend API key detected${NC}"
  ((EXPOSED_SECRETS++))
fi

# Check for Google OAuth
if git diff --cached | grep -E "GOOGLE_.*_SECRET.*=.*[a-zA-Z0-9_-]{32,}" > /dev/null 2>&1; then
  echo "${RED}❌ CRITICAL: Google OAuth secret detected${NC}"
  ((EXPOSED_SECRETS++))
fi

if [ $EXPOSED_SECRETS -gt 0 ]; then
  echo "${RED}❌ Security scan failed: $EXPOSED_SECRETS secret(s) exposed${NC}"
  echo "${YELLOW}   Remove secrets from staged files before committing${NC}"
  ((CHECKS_FAILED++))
else
  echo "${GREEN}✅ No exposed secrets detected${NC}"
  ((CHECKS_PASSED++))
fi

echo ""

###############################################################################
# SUMMARY
###############################################################################
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📊 PREVENTION CHECK SUMMARY${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  ${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo "  ${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo "  ${YELLOW}⚠️  Warnings: $CHECKS_WARNED${NC}"
echo ""

if [ $CHECKS_FAILED -gt 0 ]; then
  echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${RED}❌ COMMIT BLOCKED${NC}"
  echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "${YELLOW}Fix the issues above before committing.${NC}"
  echo ""
  exit 1
else
  echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${GREEN}✅ ALL CHECKS PASSED - READY TO COMMIT${NC}"
  echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [ $CHECKS_WARNED -gt 0 ]; then
    echo "${YELLOW}⚠️  Note: $CHECKS_WARNED warning(s) - review recommended but not blocking${NC}"
    echo ""
  fi

  exit 0
fi
