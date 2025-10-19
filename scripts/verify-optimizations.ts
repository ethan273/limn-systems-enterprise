/**
 * Verify Performance Optimizations
 * Implementation: Phase 1-6 Verification
 *
 * Checks that all performance optimizations are properly configured
 */

import fs from 'fs/promises';
import path from 'path';

interface VerificationResult {
  phase: string;
  status: 'pass' | 'fail' | 'partial';
  details: string[];
  recommendations?: string[];
}

async function verifyPhase1DatabaseIndexes(): Promise<VerificationResult> {
  console.log('Verifying Phase 1: Database Indexes...');

  const details: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check Prisma schema for indexes
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');

    const indexMatches = schemaContent.match(/@@index/g);
    const indexCount = indexMatches ? indexMatches.length : 0;

    details.push(`Found ${indexCount} database indexes in Prisma schema`);

    if (indexCount >= 27) {
      details.push('✅ All 27 indexes are defined');
      return {
        phase: 'Phase 1: Database Indexes',
        status: 'pass',
        details,
      };
    } else if (indexCount > 0) {
      recommendations.push('Add missing indexes to Prisma schema');
      return {
        phase: 'Phase 1: Database Indexes',
        status: 'partial',
        details,
        recommendations,
      };
    } else {
      recommendations.push('Run: npm run db:migrate to create indexes');
      return {
        phase: 'Phase 1: Database Indexes',
        status: 'fail',
        details,
        recommendations,
      };
    }
  } catch (error) {
    return {
      phase: 'Phase 1: Database Indexes',
      status: 'fail',
      details: ['Error reading Prisma schema'],
    };
  }
}

async function verifyPhase2ServerSideCaching(): Promise<VerificationResult> {
  console.log('Verifying Phase 2: Server-Side Caching...');

  const details: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check for cache.ts file
    const cachePath = path.join(process.cwd(), 'src/lib/cache.ts');
    const cacheContent = await fs.readFile(cachePath, 'utf-8');

    // Count cache functions
    const cacheFunctions = cacheContent.match(/export const getCached/g);
    const cacheCount = cacheFunctions ? cacheFunctions.length : 0;

    details.push(`Found ${cacheCount} cached query functions`);

    // Check for cache tags
    const hasCacheTags = cacheContent.includes('CACHE_TAGS');
    if (hasCacheTags) {
      details.push('✅ Cache tags defined for invalidation');
    }

    // Check for cache durations
    const hasCacheDurations = cacheContent.includes('CACHE_DURATIONS');
    if (hasCacheDurations) {
      details.push('✅ Cache durations configured');
    }

    if (cacheCount >= 5 && hasCacheTags && hasCacheDurations) {
      return {
        phase: 'Phase 2: Server-Side Caching',
        status: 'pass',
        details,
      };
    } else {
      recommendations.push('Ensure all cache functions use CACHE_TAGS and CACHE_DURATIONS');
      return {
        phase: 'Phase 2: Server-Side Caching',
        status: 'partial',
        details,
        recommendations,
      };
    }
  } catch (error) {
    return {
      phase: 'Phase 2: Server-Side Caching',
      status: 'fail',
      details: ['Cache layer not found at src/lib/cache.ts'],
      recommendations: ['Create caching layer following Phase 2 implementation'],
    };
  }
}

async function verifyPhase3RequestDeduplication(): Promise<VerificationResult> {
  console.log('Verifying Phase 3: Request Deduplication...');

  const details: string[] = [];

  try {
    // Check tRPC context for cache wrapper
    const contextPath = path.join(process.cwd(), 'src/server/api/trpc/context.ts');
    const contextContent = await fs.readFile(contextPath, 'utf-8');

    const hasReactCache = contextContent.includes("import { cache } from 'react'");
    const hasWrappedGetSession = contextContent.includes('const getSession = cache(');
    const hasWrappedCreateContext = contextContent.includes('export const createContext = cache(');

    if (hasReactCache) details.push('✅ React cache imported');
    if (hasWrappedGetSession) details.push('✅ getSession wrapped with cache()');
    if (hasWrappedCreateContext) details.push('✅ createContext wrapped with cache()');

    if (hasReactCache && hasWrappedGetSession && hasWrappedCreateContext) {
      return {
        phase: 'Phase 3: Request Deduplication',
        status: 'pass',
        details,
      };
    } else {
      return {
        phase: 'Phase 3: Request Deduplication',
        status: 'partial',
        details,
        recommendations: ['Wrap getSession() and createContext() with React cache()'],
      };
    }
  } catch (error) {
    return {
      phase: 'Phase 3: Request Deduplication',
      status: 'fail',
      details: ['tRPC context file not found'],
    };
  }
}

async function verifyPhase4BundleOptimization(): Promise<VerificationResult> {
  console.log('Verifying Phase 4: Bundle Optimization...');

  const details: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check for lazy components
    const lazyDir = path.join(process.cwd(), 'src/components/lazy');
    const lazyFiles = await fs.readdir(lazyDir);

    details.push(`Found ${lazyFiles.length} files in lazy components directory`);

    const expectedFiles = [
      'LazyPDFViewer.tsx',
      'Lazy3DViewer.tsx',
      'LazyCharts.tsx',
      'LazyRecharts.tsx',
      'LazyDataTable.tsx',
      'index.ts',
    ];

    const foundFiles = expectedFiles.filter((file) => lazyFiles.includes(file));
    details.push(`✅ ${foundFiles.length}/${expectedFiles.length} lazy component files present`);

    if (foundFiles.length === expectedFiles.length) {
      details.push('✅ All lazy component wrappers created');
      recommendations.push('Replace direct imports with lazy components in pages');
      return {
        phase: 'Phase 4: Bundle Optimization',
        status: 'pass',
        details,
        recommendations,
      };
    } else {
      const missing = expectedFiles.filter((file) => !lazyFiles.includes(file));
      recommendations.push(`Create missing files: ${missing.join(', ')}`);
      return {
        phase: 'Phase 4: Bundle Optimization',
        status: 'partial',
        details,
        recommendations,
      };
    }
  } catch (error) {
    return {
      phase: 'Phase 4: Bundle Optimization',
      status: 'fail',
      details: ['Lazy components directory not found'],
      recommendations: ['Create src/components/lazy/ directory and lazy component wrappers'],
    };
  }
}

async function verifyPhase5CursorPagination(): Promise<VerificationResult> {
  console.log('Verifying Phase 5: Cursor-Based Pagination...');

  const details: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check invoices router
    const invoicesPath = path.join(process.cwd(), 'src/server/api/routers/invoices.ts');
    const invoicesContent = await fs.readFile(invoicesPath, 'utf-8');

    const hasInvoicesCursor = invoicesContent.includes('getAllCursor');
    if (hasInvoicesCursor) details.push('✅ Invoices router has getAllCursor endpoint');

    // Check orders router
    const ordersPath = path.join(process.cwd(), 'src/server/api/routers/orders.ts');
    const ordersContent = await fs.readFile(ordersPath, 'utf-8');

    const hasOrdersCursor = ordersContent.includes('getAllCursor');
    if (hasOrdersCursor) details.push('✅ Orders router has getAllCursor endpoint');

    // Check production-orders router
    const prodOrdersPath = path.join(process.cwd(), 'src/server/api/routers/production-orders.ts');
    const prodOrdersContent = await fs.readFile(prodOrdersPath, 'utf-8');

    const hasProdOrdersCursor = prodOrdersContent.includes('getAllCursor');
    if (hasProdOrdersCursor) details.push('✅ Production orders router has getAllCursor endpoint');

    const cursorCount = [hasInvoicesCursor, hasOrdersCursor, hasProdOrdersCursor].filter(Boolean).length;

    if (cursorCount === 3) {
      recommendations.push('Update frontend pages to use getAllCursor endpoints');
      return {
        phase: 'Phase 5: Cursor-Based Pagination',
        status: 'pass',
        details,
        recommendations,
      };
    } else {
      recommendations.push('Add getAllCursor endpoints to remaining routers');
      return {
        phase: 'Phase 5: Cursor-Based Pagination',
        status: 'partial',
        details,
        recommendations,
      };
    }
  } catch (error) {
    return {
      phase: 'Phase 5: Cursor-Based Pagination',
      status: 'fail',
      details: ['Error reading router files'],
    };
  }
}

async function verifyPhase6ErrorBoundariesAndLoading(): Promise<VerificationResult> {
  console.log('Verifying Phase 6: Error Boundaries & Loading States...');

  const details: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check for DataErrorBoundary
    const errorBoundaryPath = path.join(process.cwd(), 'src/components/error-handling/DataErrorBoundary.tsx');
    await fs.access(errorBoundaryPath);
    details.push('✅ DataErrorBoundary component created');

    // Check for loading skeletons
    const loadingSkeletonsPath = path.join(process.cwd(), 'src/components/loading/LoadingSkeletons.tsx');
    await fs.access(loadingSkeletonsPath);
    details.push('✅ Loading skeleton components created');

    // Check for loading.tsx files
    const loadingFiles = [
      'src/app/dashboard/loading.tsx',
      'src/app/financials/invoices/loading.tsx',
      'src/app/production/orders/loading.tsx',
      'src/app/products/loading.tsx',
      'src/app/tasks/loading.tsx',
      'src/app/crm/loading.tsx',
    ];

    let foundLoadingFiles = 0;
    for (const file of loadingFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        foundLoadingFiles++;
      } catch {
        // File doesn't exist
      }
    }

    details.push(`✅ ${foundLoadingFiles}/${loadingFiles.length} loading.tsx files created`);

    if (foundLoadingFiles === loadingFiles.length) {
      recommendations.push('Wrap data-fetching pages with DataErrorBoundary');
      return {
        phase: 'Phase 6: Error Boundaries & Loading States',
        status: 'pass',
        details,
        recommendations,
      };
    } else {
      recommendations.push('Create loading.tsx for remaining routes');
      return {
        phase: 'Phase 6: Error Boundaries & Loading States',
        status: 'partial',
        details,
        recommendations,
      };
    }
  } catch (error) {
    return {
      phase: 'Phase 6: Error Boundaries & Loading States',
      status: 'fail',
      details: ['Error boundary or loading components not found'],
      recommendations: ['Create DataErrorBoundary and loading skeleton components'],
    };
  }
}

async function main() {
  console.log('🔍 Performance Optimization Verification');
  console.log('═'.repeat(60));
  console.log('\n');

  const results: VerificationResult[] = [];

  results.push(await verifyPhase1DatabaseIndexes());
  results.push(await verifyPhase2ServerSideCaching());
  results.push(await verifyPhase3RequestDeduplication());
  results.push(await verifyPhase4BundleOptimization());
  results.push(await verifyPhase5CursorPagination());
  results.push(await verifyPhase6ErrorBoundariesAndLoading());

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Verification Summary\n');

  const passCount = results.filter((r) => r.status === 'pass').length;
  const partialCount = results.filter((r) => r.status === 'partial').length;
  const failCount = results.filter((r) => r.status === 'fail').length;

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    console.log(`${icon} ${result.phase}: ${result.status.toUpperCase()}`);

    result.details.forEach((detail) => {
      console.log(`   ${detail}`);
    });

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('   💡 Recommendations:');
      result.recommendations.forEach((rec) => {
        console.log(`      - ${rec}`);
      });
    }

    console.log('');
  });

  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passCount}/6`);
  console.log(`⚠️  Partial: ${partialCount}/6`);
  console.log(`❌ Failed: ${failCount}/6\n`);

  if (passCount === 6) {
    console.log('🎉 All performance optimizations are properly configured!\n');
  } else if (passCount + partialCount === 6) {
    console.log('✅ All phases implemented, some optimizations can be improved.\n');
  } else {
    console.log('⚠️  Some optimizations are missing. Review recommendations above.\n');
  }
}

main().catch((error) => {
  console.error('Error running verification:', error);
  process.exit(1);
});
