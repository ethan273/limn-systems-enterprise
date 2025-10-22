/**
 * Field Usage Audit Script
 *
 * Analyzes all tRPC queries to identify which database fields are actually used
 * by components. This ensures we don't accidentally omit required fields when
 * adding SELECT statements for performance optimization.
 *
 * CRITICAL: This must be run BEFORE adding any SELECT statements to queries.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface FieldUsage {
  model: string;
  router: string;
  endpoint: string;
  fieldsUsed: Set<string>;
  sourceFiles: string[];
  usageExamples: string[];
}

const fieldUsageMap = new Map<string, FieldUsage>();

/**
 * Extract model name from Prisma query
 */
function extractModelFromQuery(line: string): string | null {
  const match = line.match(/ctx\.db\.(\w+)\.(findMany|findFirst|findUnique|findFirstOrThrow|findUniqueOrThrow)/);
  return match ? match[1] : null;
}

/**
 * Find all field accesses in component files
 */
function findFieldAccesses(content: string, queryName: string): Set<string> {
  const fields = new Set<string>();

  // Match patterns like: data.fieldName, item.fieldName, obj?.fieldName
  const accessPatterns = [
    /(?:data|item|row|obj|entity|record)\.(\w+)/g,
    /(?:data|item|row|obj|entity|record)\?\.(\w+)/g,
    /\{[\s]*(\w+)[\s]*\}/g,  // Destructuring
  ];

  for (const pattern of accessPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fieldName = match[1];
      if (fieldName && !isCommonMethod(fieldName)) {
        fields.add(fieldName);
      }
    }
  }

  return fields;
}

/**
 * Check if field name is a common method (not a database field)
 */
function isCommonMethod(name: string): boolean {
  const commonMethods = [
    'map', 'filter', 'reduce', 'find', 'some', 'every', 'forEach',
    'push', 'pop', 'shift', 'unshift', 'slice', 'splice',
    'length', 'toString', 'toJSON', 'valueOf', 'hasOwnProperty',
    'then', 'catch', 'finally', 'mutate', 'mutateAsync',
    'data', 'isLoading', 'error', 'refetch', 'status',
  ];
  return commonMethods.includes(name);
}

/**
 * Scan router files to find all queries
 */
function scanRouterFiles(routerDir: string): void {
  const files = readdirSync(routerDir);

  for (const file of files) {
    const filePath = join(routerDir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      scanRouterFiles(filePath);
    } else if (file.endsWith('.ts')) {
      scanRouterFile(filePath);
    }
  }
}

/**
 * Scan a single router file
 */
function scanRouterFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let currentEndpoint = '';
  let currentModel = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect endpoint definition
    const endpointMatch = line.match(/(\w+):\s*(?:publicProcedure|protectedProcedure)/);
    if (endpointMatch) {
      currentEndpoint = endpointMatch[1] || '';
    }

    // Detect Prisma query
    const model = extractModelFromQuery(line);
    if (model) {
      currentModel = model;
      const key = `${model}.${currentEndpoint}`;

      if (!fieldUsageMap.has(key)) {
        fieldUsageMap.set(key, {
          model,
          router: filePath.replace(/.*\/routers\//, ''),
          endpoint: currentEndpoint,
          fieldsUsed: new Set(),
          sourceFiles: [],
          usageExamples: [],
        });
      }
    }
  }
}

/**
 * Scan component files to find field usage
 */
function scanComponentFiles(componentDir: string): void {
  const files = readdirSync(componentDir);

  for (const file of files) {
    const filePath = join(componentDir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      scanComponentFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      scanComponentFile(filePath);
    }
  }
}

/**
 * Scan a single component file
 */
function scanComponentFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');

  // Find all API calls
  const apiCalls = content.matchAll(/api\.(\w+)\.(\w+)\.useQuery/g);

  for (const match of apiCalls) {
    const router = match[1];
    const endpoint = match[2];

    // Find which fields are accessed after this query
    const fields = findFieldAccesses(content, endpoint || '');

    // Try to match with our field usage map
    for (const [key, usage] of fieldUsageMap.entries()) {
      if (key.includes(endpoint || '')) {
        for (const field of fields) {
          usage.fieldsUsed.add(field);
        }
        usage.sourceFiles.push(filePath.replace(/.*\/src\//, 'src/'));
      }
    }
  }
}

/**
 * Generate comprehensive report
 */
function generateReport(): string {
  let report = '# Field Usage Audit Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Total Queries Analyzed:** ${fieldUsageMap.size}\n\n`;
  report += '---\n\n';

  // Group by model
  const modelGroups = new Map<string, FieldUsage[]>();
  for (const usage of fieldUsageMap.values()) {
    if (!modelGroups.has(usage.model)) {
      modelGroups.set(usage.model, []);
    }
    modelGroups.get(usage.model)?.push(usage);
  }

  for (const [model, usages] of modelGroups.entries()) {
    report += `## Model: ${model}\n\n`;

    for (const usage of usages) {
      report += `### ${usage.router} → ${usage.endpoint}\n\n`;
      report += `**Fields Used:** ${usage.fieldsUsed.size > 0 ? usage.fieldsUsed.size : 'Unknown (no usage found)'}\n\n`;

      if (usage.fieldsUsed.size > 0) {
        report += '```typescript\n';
        report += `// Safe SELECT statement for ${model}.${usage.endpoint}\n`;
        report += `select: {\n`;
        for (const field of Array.from(usage.fieldsUsed).sort()) {
          report += `  ${field}: true,\n`;
        }
        report += `}\n`;
        report += '```\n\n';
      } else {
        report += '⚠️ **WARNING:** No field usage detected. Either:\n';
        report += '1. Fields are accessed dynamically (unsafe to optimize)\n';
        report += '2. This endpoint is unused\n';
        report += '3. Detection failed (manual review needed)\n\n';
        report += '**Recommendation:** Manual review required before adding SELECT\n\n';
      }

      if (usage.sourceFiles.length > 0) {
        report += `**Used in ${usage.sourceFiles.length} file(s):**\n`;
        for (const file of usage.sourceFiles) {
          report += `- ${file}\n`;
        }
        report += '\n';
      }

      report += '---\n\n';
    }
  }

  // Summary statistics
  report += '## Summary Statistics\n\n';
  report += `- **Total Models:** ${modelGroups.size}\n`;
  report += `- **Total Endpoints:** ${fieldUsageMap.size}\n`;

  const detectedUsage = Array.from(fieldUsageMap.values()).filter(u => u.fieldsUsed.size > 0).length;
  const unknownUsage = fieldUsageMap.size - detectedUsage;

  report += `- **Endpoints with Detected Usage:** ${detectedUsage}\n`;
  report += `- **Endpoints Requiring Manual Review:** ${unknownUsage}\n\n`;

  if (unknownUsage > 0) {
    report += `⚠️ **${unknownUsage} endpoints require manual review before optimization**\n\n`;
  }

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Starting Field Usage Audit...\n');

  // Step 1: Scan router files to find all queries
  console.log('📂 Scanning router files...');
  const routerDir = join(process.cwd(), 'src/server/api/routers');
  scanRouterFiles(routerDir);
  console.log(`   Found ${fieldUsageMap.size} queries\n`);

  // Step 2: Scan component files to find field usage
  console.log('📂 Scanning component files...');
  const appDir = join(process.cwd(), 'src/app');
  scanComponentFiles(appDir);
  console.log(`   Scanned components\n`);

  // Step 3: Generate report
  console.log('📊 Generating report...');
  const report = generateReport();

  const reportPath = join(process.cwd(), 'docs/performance/FIELD-USAGE-AUDIT-REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`   Report saved to: ${reportPath}\n`);

  // Step 4: Generate safe SELECT statements file
  console.log('📝 Generating safe SELECT statements...');
  let safeSelects = '# Safe SELECT Statements\n\n';
  safeSelects += '**IMPORTANT:** Only use these SELECT statements if all required fields are included.\n\n';
  safeSelects += '---\n\n';

  for (const [key, usage] of fieldUsageMap.entries()) {
    if (usage.fieldsUsed.size > 0) {
      safeSelects += `## ${key}\n\n`;
      safeSelects += '```typescript\n';
      safeSelects += `select: {\n`;
      for (const field of Array.from(usage.fieldsUsed).sort()) {
        safeSelects += `  ${field}: true,\n`;
      }
      safeSelects += `}\n`;
      safeSelects += '```\n\n';
    }
  }

  const selectsPath = join(process.cwd(), 'docs/performance/SAFE-SELECT-STATEMENTS.md');
  writeFileSync(selectsPath, safeSelects, 'utf-8');
  console.log(`   Saved to: ${selectsPath}\n`);

  console.log('✅ Field Usage Audit Complete!\n');
  console.log('Next Steps:');
  console.log('1. Review FIELD-USAGE-AUDIT-REPORT.md');
  console.log('2. Manually review endpoints with unknown usage');
  console.log('3. Use SAFE-SELECT-STATEMENTS.md as reference for optimizations');
}

main().catch(console.error);
