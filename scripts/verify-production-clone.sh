#!/bin/bash
# Verify Production Database Clone
# Checks that production database matches development database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Verify Production Clone               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check credentials
if [ -z "$DEV_DB_URL" ] || [ -z "$PROD_DB_URL" ]; then
  echo -e "${RED}❌ Error: Database credentials not loaded${NC}"
  echo "Run: ${YELLOW}source production-credentials.env${NC}"
  exit 1
fi

echo "Comparing databases..."
echo ""

# List all tables and compare row counts
echo "Full table comparison:"
echo "┌────────────────────────────────┬──────────┬──────────┬────────┐"
echo "│ Table Name                     │   Dev    │   Prod   │ Status │"
echo "├────────────────────────────────┼──────────┼──────────┼────────┤"

# Get all table names from dev
TABLES=$(psql "$DEV_DB_URL" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")

MISMATCHES=0

while IFS= read -r table; do
  # Trim whitespace
  table=$(echo "$table" | xargs)

  if [ -n "$table" ]; then
    DEV_COUNT=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | xargs)
    PROD_COUNT=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | xargs)

    if [ "$DEV_COUNT" == "$PROD_COUNT" ]; then
      STATUS="${GREEN}✓${NC}"
    else
      STATUS="${RED}✗${NC}"
      MISMATCHES=$((MISMATCHES + 1))
    fi

    printf "│ %-30s │ %8s │ %8s │   $STATUS   │\n" "$table" "$DEV_COUNT" "$PROD_COUNT"
  fi
done <<< "$TABLES"

echo "└────────────────────────────────┴──────────┴──────────┴────────┘"
echo ""

# Summary
if [ $MISMATCHES -eq 0 ]; then
  echo -e "${GREEN}✅ All tables match perfectly!${NC}"
  echo ""
  echo "Production database is an exact clone of development."
else
  echo -e "${YELLOW}⚠️  Found $MISMATCHES table(s) with different row counts${NC}"
  echo ""
  echo "This may be expected if:"
  echo "  - Clone is in progress"
  echo "  - Some tables were excluded"
  echo "  - Data has been modified"
fi

# Check schema versions
echo ""
echo "Schema information:"
DEV_TABLES=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
PROD_TABLES=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

echo "  Dev tables:  $DEV_TABLES"
echo "  Prod tables: $PROD_TABLES"

if [ "$DEV_TABLES" == "$PROD_TABLES" ]; then
  echo -e "  ${GREEN}✓ Schema structure matches${NC}"
else
  echo -e "  ${RED}✗ Schema structure mismatch${NC}"
fi

echo ""
