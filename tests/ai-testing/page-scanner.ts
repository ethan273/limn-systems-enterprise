/**
 * Page Scanner
 * Automatically maps all pages and API routers in the application
 */

import fs from 'fs/promises';
import path from 'path';
import type { PageInfo, APIRouterInfo } from './types';

export class PageScanner {
  constructor(private projectRoot: string) {}

  /**
   * Scan all pages in the Next.js app directory
   */
  async scanAllPages(): Promise<{ total: number; pages: PageInfo[]; byModule: Record<string, number> }> {
    const appDir = path.join(this.projectRoot, 'src', 'app');
    const pages: PageInfo[] = [];

    await this.scanDirectory(appDir, '', pages);

    // Group by module
    const byModule: Record<string, number> = {};
    pages.forEach((page) => {
      byModule[page.module] = (byModule[page.module] || 0) + 1;
    });

    return {
      total: pages.length,
      pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
      byModule,
    };
  }

  /**
   * Recursively scan directory for page files
   */
  private async scanDirectory(
    dir: string,
    routePath: string,
    pages: PageInfo[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip special Next.js directories
          if (entry.name.startsWith('_') || entry.name === 'api') continue;

          const newPath = routePath + '/' + entry.name;
          await this.scanDirectory(fullPath, newPath, pages);
        } else if (entry.name === 'page.tsx' || entry.name === 'route.ts') {
          const module = this.extractModule(routePath);
          const content = await fs.readFile(fullPath, 'utf-8');

          pages.push({
            path: routePath || '/',
            fullPath,
            type: entry.name === 'page.tsx' ? 'page' : 'route',
            module,
            hasAuth: this.detectAuthUsage(content),
            hasForms: this.detectForms(content),
            hasData: this.detectDataFetching(content),
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  /**
   * Scan all tRPC API routers
   */
  async scanAPIRouters(): Promise<{ total: number; routers: APIRouterInfo[] }> {
    const routersDir = path.join(this.projectRoot, 'src', 'server', 'api', 'routers');
    const routers: APIRouterInfo[] = [];

    try {
      const files = await fs.readdir(routersDir);

      for (const file of files) {
        if (!file.endsWith('.ts')) continue;

        const content = await fs.readFile(path.join(routersDir, file), 'utf-8');
        const procedures = this.extractProcedures(content);

        routers.push({
          name: file.replace('.ts', ''),
          path: path.join(routersDir, file),
          procedures: procedures.all,
          protectedProcedures: procedures.protected,
          publicProcedures: procedures.public,
        });
      }
    } catch (error) {
      console.error('Error scanning API routers:', error);
    }

    return {
      total: routers.length,
      routers: routers.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  /**
   * Extract module name from route path
   */
  private extractModule(routePath: string): string {
    const segments = routePath.split('/').filter(Boolean);

    // Handle dynamic routes like [id]
    const cleanSegments = segments.filter(s => !s.startsWith('['));

    return cleanSegments[0] || 'root';
  }

  /**
   * Detect authentication usage in page
   */
  private detectAuthUsage(content: string): boolean {
    return (
      content.includes('useAuth') ||
      content.includes('getServerSession') ||
      content.includes('requireAuth') ||
      content.includes('protectedProcedure')
    );
  }

  /**
   * Detect forms in page
   */
  private detectForms(content: string): boolean {
    return (
      content.includes('<form') ||
      content.includes('useForm') ||
      content.includes('FormProvider') ||
      content.includes('react-hook-form')
    );
  }

  /**
   * Detect data fetching in page
   */
  private detectDataFetching(content: string): boolean {
    return (
      content.includes('trpc') ||
      content.includes('prisma') ||
      content.includes('useQuery') ||
      content.includes('useMutation') ||
      content.includes('fetch(')
    );
  }

  /**
   * Extract procedures from tRPC router
   */
  private extractProcedures(content: string): {
    all: string[];
    protected: number;
    public: number;
  } {
    // Extract procedure names
    const queryMatches = content.match(/(\w+):\s*(?:publicProcedure|protectedProcedure)\.query/g) || [];
    const mutationMatches = content.match(/(\w+):\s*(?:publicProcedure|protectedProcedure)\.mutation/g) || [];

    const allProcedures = [...queryMatches, ...mutationMatches].map((match) => {
      const nameMatch = match.match(/(\w+):/);
      return nameMatch ? nameMatch[1] : 'unknown';
    });

    const protectedMatches = content.match(/protectedProcedure/g) || [];
    const publicMatches = content.match(/publicProcedure/g) || [];

    return {
      all: allProcedures,
      protected: protectedMatches.length,
      public: publicMatches.length,
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(pagesData: Awaited<ReturnType<typeof this.scanAllPages>>, apisData: Awaited<ReturnType<typeof this.scanAPIRouters>>): string {
    let report = '# Application Scan Report\n\n';
    report += `**Generated**: ${new Date().toISOString()}\n\n`;

    report += '## Summary\n\n';
    report += `- **Total Pages**: ${pagesData.total}\n`;
    report += `- **Total API Routers**: ${apisData.total}\n\n`;

    report += '## Pages by Module\n\n';
    Object.entries(pagesData.byModule).sort(([a], [b]) => a.localeCompare(b)).forEach(([module, count]) => {
      report += `- **${module}**: ${count} pages\n`;
    });

    report += '\n## All Pages\n\n';
    pagesData.pages.forEach((page) => {
      report += `- \`${page.path}\` (${page.module}) - Auth: ${page.hasAuth ? '✅' : '❌'}, Forms: ${page.hasForms ? '✅' : '❌'}, Data: ${page.hasData ? '✅' : '❌'}\n`;
    });

    report += '\n## API Routers\n\n';
    apisData.routers.forEach((router) => {
      report += `- **${router.name}**: ${router.procedures.length} procedures (${router.protectedProcedures} protected, ${router.publicProcedures} public)\n`;
    });

    return report;
  }
}
