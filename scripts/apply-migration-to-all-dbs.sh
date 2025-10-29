#!/bin/bash

# Script: Apply Migration to ALL Databases (Dev + Prod)
# Purpose: Ensure 100% database synchronization
# Usage: ./scripts/apply-migration-to-all-dbs.sh <migration_file>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==================================================================${NC}"
echo -e "${YELLOW}  Migration Application Script - Dev + Prod Sync${NC}"
echo -e "${YELLOW}==================================================================${NC}"
echo ""

# Check if migration file provided
if [ -z "$1" ]; then
  echo -e "${RED}ERROR: No migration file specified${NC}"
  echo "Usage: $0 <migration_file>"
  echo "Example: $0 prisma/migrations/drop_unused_clients_table.sql"
  exit 1
fi

MIGRATION_FILE="$1"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}ERROR: Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}Migration File: $MIGRATION_FILE${NC}"
echo ""

# Load environment variables
if [ ! -f ".env" ]; then
  echo -e "${RED}ERROR: .env file not found${NC}"
  exit 1
fi

source .env

# Check if production credentials file exists
PROD_CREDS_FILE="/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env"
if [ ! -f "$PROD_CREDS_FILE" ]; then
  echo -e "${RED}ERROR: production credentials file not found at $PROD_CREDS_FILE${NC}"
  exit 1
fi

source "$PROD_CREDS_FILE"

# ============================================================================
# STEP 1: Apply to DEV Database
# ============================================================================

echo -e "${YELLOW}------------------------------------------------------------------${NC}"
echo -e "${YELLOW}STEP 1: Applying migration to DEV database${NC}"
echo -e "${YELLOW}------------------------------------------------------------------${NC}"

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL not set in .env${NC}"
  exit 1
fi

echo "DEV Database: $DATABASE_URL"
echo ""

# Extract connection details
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "Executing migration on DEV..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ DEV migration successful${NC}"
else
  echo -e "${RED}✗ DEV migration failed${NC}"
  exit 1
fi

echo ""

# ============================================================================
# STEP 2: Apply to PROD Database
# ============================================================================

echo -e "${YELLOW}------------------------------------------------------------------${NC}"
echo -e "${YELLOW}STEP 2: Applying migration to PROD database${NC}"
echo -e "${YELLOW}------------------------------------------------------------------${NC}"

if [ -z "$PROD_DB_URL" ]; then
  echo -e "${RED}ERROR: PROD_DB_URL not set in production-credentials.env${NC}"
  exit 1
fi

echo "PROD Database: $PROD_DB_URL"
echo ""

# Extract connection details for prod
PROD_DB_HOST=$(echo "$PROD_DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
PROD_DB_PORT=$(echo "$PROD_DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
PROD_DB_NAME=$(echo "$PROD_DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
PROD_DB_USER=$(echo "$PROD_DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
PROD_DB_PASS=$(echo "$PROD_DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo -e "${YELLOW}⚠️  WARNING: About to apply migration to PRODUCTION database!${NC}"
echo -e "${YELLOW}Press ENTER to continue, or Ctrl+C to cancel...${NC}"
read

echo "Executing migration on PROD..."
PGPASSWORD="$PROD_DB_PASS" psql -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ PROD migration successful${NC}"
else
  echo -e "${RED}✗ PROD migration failed${NC}"
  exit 1
fi

echo ""

# ============================================================================
# STEP 3: Verification
# ============================================================================

echo -e "${YELLOW}------------------------------------------------------------------${NC}"
echo -e "${YELLOW}STEP 3: Verifying databases are in sync${NC}"
echo -e "${YELLOW}------------------------------------------------------------------${NC}"

echo "Checking DEV database..."
DEV_CLIENTS_EXISTS=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients');")

echo "Checking PROD database..."
PROD_CLIENTS_EXISTS=$(PGPASSWORD="$PROD_DB_PASS" psql -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients');")

if [ "$DEV_CLIENTS_EXISTS" = "f" ] && [ "$PROD_CLIENTS_EXISTS" = "f" ]; then
  echo -e "${GREEN}✓ VERIFICATION PASSED: clients table dropped in both DEV and PROD${NC}"
elif [ "$DEV_CLIENTS_EXISTS" = "t" ] || [ "$PROD_CLIENTS_EXISTS" = "t" ]; then
  echo -e "${RED}✗ VERIFICATION FAILED: clients table still exists!${NC}"
  echo "DEV clients exists: $DEV_CLIENTS_EXISTS"
  echo "PROD clients exists: $PROD_CLIENTS_EXISTS"
  exit 1
fi

echo ""
echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}  ✓ SUCCESS: Databases are 100% in sync${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Regenerate Prisma client: npx prisma generate"
echo "2. Run type check: npm run type-check"
echo "3. Run build: npm run build"
