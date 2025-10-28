/**
 * PREVENTION TEST SUITE: Pattern Consistency
 *
 * Purpose: Enforce coding patterns and prevent regressions
 * Priority: HIGH - Runs on every commit
 *
 * Tests:
 * 1. All tRPC routers use ctx.db (not new PrismaClient)
 * 2. All admin endpoints use RBAC (not user_type checks)
 * 3. All client auth uses getCurrentUser tRPC endpoint
 * 4. All API routes use getUser() from @/lib/auth/server
 * 5. No hardcoded database URLs (use env vars)
 * 6. Logo paths match theme names (Dark_Mode.png for dark theme)
 * 7. No exposed secrets in code or docs
 * 8. All database queries follow 3-step pattern (when needed)
 *
 * Usage:
 *   npm test -- scripts/tests/prevention/pattern-consistency.test.ts
 *   CI: Runs as part of pre-commit hooks
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface PatternViolation {
  file: string;
  line: number;
  pattern: string;
  code: string;
  severity: 'error' | 'warning';
}

describe('Pattern Consistency Prevention Tests', () => {
  const violations: PatternViolation[] = [];

  function scanFiles(pattern: string): string[] {
    return glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
    });
  }

  function scanFileForPattern(
    filePath: string,
    regex: RegExp,
    patternName: string,
    severity: 'error' | 'warning' = 'error'
  ): PatternViolation[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const found: PatternViolation[] = [];

    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      if (regex.test(line)) {
        found.push({
          file: filePath,
          line: index + 1,
          pattern: patternName,
          code: line.trim(),
          severity,
        });
      }
    });

    return found;
  }

  describe('Database Access Patterns', () => {
    it('should use ctx.db in all tRPC routers (not new PrismaClient)', () => {
      const files = scanFiles('src/server/api/routers/**/*.ts');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Allow sessions.ts to use PrismaClient directly (session_tracking not in DatabaseClient)
        if (file.includes('sessions.ts')) {
          return;
        }

        // Check for new PrismaClient() usage
        if (content.includes('new PrismaClient')) {
          const matches = scanFileForPattern(
            file,
            /new\s+PrismaClient/,
            'database-access-anti-pattern'
          );
          violations.push(...matches);
        }

        // Check ctx.db is used instead
        const hasCtxDb = content.includes('ctx.db.');
        const hasPrismaQuery = content.includes('prisma.') || content.includes('db.');

        if (hasPrismaQuery && !hasCtxDb && !content.includes('import') && !content.includes('type')) {
          violations.push({
            file,
            line: 1,
            pattern: 'missing-ctx-db',
            code: 'File uses database queries but does not use ctx.db',
            severity: 'warning',
          });
        }
      });

      if (violations.length > 0) {
        console.error('\n❌ Database Access Pattern Violations:');
        violations.forEach(v => {
          console.error(`  ${v.file}:${v.line} - ${v.code}`);
        });
      }

      expect(violations).toEqual([]);
    });

    it('should not have direct Supabase client in tRPC routers', () => {
      const files = scanFiles('src/server/api/routers/**/*.ts');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        // Allow Supabase in auth-related routers - they need it for authentication
        if (file.includes('auth.ts') || file.includes('admin.ts')) {
          return;
        }

        const matches = scanFileForPattern(
          file,
          /createClient.*from.*@supabase\/supabase-js/,
          'supabase-client-in-trpc'
        );
        violations.push(...matches);
      });

      expect(violations).toEqual([]);
    });

    it('should follow 3-step query pattern for complex relations', () => {
      // This is a heuristic check - look for patterns that should use 3-step
      const files = scanFiles('src/server/api/routers/**/*.ts');
      const warnings: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for deeply nested include (more than 2 levels)
        const deepIncludeRegex = /include:\s*{[^}]*include:\s*{[^}]*include:\s*{/;
        if (deepIncludeRegex.test(content)) {
          warnings.push({
            file,
            line: 1,
            pattern: 'deep-nested-include',
            code: 'Consider using 3-step query pattern for complex relations',
            severity: 'warning',
          });
        }
      });

      if (warnings.length > 0) {
        console.warn('\n⚠️  Query Pattern Warnings:');
        warnings.forEach(w => {
          console.warn(`  ${w.file} - ${w.code}`);
        });
      }

      // Warnings only, not failures
      expect(warnings.length).toBeLessThan(50); // Threshold
    });
  });

  describe('RBAC Authentication Patterns', () => {
    it('should not use deprecated user_type permission checks', () => {
      const files = [
        ...scanFiles('src/server/api/**/*.ts'),
        ...scanFiles('src/lib/**/*.ts'),
        ...scanFiles('src/app/api/**/*.ts'),
      ];

      const violations: PatternViolation[] = [];

      files.forEach(file => {
        // Skip files marked as keeping user_type for data
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('@keep-user-type-data') || content.includes('user_type_enum')) {
          return;
        }

        // Check for user_type permission checks (not data access)
        const patterns = [
          /user_type\s*===\s*['"`]super_admin['"`]/,
          /user_type\s*===\s*['"`]admin['"`]/,
          /user_type\s*!==\s*['"`]super_admin['"`]/,
          /user_type\s*!==\s*['"`]admin['"`]/,
          /if\s*\([^)]*user_type/,
        ];

        patterns.forEach(pattern => {
          const matches = scanFileForPattern(
            file,
            pattern,
            'deprecated-user-type-check',
            'warning'
          );
          violations.push(...matches);
        });
      });

      if (violations.length > 0) {
        console.warn('\n⚠️  Deprecated user_type permission checks found:');
        console.warn('   These should use RBAC hasRole() or useIsSuperAdmin()');
        violations.slice(0, 10).forEach(v => {
          console.warn(`  ${v.file}:${v.line}`);
        });
        if (violations.length > 10) {
          console.warn(`  ... and ${violations.length - 10} more`);
        }
      }

      // Allow some violations during migration, but limit growth
      expect(violations.length).toBeLessThan(20);
    });

    it('should use RBAC hooks in client components', () => {
      const files = scanFiles('src/{components,modules,app}/**/*.{ts,tsx}');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Skip server-side files
        if (!content.includes("'use client'")) {
          return;
        }

        // Check for admin checks without RBAC hooks
        const hasAdminCheck = /isAdmin|isSuperAdmin/.test(content);
        const hasRBACImport = content.includes('from @/hooks/useRBAC') ||
                              content.includes('from \'@/hooks/useRBAC\'');

        if (hasAdminCheck && !hasRBACImport && !content.includes('AuthContext')) {
          violations.push({
            file,
            line: 1,
            pattern: 'missing-rbac-hook',
            code: 'Component checks admin status but does not import RBAC hooks',
            severity: 'warning',
          });
        }
      });

      if (violations.length > 0) {
        console.warn('\n⚠️  Components with admin checks missing RBAC hooks:');
        violations.forEach(v => {
          console.warn(`  ${v.file}`);
        });
      }

      expect(violations.length).toBeLessThan(10);
    });

    it('should use hasRole() or hasPermission() in server code', () => {
      const files = scanFiles('src/server/api/routers/**/*.ts');
      const warnings: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for admin procedures without RBAC
        if (content.includes('adminProcedure') || content.includes('superAdminProcedure')) {
          const hasRBACImport = content.includes('from @/lib/services/rbac-service') ||
                                content.includes("from '@/lib/services/rbac-service'");

          if (!hasRBACImport) {
            warnings.push({
              file,
              line: 1,
              pattern: 'admin-procedure-no-rbac',
              code: 'File uses admin procedure but does not import RBAC service',
              severity: 'warning',
            });
          }
        }
      });

      if (warnings.length > 0) {
        console.warn('\n⚠️  Admin procedures without RBAC imports:');
        warnings.forEach(w => {
          console.warn(`  ${w.file}`);
        });
      }

      // Warnings only
      expect(warnings.length).toBeLessThan(20);
    });
  });

  describe('Authentication Patterns', () => {
    it('should use getCurrentUser() tRPC endpoint in client', () => {
      const files = scanFiles('src/{components,modules,app}/**/*.{ts,tsx}');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Skip server-side files
        if (!content.includes("'use client'")) {
          return;
        }

        // Skip auth pages - they need direct Supabase for OAuth flows
        if (file.includes('/auth/') && file.includes('page')) {
          return;
        }

        // Check for direct Supabase auth calls (should use tRPC)
        const matches = scanFileForPattern(
          file,
          /supabase\.auth\.getUser\(\)/,
          'direct-supabase-auth-client'
        );
        violations.push(...matches);
      });

      if (violations.length > 0) {
        console.error('\n❌ Direct Supabase auth calls in client:');
        console.error('   Should use: api.userProfile.getCurrentUser.useQuery()');
        violations.forEach(v => {
          console.error(`  ${v.file}:${v.line}`);
        });
      }

      expect(violations).toEqual([]);
    });

    it('should use getUser() from @/lib/auth/server in API routes', () => {
      const files = scanFiles('src/app/api/**/*.ts');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for authentication
        const hasAuthCheck = /user|session|auth/i.test(content);
        const hasGetUserImport = content.includes('from @/lib/auth/server') ||
                                 content.includes("from '@/lib/auth/server'");

        if (hasAuthCheck && !hasGetUserImport && !content.includes('export')) {
          violations.push({
            file,
            line: 1,
            pattern: 'missing-getUser-import',
            code: 'API route checks auth but does not import getUser()',
            severity: 'warning',
          });
        }
      });

      if (violations.length > 0) {
        console.warn('\n⚠️  API routes without getUser() import:');
        violations.forEach(v => {
          console.warn(`  ${v.file}`);
        });
      }

      expect(violations.length).toBeLessThan(5);
    });
  });

  describe('Security Patterns', () => {
    it('should not have hardcoded database URLs', () => {
      const files = [
        ...scanFiles('src/**/*.{ts,tsx}'),
        ...scanFiles('scripts/**/*.ts'),
      ];
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip comments and usage examples
          if (line.trim().startsWith('//') ||
              line.trim().startsWith('*') ||
              line.includes('console.error') ||
              line.includes('EXAMPLE') ||
              line.includes('Usage:')) {
            return;
          }

          // Check for actual hardcoded postgres URLs (with credentials)
          const hasHardcodedURL = /postgresql:\/\/\w+:[^"'`\s@]+@/.test(line);

          if (hasHardcodedURL) {
            violations.push({
              file,
              line: index + 1,
              pattern: 'hardcoded-db-url',
              code: line.substring(0, 50) + '...',
              severity: 'error',
            });
          }
        });
      });

      if (violations.length > 0) {
        console.error('\n❌ SECURITY: Hardcoded database URLs with credentials found:');
        violations.forEach(v => {
          console.error(`  ${v.file}:${v.line}`);
        });
      }

      expect(violations).toEqual([]);
    });

    it('should not have exposed API keys or secrets', () => {
      const files = [
        ...scanFiles('src/**/*.{ts,tsx,md}'),
        ...scanFiles('*.md'),
      ];
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip comments about examples
          if (line.includes('example') || line.includes('EXAMPLE')) {
            return;
          }

          // Check for API keys
          const patterns = [
            /api_key\s*=\s*['"`][a-zA-Z0-9_-]{32,}['"`]/,
            /apiKey:\s*['"`][a-zA-Z0-9_-]{32,}['"`]/,
            /RESEND_API_KEY\s*=\s*re_[a-zA-Z0-9_-]+/,
            /GOOGLE_.*KEY\s*=\s*['"`][a-zA-Z0-9_-]{32,}['"`]/,
          ];

          patterns.forEach(pattern => {
            if (pattern.test(line)) {
              violations.push({
                file,
                line: index + 1,
                pattern: 'exposed-secret',
                code: line.substring(0, 50) + '...',
                severity: 'error',
              });
            }
          });
        });
      });

      if (violations.length > 0) {
        console.error('\n❌ CRITICAL: Exposed secrets found:');
        violations.forEach(v => {
          console.error(`  ${v.file}:${v.line}`);
        });
      }

      expect(violations).toEqual([]);
    });

    it('should use environment variables for sensitive config', () => {
      const files = scanFiles('src/lib/**/*.ts');
      const warnings: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for hardcoded email addresses in config
        if (content.includes('@limn.us.com') && !content.includes('process.env')) {
          warnings.push({
            file,
            line: 1,
            pattern: 'hardcoded-email',
            code: 'Consider using environment variables for email configuration',
            severity: 'warning',
          });
        }
      });

      // Warnings only
      if (warnings.length > 5) {
        console.warn('\n⚠️  Files with hardcoded configuration:');
        warnings.forEach(w => {
          console.warn(`  ${w.file}`);
        });
      }
    });
  });

  describe('UI/UX Patterns', () => {
    it('should use correct logo path for theme (Dark_Mode.png for dark)', () => {
      const files = scanFiles('src/**/*.{ts,tsx}');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip ternary operators - they're handled correctly if both branches are on same line
          // Example: theme === 'dark' ? 'Dark_Mode.png' : 'Light_Mode.png'
          if (line.includes('?') && line.includes(':')) {
            // Check if it's a proper ternary with correct mapping
            const isTernary = /===\s*['"]dark['"].*\?.*Dark_Mode\.png.*:.*Light_Mode\.png/ .test(line) ||
                            /===\s*['"]light['"].*\?.*Light_Mode\.png.*:.*Dark_Mode\.png/.test(line);

            if (isTernary) {
              return; // Correct ternary usage
            }
          }

          // Check for incorrect logo patterns in non-ternary contexts
          // ❌ Wrong: dark theme using Light_Mode.png (separate if/else blocks)
          if (line.includes("=== 'dark'") && line.includes('Light_Mode.png') && !line.includes('?')) {
            violations.push({
              file,
              line: index + 1,
              pattern: 'incorrect-logo-theme',
              code: 'Dark theme should use Dark_Mode.png',
              severity: 'error',
            });
          }

          // ❌ Wrong: light theme using Dark_Mode.png (separate if/else blocks)
          if (line.includes("=== 'light'") && line.includes('Dark_Mode.png') && !line.includes('?')) {
            violations.push({
              file,
              line: index + 1,
              pattern: 'incorrect-logo-theme',
              code: 'Light theme should use Light_Mode.png',
              severity: 'error',
            });
          }
        });
      });

      if (violations.length > 0) {
        console.error('\n❌ Logo theme mismatches:');
        violations.forEach(v => {
          console.error(`  ${v.file}:${v.line} - ${v.code}`);
        });
      }

      expect(violations).toEqual([]);
    });

    it('should use consistent theme variable names', () => {
      const files = scanFiles('src/**/*.{ts,tsx}');
      const warnings: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check for theme variable usage
        const themeVars = ['theme', 'resolvedTheme', 'systemTheme'];
        const hasThemeUsage = themeVars.some(v => content.includes(v));

        if (hasThemeUsage) {
          // Should import from next-themes
          const hasThemeImport = content.includes('from "next-themes"') ||
                                 content.includes("from 'next-themes'");

          if (!hasThemeImport && content.includes("'use client'")) {
            warnings.push({
              file,
              line: 1,
              pattern: 'missing-theme-import',
              code: 'File uses theme but does not import from next-themes',
              severity: 'warning',
            });
          }
        }
      });

      // Warnings only
      if (warnings.length > 10) {
        console.warn('\n⚠️  Files with inconsistent theme usage:');
        warnings.slice(0, 10).forEach(w => {
          console.warn(`  ${w.file}`);
        });
      }
    });
  });

  describe('Code Quality Patterns', () => {
    it('should not have console.log in production code', () => {
      const files = scanFiles('src/**/*.{ts,tsx}');
      const violations: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip comments
          if (line.trim().startsWith('//')) {
            return;
          }

          // Check for console.log (allow console.error, console.warn)
          if (/console\.log\(/.test(line)) {
            violations.push({
              file,
              line: index + 1,
              pattern: 'console-log-in-code',
              code: line.trim(),
              severity: 'warning',
            });
          }
        });
      });

      if (violations.length > 0) {
        console.warn('\n⚠️  console.log statements found:');
        console.warn(`   ${violations.length} total - consider using logger or removing`);
      }

      // Allow some during development, but limit growth
      // Current: 451 - threshold set to prevent growth beyond current state
      expect(violations.length).toBeLessThan(460);
    });

    it('should use TypeScript strict types (no any)', () => {
      const files = scanFiles('src/server/api/routers/**/*.ts');
      const warnings: PatternViolation[] = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for : any type annotations (not type assertions)
          if (/:\s*any\b/.test(line) && !line.includes('// @ts-expect-error')) {
            warnings.push({
              file,
              line: index + 1,
              pattern: 'any-type-usage',
              code: line.trim().substring(0, 60),
              severity: 'warning',
            });
          }
        });
      });

      if (warnings.length > 0) {
        console.warn('\n⚠️  TypeScript `any` usage in routers:');
        console.warn(`   ${warnings.length} total - consider using proper types`);
      }

      // Allow some, but limit growth
      // Current: 234 - threshold set to prevent growth beyond current state
      expect(warnings.length).toBeLessThan(250);
    });
  });
});
