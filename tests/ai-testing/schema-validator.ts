/**
 * Schema Validator
 * Compares Prisma models against actual database tables
 */

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import type { SchemaReport } from './types';

export class SchemaValidator {
  private prisma: PrismaClient;

  constructor(private projectRoot: string) {
    this.prisma = new PrismaClient();
  }

  /**
   * Validate Prisma schema against actual database
   */
  async validate(): Promise<SchemaReport> {
    console.log('🗄️  Validating database schema...');

    const schemaPath = path.join(this.projectRoot, 'prisma', 'schema.prisma');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');

    const models = this.extractModels(schemaContent);
    const tables = await this.getDatabaseTables();

    console.log(`   Found ${models.length} Prisma models`);
    console.log(`   Found ${tables.length} database tables`);

    const issues = this.compareModelsToTables(models, tables);

    const report: SchemaReport = {
      modelCount: models.length,
      tableCount: tables.length,
      discrepancy: Math.abs(models.length - tables.length),
      validatedCount: models.length - issues.filter(i => i.type === 'missing_table').length,
      issues,
      recommendations: this.generateRecommendations(issues),
    };

    console.log(`   ✅ Validated ${report.validatedCount}/${models.length} models`);
    console.log(`   ⚠️  Found ${issues.length} issues`);

    return report;
  }

  /**
   * Extract all model names from Prisma schema
   */
  private extractModels(schema: string): string[] {
    const modelRegex = /model\s+(\w+)\s*{/g;
    const models: string[] = [];
    let match;

    while ((match = modelRegex.exec(schema)) !== null) {
      models.push(match[1]);
    }

    return models;
  }

  /**
   * Get all tables from database
   */
  private async getDatabaseTables(): Promise<string[]> {
    try {
      // Query information_schema to get actual tables
      const result = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;

      return result.map((r) => r.tablename);
    } catch (error) {
      console.error('Error fetching database tables:', error);
      return [];
    }
  }

  /**
   * Compare models to tables and identify issues
   */
  private compareModelsToTables(models: string[], tables: string[]): SchemaReport['issues'] {
    const issues: SchemaReport['issues'] = [];

    // Check for models without corresponding tables
    for (const model of models) {
      const tableName = this.modelToTableName(model);
      if (!tables.includes(tableName)) {
        issues.push({
          type: 'missing_table',
          model,
          expected: tableName,
          actual: 'none',
        });
      }
    }

    // Check for tables without corresponding models
    for (const table of tables) {
      const modelName = this.tableToModelName(table);
      if (!models.includes(modelName) && !this.isSystemTable(table)) {
        issues.push({
          type: 'missing_table',
          table,
          expected: modelName,
          actual: 'none',
        });
      }
    }

    return issues;
  }

  /**
   * Convert PascalCase model name to snake_case table name
   */
  private modelToTableName(model: string): string {
    return model.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
  }

  /**
   * Convert snake_case table name to PascalCase model name
   */
  private tableToModelName(table: string): string {
    return table
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Check if table is a system table
   */
  private isSystemTable(table: string): boolean {
    return (
      table.startsWith('_') ||
      table.startsWith('pg_') ||
      table === 'spatial_ref_sys' ||
      table === 'geography_columns' ||
      table === 'geometry_columns'
    );
  }

  /**
   * Generate recommendations based on issues found
   */
  private generateRecommendations(issues: SchemaReport['issues']): string[] {
    const recommendations: string[] = [];

    const missingTables = issues.filter((i) => i.type === 'missing_table' && i.model);
    if (missingTables.length > 0) {
      recommendations.push(
        `Run 'npx prisma db push' to sync ${missingTables.length} missing tables from Prisma schema to database`
      );
    }

    const extraTables = issues.filter((i) => i.type === 'missing_table' && i.table);
    if (extraTables.length > 0) {
      recommendations.push(
        `${extraTables.length} database tables exist without Prisma models. Review and add models to schema.prisma if needed`
      );
    }

    return recommendations;
  }

  /**
   * Generate detailed markdown report
   */
  generateMarkdownReport(report: SchemaReport): string {
    let md = '# Database Schema Validation Report\n\n';
    md += `**Generated**: ${new Date().toISOString()}\n\n`;

    md += '## Summary\n\n';
    md += `- **Prisma Models**: ${report.modelCount}\n`;
    md += `- **Database Tables**: ${report.tableCount}\n`;
    md += `- **Discrepancy**: ${report.discrepancy}\n`;
    md += `- **Validated**: ${report.validatedCount}/${report.modelCount}\n`;
    md += `- **Issues Found**: ${report.issues.length}\n\n`;

    if (report.issues.length > 0) {
      md += '## Issues\n\n';

      const missingModels = report.issues.filter(i => i.model && !i.table);
      if (missingModels.length > 0) {
        md += '### Models Without Database Tables\n\n';
        missingModels.forEach(issue => {
          md += `- ❌ **${issue.model}** → Expected table: \`${issue.expected}\`\n`;
        });
        md += '\n';
      }

      const missingTables = report.issues.filter(i => i.table && !i.model);
      if (missingTables.length > 0) {
        md += '### Database Tables Without Prisma Models\n\n';
        missingTables.forEach(issue => {
          md += `- ⚠️  **${issue.table}** → Expected model: \`${issue.expected}\`\n`;
        });
        md += '\n';
      }
    }

    if (report.recommendations.length > 0) {
      md += '## Recommendations\n\n';
      report.recommendations.forEach((rec, i) => {
        md += `${i + 1}. ${rec}\n`;
      });
      md += '\n';
    }

    return md;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
