#!/bin/bash
###############################################################################
# Database Backup Script
#
# Performs full PostgreSQL dump of production database
# Compresses and optionally uploads to S3 for offsite storage
#
# Usage: ./backup-database.sh
# Cron: 0 2 * * * /path/to/backup-database.sh
#
# Created: 2025-10-26
# Phase: Grand Plan - Critical Fix (Database Backups)
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="/Users/eko3/limn-systems-enterprise-backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="limn_db_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "${LOG_FILE}"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log "========================================="
log "Starting database backup process"
log "========================================="

# Source environment variables
CREDENTIALS_FILE="/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env"

if [ ! -f "${CREDENTIALS_FILE}" ]; then
    log_error "Credentials file not found: ${CREDENTIALS_FILE}"
    exit 1
fi

source "${CREDENTIALS_FILE}"

if [ -z "${PROD_DB_URL:-}" ]; then
    log_error "PROD_DB_URL not set in credentials file"
    exit 1
fi

# Check disk space (require at least 5GB free)
AVAILABLE_SPACE=$(df -BG "${BACKUP_DIR}" | tail -1 | awk '{print $4}' | sed 's/G//')

if [ "${AVAILABLE_SPACE}" -lt 5 ]; then
    log_error "Insufficient disk space: ${AVAILABLE_SPACE}GB available (5GB required)"
    exit 1
fi

log "Disk space check passed: ${AVAILABLE_SPACE}GB available"

# Perform PostgreSQL dump
log "Creating database dump..."

if pg_dump "${PROD_DB_URL}" > "${BACKUP_PATH}" 2>> "${LOG_FILE}"; then
    log_success "Database dump created successfully"
else
    log_error "Database dump failed"
    rm -f "${BACKUP_PATH}"  # Clean up partial backup
    exit 1
fi

# Verify backup file exists and has content
if [ ! -s "${BACKUP_PATH}" ]; then
    log_error "Backup file is empty or doesn't exist"
    exit 1
fi

# Get backup size before compression
BACKUP_SIZE_BEFORE=$(du -h "${BACKUP_PATH}" | cut -f1)
log "Backup size (uncompressed): ${BACKUP_SIZE_BEFORE}"

# Compress backup
log "Compressing backup..."

if gzip "${BACKUP_PATH}"; then
    BACKUP_PATH="${BACKUP_PATH}.gz"
    log_success "Backup compressed"
else
    log_error "Compression failed"
    exit 1
fi

# Get compressed backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log_success "Final backup size: ${BACKUP_SIZE}"

# Calculate backup count
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "limn_db_backup_*.sql.gz" | wc -l)
log "Total backups in directory: ${BACKUP_COUNT}"

# Optional: Upload to S3
if command -v aws &> /dev/null && [ -n "${AWS_BACKUP_BUCKET:-}" ]; then
    log "Uploading to S3..."

    S3_PATH="s3://${AWS_BACKUP_BUCKET}/database-backups/${BACKUP_FILE}.gz"

    if aws s3 cp "${BACKUP_PATH}" "${S3_PATH}" >> "${LOG_FILE}" 2>&1; then
        log_success "Uploaded to S3: ${S3_PATH}"
    else
        log_warning "S3 upload failed (local backup still available)"
    fi
else
    log_warning "AWS CLI not configured or AWS_BACKUP_BUCKET not set - skipping S3 upload"
fi

# Clean up old backups (keep last N days)
log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."

DELETED_COUNT=0
while IFS= read -r old_backup; do
    if [ -n "${old_backup}" ]; then
        rm -f "${old_backup}"
        ((DELETED_COUNT++))
    fi
done < <(find "${BACKUP_DIR}" -name "limn_db_backup_*.sql.gz" -mtime +${RETENTION_DAYS})

if [ "${DELETED_COUNT}" -gt 0 ]; then
    log "Deleted ${DELETED_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# List recent backups
log "Recent backups:"
ls -lht "${BACKUP_DIR}"/limn_db_backup_*.sql.gz | head -5 | tee -a "${LOG_FILE}"

# Optional: Send Slack notification
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    SLACK_MESSAGE=$(cat <<EOF
{
  "text": "✅ Database Backup Complete",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Database Backup Completed*\n*Size:* ${BACKUP_SIZE}\n*File:* ${BACKUP_FILE}.gz\n*Timestamp:* $(date '+%Y-%m-%d %H:%M:%S')"
      }
    }
  ]
}
EOF
)

    if curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-Type: application/json' \
        -d "${SLACK_MESSAGE}" >> "${LOG_FILE}" 2>&1; then
        log "Slack notification sent"
    else
        log_warning "Failed to send Slack notification"
    fi
fi

log_success "========================================="
log_success "Backup process completed successfully!"
log_success "Backup file: ${BACKUP_PATH}"
log_success "========================================="

exit 0
