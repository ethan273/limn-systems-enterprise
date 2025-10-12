# Maintenance Scripts

This directory contains utility scripts used for database maintenance, migrations, testing setup, and other administrative tasks. These scripts are NOT part of the application runtime code.

## Directory Structure

### `/database/`
**Purpose**: Database schema discovery and inspection utilities

Contains scripts for:
- Schema discovery and complete table listing
- Database structure inspection
- Schema export to JSON/SQL formats

**Key Files**:
- `discover_all_tables.js` - Discovers all tables in the database
- `discover-complete-schema.js` - Generates complete schema documentation
- `inspect-schema.js` - Interactive schema inspection tool
- `complete-schema.json` - Full schema export in JSON format
- `complete-schema.sql` - Full schema export in SQL format

### `/migrations/`
**Purpose**: Database migration and schema synchronization utilities

Contains scripts for:
- Table migrations and data transfers
- Prisma schema fixes and updates
- Relationship corrections

**Key Files**:
- `complete_migration_api.js` - Complete API-based migration tool
- `direct_table_migration.js` - Direct table-to-table migration
- `final_complete_migration.js` - Final migration orchestrator
- `fix-prisma-schema.js` - Prisma schema repair utility
- `apply-relationships-fix.sh` - Relationship constraint fixes

### `/portal-setup/`
**Purpose**: Portal access configuration and user setup

Contains scripts for:
- Adding portal access for users
- Creating test users for different portals
- Fixing portal role constraints
- Verifying portal permissions

**Key Files**:
- `add-portal-access.js` - Grants portal access to users
- `create-portal-test-users.js` - Creates test users for portal testing
- `fix-partner-portal-user-ids.js` - Repairs partner portal user associations
- `check-portal-role-constraint.js` - Validates portal role constraints

### `/testing/`
**Purpose**: Test data management and diagnostic utilities

Contains scripts for:
- Test data cleanup
- Test user creation
- API testing and diagnostics
- RLS (Row Level Security) troubleshooting

**Key Files**:
- `cleanup-test-data.mjs` / `cleanup-test-data.ts` - Removes test data from database
- `create-test-users.js` - Creates users for testing
- `diagnose-user-profiles-rls.ts` - Diagnoses RLS issues
- `test-api-direct.ts` - Direct API testing utility

### `/utilities/`
**Purpose**: General maintenance and setup utilities

Contains scripts for:
- Environment setup
- Code cleanup
- Memory monitoring
- Build utilities

**Key Files**:
- `apply-option-a.sh` - Migration option application
- `check-memory.sh` - Memory usage monitoring
- `clean-unused-imports.sh` - Code cleanup utility
- `migrate-pages.sh` - Page migration helper
- `setup-desktop.sh` - Desktop environment setup

### `/screenshots/`
**Purpose**: Reference images and documentation

Contains:
- Screenshots from testing sessions
- Database connection documentation
- Test result captures

## Usage Guidelines

### Safety Notes
1. **These are utility scripts** - Not part of the application runtime
2. **Always backup data** before running migration scripts
3. **Test in development** before running in production
4. **Review script contents** before execution to understand what they do

### When to Use These Scripts

**Database Scripts**: When you need to:
- Inspect the current database schema
- Export schema for documentation
- Verify table structures

**Migration Scripts**: When you need to:
- Migrate data between environments
- Fix schema inconsistencies
- Apply Prisma schema changes

**Portal Setup Scripts**: When you need to:
- Set up new portal users for testing
- Fix portal access issues
- Verify portal permissions

**Testing Scripts**: When you need to:
- Clean up test data after test runs
- Create test users for different scenarios
- Diagnose API or RLS issues

**General Utilities**: When you need to:
- Monitor system resources
- Clean up code
- Set up development environments

## Running Scripts

Most scripts can be run directly with Node.js:

```bash
# JavaScript files
node maintenance/database/discover_all_tables.js

# TypeScript files (using tsx)
npx tsx maintenance/testing/diagnose-user-profiles-rls.ts

# Shell scripts
bash maintenance/utilities/check-memory.sh
```

## Important Notes

- **Do not move files back to root** - These scripts are organized here to keep the project root clean
- **Application code is in src/** - These scripts are separate from the application
- **Check script comments** - Most scripts have inline documentation about their purpose
- **Environment variables** - Many scripts require proper .env configuration

## Maintenance Schedule

These scripts are typically used:
- **On-demand** for troubleshooting
- **During migrations** for schema changes
- **Before/after tests** for data cleanup
- **During development** for environment setup

---

**Last Updated**: 2025-10-10
**Organization**: Part of root directory cleanup initiative
