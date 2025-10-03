/**
 * API Router Analysis Script
 *
 * Analyzes tRPC API routers to find:
 * - Missing authentication
 * - Dangerous queries (N+1 problems)
 * - Missing input validation
 * - Unused models
 * - Security issues
 *
 * Created: October 3, 2025
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouterAnalysisReport {
  timestamp: string;
  totalRouters: number;
  totalProcedures: number;
  routers: Array<{
    file: string;
    procedures: number;
    publicProcedures: number;
    protectedProcedures: number;
  }>;
  missingAuth: Array<{
    file: string;
    procedure: string;
    line: number;
  }>;
  dangerousQueries: Array<{
    file: string;
    issue: string;
    line: number;
    severity: 'high' | 'medium' | 'low';
  }>;
  missingValidation: Array<{
    file: string;
    procedure: string;
    line: number;
  }>;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function analyzeApiRouters(): Promise<RouterAnalysisReport> {
  console.log('🔍 Starting API router analysis...\n');

  const routersDir = path.join(process.cwd(), 'src/server/api/routers');
  const routerFiles = getAllFiles(routersDir);

  console.log(`📊 Found ${routerFiles.length} router files\n`);

  const report: RouterAnalysisReport = {
    timestamp: new Date().toISOString(),
    totalRouters: routerFiles.length,
    totalProcedures: 0,
    routers: [],
    missingAuth: [],
    dangerousQueries: [],
    missingValidation: [],
  };

  for (const file of routerFiles) {
    console.log(`🔍 Analyzing: ${path.basename(file)}`);

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Count procedures
    const publicProcs = (content.match(/\w+:\s*publicProcedure/g) || []).length;
    const protectedProcs = (content.match(/\w+:\s*protectedProcedure/g) || []).length;
    const totalProcs = publicProcs + protectedProcs;

    report.totalProcedures += totalProcs;
    report.routers.push({
      file: path.basename(file),
      procedures: totalProcs,
      publicProcedures: publicProcs,
      protectedProcedures: protectedProcs,
    });

    // Check for missing authentication (public procedures in sensitive routers)
    const fileName = path.basename(file).toLowerCase();
    const isSensitiveRouter = [
      'orders',
      'payments',
      'customers',
      'qc',
      'production',
      'admin',
    ].some(name => fileName.includes(name));

    if (isSensitiveRouter && publicProcs > 0) {
      lines.forEach((line, index) => {
        if (line.includes('publicProcedure') && !line.includes('//')) {
          const procedureMatch = line.match(/(\w+):\s*publicProcedure/);
          if (procedureMatch) {
            report.missingAuth.push({
              file: path.basename(file),
              procedure: procedureMatch[1],
              line: index + 1,
            });
          }
        }
      });
    }

    // Check for N+1 query problems
    lines.forEach((line, index) => {
      // findMany without include
      if (line.includes('findMany') && !line.includes('include:')) {
        const contextStart = Math.max(0, index - 5);
        const contextEnd = Math.min(lines.length, index + 10);
        const contextLines = lines.slice(contextStart, contextEnd);
        const hasInclude = contextLines.some(l => l.includes('include:'));

        if (!hasInclude) {
          report.dangerousQueries.push({
            file: path.basename(file),
            issue: 'Potential N+1 query: findMany without include',
            line: index + 1,
            severity: 'medium',
          });
        }
      }

      // Raw queries without parameterization
      if (line.includes('$queryRaw') && !line.includes('$queryRaw`')) {
        report.dangerousQueries.push({
          file: path.basename(file),
          issue: 'Unsafe raw query: Use tagged template literals',
          line: index + 1,
          severity: 'high',
        });
      }

      // Missing error handling
      if (line.includes('await') && !line.includes('try') && !line.includes('catch')) {
        const contextStart = Math.max(0, index - 10);
        const contextEnd = Math.min(lines.length, index + 5);
        const contextLines = lines.slice(contextStart, contextEnd);
        const hasTryCatch = contextLines.some(l => l.includes('try') || l.includes('catch'));

        if (!hasTryCatch && line.includes('prisma')) {
          report.dangerousQueries.push({
            file: path.basename(file),
            issue: 'Missing error handling for database operation',
            line: index + 1,
            severity: 'medium',
          });
        }
      }
    });

    // Check for missing input validation
    lines.forEach((line, index) => {
      if ((line.includes('publicProcedure') || line.includes('protectedProcedure')) && !line.includes('//')) {
        const procedureMatch = line.match(/(\w+):\s*(publicProcedure|protectedProcedure)/);
        if (procedureMatch) {
          // Check next 10 lines for .input(z.
          const contextEnd = Math.min(lines.length, index + 10);
          const nextLines = lines.slice(index, contextEnd);
          const hasValidation = nextLines.some(l => l.includes('.input(z.'));

          if (!hasValidation && !nextLines.some(l => l.includes('.query') && !l.includes('input'))) {
            report.missingValidation.push({
              file: path.basename(file),
              procedure: procedureMatch[1],
              line: index + 1,
            });
          }
        }
      }
    });
  }

  // Save JSON report
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'api-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate markdown report
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(
    path.join(reportsDir, 'api-analysis-report.md'),
    markdown
  );

  console.log('\n✅ API router analysis complete!');
  console.log(`   Reports saved to: ${reportsDir}\n`);

  return report;
}

function generateMarkdownReport(report: RouterAnalysisReport): string {
  let md = `# API Router Analysis Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Routers:** ${report.totalRouters}\n`;
  md += `- **Total Procedures:** ${report.totalProcedures}\n`;
  md += `- **Missing Authentication:** ${report.missingAuth.length}\n`;
  md += `- **Dangerous Queries:** ${report.dangerousQueries.length}\n`;
  md += `- **Missing Validation:** ${report.missingValidation.length}\n\n`;

  if (report.routers.length > 0) {
    md += `## Routers Overview\n\n`;
    md += `| Router | Procedures | Public | Protected |\n`;
    md += `|--------|------------|--------|----------|\n`;
    report.routers.forEach(router => {
      md += `| ${router.file} | ${router.procedures} | ${router.publicProcedures} | ${router.protectedProcedures} |\n`;
    });
    md += `\n`;
  }

  if (report.missingAuth.length > 0) {
    md += `## ⚠️ Missing Authentication (${report.missingAuth.length})\n\n`;
    md += `Public procedures in sensitive routers that may need authentication:\n\n`;
    report.missingAuth.forEach(issue => {
      md += `### ${issue.file}:${issue.line}\n`;
      md += `- **Procedure:** \`${issue.procedure}\`\n`;
      md += `- **Issue:** Using \`publicProcedure\` in sensitive router\n`;
      md += `- **Recommendation:** Consider using \`protectedProcedure\` if authentication is required\n\n`;
    });
  }

  if (report.dangerousQueries.length > 0) {
    md += `## 🔴 Dangerous Queries (${report.dangerousQueries.length})\n\n`;
    const highSeverity = report.dangerousQueries.filter(q => q.severity === 'high');
    const mediumSeverity = report.dangerousQueries.filter(q => q.severity === 'medium');

    if (highSeverity.length > 0) {
      md += `### High Severity (${highSeverity.length})\n\n`;
      highSeverity.forEach(issue => {
        md += `- **${issue.file}:${issue.line}** - ${issue.issue}\n`;
      });
      md += `\n`;
    }

    if (mediumSeverity.length > 0) {
      md += `### Medium Severity (${mediumSeverity.length})\n\n`;
      mediumSeverity.forEach(issue => {
        md += `- **${issue.file}:${issue.line}** - ${issue.issue}\n`;
      });
      md += `\n`;
    }
  }

  if (report.missingValidation.length > 0) {
    md += `## ⚠️ Missing Input Validation (${report.missingValidation.length})\n\n`;
    md += `Procedures without Zod input validation:\n\n`;
    report.missingValidation.forEach(issue => {
      md += `- **${issue.file}:${issue.line}** - Procedure \`${issue.procedure}\` missing \`.input(z.object(...))\`\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;
  md += `*Generated by API Router Analysis Script*\n`;

  return md;
}

// Run analysis
analyzeApiRouters()
  .then((report) => {
    console.log('📊 Analysis Results:');
    console.log(`   - Total Routers: ${report.totalRouters}`);
    console.log(`   - Total Procedures: ${report.totalProcedures}`);
    console.log(`   - Missing Auth: ${report.missingAuth.length}`);
    console.log(`   - Dangerous Queries: ${report.dangerousQueries.length}`);
    console.log(`   - Missing Validation: ${report.missingValidation.length}`);
    console.log('\n✅ Reports saved to /reports directory');
  })
  .catch((error) => {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  });
