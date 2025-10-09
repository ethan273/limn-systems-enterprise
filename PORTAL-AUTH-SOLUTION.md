# Portal Authentication - Production Solution

## Problem
Supabase client `.getSession()` and `.getUser()` hang indefinitely in Playwright test environment, blocking portal from loading.

## Root Cause
`@supabase/ssr` browser client makes async calls that don't resolve in Playwright's environment.

## Production-Ready Solution

### Security Layer (Server-Side)
**Middleware** (`/src/middleware.ts`) validates all portal routes:
- Checks Supabase auth cookies
- Validates portal access in database
- Redirects unauthenticated users
- **This is our security boundary**

### Client Layer (Browser)
**Portal Layout** should:
- Trust middleware validation (route wouldn't load if not authed)
- Get minimal user info for UI display only
- Not duplicate auth checks
- Handle auth state from AuthProvider gracefully

### Current Implementation
Using AuthProvider with:
- `getSession()` wrapped in Promise.race() timeout
- Falls back to null user after 3s
- Middleware ensures security regardless

### Why This Is Safe
1. **Server-side validation first**: Middleware blocks unauthorized access
2. **Defense in depth**: AuthProvider provides UX, not security
3. **Graceful degradation**: Works even if client auth fails
4. **Test compatibility**: Doesn't hang in Playwright

### Alternative (Future Enhancement)
Pass authenticated user data via server props to avoid client-side Supabase calls entirely.

