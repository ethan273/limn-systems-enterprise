# Limn Systems Enterprise - Testing Suite

**Comprehensive AI-Driven Testing Framework**

---

## Quick Start

### Run Tests
```bash
npm test                    # Run all Vitest tests (watch mode)
npm run test:ui            # Open Vitest UI
npm run test:coverage      # Generate coverage report
npm run test:e2e           # Run Playwright E2E tests
npm run test:all           # Run all tests
```

### Run AI Analysis
```bash
npx tsx tests/ai-testing/run-analysis.ts
```

### Open Prisma Studio
```bash
npm run db:studio
```

---

## Test Directory Structure

```
tests/
├── helpers/          # Shared test utilities
├── unit/            # Unit tests (components, lib, modules)
├── integration/     # Integration tests (API, database)
├── e2e/             # End-to-end tests (all modules)
├── visual/          # Visual regression tests (Chromatic)
├── ai-testing/      # AI testing framework ⭐
├── reports/         # Generated reports
└── fixtures/        # Test data and mocks
```

---

## AI Testing Framework

### Tools

**page-scanner.ts** - Discovers all pages and API routers
**schema-validator.ts** - Validates Prisma schema vs database
**test-orchestrator.ts** - Coordinates all analysis
**run-analysis.ts** - CLI entry point

### Run Full Analysis
```bash
npx tsx tests/ai-testing/run-analysis.ts
```

### Generated Reports
- `tests/reports/comprehensive-test-report.md`
- `tests/reports/page-scan-report.md`
- `tests/reports/schema-validation-report.md`
- `tests/reports/test-data.json`

---

## Current Status

### Phase 0: Setup ✅ COMPLETE
- All tools installed (Vitest, Playwright, Chromatic)
- All configurations created
- AI framework built and operational
- Initial analysis completed

### Application Scale (Discovered)
- **104 pages** across 22 modules
- **31 API routers** (all tRPC)
- **287 Prisma models**
- **271 database tables**

### Next: Phase 1 - Critical Risk Testing
1. Database schema validation tests
2. Multi-tenant isolation tests (16 portal pages)
3. Authentication flow tests (6 endpoints)
4. Financial calculation tests

---

## Testing Philosophy

✅ **Pattern-based bug fixing** - Fix patterns, not individual bugs
✅ **Critical risks first** - Security and data integrity prioritized
✅ **Comprehensive testing** - UI + functionality + data validation
✅ **Zero mock data** - Real database, real functionality
✅ **Production-ready only** - No temp fixes or workarounds

---

## Key Commands

### Testing
```bash
npm test                 # Vitest watch mode
npm run test:run        # Vitest run once
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright E2E
npm run chromatic       # Visual regression
```

### Database
```bash
npm run db:studio       # Open Prisma Studio
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
```

### Quality Checks
```bash
npm run lint            # ESLint
npm run type-check      # TypeScript
npm run security:check  # Security audit
npm run pre-commit      # All checks
```

---

## Coverage Goals

- **Code Coverage**: 80%+
- **API Coverage**: 100% (31/31 routers)
- **Page Coverage**: 100% (104/104 pages)
- **Expected Tests**: 1,200+

---

## Critical Testing Priorities

### 1. Security (CRITICAL)
- Multi-tenant isolation (16 portal pages)
- Designer portal security (5 pages)
- Factory portal security (5 pages)
- Document access control

### 2. Database Integrity (HIGH)
- Schema sync (287 models vs 271 tables)
- Foreign key validation
- Data integrity checks

### 3. Authentication (HIGH)
- 6 auth endpoints
- Session management
- 2FA implementation
- OAuth flows

### 4. Financial (HIGH)
- Invoice calculations
- Payment allocations
- QuickBooks sync
- Production payment gates

---

## Reports Location

All reports are auto-generated in:
```
tests/reports/
```

View the latest analysis:
```bash
cat tests/reports/comprehensive-test-report.md
```

---

## Need Help?

- **Documentation**: `/Users/eko3/limn-systems-enterprise-docs/LSE Testing/`
- **Implementation Plan**: `COMPREHENSIVE-IMPLEMENTATION-PLAN.md`
- **Session 1 Summary**: `SESSION-1-COMPLETE.md`

---

**Phase 0 Complete ✅ | Ready for Phase 1 🚀**
