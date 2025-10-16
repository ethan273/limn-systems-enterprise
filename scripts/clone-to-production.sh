#!/bin/bash
# Clone Development Database to Production
# This script clones your dev database (with test data) to production for team testing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Clone Dev → Production Database      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check that credentials are loaded
if [ -z "$DEV_DB_URL" ] || [ -z "$PROD_DB_URL" ]; then
  echo -e "${RED}❌ Error: Database credentials not loaded${NC}"
  echo ""
  echo "Please run this first:"
  echo -e "${YELLOW}  source production-credentials.env${NC}"
  echo ""
  exit 1
fi

# Confirm before proceeding
echo -e "${YELLOW}⚠️  WARNING: This will overwrite ALL data in production database${NC}"
echo ""
echo "Source (Dev):  ${DEV_DB_URL:0:50}..."
echo "Target (Prod): ${PROD_DB_URL:0:50}..."
echo ""
read -p "Type 'CLONE' to confirm: " confirm

if [ "$confirm" != "CLONE" ]; then
  echo "Clone cancelled."
  exit 0
fi

# Create backup directory
BACKUP_DIR="./database-backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="$BACKUP_DIR/dev_clone_${TIMESTAMP}.sql"

echo ""
echo -e "${BLUE}Step 1/3: Dumping development database...${NC}"
echo "Output: $DUMP_FILE"
echo ""

# Dump dev database (schema + data)
if pg_dump "$DEV_DB_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f "$DUMP_FILE"; then

  FILE_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
  echo -e "${GREEN}✅ Dump complete: $FILE_SIZE${NC}"
else
  echo -e "${RED}❌ Dump failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 2/3: Loading into production database...${NC}"
echo "This may take 2-5 minutes..."
echo ""

# Load into production
if psql "$PROD_DB_URL" -f "$DUMP_FILE" > /tmp/clone-output.txt 2>&1; then
  echo -e "${GREEN}✅ Load complete${NC}"
else
  echo -e "${RED}❌ Load failed${NC}"
  echo "Last 20 lines of output:"
  tail -20 /tmp/clone-output.txt
  exit 1
fi

echo ""
echo -e "${BLUE}Step 3/3: Verifying clone...${NC}"
echo ""

# Get table counts
DEV_TABLES=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
PROD_TABLES=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

# Get sample row counts
echo "Row counts comparison:"
echo "┌─────────────────────┬──────────┬──────────┐"
echo "│ Table               │   Dev    │   Prod   │"
echo "├─────────────────────┼──────────┼──────────┤"

for table in customers products orders users user_profiles; do
  DEV_ROWS=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
  PROD_ROWS=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
  printf "│ %-19s │ %8s │ %8s │\n" "$table" "$DEV_ROWS" "$PROD_ROWS"
done

echo "└─────────────────────┴──────────┴──────────┘"
echo ""

if [ "$DEV_TABLES" == "$PROD_TABLES" ]; then
  echo -e "${GREEN}✅ Table count matches: $PROD_TABLES tables${NC}"
else
  echo -e "${YELLOW}⚠️  Table count mismatch: Dev=$DEV_TABLES, Prod=$PROD_TABLES${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Clone Complete! 🎉                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Backup saved: $DUMP_FILE"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Deploy to Vercel: ${YELLOW}git push origin main${NC}"
echo "  2. Test with your team at production URL"
echo "  3. When ready to wipe test data: ${YELLOW}psql \$PROD_DB_URL -f scripts/wipe-production-data.sql${NC}"
echo ""
