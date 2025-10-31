module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  plugins: [
    'security',
  ],
  rules: {
    'prefer-const': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'off',
    'react/no-unescaped-entities': 'warn',
    'import/no-anonymous-default-export': 'warn',
    'security/detect-object-injection': 'off', // Disabled: produces too many false positives with TypeScript type-safe code
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXAttribute[name.name=\'className\'] Literal[value=/\\b(bg|text|border)-(red|blue|green|yellow|purple|indigo|pink|orange|teal|cyan|lime|amber|emerald|violet|fuchsia|rose|sky|slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)\\b/]',
        message: '❌ ARCHITECTURAL VIOLATION: Hardcoded color Tailwind utilities are forbidden. Use semantic CSS classes from globals.css instead. Example: Replace \'bg-purple-50 text-purple-800\' with \'badge-style\' defined in globals.css'
      }
    ]
  },
  overrides: [
    {
      // Only apply strict Prisma rules to tRPC routers
      files: ['src/server/api/routers/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/lib/db', '@/lib/db'],
                importNames: ['prisma'],
                message: '❌ PATTERN VIOLATION: Do not import "prisma" from @/lib/db in tRPC routers. Use ctx.db instead. See .claude/patterns/database-patterns.md'
              }
            ],
            paths: [
              {
                name: '@prisma/client',
                importNames: ['PrismaClient'],
                message: '❌ PATTERN VIOLATION: Do not import PrismaClient in tRPC routers. Use ctx.db instead. Type imports (Prisma namespace) are allowed.'
              }
            ]
          }
        ]
      }
    }
  ]
};
