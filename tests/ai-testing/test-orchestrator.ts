/**
 * AI Test Orchestrator
 * Coordinates all testing activities and aggregates results
 */

import fs from 'fs/promises';
import path from 'path';
import { PageScanner } from './page-scanner';
import { SchemaValidator } from './schema-validator';
import type { TestReport } from './types';

export class TestOrchestrator {
  private pageScanner: PageScanner;
  private schemaValidator: SchemaValidator;

  constructor(projectRoot: string) {
    this.pageScanner = new PageScanner(projectRoot);
    this.schemaValidator = new SchemaValidator(projectRoot);
  }

  /**
   * Run comprehensive analysis of the application
   */
  async runFullAnalysis(): Promise<TestReport> {
    console.log('\n🚀 Starting Comprehensive Test Analysis\n');
    console.log('=' .repeat(60));

    // Phase 1: Scan application structure
    console.log('\n📄 Phase 1: Scanning Application Structure\n');
    const pagesData = await this.pageScanner.scanAllPages();
    console.log(`   ✅ Found ${pagesData.total} pages across ${Object.keys(pagesData.byModule).length} modules`);

    const apisData = await this.pageScanner.scanAPIRouters();
    console.log(`   ✅ Found ${apisData.total} API routers`);

    // Phase 2: Validate database schema
    console.log('\n🗄️  Phase 2: Validating Database Schema\n');
    const schemaReport = await this.schemaValidator.validate();

    // Identify new areas since October analysis
    const newAreas = this.identifyNewAreas(pagesData);

    // Generate comprehensive report
    const report: TestReport = {
      timestamp: new Date(),
      summary: {
        pages: {
          total: pagesData.total,
          tested: 0,
          passed: 0,
          failed: 0,
        },
        apis: {
          total: apisData.total,
          tested: 0,
          passed: 0,
          failed: 0,
        },
        models: {
          total: schemaReport.modelCount,
          validated: schemaReport.validatedCount,
          issues: schemaReport.issues.length,
        },
        coverage: {
          lines: 0,
          functions: 0,
          branches: 0,
          statements: 0,
        },
      },
      issues: [],
      recommendations: this.generateRecommendations(pagesData, apisData, schemaReport),
      newAreas,
    };

    console.log('\n📊 Analysis Complete\n');
    console.log('=' .repeat(60));
    console.log(`\n   Pages: ${report.summary.pages.total}`);
    console.log(`   APIs: ${report.summary.apis.total}`);
    console.log(`   Models: ${report.summary.models.total}`);
    console.log(`   Schema Issues: ${report.summary.models.issues}\n`);

    // Save reports
    await this.saveReports(pagesData, apisData, schemaReport, report);

    return report;
  }

  /**
   * Identify new areas added since October 2025 analysis
   */
  private identifyNewAreas(pagesData: Awaited<ReturnType<PageScanner['scanAllPages']>>): TestReport['newAreas'] {
    // Based on CHANGES-LOG.md, these are new areas
    const knownNewPages = [
      '/admin/approvals',
      '/dashboards/analytics',
      '/dashboards/executive',
      '/dashboards/projects',
      '/design/documents',
      '/documents',
      '/documents/[id]',
      '/finance',
      '/portal/designer',
      '/portal/factory',
      '/shipping/tracking',
      '/shipping/tracking/[trackingNumber]',
      '/simple',
      '/test',
      '/working',
    ];

    const newPages = pagesData.pages
      .filter(page => knownNewPages.some(newPath => page.path.includes(newPath)))
      .map(page => page.path);

    return {
      pages: newPages,
      routers: ['production-tracking'], // Known new router from analysis
      criticalFocus: [
        'Portal Security (designer & factory portals)',
        'Dashboard Performance (analytics, executive, projects)',
        'Document Management Security',
        'Shipping Tracking Integration',
      ],
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    pagesData: Awaited<ReturnType<PageScanner['scanAllPages']>>,
    apisData: Awaited<ReturnType<PageScanner['scanAPIRouters']>>,
    schemaReport: Awaited<ReturnType<SchemaValidator['validate']>>
  ): string[] {
    const recommendations: string[] = [];

    // Testing recommendations
    recommendations.push(
      `Create ${pagesData.total} E2E test files (one per page)`
    );
    recommendations.push(
      `Create ${apisData.total} API integration test files (one per router)`
    );

    // Critical security recommendations
    const portalPages = pagesData.pages.filter(p => p.path.includes('/portal/'));
    if (portalPages.length > 0) {
      recommendations.push(
        `CRITICAL: Test multi-tenant isolation for ${portalPages.length} portal pages`
      );
    }

    // Schema recommendations
    if (schemaReport.recommendations.length > 0) {
      recommendations.push(...schemaReport.recommendations);
    }

    // New areas focus
    recommendations.push(
      'PRIORITY: Focus on new portal areas (designer & factory) for security testing'
    );
    recommendations.push(
      'PRIORITY: Performance test new dashboard pages (analytics, executive, projects)'
    );

    return recommendations;
  }

  /**
   * Save all reports to files
   */
  private async saveReports(
    pagesData: Awaited<ReturnType<PageScanner['scanAllPages']>>,
    apisData: Awaited<ReturnType<PageScanner['scanAPIRouters']>>,
    schemaReport: Awaited<ReturnType<SchemaValidator['validate']>>,
    testReport: TestReport
  ): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'tests', 'reports');

    // Ensure reports directory exists
    await fs.mkdir(reportsDir, { recursive: true });

    // Save page scan report
    const pageScanReport = this.pageScanner.generateMarkdownReport(pagesData, apisData);
    await fs.writeFile(
      path.join(reportsDir, 'page-scan-report.md'),
      pageScanReport
    );

    // Save schema validation report
    const schemaValidationReport = this.schemaValidator.generateMarkdownReport(schemaReport);
    await fs.writeFile(
      path.join(reportsDir, 'schema-validation-report.md'),
      schemaValidationReport
    );

    // Save comprehensive test report
    const comprehensiveReport = this.generateComprehensiveReport(testReport);
    await fs.writeFile(
      path.join(reportsDir, 'comprehensive-test-report.md'),
      comprehensiveReport
    );

    // Save JSON data for programmatic access
    await fs.writeFile(
      path.join(reportsDir, 'test-data.json'),
      JSON.stringify({ pagesData, apisData, schemaReport, testReport }, null, 2)
    );

    console.log(`\n💾 Reports saved to tests/reports/\n`);
  }

  /**
   * Generate comprehensive markdown report
   */
  private generateComprehensiveReport(report: TestReport): string {
    let md = '# Comprehensive Test Analysis Report\n\n';
    md += `**Generated**: ${report.timestamp.toISOString()}\n\n`;

    md += '## Summary\n\n';
    md += `- **Total Pages**: ${report.summary.pages.total}\n`;
    md += `- **Total API Routers**: ${report.summary.apis.total}\n`;
    md += `- **Total Prisma Models**: ${report.summary.models.total}\n`;
    md += `- **Validated Models**: ${report.summary.models.validated}\n`;
    md += `- **Schema Issues**: ${report.summary.models.issues}\n\n`;

    if (report.newAreas.pages.length > 0) {
      md += '## New Areas Since October 2025\n\n';
      md += '### New Pages\n\n';
      report.newAreas.pages.forEach(page => {
        md += `- ${page}\n`;
      });
      md += '\n';

      md += '### New API Routers\n\n';
      report.newAreas.routers.forEach(router => {
        md += `- ${router}\n`;
      });
      md += '\n';

      md += '### Critical Focus Areas\n\n';
      report.newAreas.criticalFocus.forEach((area, i) => {
        md += `${i + 1}. ${area}\n`;
      });
      md += '\n';
    }

    md += '## Recommendations\n\n';
    report.recommendations.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += '\n';

    md += '## Next Steps\n\n';
    md += '1. **Phase 1**: Create critical risk tests (database, security, auth, financial)\n';
    md += '2. **Phase 2**: Create API integration tests (31 routers)\n';
    md += '3. **Phase 3**: Create E2E page tests (112 pages)\n';
    md += '4. **Phase 4**: Create integration tests (7 external integrations)\n';
    md += '\n';

    md += '## Testing Strategy\n\n';
    md += '- **Pattern-based bug fixing**: Identify patterns, fix holistically\n';
    md += '- **Priority**: Critical risks first (security, data integrity)\n';
    md += '- **Coverage goal**: 80%+ code coverage\n';
    md += '- **Test count goal**: 1,200+ automated tests\n';

    return md;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    await this.schemaValidator.close();
  }
}
