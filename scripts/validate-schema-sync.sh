#!/bin/bash
set -e

echo "=== Database Schema Sync Validation ==="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found"
    exit 1
fi

source .env

# Check if production credentials exist
if [ ! -f /Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env ]; then
    echo "❌ ERROR: Production credentials file not found"
    exit 1
fi

source /Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env

echo "Exporting dev schema..."
psql "$DATABASE_URL" -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name;" > /tmp/dev_schema_check.txt 2>&1

echo "Exporting prod schema..."
psql "$PROD_DB_URL" -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name;" > /tmp/prod_schema_check.txt 2>&1

# Compare
if diff -q /tmp/dev_schema_check.txt /tmp/prod_schema_check.txt > /dev/null 2>&1; then
    echo "✅ PASS: Dev and Prod schemas are in sync"
    exit 0
else
    echo "❌ FAIL: Dev and Prod schemas differ!"
    echo ""
    echo "Differences found:"
    diff /tmp/dev_schema_check.txt /tmp/prod_schema_check.txt | head -50
    echo ""
    echo "Run comprehensive audit: npm run db:audit"
    exit 1
fi
