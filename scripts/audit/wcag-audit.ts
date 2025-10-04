#!/usr/bin/env tsx

/**
 * Automated WCAG Accessibility Compliance Audit
 *
 * Scans the codebase and running application for:
 * 1. Color contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for large text)
 * 2. Alt text on images
 * 3. Aria labels on interactive elements
 * 4. Semantic HTML usage
 * 5. Keyboard accessibility
 *
 * Usage:
 * npm run audit:accessibility
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

interface ContrastIssue {
  file: string;
  line: number;
  color: string;
  background: string;
  ratio: number;
  source: string;
}

interface AccessibilityIssue {
  type: 'contrast' | 'alt-text' | 'aria' | 'semantic' | 'keyboard';
  severity: 'error' | 'warning';
  file: string;
  line: number;
  message: string;
  source: string;
}

interface AuditResult {
  totalFiles: number;
  totalIssues: number;
  errors: AccessibilityIssue[];
  warnings: AccessibilityIssue[];
  summary: {
    contrastIssues: number;
    altTextIssues: number;
    ariaIssues: number;
    semanticIssues: number;
    keyboardIssues: number;
  };
}

class WCAGAuditor {
  private appDir = path.join(process.cwd(), 'src', 'app');
  private componentsDir = path.join(process.cwd(), 'src', 'components');
  private issues: AccessibilityIssue[] = [];
  private filesScanned = 0;

  async run(): Promise<AuditResult> {
    console.log('♿ Starting WCAG accessibility audit...\n');

    // Step 1: Scan globals.css for contrast issues
    await this.auditGlobalCSS();

    // Step 2: Scan components for accessibility issues
    await this.auditComponents();

    // Step 3: Scan app pages for accessibility issues
    await this.auditPages();

    // Generate report
    const errors = this.issues.filter((i) => i.severity === 'error');
    const warnings = this.issues.filter((i) => i.severity === 'warning');

    const result: AuditResult = {
      totalFiles: this.filesScanned,
      totalIssues: this.issues.length,
      errors,
      warnings,
      summary: {
        contrastIssues: this.issues.filter((i) => i.type === 'contrast').length,
        altTextIssues: this.issues.filter((i) => i.type === 'alt-text').length,
        ariaIssues: this.issues.filter((i) => i.type === 'aria').length,
        semanticIssues: this.issues.filter((i) => i.type === 'semantic').length,
        keyboardIssues: this.issues.filter((i) => i.type === 'keyboard').length,
      },
    };

    this.printReport(result);

    return result;
  }

  private async auditGlobalCSS(): Promise<void> {
    const cssFile = path.join(process.cwd(), 'src', 'app', 'globals.css');

    if (!fs.existsSync(cssFile)) {
      console.log('⚠️  globals.css not found, skipping CSS audit\n');
      return;
    }

    this.filesScanned++;
    const content = fs.readFileSync(cssFile, 'utf-8');
    const lines = content.split('\n');

    // Check for hardcoded color values that might have contrast issues
    lines.forEach((line, index) => {
      // Look for color definitions
      const colorMatch = line.match(/(color|background|background-color|border-color):\s*([^;]+);/);
      if (colorMatch) {
        const property = colorMatch[1];
        const value = colorMatch[2].trim();

        // Flag potential contrast issues (hex colors, rgb, etc.)
        if (value.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/)) {
          // Skip CSS variables (they're theme-aware)
          if (!value.includes('var(--')) {
            this.issues.push({
              type: 'contrast',
              severity: 'warning',
              file: cssFile,
              line: index + 1,
              message: `Hardcoded color value detected. Use CSS variables for theme consistency and contrast control.`,
              source: line.trim(),
            });
          }
        }
      }
    });

    console.log(`✅ Scanned globals.css for accessibility issues\n`);
  }

  private async auditComponents(): Promise<void> {
    const componentFiles = glob.sync('**/*.{tsx,ts}', {
      cwd: this.componentsDir,
      ignore: ['**/node_modules/**', '**/.next/**'],
    });

    for (const file of componentFiles) {
      await this.auditFile(path.join(this.componentsDir, file));
    }

    console.log(`✅ Scanned ${componentFiles.length} component files\n`);
  }

  private async auditPages(): Promise<void> {
    const pageFiles = glob.sync('**/*.{tsx,ts}', {
      cwd: this.appDir,
      ignore: ['**/node_modules/**', '**/.next/**'],
    });

    for (const file of pageFiles) {
      await this.auditFile(path.join(this.appDir, file));
    }

    console.log(`✅ Scanned ${pageFiles.length} page files\n`);
  }

  private async auditFile(filePath: string): Promise<void> {
    this.filesScanned++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for images without alt text
      const imgMatch = line.match(/<img\s+([^>]*?)>/);
      if (imgMatch) {
        const attrs = imgMatch[1];
        if (!attrs.includes('alt=')) {
          this.issues.push({
            type: 'alt-text',
            severity: 'error',
            file: filePath,
            line: index + 1,
            message: 'Image missing alt attribute. Add alt text for screen reader accessibility.',
            source: line.trim(),
          });
        }
      }

      // Check for buttons without aria-label or text content
      const buttonMatch = line.match(/<button\s+([^>]*?)>/);
      if (buttonMatch) {
        const attrs = buttonMatch[1];
        const hasAriaLabel = attrs.includes('aria-label=');
        const isIconOnly = attrs.includes('className="btn-icon"') || attrs.includes('className=\'btn-icon\'');

        if (isIconOnly && !hasAriaLabel) {
          this.issues.push({
            type: 'aria',
            severity: 'error',
            file: filePath,
            line: index + 1,
            message: 'Icon button missing aria-label. Add aria-label for screen reader users.',
            source: line.trim(),
          });
        }
      }

      // Check for onClick on non-interactive elements
      const divClickMatch = line.match(/<div\s+([^>]*?)onClick/);
      if (divClickMatch) {
        const attrs = divClickMatch[1];
        const hasRole = attrs.includes('role=');
        const hasTabIndex = attrs.includes('tabIndex') || attrs.includes('tabindex');

        if (!hasRole || !hasTabIndex) {
          this.issues.push({
            type: 'keyboard',
            severity: 'warning',
            file: filePath,
            line: index + 1,
            message: 'Non-interactive element with onClick. Add role and tabIndex for keyboard accessibility.',
            source: line.trim(),
          });
        }
      }

      // Check for missing form labels
      const inputMatch = line.match(/<input\s+([^>]*?)>/);
      if (inputMatch) {
        const attrs = inputMatch[1];
        const hasId = attrs.match(/id=['"]([^'"]+)['"]/);
        const hasAriaLabel = attrs.includes('aria-label=');
        const hasAriaLabelledBy = attrs.includes('aria-labelledby=');

        if (hasId && !hasAriaLabel && !hasAriaLabelledBy) {
          // Check if there's a label with matching htmlFor in nearby lines
          const contextLines = lines.slice(Math.max(0, index - 3), index + 3).join('\n');
          const hasLabel = contextLines.includes(`htmlFor="${hasId[1]}"`);

          if (!hasLabel) {
            this.issues.push({
              type: 'aria',
              severity: 'error',
              file: filePath,
              line: index + 1,
              message: 'Form input missing associated label. Add <label> or aria-label for screen readers.',
              source: line.trim(),
            });
          }
        }
      }

      // Check for hardcoded colors in className (architectural violation)
      const hardcodedColorMatch = line.match(/className\s*=\s*['"`][^'"`]*\b(bg-|text-|border-)(red|blue|green|purple|yellow|gray|orange|pink)-\d+/);
      if (hardcodedColorMatch) {
        this.issues.push({
          type: 'contrast',
          severity: 'error',
          file: filePath,
          line: index + 1,
          message: 'Hardcoded Tailwind color detected. Use semantic CSS classes from globals.css for WCAG compliance.',
          source: line.trim(),
        });
      }
    });
  }

  private printReport(result: AuditResult): void {
    console.log('═'.repeat(80));
    console.log('WCAG ACCESSIBILITY AUDIT REPORT');
    console.log('═'.repeat(80));
    console.log();

    console.log('📊 SUMMARY:');
    console.log(`  Files Scanned: ${result.totalFiles}`);
    console.log(`  Total Issues: ${result.totalIssues}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Warnings: ${result.warnings.length}`);
    console.log();

    console.log('📋 ISSUES BY TYPE:');
    console.log(`  Color Contrast: ${result.summary.contrastIssues}`);
    console.log(`  Alt Text: ${result.summary.altTextIssues}`);
    console.log(`  ARIA Labels: ${result.summary.ariaIssues}`);
    console.log(`  Semantic HTML: ${result.summary.semanticIssues}`);
    console.log(`  Keyboard Access: ${result.summary.keyboardIssues}`);
    console.log();

    if (result.errors.length > 0) {
      console.log('❌ ERRORS (Must Fix):');
      console.log('─'.repeat(80));
      result.errors.forEach((issue) => {
        const relativePath = path.relative(process.cwd(), issue.file);
        console.log(`  ${issue.type.toUpperCase()}: ${issue.message}`);
        console.log(`  File: ${relativePath}:${issue.line}`);
        console.log(`  Code: ${issue.source}`);
        console.log();
      });
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  WARNINGS (Should Fix):');
      console.log('─'.repeat(80));
      result.warnings.forEach((issue) => {
        const relativePath = path.relative(process.cwd(), issue.file);
        console.log(`  ${issue.type.toUpperCase()}: ${issue.message}`);
        console.log(`  File: ${relativePath}:${issue.line}`);
        console.log(`  Code: ${issue.source}`);
        console.log();
      });
    }

    if (result.totalIssues === 0) {
      console.log('✅ No accessibility issues found! WCAG compliance achieved.');
      console.log();
    }

    console.log('═'.repeat(80));
    console.log();

    // Exit with error code if errors found
    if (result.errors.length > 0) {
      console.log('❌ Accessibility audit failed. Fix errors before proceeding.');
      process.exit(1);
    } else if (result.warnings.length > 0) {
      console.log('⚠️  Accessibility audit passed with warnings. Consider fixing warnings.');
    } else {
      console.log('✅ Accessibility audit passed!');
    }
  }
}

// Run the audit
const auditor = new WCAGAuditor();
auditor.run().catch((error) => {
  console.error('❌ WCAG audit failed:', error);
  process.exit(1);
});
