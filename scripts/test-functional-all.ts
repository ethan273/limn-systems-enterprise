/**
 * COMPREHENSIVE FUNCTIONAL TEST - ALL MODULES
 *
 * Tests ALL functionality across the ENTIRE application:
 * - Dashboard
 * - CRM (Contacts, Customers, Leads, Projects, Prospects)
 * - Production (Orders, QC)
 * - Products (Catalog, Concepts, Prototypes)
 * - Design (Briefs, Projects, Moodboards)
 * - Shipping (Shipments, Tracking)
 * - Financials (Invoices, Payments)
 * - Tasks (List, Kanban)
 * - Admin (Users, Roles, Analytics)
 *
 * STRATEGY:
 * 1. Test ALL modules sequentially (memory-safe)
 * 2. Compile ALL errors from ALL modules
 * 3. Analyze patterns GLOBALLY across entire app
 * 4. Recommend holistic fixes that solve root causes
 */

import { FunctionalAuditor } from './lib/functional-auditor';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

const ALL_MODULES = {
  dashboard: {
    name: 'Dashboard',
    routes: ['/dashboard', '/offline'],
  },
  crm: {
    name: 'CRM',
    routes: [
      '/crm/contacts',
      '/crm/customers',
      '/crm/leads',
      '/crm/projects',
      '/crm/prospects',
    ],
  },
  production: {
    name: 'Production',
    routes: [
      '/production/orders',
      '/production/qc',
    ],
  },
  products: {
    name: 'Products',
    routes: [
      '/products/catalog',
      '/products/concepts',
      '/products/prototypes',
    ],
  },
  design: {
    name: 'Design',
    routes: [
      '/design/projects',
    ],
  },
  shipping: {
    name: 'Shipping',
    routes: [
      '/shipping/shipments',
    ],
  },
  financials: {
    name: 'Financials',
    routes: [
      '/financials/invoices',
    ],
  },
  tasks: {
    name: 'Tasks',
    routes: [
      '/tasks/kanban',
    ],
  },
  admin: {
    name: 'Admin',
    routes: [
      '/admin/users',
      '/admin/roles',
      '/admin/analytics',
    ],
  },
};

// ============================================================================
// GLOBAL PATTERN AGGREGATOR
// ============================================================================

interface GlobalPattern {
  type: string;
  category: 'CRUD' | 'UI' | 'DATA' | 'INTEGRATION';
  severity: 'critical' | 'high' | 'medium' | 'low';
  totalOccurrences: number;
  affectedModules: string[];
  affectedPages: string[];
  recommendedFix: string;
  codeExample?: string;
}

class GlobalPatternAnalyzer {
  private patterns: Map<string, GlobalPattern> = new Map();
  private allResults: any[] = [];

  addModuleResults(module: string, results: any): void {
    this.allResults.push({ module, ...results });
  }

  analyzeGlobalPatterns(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 GLOBAL PATTERN ANALYSIS ACROSS ALL MODULES');
    console.log('='.repeat(80) + '\n');

    // Analyze all results together
    for (const moduleResult of this.allResults) {
      if (!moduleResult.errorPatterns) continue;

      for (const [key, pattern] of Object.entries(moduleResult.errorPatterns as any)) {
        const globalKey = pattern.type;

        if (this.patterns.has(globalKey)) {
          const existing = this.patterns.get(globalKey)!;
          existing.totalOccurrences += pattern.occurrences;
          if (!existing.affectedModules.includes(moduleResult.module)) {
            existing.affectedModules.push(moduleResult.module);
          }
          existing.affectedPages.push(...pattern.affectedPages);
        } else {
          this.patterns.set(globalKey, {
            type: pattern.type,
            category: pattern.category,
            severity: pattern.severity,
            totalOccurrences: pattern.occurrences,
            affectedModules: [moduleResult.module],
            affectedPages: [...pattern.affectedPages],
            recommendedFix: this.generateGlobalFix(pattern.type, [moduleResult.module]),
            codeExample: this.generateCodeExample(pattern.type),
          });
        }
      }
    }

    this.printGlobalPatterns();
  }

  private generateGlobalFix(type: string, modules: string[]): string {
    if (type === 'CREATE_FAILED') {
      return `GLOBAL FIX: Implement Add/Create buttons across ALL modules. Pattern detected in ${modules.length} module(s). This requires:
1. Add "Add" button to list pages
2. Create dialog/form components for each entity
3. Implement tRPC create mutations
4. Connect form submissions to database`;
    }
    if (type === 'UPDATE_FAILED') {
      return `GLOBAL FIX: Implement Edit functionality across ALL modules. This requires:
1. Add "Edit" buttons to table rows
2. Pre-populate forms with existing data
3. Implement tRPC update mutations
4. Verify database updates`;
    }
    if (type === 'DELETE_FAILED') {
      return `GLOBAL FIX: Implement Delete functionality across ALL modules. This requires:
1. Add "Delete" buttons to table rows
2. Add confirmation dialogs
3. Implement tRPC delete mutations
4. Handle cascade deletions properly`;
    }
    return 'Investigate and fix globally';
  }

  private generateCodeExample(type: string): string {
    if (type === 'CREATE_FAILED') {
      return `
// Example: Add button to CRM pages
// File: src/app/crm/[entity]/page.tsx

export default function EntityPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsCreateOpen(true)}>Add New</Button>
      <CreateDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

// File: src/components/crm/CreateDialog.tsx
const createMutation = api.crm.entity.create.useMutation({
  onSuccess: () => {
    router.refresh();
    toast.success('Created successfully');
    onClose();
  }
});`;
    }
    return '';
  }

  private printGlobalPatterns(): void {
    const sortedPatterns = Array.from(this.patterns.values()).sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const pattern of sortedPatterns) {
      const icon = pattern.severity === 'critical' ? '🚨' : pattern.severity === 'high' ? '⚠️' : '⚡';
      console.log(`${icon} ${pattern.type} (${pattern.severity.toUpperCase()})`);
      console.log(`   Occurrences: ${pattern.totalOccurrences} across ${pattern.affectedModules.length} modules`);
      console.log(`   Affected Modules: ${pattern.affectedModules.join(', ')}`);
      console.log(`   Affected Pages: ${pattern.affectedPages.length} total`);
      console.log(`   Fix: ${pattern.recommendedFix}`);
      console.log('');
    }
  }

  generateGlobalReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# COMPREHENSIVE FUNCTIONAL AUDIT - ALL MODULES\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Modules Tested**: ${this.allResults.length}\n`;

    const totalPages = this.allResults.reduce((sum, r) => sum + (r.results?.crud?.length || 0), 0);
    report += `**Total Pages Tested**: ${totalPages}\n\n`;

    // Global Summary
    report += `## 📊 GLOBAL SUMMARY\n\n`;
    const totalTests = this.allResults.reduce((sum, r) => {
      return sum + (r.results?.crud?.length || 0) * 4;
    }, 0);

    const passedTests = this.allResults.reduce((sum, r) => {
      if (!r.results?.crud) return sum;
      return sum + r.results.crud.reduce((s: number, test: any) => {
        return s +
          (test.create.success ? 1 : 0) +
          (test.read.success ? 1 : 0) +
          (test.update.success ? 1 : 0) +
          (test.delete.success ? 1 : 0);
      }, 0);
    }, 0);

    report += `- **Total CRUD Tests**: ${totalTests}\n`;
    report += `- **Passing**: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)\n`;
    report += `- **Failing**: ${totalTests - passedTests} (${Math.round((totalTests - passedTests) / totalTests * 100)}%)\n`;
    report += `- **Unique Error Patterns**: ${this.patterns.size}\n\n`;

    // Global Patterns
    if (this.patterns.size > 0) {
      report += `## 🔬 GLOBAL ERROR PATTERNS\n\n`;
      const sortedPatterns = Array.from(this.patterns.values()).sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      for (const pattern of sortedPatterns) {
        const icon = pattern.severity === 'critical' ? '🚨' : pattern.severity === 'high' ? '⚠️' : '⚡';
        report += `### ${icon} ${pattern.type} (${pattern.severity.toUpperCase()})\n\n`;
        report += `- **Total Occurrences**: ${pattern.totalOccurrences}\n`;
        report += `- **Affected Modules**: ${pattern.affectedModules.join(', ')}\n`;
        report += `- **Affected Pages**: ${pattern.affectedPages.length}\n`;
        report += `- **Recommended Fix**: ${pattern.recommendedFix}\n`;

        if (pattern.codeExample) {
          report += `\n**Code Example**:\n\`\`\`typescript${pattern.codeExample}\n\`\`\`\n`;
        }
        report += '\n';
      }
    }

    // Module-by-Module Breakdown
    report += `## 📋 MODULE BREAKDOWN\n\n`;
    for (const moduleResult of this.allResults) {
      report += `### ${moduleResult.module.toUpperCase()}\n\n`;
      if (moduleResult.results?.crud) {
        const modulePassing = moduleResult.results.crud.reduce((sum: number, r: any) => {
          return sum +
            (r.create.success ? 1 : 0) +
            (r.read.success ? 1 : 0) +
            (r.update.success ? 1 : 0) +
            (r.delete.success ? 1 : 0);
        }, 0);
        const moduleTotal = moduleResult.results.crud.length * 4;
        report += `- **Tests**: ${modulePassing}/${moduleTotal} passing (${Math.round(modulePassing / moduleTotal * 100)}%)\n`;
        report += `- **Pages**: ${moduleResult.results.crud.length}\n\n`;
      }
    }

    return report;
  }

  async saveGlobalReport(): Promise<string> {
    const report = this.generateGlobalReport();
    const projectRoot = process.cwd();
    const parentDir = path.dirname(projectRoot);
    const outputDir = path.join(parentDir, 'limn-systems-enterprise-docs', '02-TESTING', 'functional-tests');
    const outputPath = path.join(outputDir, `comprehensive-report-${Date.now()}.md`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\n📝 Global report saved: ${outputPath}`);

    const latestPath = path.join(outputDir, 'comprehensive-latest.md');
    fs.writeFileSync(latestPath, report, 'utf-8');
    console.log(`📝 Latest global report: ${latestPath}\n`);

    return outputPath;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('🚀 COMPREHENSIVE FUNCTIONAL TESTING - ALL MODULES\n');
  console.log('=' .repeat(80));
  console.log('STRATEGY: Test all modules → Compile all errors → Global analysis → Holistic fixes');
  console.log('=' .repeat(80));
  console.log('\n');

  const globalAnalyzer = new GlobalPatternAnalyzer();
  const moduleKeys = Object.keys(ALL_MODULES);

  for (let i = 0; i < moduleKeys.length; i++) {
    const moduleKey = moduleKeys[i];
    const module = ALL_MODULES[moduleKey as keyof typeof ALL_MODULES];

    console.log('\n' + '='.repeat(80));
    console.log(`📦 MODULE ${i + 1}/${moduleKeys.length}: ${module.name.toUpperCase()}`);
    console.log('='.repeat(80) + '\n');

    const auditor = new FunctionalAuditor({
      module: moduleKey,
      baseUrl: 'http://localhost:3000',
      workers: 1,
      timeout: 30000,
      headless: true, // Run headless for speed
    });

    try {
      await auditor.initialize();
      await auditor.loginAsAdmin();

      for (const route of module.routes) {
        console.log(`\n📄 Testing: ${route}`);
        await auditor.discoverInteractions(route);
        await auditor.testCRUDOperations(route);
      }

      auditor.analyzePatterns();
      await auditor.saveReport();

      // Add results to global analyzer
      globalAnalyzer.addModuleResults(moduleKey, {
        results: (auditor as any).results,
        errorPatterns: (auditor as any).errorPatterns,
      });

    } catch (error) {
      console.error(`\n❌ Module ${module.name} testing failed:`, error);
    } finally {
      await auditor.fullCleanup();
    }

    // Memory check between modules
    console.log('\n💾 Memory check between modules...');
    if (global.gc) {
      global.gc();
    }
  }

  // Global analysis
  globalAnalyzer.analyzeGlobalPatterns();
  await globalAnalyzer.saveGlobalReport();

  console.log('\n' + '='.repeat(80));
  console.log('✅ COMPREHENSIVE TESTING COMPLETE');
  console.log('='.repeat(80) + '\n');
  console.log('Next steps:');
  console.log('1. Review global report for patterns');
  console.log('2. Apply holistic fixes based on recommendations');
  console.log('3. Re-run tests to verify fixes\n');
}

// Run with garbage collection enabled
if (typeof global.gc === 'undefined') {
  console.warn('⚠️  Warning: Run with --expose-gc for better memory management');
  console.warn('   Example: node --expose-gc $(which tsx) scripts/test-functional-all.ts\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
