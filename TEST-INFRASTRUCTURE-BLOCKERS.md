# Test Infrastructure Blockers

## CRITICAL: Supabase Auth Rate Limiting

**Status**: BLOCKING TEST SUCCESS
**Severity**: HIGH
**Date Discovered**: 2025-10-08

### Problem

Playwright tests are hitting Supabase's authentication rate limit when running the full test suite (286 tests). Each test calls the `/api/auth/dev-login` endpoint which creates a magic link and verifies it with Supabase. Supabase allows only ~10-15 auth verifications per minute.

**Error Message:**
```
Magic link verification error: Error [AuthApiError]: Request rate limit reached
  __isAuthError: true,
  status: 429,
  code: 'over_request_rate_limit'
```

### Impact

- Full test suite cannot complete successfully
- Tests fail with authentication errors after first ~20-30 tests
- Unable to achieve 100% pass rate due to infrastructure limitation

### Solutions

1. **SESSION REUSE (Recommended)**:
   - Modify `tests/helpers/auth-helper.ts` to create ONE session per user type
   - Store session cookies/tokens in global state
   - Reuse sessions across tests instead of re-authenticating

2. **TEST BATCHING**:
   - Run tests in smaller batches (e.g., 20-30 tests at a time)
   - Wait 1-2 minutes between batches for rate limit to reset
   - Use `--shard` option: `npx playwright test --shard=1/10`

3. **MOCK AUTH FOR TESTING**:
   - Create a test-only auth bypass that doesn't hit Supabase
   - Use `NODE_ENV=test` to detect test environment
   - Set session cookies directly without verification

4. **INCREASE SUPABASE LIMITS**:
   - Upgrade Supabase plan for higher rate limits
   - Configure custom rate limits in Supabase dashboard
   - May require paid plan

### Temporary Workaround

Run tests in smaller groups:
```bash
# Run tests by category to avoid rate limit
npx playwright test tests/01-authentication.spec.ts tests/02-crud-operations.spec.ts --workers=1
# Wait 2 minutes
npx playwright test tests/03-ui-consistency.spec.ts tests/04-performance.spec.ts --workers=1
# Continue...
```

### Recommended Implementation

Implement session reuse in `auth-helper.ts`:

```typescript
// Global session cache
const sessionCache = new Map<string, { cookies: Cookie[], timestamp: number }>();
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

export async function login(page: Page, email: string, password: string) {
  const cacheKey = `${email}:${password}`;
  const cached = sessionCache.get(cacheKey);

  // Reuse session if it exists and is fresh
  if (cached && Date.now() - cached.timestamp < SESSION_TTL) {
    await page.context().addCookies(cached.cookies);
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    return;
  }

  // Create new session (existing logic)
  // ...

  // Cache the session
  const cookies = await page.context().cookies();
  sessionCache.set(cacheKey, { cookies, timestamp: Date.now() });
}
```

### Related Issues

- tRPC API tests failing due to authentication errors
- Admin portal tests timing out waiting for login
- Portal-specific tests (customer/designer/factory) unable to authenticate

### Next Steps

1. Wait for Supabase rate limit to reset (5-10 minutes)
2. Implement session reuse in auth-helper.ts
3. Re-run full test suite with session reuse
4. If still issues, consider test batching or mock auth
