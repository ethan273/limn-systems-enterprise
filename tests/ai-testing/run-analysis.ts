#!/usr/bin/env tsx
/**
 * Run AI Testing Analysis
 * Execute this to scan the entire application and generate reports
 */

import { TestOrchestrator } from './test-orchestrator';
import path from 'path';

async function main() {
  const projectRoot = path.join(__dirname, '..', '..');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Limn Systems Enterprise - AI Testing Framework          ║');
  console.log('║   Comprehensive Application Analysis                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const orchestrator = new TestOrchestrator(projectRoot);

  try {
    const report = await orchestrator.runFullAnalysis();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Analysis Complete!                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📁 Reports Generated:\n');
    console.log('   • tests/reports/page-scan-report.md');
    console.log('   • tests/reports/schema-validation-report.md');
    console.log('   • tests/reports/comprehensive-test-report.md');
    console.log('   • tests/reports/test-data.json\n');

    console.log('📊 Key Findings:\n');
    console.log(`   • ${report.summary.pages.total} pages discovered`);
    console.log(`   • ${report.summary.apis.total} API routers found`);
    console.log(`   • ${report.summary.models.total} Prisma models`);
    console.log(`   • ${report.summary.models.issues} schema issues identified\n`);

    if (report.newAreas.pages.length > 0) {
      console.log('🆕 New Areas Identified:\n');
      console.log(`   • ${report.newAreas.pages.length} new pages`);
      console.log(`   • ${report.newAreas.routers.length} new API routers\n`);
    }

    console.log('📋 Next Steps:\n');
    report.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during analysis:', error);
    process.exit(1);
  } finally {
    await orchestrator.close();
  }
}

main().catch(console.error);
