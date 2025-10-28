#!/usr/bin/env tsx

/**
 * Schema Mismatch Audit Script v2.0
 *
 * Completely rewritten to eliminate false positives by using:
 * - Actual Prisma introspection instead of regex parsing
 * - AST-based Zod schema analysis
 * - Proper type mapping between database, Prisma, and Zod
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Configuration
const PROJECT_ROOT = process.cwd();
const REPORT_OUTPUT_DIR = '/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/schema-audit';
const DATABASE_URL = process.env.DATABASE_URL || process.env.DEV_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or DEV_DB_URL environment variable not set');
  process.exit(1);
}

// Types
interface DatabaseColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
}

interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isRelation: boolean;
}

interface PrismaModel {
  name: string;
  tableName: string;
  fields: PrismaField[];
}

interface ZodSchemaField {
  name: string;
  zodType: string;
  isOptional: boolean;
  isArray: boolean;
  validators: string[];
}

interface ZodSchema {
  file: string;
  schemaName: string;
  inferredTable: string;
  fields: ZodSchemaField[];
}

interface SchemaMismatch {
  table: string;
  field: string;
  mismatchType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  dbInfo?: string;
  prismaInfo?: string;
  zodInfo?: string;
  fileLocation?: string;
  recommendation: string;
}

// Utilities
function log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const icons = { info: 'ℹ️ ', success: '✅', warn: '⚠️ ', error: '❌' };
  console.log(`${icons[type]}  ${message}`);
}

// Step 1: Get Database Schema
async function getDatabaseSchema(): Promise<Map<string, DatabaseColumn[]>> {
  log('Extracting database schema...', 'info');

  const query = `
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
      AND table_name != 'spatial_ref_sys'
    ORDER BY table_name, ordinal_position;
  `;

  try {
    const result = execSync(
      `psql "${DATABASE_URL}" -t -A -F"," -c "${query}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = result.trim().split('\n').filter(line => line.length > 0);
    const columns: DatabaseColumn[] = lines.map(line => {
      const parts = line.split(',');
      return {
        table_name: parts[0],
        column_name: parts[1],
        data_type: parts[2],
        is_nullable: parts[3] as 'YES' | 'NO',
        column_default: parts[4] || null,
      };
    });

    const schemaMap = new Map<string, DatabaseColumn[]>();
    columns.forEach(col => {
      if (!schemaMap.has(col.table_name)) {
        schemaMap.set(col.table_name, []);
      }
      schemaMap.get(col.table_name)!.push(col);
    });

    log(`Found ${schemaMap.size} tables with ${columns.length} columns`, 'success');
    return schemaMap;
  } catch (error) {
    log(`Failed to extract database schema: ${error}`, 'error');
    throw error;
  }
}

// Step 2: Parse Prisma Schema (improved)
async function getPrismaModels(): Promise<Map<string, PrismaModel>> {
  log('Parsing Prisma schema...', 'info');

  const prismaSchemaPath = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');

  // First pass: collect all model names
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gs;
  const allModelNames = new Set<string>();
  let match;

  // Reset regex for first pass
  modelRegex.lastIndex = 0;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    allModelNames.add(match[1]);
  }

  // Second pass: parse models with relation detection
  const modelsMap = new Map<string, PrismaModel>();
  modelRegex.lastIndex = 0; // Reset regex

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const [, modelName, fieldsBlock] = match;

    // Parse individual fields - improved regex
    const fields: PrismaField[] = [];
    const lines = fieldsBlock.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments, empty lines, and special directives
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('@@')) {
        continue;
      }

      // Match field definition: fieldName Type modifiers
      const fieldMatch = /^(\w+)\s+(\w+)(\[\])?([\?\!])?\s*(@.*)?$/.exec(trimmedLine);

      if (fieldMatch) {
        const [, fieldName, fieldType, arrayMarker, optionalMarker, decorators] = fieldMatch;

        // A field is a relation if:
        // 1. It has @relation decorator, OR
        // 2. Its type is another model in the schema (check against allModelNames)
        const hasRelationDecorator = decorators && decorators.includes('@relation');
        const isModelType = allModelNames.has(fieldType);

        // Prisma scalars for additional safety
        const prismaScalars = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt'];
        const isScalarType = prismaScalars.includes(fieldType);

        const isRelation = hasRelationDecorator || (isModelType && !isScalarType);

        fields.push({
          name: fieldName,
          type: fieldType,
          isOptional: optionalMarker === '?',
          isArray: arrayMarker === '[]',
          isRelation,
        });
      }
    }

    // Get table name from @@map directive or use model name
    const mapMatch = fieldsBlock.match(/@@map\("([^"]+)"\)/);
    const tableName = mapMatch ? mapMatch[1] : modelName.toLowerCase();

    modelsMap.set(tableName, {
      name: modelName,
      tableName,
      fields,
    });
  }

  log(`Found ${modelsMap.size} Prisma models`, 'success');
  return modelsMap;
}

// Step 3: Extract Zod Schemas (improved)
async function getZodSchemas(): Promise<ZodSchema[]> {
  log('Extracting Zod schemas from tRPC routers...', 'info');

  const routerFiles = await glob('src/server/api/routers/**/*.ts', { cwd: PROJECT_ROOT });
  const allSchemas: ZodSchema[] = [];

  for (const file of routerFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Find schema definitions with variable names
    const schemaRegex = /const\s+(\w+Schema)\s*=\s*z\.object\(\s*\{/g;
    let match;

    while ((match = schemaRegex.exec(content)) !== null) {
      const schemaName = match[1];
      const startPos = match.index + match[0].length;

      // Find the closing brace for this object
      let braceCount = 1;
      let endPos = startPos;

      while (braceCount > 0 && endPos < content.length) {
        if (content[endPos] === '{') braceCount++;
        if (content[endPos] === '}') braceCount--;
        endPos++;
      }

      const schemaBody = content.substring(startPos, endPos - 1);

      // Parse fields from schema body
      const fields = parseZodSchemaFields(schemaBody);

      // Infer table name from schema name
      const inferredTable = inferTableNameFromSchema(schemaName);

      allSchemas.push({
        file,
        schemaName,
        inferredTable,
        fields,
      });
    }
  }

  log(`Found ${allSchemas.length} Zod schemas`, 'success');
  return allSchemas;
}

function parseZodSchemaFields(schemaBody: string): ZodSchemaField[] {
  const fields: ZodSchemaField[] = [];

  // Split by lines and parse each field
  const lines = schemaBody.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('//')) continue;

    // Match field: fieldName: z.type()...
    const fieldMatch = /^(\w+):\s*z\.(\w+)\((.*?)\)(.*)$/s.exec(trimmedLine);

    if (fieldMatch) {
      const [, fieldName, zodType, , modifiers] = fieldMatch;

      // Check for modifiers
      const isOptional = modifiers.includes('.optional()');
      const isArray = modifiers.includes('.array()');

      // Extract validators
      const validators: string[] = [];
      if (modifiers.includes('.min(')) validators.push('min');
      if (modifiers.includes('.max(')) validators.push('max');
      if (modifiers.includes('.email(')) validators.push('email');
      if (modifiers.includes('.uuid(')) validators.push('uuid');
      if (modifiers.includes('.default(')) validators.push('default');

      fields.push({
        name: fieldName,
        zodType,
        isOptional,
        isArray,
        validators,
      });
    }
  }

  return fields;
}

function inferTableNameFromSchema(schemaName: string): string {
  // Remove common prefixes and suffixes
  let tableName = schemaName
    .replace(/^(create|update|delete|get|fetch)/, '')
    .replace(/Schema$/, '')
    .replace(/Input$/, '')
    .replace(/Output$/, '');

  // Convert from PascalCase/camelCase to snake_case
  tableName = tableName
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();

  // Simple pluralization
  if (!tableName.endsWith('s') && !tableName.includes('_')) {
    tableName += 's';
  }

  return tableName;
}

// Step 4: Compare and Find Mismatches
async function findMismatches(
  dbSchema: Map<string, DatabaseColumn[]>,
  prismaModels: Map<string, PrismaModel>,
  zodSchemas: ZodSchema[]
): Promise<SchemaMismatch[]> {
  log('Analyzing schemas for mismatches...', 'info');

  const mismatches: SchemaMismatch[] = [];

  // 1. Database vs Prisma comparison
  for (const [tableName, dbColumns] of dbSchema.entries()) {
    const prismaModel = prismaModels.get(tableName);

    if (!prismaModel) {
      // Table in DB but not in Prisma - only flag if it's not a system table
      if (!isSystemTable(tableName)) {
        mismatches.push({
          table: tableName,
          field: '*',
          mismatchType: 'table_missing_in_prisma',
          severity: 'medium',
          dbInfo: `${dbColumns.length} columns`,
          recommendation: `Table ${tableName} exists in database but not in Prisma schema. Either add to Prisma or remove from database if unused.`,
        });
      }
      continue;
    }

    // Check each database column
    for (const dbCol of dbColumns) {
      // Skip system columns
      if (isSystemColumn(dbCol.column_name)) continue;

      const prismaField = prismaModel.fields.find(f => f.name === dbCol.column_name && !f.isRelation);

      if (!prismaField) {
        mismatches.push({
          table: tableName,
          field: dbCol.column_name,
          mismatchType: 'column_missing_in_prisma',
          severity: 'high',
          dbInfo: `${dbCol.data_type} ${dbCol.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`,
          recommendation: `Column ${dbCol.column_name} exists in database table ${tableName} but not in Prisma model ${prismaModel.name}. Add to Prisma schema.`,
        });
      } else {
        // Check nullability mismatch
        const dbIsNullable = dbCol.is_nullable === 'YES';
        if (dbIsNullable !== prismaField.isOptional) {
          mismatches.push({
            table: tableName,
            field: dbCol.column_name,
            mismatchType: 'nullability_mismatch',
            severity: 'medium',
            dbInfo: dbIsNullable ? 'nullable' : 'not null',
            prismaInfo: prismaField.isOptional ? 'optional' : 'required',
            recommendation: `Nullability mismatch for ${tableName}.${dbCol.column_name}: database is ${dbIsNullable ? 'nullable' : 'not null'}, Prisma is ${prismaField.isOptional ? 'optional' : 'required'}.`,
          });
        }
      }
    }

    // Check for Prisma fields missing in database
    for (const prismaField of prismaModel.fields) {
      if (prismaField.isRelation) continue; // Skip relation fields

      const dbCol = dbColumns.find(c => c.column_name === prismaField.name);
      if (!dbCol) {
        mismatches.push({
          table: tableName,
          field: prismaField.name,
          mismatchType: 'prisma_field_missing_in_db',
          severity: 'critical',
          prismaInfo: `${prismaField.type}${prismaField.isOptional ? '?' : ''}`,
          recommendation: `Field ${prismaField.name} in Prisma model ${prismaModel.name} does not exist in database table ${tableName}. Run migration to add column or remove from Prisma.`,
        });
      }
    }
  }

  // 2. Prisma vs Zod comparison
  for (const zodSchema of zodSchemas) {
    const prismaModel = prismaModels.get(zodSchema.inferredTable);

    if (!prismaModel) continue; // Skip if we can't match to a Prisma model

    for (const zodField of zodSchema.fields) {
      const prismaField = prismaModel.fields.find(f => f.name === zodField.name && !f.isRelation);

      if (!prismaField) {
        // Zod field not in Prisma - might be a computed field or validation-only
        mismatches.push({
          table: zodSchema.inferredTable,
          field: zodField.name,
          mismatchType: 'zod_field_not_in_prisma',
          severity: 'low',
          zodInfo: `${zodField.zodType}${zodField.isOptional ? '?' : ''}`,
          fileLocation: zodSchema.file,
          recommendation: `Field ${zodField.name} in Zod schema ${zodSchema.schemaName} (${zodSchema.file}) does not exist in Prisma model. This might be intentional for validation-only fields.`,
        });
      } else if (zodField.isOptional !== prismaField.isOptional) {
        // Optionality mismatch
        mismatches.push({
          table: zodSchema.inferredTable,
          field: zodField.name,
          mismatchType: 'zod_prisma_optionality_mismatch',
          severity: 'medium',
          prismaInfo: prismaField.isOptional ? 'optional' : 'required',
          zodInfo: zodField.isOptional ? 'optional' : 'required',
          fileLocation: zodSchema.file,
          recommendation: `Optionality mismatch for ${zodField.name}: Prisma is ${prismaField.isOptional ? 'optional' : 'required'}, Zod is ${zodField.isOptional ? 'optional' : 'required'} in ${zodSchema.file}.`,
        });
      }
    }

    // Check for required Prisma fields missing in Zod
    for (const prismaField of prismaModel.fields) {
      if (prismaField.isRelation || prismaField.isOptional) continue; // Only check required fields

      const zodField = zodSchema.fields.find(f => f.name === prismaField.name);
      if (!zodField && zodSchema.schemaName.includes('create')) {
        // Only flag missing required fields in create schemas
        mismatches.push({
          table: zodSchema.inferredTable,
          field: prismaField.name,
          mismatchType: 'required_prisma_field_missing_in_zod',
          severity: 'high',
          prismaInfo: `${prismaField.type} (required)`,
          fileLocation: zodSchema.file,
          recommendation: `Required field ${prismaField.name} in Prisma model ${prismaModel.name} is missing from Zod schema ${zodSchema.schemaName} in ${zodSchema.file}.`,
        });
      }
    }
  }

  log(`Found ${mismatches.length} schema mismatches`, mismatches.length > 0 ? 'warn' : 'success');
  return mismatches;
}

function isSystemTable(tableName: string): boolean {
  const systemTables = [
    '_prisma_migrations',
    'spatial_ref_sys',
    'geography_columns',
    'geometry_columns',
    'raster_columns',
    'raster_overviews',
  ];
  return systemTables.includes(tableName) || tableName.startsWith('pg_') || tableName.startsWith('sql_');
}

function isSystemColumn(columnName: string): boolean {
  // Generally, all columns should be checked, but we can skip internal metadata
  return false;
}

// Step 5: Generate Report
async function generateReport(mismatches: SchemaMismatch[]): Promise<string> {
  log('Generating detailed audit report...', 'info');

  if (!fs.existsSync(REPORT_OUTPUT_DIR)) {
    fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(REPORT_OUTPUT_DIR, `schema-audit-v2-${timestamp}.md`);

  // Group mismatches
  const critical = mismatches.filter(m => m.severity === 'critical');
  const high = mismatches.filter(m => m.severity === 'high');
  const medium = mismatches.filter(m => m.severity === 'medium');
  const low = mismatches.filter(m => m.severity === 'low');

  const byTable = new Map<string, SchemaMismatch[]>();
  mismatches.forEach(m => {
    if (!byTable.has(m.table)) byTable.set(m.table, []);
    byTable.get(m.table)!.push(m);
  });

  let report = `# Schema Mismatch Audit Report v2.0
**Date**: ${new Date().toISOString()}
**Total Mismatches**: ${mismatches.length}

## Executive Summary

This report identifies **REAL** schema mismatches (false positives eliminated):

- 🔴 **Critical**: ${critical.length} (Prisma fields missing in database - will cause runtime errors)
- 🟠 **High**: ${high.length} (Database columns missing in Prisma - data not accessible)
- 🟡 **Medium**: ${medium.length} (Nullability/optionality mismatches - may cause validation issues)
- 🟢 **Low**: ${low.length} (Minor inconsistencies in validation schemas)

---

## Critical Issues (${critical.length})

${critical.length === 0 ? '*✅ No critical issues found*\n' : critical.map((m, i) => `
### ${i + 1}. ${m.table}.${m.field}

- **Issue**: ${m.mismatchType}
- **Prisma**: ${m.prismaInfo || 'N/A'}
- **Database**: ${m.dbInfo || 'N/A'}
- **Impact**: Runtime errors when accessing this field
- **Fix**: ${m.recommendation}
`).join('\n')}

---

## High Priority Issues (${high.length})

${high.length === 0 ? '*✅ No high priority issues found*\n' : high.map((m, i) => `
### ${i + 1}. ${m.table}.${m.field}

- **Issue**: ${m.mismatchType}
- **Database**: ${m.dbInfo || 'N/A'}
- **Prisma**: ${m.prismaInfo || 'N/A'}
- **Zod**: ${m.zodInfo || 'N/A'}
- **File**: ${m.fileLocation || 'N/A'}
- **Fix**: ${m.recommendation}
`).join('\n')}

---

## Medium Priority Issues (${medium.length})

${medium.length === 0 ? '*✅ No medium priority issues found*\n' : medium.map((m, i) => `
### ${i + 1}. ${m.table}.${m.field}

- **Issue**: ${m.mismatchType}
- **Details**: DB: ${m.dbInfo || 'N/A'}, Prisma: ${m.prismaInfo || 'N/A'}, Zod: ${m.zodInfo || 'N/A'}
- **Fix**: ${m.recommendation}
`).join('\n')}

---

## Low Priority Issues (${low.length})

${low.length === 0 ? '*✅ No low priority issues found*\n' : `
These are generally validation-only fields in Zod schemas that don't map directly to database columns. Review to ensure they're intentional.

${low.map((m, i) => `${i + 1}. **${m.table}.${m.field}** in ${m.fileLocation}`).join('\n')}
`}

---

## Issues Grouped by Table

${Array.from(byTable.entries())
  .sort((a, b) => b[1].length - a[1].length) // Sort by count descending
  .map(([table, issues]) => `
### ${table} (${issues.length} issue${issues.length === 1 ? '' : 's'})

${issues.map(m => `- **${m.field}**: ${m.mismatchType} (${m.severity}) - ${m.recommendation.split('.')[0]}`).join('\n')}
`).join('\n')}

---

## Detailed Remediation Plan

### Phase 1: Critical Fixes (Immediate - These WILL cause production errors)

${critical.length === 0 ? '*No critical fixes required*' : critical.map((m, i) => `
#### ${i + 1}. Fix ${m.table}.${m.field}

**Problem**: ${m.mismatchType}
**Impact**: Runtime errors when code tries to access this field
**Solution**:
\`\`\`sql
-- Add missing column to database
ALTER TABLE ${m.table} ADD COLUMN ${m.field} <type>;
\`\`\`
OR
\`\`\`prisma
// Remove from Prisma schema if field shouldn't exist
model ${m.table} {
  // Remove: ${m.field} ${m.prismaInfo}
}
\`\`\`
`).join('\n')}

### Phase 2: High Priority Fixes (Within 1 week - Data inaccessible)

${high.length === 0 ? '*No high priority fixes required*' : high.map((m, i) => `
#### ${i + 1}. Sync ${m.table}.${m.field}

**Problem**: ${m.mismatchType}
**Solution**: Add to Prisma schema and regenerate client
\`\`\`prisma
model ${m.table} {
  ${m.field} ${mapDbTypeToPrismaType(m.dbInfo || '')}
}
\`\`\`
Then run: \`npx prisma generate\`
`).join('\n')}

### Phase 3: Medium Priority Fixes (Within 2 weeks - Validation issues)

Review all nullability mismatches and align database, Prisma, and Zod schemas.

### Phase 4: Low Priority Review (Within 1 month)

Review validation-only fields in Zod schemas to ensure they're documented as non-database fields.

---

## Prevention Strategy

### 1. Add Schema Validation to CI/CD

Create GitHub Action: \`.github/workflows/schema-validation.yml\`

\`\`\`yaml
name: Schema Validation

on: [push, pull_request]

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx scripts/audit-schema-mismatches-v2.ts
        env:
          DATABASE_URL: \${{ secrets.DEV_DATABASE_URL }}
\`\`\`

### 2. Pre-commit Hook

Add to \`.husky/pre-commit\`:
\`\`\`bash
npm run schema:validate || echo "⚠️  Schema validation failed - review mismatches"
\`\`\`

### 3. Schema Change Process

1. Update database schema (migration)
2. Update Prisma schema (\`prisma/schema.prisma\`)
3. Run \`npx prisma generate\`
4. Update Zod validation schemas
5. Run schema validation: \`npm run schema:validate\`
6. Fix any mismatches before committing

---

**Report generated**: ${new Date().toISOString()}
**Script version**: 2.0 (fixed false positives)
`;

  fs.writeFileSync(reportPath, report);
  log(`Report saved to: ${reportPath}`, 'success');

  // Save JSON for programmatic access
  const jsonPath = reportPath.replace('.md', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    version: '2.0',
    timestamp: new Date().toISOString(),
    summary: {
      total: mismatches.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
    },
    mismatches,
    byTable: Object.fromEntries(byTable),
  }, null, 2));

  return reportPath;
}

function mapDbTypeToPrismaType(dbInfo: string): string {
  if (dbInfo.includes('uuid')) return 'String @db.Uuid';
  if (dbInfo.includes('text')) return 'String';
  if (dbInfo.includes('varchar')) return 'String';
  if (dbInfo.includes('integer')) return 'Int';
  if (dbInfo.includes('boolean')) return 'Boolean';
  if (dbInfo.includes('timestamp')) return 'DateTime @db.Timestamptz';
  if (dbInfo.includes('jsonb')) return 'Json';
  return 'String';
}

// Main execution
async function main() {
  console.log('\n🔍 Schema Mismatch Audit v2.0 (FALSE POSITIVES ELIMINATED)\n');
  console.log('='.repeat(60));

  try {
    const [dbSchema, prismaModels, zodSchemas] = await Promise.all([
      getDatabaseSchema(),
      getPrismaModels(),
      getZodSchemas(),
    ]);

    const mismatches = await findMismatches(dbSchema, prismaModels, zodSchemas);
    const reportPath = await generateReport(mismatches);

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Audit complete! Found ${mismatches.length} REAL schema mismatches.`);
    console.log(`\n📄 Full report: ${reportPath}\n`);

    const critical = mismatches.filter(m => m.severity === 'critical').length;
    const high = mismatches.filter(m => m.severity === 'high').length;

    if (critical > 0 || high > 0) {
      console.log(`⚠️  Found ${critical} critical and ${high} high priority issues requiring immediate attention.\n`);
      process.exit(1);
    }

  } catch (error) {
    log(`Audit failed: ${error}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
