#!/usr/bin/env tsx

/**
 * Comprehensive Schema Mismatch Audit Script
 *
 * Purpose: Identify ALL schema mismatches between:
 * 1. Database schema (PostgreSQL tables)
 * 2. Prisma schema models
 * 3. tRPC router validation schemas (Zod)
 * 4. Form validation schemas
 * 5. TypeScript types/interfaces
 *
 * This script will:
 * - Query database schema for all tables and columns
 * - Parse Prisma schema for all models
 * - Extract all Zod schemas from tRPC routers
 * - Find all form schemas in components
 * - Compare and identify mismatches
 * - Generate detailed report with remediation recommendations
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
  is_nullable: string;
  column_default: string | null;
}

interface PrismaModel {
  name: string;
  fields: PrismaField[];
}

interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
}

interface ZodSchema {
  routerFile: string;
  schemaName: string;
  fields: ZodField[];
}

interface ZodField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  validators: string[];
}

interface FormSchema {
  componentFile: string;
  schemaName: string;
  fields: FormField[];
}

interface FormField {
  name: string;
  type: string;
  isOptional: boolean;
}

interface SchemaMismatch {
  table: string;
  field: string;
  mismatchType: string;
  dbSchema: string;
  prismaSchema?: string;
  zodSchema?: string;
  formSchema?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

// Utilities
function log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const icons = { info: '  ℹ️', success: '✅', warn: '⚠️ ', error: '❌' };
  console.log(`${icons[type]}  ${message}`);
}

// Step 1: Extract Database Schema
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
    ORDER BY table_name, ordinal_position;
  `;

  try {
    const result = execSync(
      `psql "${DATABASE_URL}" -t -A -F"," -c "${query}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = result.trim().split('\n');
    const columns: DatabaseColumn[] = lines.map(line => {
      const [table_name, column_name, data_type, is_nullable, column_default] = line.split(',');
      return { table_name, column_name, data_type, is_nullable, column_default: column_default || null };
    });

    // Group by table name
    const schemaMap = new Map<string, DatabaseColumn[]>();
    columns.forEach(col => {
      if (!schemaMap.has(col.table_name)) {
        schemaMap.set(col.table_name, []);
      }
      schemaMap.get(col.table_name)!.push(col);
    });

    log(`Found ${schemaMap.size} tables with ${columns.length} total columns`, 'success');
    return schemaMap;
  } catch (error) {
    log(`Failed to extract database schema: ${error}`, 'error');
    throw error;
  }
}

// Step 2: Parse Prisma Schema
async function getPrismaSchema(): Promise<Map<string, PrismaModel>> {
  log('Parsing Prisma schema...', 'info');

  const prismaSchemaPath = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');

  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  const fieldRegex = /(\w+)\s+(\w+)(\[\])?([\?\!])?/g;

  const modelsMap = new Map<string, PrismaModel>();
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const [, modelName, fieldsBlock] = match;
    const fields: PrismaField[] = [];

    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(fieldsBlock)) !== null) {
      const [, name, type, isArray, optionalOrRequired] = fieldMatch;
      // Skip attributes like @id, @default, @relation
      if (name.startsWith('@') || type.startsWith('@')) continue;

      fields.push({
        name,
        type,
        isOptional: optionalOrRequired === '?',
        isArray: isArray === '[]',
      });
    }

    modelsMap.set(modelName.toLowerCase(), { name: modelName, fields });
  }

  log(`Found ${modelsMap.size} Prisma models`, 'success');
  return modelsMap;
}

// Step 3: Extract Zod Schemas from tRPC Routers
async function getZodSchemas(): Promise<Map<string, ZodSchema[]>> {
  log('Extracting Zod schemas from tRPC routers...', 'info');

  const routerFiles = await glob('src/server/api/routers/**/*.ts', { cwd: PROJECT_ROOT });
  const zodSchemasMap = new Map<string, ZodSchema[]>();

  for (const file of routerFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Extract const declarations with z.object
    const schemaRegex = /const\s+(\w+Schema)\s*=\s*z\.object\(\{([^}]+)\}\)/gs;
    let match;

    const schemas: ZodSchema[] = [];
    while ((match = schemaRegex.exec(content)) !== null) {
      const [, schemaName, fieldsBlock] = match;

      // Parse fields (simplified - would need more robust parsing)
      const fieldRegex = /(\w+):\s*z\.(\w+)\(\)([^\n,]*)/g;
      const fields: ZodField[] = [];
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(fieldsBlock)) !== null) {
        const [, fieldName, zodType, modifiers] = fieldMatch;
        fields.push({
          name: fieldName,
          type: zodType,
          isOptional: modifiers.includes('.optional()'),
          isArray: modifiers.includes('.array()'),
          validators: extractValidators(modifiers),
        });
      }

      schemas.push({
        routerFile: file,
        schemaName,
        fields,
      });
    }

    if (schemas.length > 0) {
      zodSchemasMap.set(file, schemas);
    }
  }

  const totalSchemas = Array.from(zodSchemasMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  log(`Found ${totalSchemas} Zod schemas across ${zodSchemasMap.size} router files`, 'success');
  return zodSchemasMap;
}

function extractValidators(modifiers: string): string[] {
  const validators: string[] = [];
  if (modifiers.includes('.min(')) validators.push('min');
  if (modifiers.includes('.max(')) validators.push('max');
  if (modifiers.includes('.email(')) validators.push('email');
  if (modifiers.includes('.uuid(')) validators.push('uuid');
  if (modifiers.includes('.default(')) validators.push('default');
  return validators;
}

// Step 4: Extract Form Schemas
async function getFormSchemas(): Promise<Map<string, FormSchema[]>> {
  log('Extracting form schemas from components...', 'info');

  const componentFiles = await glob('src/{components,app}/**/*.{ts,tsx}', { cwd: PROJECT_ROOT });
  const formSchemasMap = new Map<string, FormSchema[]>();

  for (const file of componentFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Look for useForm with zodResolver
    if (!content.includes('useForm') || !content.includes('zodResolver')) continue;

    // Extract schema definitions
    const schemaRegex = /const\s+(\w+Schema)\s*=\s*z\.object\(\{([^}]+)\}\)/gs;
    let match;

    const schemas: FormSchema[] = [];
    while ((match = schemaRegex.exec(content)) !== null) {
      const [, schemaName, fieldsBlock] = match;

      const fieldRegex = /(\w+):\s*z\.(\w+)\(\)([^\n,]*)/g;
      const fields: FormField[] = [];
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(fieldsBlock)) !== null) {
        const [, fieldName, zodType, modifiers] = fieldMatch;
        fields.push({
          name: fieldName,
          type: zodType,
          isOptional: modifiers.includes('.optional()'),
        });
      }

      schemas.push({
        componentFile: file,
        schemaName,
        fields,
      });
    }

    if (schemas.length > 0) {
      formSchemasMap.set(file, schemas);
    }
  }

  const totalSchemas = Array.from(formSchemasMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  log(`Found ${totalSchemas} form schemas across ${formSchemasMap.size} component files`, 'success');
  return formSchemasMap;
}

// Step 5: Compare and Find Mismatches
async function findMismatches(
  dbSchema: Map<string, DatabaseColumn[]>,
  prismaSchema: Map<string, PrismaModel>,
  zodSchemas: Map<string, ZodSchema[]>,
  formSchemas: Map<string, FormSchema[]>
): Promise<SchemaMismatch[]> {
  log('Analyzing schemas for mismatches...', 'info');

  const mismatches: SchemaMismatch[] = [];

  // Compare Database vs Prisma
  for (const [tableName, dbColumns] of dbSchema.entries()) {
    const prismaModel = prismaSchema.get(tableName);

    if (!prismaModel) {
      // Table exists in DB but not in Prisma
      mismatches.push({
        table: tableName,
        field: '*',
        mismatchType: 'missing_prisma_model',
        dbSchema: `${dbColumns.length} columns`,
        severity: 'high',
        recommendation: `Add model ${tableName} to prisma/schema.prisma or remove table from database`,
      });
      continue;
    }

    // Check each column
    for (const dbCol of dbColumns) {
      const prismaField = prismaModel.fields.find(f => f.name === dbCol.column_name);

      if (!prismaField) {
        mismatches.push({
          table: tableName,
          field: dbCol.column_name,
          mismatchType: 'missing_prisma_field',
          dbSchema: `${dbCol.data_type} ${dbCol.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`,
          severity: 'high',
          recommendation: `Add field ${dbCol.column_name} to Prisma model ${prismaModel.name}`,
        });
      } else {
        // Check type compatibility
        const dbIsNullable = dbCol.is_nullable === 'YES';
        if (dbIsNullable !== prismaField.isOptional) {
          mismatches.push({
            table: tableName,
            field: dbCol.column_name,
            mismatchType: 'nullability_mismatch',
            dbSchema: dbIsNullable ? 'NULL' : 'NOT NULL',
            prismaSchema: prismaField.isOptional ? 'optional' : 'required',
            severity: 'medium',
            recommendation: `Sync nullability: DB is ${dbIsNullable ? 'nullable' : 'not nullable'}, Prisma is ${prismaField.isOptional ? 'optional' : 'required'}`,
          });
        }
      }
    }

    // Check for Prisma fields not in DB
    for (const prismaField of prismaModel.fields) {
      // Skip Prisma-only fields like relations
      if (prismaField.type === 'Relation' || prismaField.name.endsWith('_relation')) continue;

      const dbCol = dbColumns.find(c => c.column_name === prismaField.name);
      if (!dbCol) {
        mismatches.push({
          table: tableName,
          field: prismaField.name,
          mismatchType: 'missing_db_column',
          prismaSchema: `${prismaField.type}${prismaField.isOptional ? '?' : ''}`,
          severity: 'critical',
          recommendation: `Add column ${prismaField.name} to database table ${tableName} or remove from Prisma schema`,
        });
      }
    }
  }

  // Compare Zod schemas with Prisma
  for (const [routerFile, zodSchemaList] of zodSchemas.entries()) {
    for (const zodSchema of zodSchemaList) {
      // Try to infer table name from schema name (e.g., createPartnerSchema -> partners)
      const tableName = inferTableName(zodSchema.schemaName);
      const prismaModel = prismaSchema.get(tableName);

      if (!prismaModel) continue; // Skip if can't match to a model

      for (const zodField of zodSchema.fields) {
        const prismaField = prismaModel.fields.find(f => f.name === zodField.name);

        if (!prismaField) {
          mismatches.push({
            table: tableName,
            field: zodField.name,
            mismatchType: 'zod_field_not_in_prisma',
            zodSchema: `${zodField.type}${zodField.isOptional ? '?' : ''}`,
            severity: 'high',
            recommendation: `Field ${zodField.name} in ${routerFile} (${zodSchema.schemaName}) does not exist in Prisma model ${prismaModel.name}. Either add to Prisma/DB or remove from Zod schema.`,
          });
        } else if (zodField.isOptional !== prismaField.isOptional) {
          mismatches.push({
            table: tableName,
            field: zodField.name,
            mismatchType: 'zod_prisma_optionality_mismatch',
            prismaSchema: prismaField.isOptional ? 'optional' : 'required',
            zodSchema: zodField.isOptional ? 'optional' : 'required',
            severity: 'medium',
            recommendation: `Optionality mismatch in ${routerFile}: Zod is ${zodField.isOptional ? 'optional' : 'required'}, Prisma is ${prismaField.isOptional ? 'optional' : 'required'}`,
          });
        }
      }

      // Check for missing Zod fields that are required in Prisma
      for (const prismaField of prismaModel.fields) {
        if (prismaField.isOptional) continue; // Only check required fields
        const zodField = zodSchema.fields.find(f => f.name === prismaField.name);
        if (!zodField) {
          mismatches.push({
            table: tableName,
            field: prismaField.name,
            mismatchType: 'required_prisma_field_missing_in_zod',
            prismaSchema: `${prismaField.type} (required)`,
            severity: 'high',
            recommendation: `Required field ${prismaField.name} in Prisma model ${prismaModel.name} is missing from Zod schema ${zodSchema.schemaName} in ${routerFile}`,
          });
        }
      }
    }
  }

  log(`Found ${mismatches.length} schema mismatches`, mismatches.length > 0 ? 'warn' : 'success');
  return mismatches;
}

function inferTableName(schemaName: string): string {
  // createPartnerSchema -> partners
  // updateContactSchema -> contacts
  // partnerContactSchema -> partner_contacts

  let tableName = schemaName
    .replace(/^(create|update|delete|get)/, '')
    .replace(/Schema$/, '')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');

  // Pluralize common patterns
  if (!tableName.includes('_') && !tableName.endsWith('s')) {
    tableName += 's';
  }

  return tableName;
}

// Step 6: Generate Report
async function generateReport(mismatches: SchemaMismatch[]) {
  log('Generating audit report...', 'info');

  // Ensure output directory exists
  if (!fs.existsSync(REPORT_OUTPUT_DIR)) {
    fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(REPORT_OUTPUT_DIR, `schema-audit-${timestamp}.md`);

  // Group mismatches by severity and table
  const critical = mismatches.filter(m => m.severity === 'critical');
  const high = mismatches.filter(m => m.severity === 'high');
  const medium = mismatches.filter(m => m.severity === 'medium');
  const low = mismatches.filter(m => m.severity === 'low');

  const byTable = new Map<string, SchemaMismatch[]>();
  mismatches.forEach(m => {
    if (!byTable.has(m.table)) {
      byTable.set(m.table, []);
    }
    byTable.get(m.table)!.push(m);
  });

  let report = `# Schema Mismatch Audit Report
**Date**: ${new Date().toISOString()}
**Total Mismatches**: ${mismatches.length}

## Executive Summary

- 🔴 **Critical**: ${critical.length} (Database/Prisma sync issues - may cause runtime errors)
- 🟠 **High**: ${high.length} (Schema definition gaps - should be fixed soon)
- 🟡 **Medium**: ${medium.length} (Optionality/type mismatches - may cause validation issues)
- 🟢 **Low**: ${low.length} (Minor inconsistencies)

---

## Critical Issues (${critical.length})

${critical.length === 0 ? '*No critical issues found*\n' : critical.map(m => `
### ${m.table}.${m.field}
- **Type**: ${m.mismatchType}
- **DB Schema**: ${m.dbSchema || 'N/A'}
- **Prisma Schema**: ${m.prismaSchema || 'N/A'}
- **Zod Schema**: ${m.zodSchema || 'N/A'}
- **Recommendation**: ${m.recommendation}
`).join('\n')}

---

## High Priority Issues (${high.length})

${high.length === 0 ? '*No high priority issues found*\n' : high.map(m => `
### ${m.table}.${m.field}
- **Type**: ${m.mismatchType}
- **DB Schema**: ${m.dbSchema || 'N/A'}
- **Prisma Schema**: ${m.prismaSchema || 'N/A'}
- **Zod Schema**: ${m.zodSchema || 'N/A'}
- **Recommendation**: ${m.recommendation}
`).join('\n')}

---

## Medium Priority Issues (${medium.length})

${medium.length === 0 ? '*No medium priority issues found*\n' : medium.map(m => `
### ${m.table}.${m.field}
- **Type**: ${m.mismatchType}
- **Recommendation**: ${m.recommendation}
`).join('\n')}

---

## Mismatches by Table

${Array.from(byTable.entries()).map(([table, issues]) => `
### ${table} (${issues.length} issues)

${issues.map(m => `- **${m.field}**: ${m.mismatchType} (${m.severity})`).join('\n')}
`).join('\n')}

---

## Remediation Plan

### Phase 1: Critical Fixes (Immediate)
${critical.length === 0 ? '*No critical fixes required*' : critical.map((m, i) => `
${i + 1}. **${m.table}.${m.field}**
   - ${m.recommendation}
`).join('\n')}

### Phase 2: High Priority (Within 1 week)
${high.length === 0 ? '*No high priority fixes required*' : high.map((m, i) => `
${i + 1}. **${m.table}.${m.field}**
   - ${m.recommendation}
`).join('\n')}

### Phase 3: Medium Priority (Within 2 weeks)
${medium.length === 0 ? '*No medium priority fixes required*' : '- Review all optionality and type mismatches\n- Ensure consistent validation across layers'}

---

## Prevention Strategies

1. **Schema Validation CI Check**: Add this audit script to CI pipeline
2. **Pre-commit Hook**: Run schema validation before commits
3. **Code Generation**: Consider using Prisma schema as single source of truth with code generation
4. **Documentation**: Document schema change process (DB → Prisma → Zod → Forms)
5. **Type Safety**: Leverage TypeScript more heavily to catch mismatches at compile time

---

**End of Report**
`;

  fs.writeFileSync(reportPath, report);
  log(`Report saved to: ${reportPath}`, 'success');

  // Also save JSON version for programmatic access
  const jsonPath = reportPath.replace('.md', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: mismatches.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
    },
    mismatches,
  }, null, 2));
  log(`JSON data saved to: ${jsonPath}`, 'success');

  return reportPath;
}

// Main execution
async function main() {
  console.log('\n🔍 Starting Comprehensive Schema Mismatch Audit\n');
  console.log('=' .repeat(60));

  try {
    const dbSchema = await getDatabaseSchema();
    const prismaSchema = await getPrismaSchema();
    const zodSchemas = await getZodSchemas();
    const formSchemas = await getFormSchemas();

    const mismatches = await findMismatches(dbSchema, prismaSchema, zodSchemas, formSchemas);

    const reportPath = await generateReport(mismatches);

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Audit complete! Found ${mismatches.length} schema mismatches.`);
    console.log(`\n📄 Report: ${reportPath}\n`);

    // Exit with error code if critical or high issues found
    const critical = mismatches.filter(m => m.severity === 'critical').length;
    const high = mismatches.filter(m => m.severity === 'high').length;

    if (critical > 0 || high > 0) {
      console.log(`⚠️  Found ${critical} critical and ${high} high priority issues that need immediate attention.\n`);
      process.exit(1);
    }

  } catch (error) {
    log(`Audit failed: ${error}`, 'error');
    process.exit(1);
  }
}

main();
