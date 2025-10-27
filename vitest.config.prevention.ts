/**
 * Vitest Configuration for Prevention Tests
 *
 * Purpose: Run prevention tests with appropriate timeouts and settings
 * Tests: Schema validation, pattern consistency
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'prevention',
    include: ['scripts/tests/prevention/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.next'],

    // Generous timeouts for database queries
    testTimeout: 60000, // 60s
    hookTimeout: 30000, // 30s

    // Run tests sequentially to avoid database contention
    threads: false,

    // Environment
    environment: 'node',

    globals: true,

    // Setup files
    setupFiles: [],

    // Reporter
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/prevention-tests.json',
      html: './test-results/prevention-tests.html',
    },

    // Coverage (optional)
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'scripts/**/*.ts'],
      exclude: [
        'node_modules',
        '.next',
        'dist',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
