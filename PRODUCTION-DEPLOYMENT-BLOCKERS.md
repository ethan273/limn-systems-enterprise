# 🚨 PRODUCTION DEPLOYMENT BLOCKERS

**CRITICAL**: The following items MUST be completed before deploying to production.

---

## ❌ BLOCKER #1: Delete All Test Users

**Status**: NOT COMPLETED
**Priority**: CRITICAL
**Impact**: Security vulnerability - test users with elevated privileges exist in database

### Test Users to Delete (8 total):

#### Super Admin Test Users (CRITICAL):
- `admin@test.com` (ID: dac75270-87a0-4311-81b6-71941491d151) - **SUPER_ADMIN ACCESS**

#### Employee Test Users:
- `test_designer@limnsystems.com` (ID: c9636ad6-2f76-4e3a-80c4-3b36ff4816bb)
- `test_factory@limnsystems.com` (ID: 34b44a06-32ce-4012-af6a-931cdee382c4)
- `test_qc@limnsystems.com` (ID: 04638556-e334-4693-9a96-b656f4b5ec66)

#### Customer Test Users:
- `test_customer@limnsystems.com` (ID: 99546f73-0b0d-44f5-9b85-aca498c9eae4)
- `rls-test-1760053554793@test.com` (ID: 6cf27de4-b161-489d-bfd1-9cb284bccd4a)
- `rls-test-1760053228345@test.com` (ID: 7c952859-c3c5-499b-bf54-f366011feaaf)

#### Contractor Test Users:
- `test@example.com` (ID: fc7356e6-98d5-4ad3-93ba-61bb23fd3f6e)

### How to Delete:

```bash
# Run the cleanup script
node maintenance/delete-test-users-production.js
```

Or manually delete from Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Search for each email above
3. Delete user (this will cascade delete user_profiles and portal_access)

### Verification:

After deletion, verify with:
```bash
node maintenance/security-audit-user-types.js
```

Should show: "⚠️  Total test users in database: 0"

---

## ❌ BLOCKER #2: Verify Dev-Login API is Disabled in Production

**Status**: NOT VERIFIED
**Priority**: CRITICAL
**Impact**: Security vulnerability - bypass authentication in production

### Check:

The file `/src/app/api/auth/dev-login/route.ts` has this protection:

```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
}
```

### Verification Steps:

1. Deploy to production
2. Test endpoint: `curl https://your-production-url.com/api/auth/dev-login -X POST`
3. Should return 404 or "Not available in production"
4. If it works, **DO NOT DEPLOY** - environment variable is wrong

---

## ✅ COMPLETED ITEMS

### ✅ Fix Middleware .single() Bug
- **Completed**: October 16, 2025
- **Commit**: 90994ba877064a3bf0b6ad41fe1f1c8f97338a8c
- **Files**: src/middleware.ts, src/app/portal/login/page.tsx

### ✅ Comprehensive Auth Tests
- **Completed**: October 16, 2025
- **Tests**: 53 tests, 100% passing
- **File**: tests/00-comprehensive-auth-security.spec.ts

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Delete all 8 test users from database
- [ ] Run security audit: `node maintenance/security-audit-user-types.js`
- [ ] Verify test users count = 0
- [ ] Verify dev-login API returns 404 in production
- [ ] Run full test suite: `npx playwright test`
- [ ] All tests passing (currently: 53/53 auth tests ✅)
- [ ] Review user_type assignments for real users
- [ ] Verify admin users (should be 2: ethan@limn.us.com, daniel@limn.us.com)
- [ ] Database backup completed
- [ ] Rollback plan documented

---

## 🔒 Security Notes

### Current Admin Users (Production Ready):
- `ethan@limn.us.com` - super_admin ✅
- `daniel@limn.us.com` - super_admin ✅

### Test Users (MUST BE DELETED):
- `admin@test.com` - super_admin ❌ **CRITICAL**

---

**Last Updated**: October 16, 2025
**Next Review**: Before production deployment
**Owner**: Development Team
