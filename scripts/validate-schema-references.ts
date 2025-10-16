#!/usr/bin/env ts-node

/**
 * AUTOMATED SCHEMA VALIDATOR
 *
 * Scans entire codebase for table/column references and validates against Prisma schema.
 * Reports all mismatches to prevent runtime errors and RLS policy failures.
 *
 * Usage:
 *   npx ts-node scripts/validate-schema-references.ts
 *
 * Exit codes:
 *   0 - All schema references valid
 *   1 - Schema violations found
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface SchemaViolation {
  file: string;
  line: number;
  type: 'table' | 'column' | 'enum' | 'relation';
  invalid: string;
  context: string;
  suggestion?: string;
}

interface SchemaMetadata {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
  enums: Map<string, Set<string>>;
  relations: Map<string, string[]>;
}

class SchemaValidator {
  private violations: SchemaViolation[] = [];
  private schema: SchemaMetadata = {
    tables: new Set(),
    columns: new Map(),
    enums: new Map(),
    relations: new Map(),
  };

  private schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  private excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

  /**
   * Initialize by parsing Prisma schema
   */
  async initialize(): Promise<void> {
    console.log('🔍 Parsing Prisma schema...');

    const schemaContent = fs.readFileSync(this.schemaPath, 'utf-8');

    // Extract models (tables)
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
    let modelMatch;

    while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
      const tableName = modelMatch[1];
      const modelBody = modelMatch[2];

      this.schema.tables.add(tableName);

      // Extract fields (columns)
      const fieldRegex = /^\s*(\w+)\s+/gm;
      const fields = new Set<string>();
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
        const fieldName = fieldMatch[1];
        // Skip Prisma keywords
        if (!['@@', '//'].some(kw => fieldName.startsWith(kw))) {
          fields.add(fieldName);
        }
      }

      this.schema.columns.set(tableName, fields);

      // Extract relations
      const relationRegex = /(\w+)\s+(\w+)\[\]|\s+(\w+)\??\s+(\w+)\??\s+@relation/g;
      const relations: string[] = [];
      let relationMatch;

      while ((relationMatch = relationRegex.exec(modelBody)) !== null) {
        const relatedTable = relationMatch[2] || relationMatch[4];
        if (relatedTable && this.schema.tables.has(relatedTable)) {
          relations.push(relatedTable);
        }
      }

      this.schema.relations.set(tableName, relations);
    }

    // Extract enums
    const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g;
    let enumMatch;

    while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
      const enumName = enumMatch[1];
      const enumBody = enumMatch[2];

      const values = new Set<string>();
      const valueRegex = /^\s*(\w+)/gm;
      let valueMatch;

      while ((valueMatch = valueRegex.exec(enumBody)) !== null) {
        const value = valueMatch[1];
        if (!value.startsWith('@@')) {
          values.add(value);
        }
      }

      this.schema.enums.set(enumName, values);
    }

    console.log(`✅ Found ${this.schema.tables.size} tables, ${this.schema.enums.size} enums`);
  }

  /**
   * Scan directory for schema violations
   */
  async scanDirectory(dir: string, extensions = ['.ts', '.tsx', '.sql', '.js']): Promise<void> {
    const files = this.getAllFiles(dir, extensions);

    console.log(`\n📂 Scanning ${files.length} files in ${dir}...`);

    for (const file of files) {
      await this.scanFile(file);
    }
  }

  /**
   * Recursively get all files with specified extensions
   */
  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    const scan = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!this.excludeDirs.includes(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile()) {
          if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Check if line is a comment
   */
  private isComment(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('--') ||
      trimmed.startsWith('#')
    );
  }

  /**
   * Remove string literals from line to avoid matching text inside strings
   */
  private removeStringLiterals(line: string): string {
    // Remove single-quoted strings
    let cleaned = line.replace(/'[^']*'/g, "''");
    // Remove double-quoted strings
    cleaned = cleaned.replace(/"[^"]*"/g, '""');
    // Remove backtick strings
    cleaned = cleaned.replace(/`[^`]*`/g, '``');
    return cleaned;
  }

  /**
   * Scan individual file for schema violations
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Skip comments
      if (this.isComment(line)) {
        return;
      }

      // Remove string content to avoid false positives
      const cleanedLine = this.removeStringLiterals(line);

      // Pattern 1: Supabase queries - .from('table_name')
      const supabaseFromRegex = /\.from\(['"``](\w+)['"``]\)/g;
      let match;

      while ((match = supabaseFromRegex.exec(cleanedLine)) !== null) {
        const tableName = match[1];
        this.validateTableReference(tableName, filePath, lineNumber, line);
      }

      // Pattern 2: Prisma queries - prisma.table_name
      const prismaTableRegex = /prisma\.(\w+)\./g;
      while ((match = prismaTableRegex.exec(cleanedLine)) !== null) {
        const tableName = match[1];
        this.validateTableReference(tableName, filePath, lineNumber, line);
      }

      // Pattern 3: SQL FROM/JOIN clauses (uppercase only to avoid natural language)
      const sqlTableRegex = /\b(?:FROM|JOIN)\s+(\w+)/g;
      while ((match = sqlTableRegex.exec(cleanedLine)) !== null) {
        const tableName = match[1];
        // Skip SQL keywords and only validate if line looks like SQL (has SELECT, UPDATE, DELETE, etc)
        const hasSQL = /\b(SELECT|UPDATE|DELETE|INSERT)\b/.test(cleanedLine.toUpperCase());
        if (hasSQL && !['SELECT', 'WHERE', 'ON', 'SET', 'VALUES'].includes(tableName.toUpperCase())) {
          this.validateTableReference(tableName, filePath, lineNumber, line);
        }
      }

      // Pattern 4: SQL ALTER TABLE (uppercase only)
      const alterTableRegex = /\bALTER\s+TABLE\s+(\w+)/g;
      while ((match = alterTableRegex.exec(cleanedLine)) !== null) {
        const tableName = match[1];
        this.validateTableReference(tableName, filePath, lineNumber, line);
      }

      // Pattern 5: Column references in .eq(), .select(), etc.
      const columnRefRegex = /\.(?:eq|select|update|insert)\(['"``](\w+)['"``]/g;
      while ((match = columnRefRegex.exec(cleanedLine)) !== null) {
        const columnName = match[1];
        // Try to infer table from context (previous .from() call)
        const tableName = this.inferTableFromContext(cleanedLine, content.substring(0, content.indexOf(line)));
        if (tableName) {
          this.validateColumnReference(tableName, columnName, filePath, lineNumber, line);
        }
      }

      // Pattern 6: Enum value checks
      const enumValueRegex = /user_type\s*(?:===|IN|=)\s*[('"`](\w+)[)'"`]/g;
      while ((match = enumValueRegex.exec(cleanedLine)) !== null) {
        const enumValue = match[1];
        this.validateEnumValue('user_type_enum', enumValue, filePath, lineNumber, line);
      }
    });
  }

  /**
   * Check if table is a system/framework table that should be ignored
   */
  private isSystemTable(tableName: string): boolean {
    const systemTables = [
      'information_schema',
      'pg_catalog',
      'pg_indexes',
      'pg_stat',
      'pg_tables',
      'auth', // Supabase auth schema
      'public', // Schema qualifier
      'storage', // Supabase storage schema
    ];

    return systemTables.includes(tableName) ||
           tableName.startsWith('pg_') ||
           tableName.startsWith('_prisma');
  }

  /**
   * Validate table name exists in schema
   */
  private validateTableReference(tableName: string, file: string, line: number, context: string): void {
    // Skip system tables
    if (this.isSystemTable(tableName)) {
      return;
    }

    if (!this.schema.tables.has(tableName)) {
      // Check for similar table names
      const suggestion = this.findSimilarTable(tableName);

      this.violations.push({
        file,
        line,
        type: 'table',
        invalid: tableName,
        context: context.trim(),
        suggestion,
      });
    }
  }

  /**
   * Validate column exists in table
   */
  private validateColumnReference(
    table: string,
    column: string,
    file: string,
    line: number,
    context: string
  ): void {
    const columns = this.schema.columns.get(table);

    if (!columns || !columns.has(column)) {
      const suggestion = this.findSimilarColumn(table, column);

      this.violations.push({
        file,
        line,
        type: 'column',
        invalid: `${table}.${column}`,
        context: context.trim(),
        suggestion,
      });
    }
  }

  /**
   * Validate enum value exists
   */
  private validateEnumValue(
    enumName: string,
    value: string,
    file: string,
    line: number,
    context: string
  ): void {
    const enumValues = this.schema.enums.get(enumName);

    if (!enumValues || !enumValues.has(value)) {
      const suggestion = Array.from(enumValues || []).join(', ');

      this.violations.push({
        file,
        line,
        type: 'enum',
        invalid: `${enumName}.${value}`,
        context: context.trim(),
        suggestion: suggestion ? `Valid values: ${suggestion}` : undefined,
      });
    }
  }

  /**
   * Try to infer table name from context
   */
  private inferTableFromContext(currentLine: string, previousContent: string): string | null {
    // Look for .from() in current line first
    const fromMatch = currentLine.match(/\.from\(['"`](\w+)['"`]\)/);
    if (fromMatch) {
      return fromMatch[1];
    }

    // Look backwards in content for recent .from()
    const lines = previousContent.split('\n').reverse();
    for (const line of lines.slice(0, 10)) { // Check last 10 lines
      const match = line.match(/\.from\(['"`](\w+)['"`]\)/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Find similar table name using Levenshtein distance
   */
  private findSimilarTable(tableName: string): string | undefined {
    const threshold = 3;
    let bestMatch: string | undefined;
    let bestDistance = Infinity;

    for (const table of this.schema.tables) {
      const distance = this.levenshteinDistance(tableName.toLowerCase(), table.toLowerCase());
      if (distance < bestDistance && distance <= threshold) {
        bestDistance = distance;
        bestMatch = table;
      }
    }

    return bestMatch ? `Did you mean '${bestMatch}'?` : undefined;
  }

  /**
   * Find similar column name in table
   */
  private findSimilarColumn(tableName: string, columnName: string): string | undefined {
    const columns = this.schema.columns.get(tableName);
    if (!columns) return undefined;

    const threshold = 3;
    let bestMatch: string | undefined;
    let bestDistance = Infinity;

    for (const column of columns) {
      const distance = this.levenshteinDistance(columnName.toLowerCase(), column.toLowerCase());
      if (distance < bestDistance && distance <= threshold) {
        bestDistance = distance;
        bestMatch = column;
      }
    }

    return bestMatch ? `Did you mean '${tableName}.${bestMatch}'?` : undefined;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate detailed markdown report
   */
  generateReport(): string {
    if (this.violations.length === 0) {
      return `# ✅ Schema Validation Report

**Date:** ${new Date().toISOString()}
**Status:** All schema references valid!

No violations found. All table and column references match the Prisma schema.
`;
    }

    // Group violations by type
    const byType = {
      table: this.violations.filter(v => v.type === 'table'),
      column: this.violations.filter(v => v.type === 'column'),
      enum: this.violations.filter(v => v.type === 'enum'),
      relation: this.violations.filter(v => v.type === 'relation'),
    };

    // Group violations by file
    const byFile = new Map<string, SchemaViolation[]>();
    for (const violation of this.violations) {
      const existing = byFile.get(violation.file) || [];
      existing.push(violation);
      byFile.set(violation.file, existing);
    }

    let report = `# ❌ Schema Validation Report

**Date:** ${new Date().toISOString()}
**Status:** ${this.violations.length} violations found

---

## 📊 Summary

| Violation Type | Count |
|----------------|-------|
| Invalid Tables | ${byType.table.length} |
| Invalid Columns | ${byType.column.length} |
| Invalid Enum Values | ${byType.enum.length} |
| Invalid Relations | ${byType.relation.length} |
| **Total** | **${this.violations.length}** |

---

## 🔴 Violations by Type

`;

    // Table violations
    if (byType.table.length > 0) {
      report += `### Invalid Table References (${byType.table.length})\n\n`;
      for (const v of byType.table) {
        report += `**${v.file}:${v.line}**\n`;
        report += `- ❌ Table \`${v.invalid}\` does not exist\n`;
        if (v.suggestion) report += `- 💡 ${v.suggestion}\n`;
        report += `- Code: \`${v.context}\`\n\n`;
      }
    }

    // Column violations
    if (byType.column.length > 0) {
      report += `### Invalid Column References (${byType.column.length})\n\n`;
      for (const v of byType.column) {
        report += `**${v.file}:${v.line}**\n`;
        report += `- ❌ Column \`${v.invalid}\` does not exist\n`;
        if (v.suggestion) report += `- 💡 ${v.suggestion}\n`;
        report += `- Code: \`${v.context}\`\n\n`;
      }
    }

    // Enum violations
    if (byType.enum.length > 0) {
      report += `### Invalid Enum Values (${byType.enum.length})\n\n`;
      for (const v of byType.enum) {
        report += `**${v.file}:${v.line}**\n`;
        report += `- ❌ Enum value \`${v.invalid}\` does not exist\n`;
        if (v.suggestion) report += `- 💡 ${v.suggestion}\n`;
        report += `- Code: \`${v.context}\`\n\n`;
      }
    }

    report += `---

## 📁 Violations by File

`;

    for (const [file, violations] of byFile.entries()) {
      report += `### ${file} (${violations.length} violations)\n\n`;
      for (const v of violations) {
        report += `- **Line ${v.line}:** ${v.type} - \`${v.invalid}\`\n`;
        if (v.suggestion) report += `  - ${v.suggestion}\n`;
      }
      report += '\n';
    }

    report += `---

## 🔧 How to Fix

1. **Review each violation** listed above
2. **Check Prisma schema** for correct table/column names
3. **Update code** to use valid schema references
4. **Re-run validator** to verify fixes: \`npx ts-node scripts/validate-schema-references.ts\`

---

**Prepared by:** Schema Validator
**Date:** ${new Date().toISOString()}
`;

    return report;
  }
}

// Main execution
async function main() {
  const validator = new SchemaValidator();

  try {
    await validator.initialize();

    // Scan directories
    await validator.scanDirectory('src');
    await validator.scanDirectory('tests');
    await validator.scanDirectory('scripts');

    // Generate report
    const report = validator.generateReport();

    // Write to file
    const reportPath = path.join(process.cwd(), 'SCHEMA-VIOLATIONS-REPORT.md');
    fs.writeFileSync(reportPath, report);

    console.log(`\n📄 Report written to: ${reportPath}`);

    // Exit with appropriate code
    if (validator['violations'].length > 0) {
      console.error(`\n❌ Found ${validator['violations'].length} schema violations!`);
      process.exit(1);
    } else {
      console.log('\n✅ All schema references valid!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
