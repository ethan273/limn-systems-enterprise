/**
 * Type definitions for AI Testing Framework
 */

export interface PageInfo {
  path: string;
  fullPath: string;
  type: 'page' | 'route' | 'layout';
  module: string;
  hasAuth: boolean;
  hasForms: boolean;
  hasData: boolean;
  isNew?: boolean;
}

export interface APIRouterInfo {
  name: string;
  path: string;
  procedures: string[];
  protectedProcedures: number;
  publicProcedures: number;
}

export interface SchemaReport {
  modelCount: number;
  tableCount: number;
  discrepancy: number;
  validatedCount: number;
  issues: Array<{
    type: 'missing_table' | 'missing_column' | 'type_mismatch' | 'missing_relation';
    model?: string;
    table?: string;
    field?: string;
    expected?: string;
    actual?: string;
  }>;
  recommendations: string[];
}

export interface SecurityReport {
  portalCount: number;
  rlsPolicies: { table: string; hasRLS: boolean }[];
  authChecks: { page: string; hasAuth: boolean }[];
  criticalIssues: Array<{
    severity: 'critical' | 'high';
    category: string;
    description: string;
    file: string;
  }>;
}

export interface UIReport {
  inconsistencies: string[];
  recommendations: string[];
}

export interface BugPattern {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  pattern: string;
  occurrences: number;
  files: string[];
  description: string;
  holistic_fix: string;
}

export interface BugReport {
  patterns: BugPattern[];
  recommendations: string[];
  totalIssues: number;
  criticalIssues: number;
}

export interface TestReport {
  timestamp: Date;
  summary: {
    pages: { total: number; tested: number; passed: number; failed: number };
    apis: { total: number; tested: number; passed: number; failed: number };
    models: { total: number; validated: number; issues: number };
    coverage: { lines: number; functions: number; branches: number; statements: number };
  };
  issues: BugPattern[];
  recommendations: string[];
  newAreas: {
    pages: string[];
    routers: string[];
    criticalFocus: string[];
  };
}
