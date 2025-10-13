# Limn Systems Enterprise

Enterprise furniture manufacturing management system built with Next.js 15, TypeScript, and Supabase.

---

## 🚨 PRIME DIRECTIVE: NO SHORTCUTS

**For all developers and AI assistants working on this codebase:**

### Core Principles

1. **NO SHORTCUTS** - Ever
2. **Quality is imperative**, not speed
3. **Always build the best possible solutions** that are permanent and error-free
4. **Complete verification required** before claiming any task is done
5. **Zero tolerance** for exposed secrets, type errors, or build failures

**Full details**: See [`.claude/claude.md`](.claude/claude.md) for complete development standards.

---

## Production Readiness

This application is **production ready** when and only when:

```bash
./scripts/pre-deploy-check.sh
# Must output: ✅ ALL CRITICAL CHECKS PASSED
```

**Current Status**: See [`/limn-systems-enterprise-docs/09-SECURITY/`](../limn-systems-enterprise-docs/09-SECURITY/) for latest security and readiness reports.

---

## Quick Start

### Prerequisites

- Node.js 18+ (24.x recommended)
- PostgreSQL 14+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

### Verification

Before any deployment:

```bash
# Run complete verification
./scripts/pre-deploy-check.sh

# Individual checks
npm run type-check  # Must pass
npm run lint        # Must pass
npm run build       # Must succeed
npm run test        # Should pass
```

---

## Project Structure

```
limn-systems-enterprise/
├── .claude/                    # Development standards and directives
│   └── claude.md              # Prime directive - READ THIS FIRST
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── admin/            # Admin pages
│   │   ├── crm/              # CRM pages
│   │   ├── design/           # Design management
│   │   ├── financials/       # Finance pages
│   │   ├── flipbooks/        # Flipbook feature
│   │   ├── partners/         # Partner management
│   │   ├── production/       # Manufacturing
│   │   ├── products/         # Product catalog
│   │   ├── shipping/         # Logistics
│   │   └── tasks/            # Task management
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities and configs
│   ├── server/               # Server-side code
│   └── styles/               # Global styles
├── prisma/                    # Database schema
├── public/                    # Static assets
├── scripts/                   # Build and deploy scripts
│   └── pre-deploy-check.sh   # Production verification
└── tests/                     # E2E and integration tests
```

---

## Documentation

Comprehensive documentation is maintained in the separate `limn-systems-enterprise-docs` repository:

### Key Documents

- **[Prime Directive](.claude/claude.md)** - Development standards (READ FIRST)
- **[Production Verification](../limn-systems-enterprise-docs/testing/PRODUCTION-VERIFICATION-CHECKLIST.md)** - Deployment checklist
- **[Security Status](../limn-systems-enterprise-docs/09-SECURITY/)** - Current security posture
- **[Testing Guide](../limn-systems-enterprise-docs/testing/)** - Test strategies and results

---

## Development Workflow

### Making Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes with quality focus**
   - No shortcuts
   - Complete type safety
   - Proper error handling
   - Security-first approach

3. **Verify locally**
   ```bash
   npm run type-check  # 0 errors required
   npm run lint        # Must pass
   npm run test        # Should pass
   ```

4. **Commit with descriptive message**
   ```bash
   git add .
   git commit -m "feat: Add feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Before Merging to Main

```bash
# Run complete verification
./scripts/pre-deploy-check.sh

# Must see:
# ✅ ALL CRITICAL CHECKS PASSED
# Application is ready for production deployment.
```

---

## Security

### Critical Rules

1. **Never commit secrets** - Use .env files (gitignored)
2. **Scan before commits** - Check for exposed credentials
3. **Rotate if exposed** - Immediately rotate any exposed credentials
4. **Report issues** - Document in security reports

### Checking for Secrets

```bash
# Run before every commit
grep -r "GOCSPX\|sk_live_\|pk_live_" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="*.md"
```

### Current Security Status

- npm Vulnerabilities: **0** ✅
- TypeScript Errors: See latest build
- Secrets Exposed: **None** ✅
- Production Ready: Run `./scripts/pre-deploy-check.sh`

---

## Tech Stack

### Core

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.7.3
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 6.2.1
- **API**: tRPC 11.0.2
- **Auth**: Supabase Auth

### UI

- **Styling**: Tailwind CSS 3.4.1
- **Components**: Radix UI, shadcn/ui
- **Icons**: Lucide React
- **Canvas**: Fabric.js 6.5.2

### Dev Tools

- **Testing**: Playwright 1.49.1
- **Linting**: ESLint 9.18.0
- **Type Checking**: TypeScript compiler
- **Error Tracking**: Sentry 10.19.0

---

## Scripts

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run dev:turbo    # Start with Turbopack

# Production
npm run build        # Build for production
npm run start        # Start production server

# Quality Checks
npm run type-check   # TypeScript compilation (0 errors required)
npm run lint         # ESLint (must pass)
npm run lint:fix     # Auto-fix linting issues

# Testing
npm run test         # Run Playwright tests
npm run test:ui      # Playwright UI mode
npm run test:headed  # Run tests in headed mode

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev     # Run migrations (dev)
npx prisma migrate deploy  # Run migrations (prod)
npx prisma studio    # Open Prisma Studio

# Verification
./scripts/pre-deploy-check.sh  # Complete production readiness check
```

---

## Environment Variables

Required variables (see `.env.example` for full list):

### Database
```bash
DATABASE_URL="postgresql://..."
```

### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

### Auth
```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

### Error Tracking (Production)
```bash
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
SENTRY_AUTH_TOKEN="..."
```

**Never commit .env files. Always use .env.example with placeholders.**

---

## Common Issues

### Build Timeout

If `npm run build` times out:

```bash
# Use increased memory allocation
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### TypeScript Errors

Always check with:
```bash
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit
```

Fix all errors before claiming production ready.

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

---

## Contributing

### Standards

1. **Follow Prime Directive** - Read [`.claude/claude.md`](.claude/claude.md)
2. **No shortcuts** - Quality over speed
3. **Complete verification** - Run `./scripts/pre-deploy-check.sh`
4. **Type safety** - 0 TypeScript errors
5. **Security first** - No secrets, scan all files

### Pull Request Checklist

- [ ] Code follows project standards
- [ ] TypeScript compilation succeeds (0 errors)
- [ ] Linting passes
- [ ] Tests pass (>90% rate)
- [ ] No secrets exposed
- [ ] `./scripts/pre-deploy-check.sh` passes
- [ ] Documentation updated
- [ ] Commit messages are descriptive

---

## Support

### Documentation

- **Development Standards**: [`.claude/claude.md`](.claude/claude.md)
- **Full Documentation**: `../limn-systems-enterprise-docs/`
- **Security Reports**: `../limn-systems-enterprise-docs/09-SECURITY/`
- **Testing Guides**: `../limn-systems-enterprise-docs/testing/`

### Getting Help

1. Check documentation first
2. Run `./scripts/pre-deploy-check.sh` to identify issues
3. Review TypeScript errors: `npx tsc --noEmit`
4. Check security reports for known issues

---

## License

Proprietary - All rights reserved

---

## Remember

### The ONE Rule:

**NO SHORTCUTS. QUALITY IS IMPERATIVE. BUILD THE BEST POSSIBLE SOLUTIONS THAT ARE PERMANENT AND ERROR-FREE.**

Everything else follows from this.

---

**Last Updated**: January 13, 2025
**Next Review**: Before every major change
**Status**: See `./scripts/pre-deploy-check.sh`
