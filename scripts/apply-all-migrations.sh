#!/bin/bash

#############################################################
# Apply All Database Migrations
#
# This script applies all standalone SQL migration files
# to a specified database (DEV or PROD)
#
# Usage: ./scripts/apply-all-migrations.sh [dev|prod]
#############################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line argument
if [ "$1" == "prod" ]; then
  echo -e "${YELLOW}=== APPLYING MIGRATIONS TO PRODUCTION DATABASE ===${NC}"
  if [ -z "$PROD_DATABASE_URL" ]; then
    echo -e "${RED}ERROR: PROD_DATABASE_URL environment variable not set${NC}"
    exit 1
  fi
  DATABASE_URL="$PROD_DATABASE_URL"
elif [ "$1" == "dev" ] || [ -z "$1" ]; then
  echo -e "${YELLOW}=== APPLYING MIGRATIONS TO DEVELOPMENT DATABASE ===${NC}"
  # Load from .env.local
  if [ -f .env.local ]; then
    export $(grep "^DATABASE_URL=" .env.local | xargs)
  fi
  if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not found in .env.local${NC}"
    exit 1
  fi
else
  echo -e "${RED}ERROR: Invalid argument. Use 'dev' or 'prod'${NC}"
  exit 1
fi

echo -e "${GREEN}Database URL: ${DATABASE_URL:0:50}...${NC}"
echo

# Get list of all SQL migration files, sorted by date (oldest first)
MIGRATION_FILES=$(ls -1tr prisma/migrations/*.sql 2>/dev/null)

if [ -z "$MIGRATION_FILES" ]; then
  echo -e "${YELLOW}No standalone SQL migration files found.${NC}"
  exit 0
fi

echo -e "${GREEN}Found $(echo "$MIGRATION_FILES" | wc -l | tr -d ' ') migration files${NC}"
echo

# Apply each migration
SUCCESS_COUNT=0
SKIP_COUNT=0
ERROR_COUNT=0

for migration_file in $MIGRATION_FILES; do
  filename=$(basename "$migration_file")
  echo -e "${YELLOW}Applying: $filename${NC}"

  # Run migration with psql, capturing errors
  if psql "$DATABASE_URL" -f "$migration_file" -v ON_ERROR_STOP=1 2>&1 | grep -v "NOTICE:  relation.*already exists" | grep -v "ERROR:  relation.*already exists"; then
    echo -e "${GREEN}✓ Applied successfully${NC}"
    ((SUCCESS_COUNT++))
  else
    # Check if error was "already exists" (not a real error)
    if psql "$DATABASE_URL" -f "$migration_file" 2>&1 | grep -q "already exists"; then
      echo -e "${YELLOW}⊙ Skipped (already applied)${NC}"
      ((SKIP_COUNT++))
    else
      echo -e "${RED}✗ Failed to apply${NC}"
      ((ERROR_COUNT++))
    fi
  fi
  echo
done

# Print summary
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Migration Summary:${NC}"
echo -e "${GREEN}  Successfully applied: $SUCCESS_COUNT${NC}"
echo -e "${YELLOW}  Skipped (existing):  $SKIP_COUNT${NC}"
if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${RED}  Errors:              $ERROR_COUNT${NC}"
  exit 1
else
  echo -e "${GREEN}  Errors:              0${NC}"
fi
echo -e "${GREEN}======================================${NC}"

# Also run Prisma migrate deploy
echo
echo -e "${YELLOW}Running Prisma migrate deploy...${NC}"
npx prisma migrate deploy

echo
echo -e "${GREEN}✓ All migrations applied successfully!${NC}"
