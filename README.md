# Limn Systems Enterprise

Enterprise furniture manufacturing management system.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Documentation

**All comprehensive documentation is maintained in the separate documentation repository:**

`/Users/eko3/limn-systems-enterprise-docs/`

Key documentation locations:
- **Development Guides**: `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/`
- **Performance Optimization**: `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/`
- **Architecture**: `/Users/eko3/limn-systems-enterprise-docs/04-ARCHITECTURE/`
- **Deployment**: `/Users/eko3/limn-systems-enterprise-docs/09-DEPLOYMENT/`
- **Full README**: `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/FULL-README.md`

## Development Standards

See [`.claude/claude.md`](.claude/claude.md) for:
- Prime Directive (NO SHORTCUTS)
- Code quality standards
- Authentication patterns
- Database access patterns
- Performance best practices

## Tech Stack

- **Framework**: Next.js 15.5.6
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.17.1
- **API**: tRPC v11
- **State**: React Query v5
- **UI**: Radix UI + Tailwind CSS
- **Testing**: Playwright + Jest

## Key Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
npx playwright test  # E2E tests
```

## Environment

- **Development**: `.env`
- **Production**: `production-credentials.env`

Both dev and prod databases must stay in sync. See `.claude/claude.md` for critical environment configuration details.

## Production Deployment

Deployed on Vercel. See `/Users/eko3/limn-systems-enterprise-docs/09-DEPLOYMENT/` for deployment guides.

---

**Status**: Active Development
**Last Updated**: October 21, 2025
