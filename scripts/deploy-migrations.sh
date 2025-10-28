#!/bin/bash
set -e

echo "=== Prisma Migration Deployment ==="
echo ""

TARGET="${1:-dev}"

if [ "$TARGET" = "prod" ]; then
    echo "🚨 PRODUCTION DEPLOYMENT 🚨"
    echo "This will apply pending migrations to PRODUCTION"
    echo ""
    read -p "Are you sure? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "Deployment cancelled"
        exit 1
    fi

    # Check if production credentials exist
    if [ ! -f /Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env ]; then
        echo "❌ ERROR: Production credentials file not found"
        exit 1
    fi

    # Backup first
    echo "Creating backup..."
    mkdir -p /Users/eko3/limn-systems-enterprise-docs/09-SECURITY/backups
    source /Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env
    BACKUP_FILE="/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/backups/prod-backup-$(date +%Y-%m-%d-%H%M%S).sql"
    pg_dump "$PROD_DB_URL" --schema-only > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"

    # Apply to production
    export DATABASE_URL="$PROD_DB_URL"

    echo "Applying migrations to PRODUCTION..."
    npx prisma migrate deploy

    echo "Verifying schema..."
    npx prisma validate

    echo "✅ Production migrations complete"
else
    echo "Applying migrations to DEV..."
    npx prisma migrate dev
    echo "✅ Dev migrations complete"
fi

# Validate sync after migration
echo ""
echo "Validating schema sync..."
./scripts/validate-schema-sync.sh
