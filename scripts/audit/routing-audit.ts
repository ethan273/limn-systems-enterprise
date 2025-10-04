#!/usr/bin/env tsx

/**
 * Automated Routing Audit System
 *
 * Scans the codebase to:
 * 1. Find all page files in /src/app
 * 2. Extract all router.push() navigation calls
 * 3. Verify navigation targets point to real pages
 * 4. Report broken links and orphaned pages
 *
 * Usage:
 * npx tsx scripts/audit/routing-audit.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

interface PageRoute {
  path: string;
  file: string;
  isDynamic: boolean;
}

interface NavigationCall {
  file: string;
  line: number;
  target: string;
  source: string;
}

interface AuditResult {
  totalPages: number;
  totalNavigationCalls: number;
  brokenLinks: NavigationCall[];
  orphanedPages: PageRoute[];
  summary: {
    pagesWithoutNavigation: number;
    brokenNavigationCalls: number;
  };
}

class RoutingAuditor {
  private appDir = path.join(process.cwd(), 'src', 'app');
  private pages: PageRoute[] = [];
  private navigationCalls: NavigationCall[] = [];

  async run(): Promise<AuditResult> {
    console.log('🔍 Starting routing audit...\n');

    // Step 1: Discover all pages
    await this.discoverPages();
    console.log(`✅ Found ${this.pages.length} page routes\n`);

    // Step 2: Find all navigation calls
    await this.findNavigationCalls();
    console.log(`✅ Found ${this.navigationCalls.length} navigation calls\n`);

    // Step 3: Verify navigation targets
    const brokenLinks = this.verifyNavigationTargets();
    console.log(`${brokenLinks.length > 0 ? '❌' : '✅'} Found ${brokenLinks.length} broken navigation links\n`);

    // Step 4: Find orphaned pages
    const orphanedPages = this.findOrphanedPages();
    console.log(`${orphanedPages.length > 0 ? '⚠️' : '✅'} Found ${orphanedPages.length} orphaned pages\n`);

    // Generate report
    const result: AuditResult = {
      totalPages: this.pages.length,
      totalNavigationCalls: this.navigationCalls.length,
      brokenLinks,
      orphanedPages,
      summary: {
        pagesWithoutNavigation: orphanedPages.length,
        brokenNavigationCalls: brokenLinks.length,
      },
    };

    this.printReport(result);

    return result;
  }

  private async discoverPages(): Promise<void> {
    // Find all page.tsx and page.ts files
    const pageFiles = glob.sync('**/page.{tsx,ts}', {
      cwd: this.appDir,
      ignore: ['**/node_modules/**', '**/.next/**'],
    });

    this.pages = pageFiles.map((file) => {
      // Convert file path to route path
      const routePath = this.fileToRoute(file);
      const isDynamic = routePath.includes('[');

      return {
        path: routePath,
        file: path.join(this.appDir, file),
        isDynamic,
      };
    });

    // Sort by path for easier reading
    this.pages.sort((a, b) => a.path.localeCompare(b.path));
  }

  private fileToRoute(file: string): string {
    // Remove page.tsx or page.ts
    let route = file.replace(/\/page\.(tsx|ts)$/, '');

    // Root page
    if (route === '') {
      return '/';
    }

    // Add leading slash
    return '/' + route;
  }

  private async findNavigationCalls(): Promise<void> {
    // Find all TypeScript/React files
    const sourceFiles = glob.sync('**/*.{tsx,ts}', {
      cwd: this.appDir,
      ignore: ['**/node_modules/**', '**/.next/**'],
    });

    for (const file of sourceFiles) {
      const filePath = path.join(this.appDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Match router.push('/path'), router.replace('/path'), router.prefetch('/path')
        const pushMatch = line.match(/router\.(push|replace|prefetch)\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (pushMatch) {
          this.navigationCalls.push({
            file: filePath,
            line: index + 1,
            target: pushMatch[2],
            source: line.trim(),
          });
        }

        // Match <Link href="/path">
        const linkMatch = line.match(/href\s*=\s*['"`]([/][^'"`]+)['"`]/);
        if (linkMatch && !linkMatch[1].startsWith('http')) {
          this.navigationCalls.push({
            file: filePath,
            line: index + 1,
            target: linkMatch[1],
            source: line.trim(),
          });
        }
      });
    }
  }

  private verifyNavigationTargets(): NavigationCall[] {
    const brokenLinks: NavigationCall[] = [];

    for (const nav of this.navigationCalls) {
      const targetExists = this.routeExists(nav.target);

      if (!targetExists) {
        brokenLinks.push(nav);
      }
    }

    return brokenLinks;
  }

  private routeExists(target: string): boolean {
    // Exact match
    if (this.pages.some((p) => p.path === target)) {
      return true;
    }

    // Dynamic route match (e.g., /crm/contacts/[id] matches /crm/contacts/123)
    const dynamicMatch = this.pages.some((p) => {
      if (!p.isDynamic) return false;

      // Convert dynamic route pattern to regex
      const pattern = p.path.replace(/\[([^\]]+)\]/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);

      return regex.test(target);
    });

    return dynamicMatch;
  }

  private findOrphanedPages(): PageRoute[] {
    const orphaned: PageRoute[] = [];

    for (const page of this.pages) {
      // Skip root page, it's always accessible
      if (page.path === '/') continue;

      // Check if any navigation points to this page
      const hasNavigation = this.navigationCalls.some((nav) => {
        if (nav.target === page.path) return true;

        // Check if navigation target matches dynamic route
        if (page.isDynamic) {
          const pattern = page.path.replace(/\[([^\]]+)\]/g, '([^/]+)');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(nav.target);
        }

        return false;
      });

      if (!hasNavigation) {
        orphaned.push(page);
      }
    }

    return orphaned;
  }

  private printReport(result: AuditResult): void {
    console.log('═'.repeat(80));
    console.log('ROUTING AUDIT REPORT');
    console.log('═'.repeat(80));
    console.log();

    console.log('📊 SUMMARY:');
    console.log(`  Total Pages: ${result.totalPages}`);
    console.log(`  Total Navigation Calls: ${result.totalNavigationCalls}`);
    console.log(`  Broken Links: ${result.brokenLinks.length}`);
    console.log(`  Orphaned Pages: ${result.orphanedPages.length}`);
    console.log();

    if (result.brokenLinks.length > 0) {
      console.log('❌ BROKEN NAVIGATION LINKS:');
      console.log('─'.repeat(80));
      result.brokenLinks.forEach((link) => {
        const relativePath = path.relative(process.cwd(), link.file);
        console.log(`  File: ${relativePath}:${link.line}`);
        console.log(`  Target: ${link.target}`);
        console.log(`  Source: ${link.source}`);
        console.log();
      });
    }

    if (result.orphanedPages.length > 0) {
      console.log('⚠️  ORPHANED PAGES (No Navigation Found):');
      console.log('─'.repeat(80));
      result.orphanedPages.forEach((page) => {
        const relativePath = path.relative(process.cwd(), page.file);
        console.log(`  Route: ${page.path}`);
        console.log(`  File: ${relativePath}`);
        console.log();
      });
    }

    if (result.brokenLinks.length === 0 && result.orphanedPages.length === 0) {
      console.log('✅ All routes are properly linked!');
      console.log();
    }

    console.log('═'.repeat(80));
    console.log();

    // Exit with error code if issues found
    if (result.brokenLinks.length > 0 || result.orphanedPages.length > 0) {
      process.exit(1);
    }
  }
}

// Run the audit
const auditor = new RoutingAuditor();
auditor.run().catch((error) => {
  console.error('❌ Routing audit failed:', error);
  process.exit(1);
});
