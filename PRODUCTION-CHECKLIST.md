# PRODUCTION DEPLOYMENT CHECKLIST

## 🔴 CRITICAL: Items That MUST Be Tested Before Production

### **1. PWA Service Worker Functionality (DEFERRED FROM DEVELOPMENT)**

**Status**: ⚠️ REQUIRES PRODUCTION BUILD TESTING

**Issue**: Service workers don't register in Next.js 15 + Turbopack development mode, even with PWA enabled via `ENABLE_PWA=true` and `@ducanh2912/next-pwa` package.

**Tests Affected**:
- `tests/18-pwa-mobile.spec.ts:139` - Service worker registers successfully
- `tests/18-pwa-mobile.spec.ts:161` - Service worker is in activated state
- `tests/18-pwa-mobile.spec.ts:172` - Service worker caches critical resources

**Root Cause**: `@ducanh2912/next-pwa` (Next.js 15-compatible PWA package) only generates/registers service workers in production builds, not development mode (even with `disable: false`). This is by design for optimal development experience.

**Expected Behavior in Production**:
- Service worker should register at `/sw.js`
- Should activate and cache critical resources (Supabase API, tRPC, static assets)
- Should enable offline functionality
- Should show install prompt for PWA

**Changes Made**:
- Upgraded from `next-pwa@5.6.0` to `@ducanh2912/next-pwa@10.2.9` (Next.js 15 compatible)
- Updated `next.config.js` to use new package: `require('@ducanh2912/next-pwa').default`
- Added `ENABLE_PWA=true` environment variable support for development testing
- Updated PWA tests to use session-based authentication (loadSession helper)

**Test Plan**:
1. **Build Production**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   # OR use production hosting (Vercel, etc.)
   ```

3. **Run Playwright Tests Against Production**:
   ```bash
   # Update TEST_CONFIG.BASE_URL to production URL
   ENABLE_PWA=true npx playwright test tests/18-pwa-mobile.spec.ts --workers=1
   ```

4. **Manual Verification**:
   - Navigate to production app in Chrome/Edge
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered and activated
   - Check "Update on reload" is NOT checked
   - Verify service worker file `/sw.js` exists and loads
   - Check Application → Cache Storage shows cached resources

5. **Offline Testing**:
   - With app loaded, open DevTools → Network
   - Set throttling to "Offline"
   - Reload page - should still work (cached)
   - Navigate between pages - should work from cache
   - Try tRPC API calls - should fail gracefully or use cache

6. **PWA Install Testing**:
   - In Chrome, check for install prompt (+ icon in address bar)
   - Click install, verify PWA installs correctly
   - Launch installed PWA, verify works as standalone app
   - Test PWA on mobile devices (iOS Safari, Android Chrome)

**Acceptance Criteria**:
- ✅ All 3 Playwright tests pass against production build
- ✅ Service worker registers without errors in console
- ✅ Service worker activates (state = "activated")
- ✅ Cache storage contains expected entries (supabase-api-cache, trpc-api-cache, static-image-cache, etc.)
- ✅ App works offline (loads from cache)
- ✅ PWA install works on desktop and mobile
- ✅ No console errors related to service worker

**Assigned To**: [Pending - Assign before production deployment]
**Target Date**: Before production deployment
**Tracking**: This checklist item + GitHub issue (create if needed)

---

## 📋 Additional Pre-Production Tests

### **2. Full Test Suite Against Production Build**
- [ ] Build production: `npm run build`
- [ ] Start production server: `npm start`
- [ ] Update `TEST_CONFIG.BASE_URL` to production URL
- [ ] Run all 286 tests: `npx playwright test --workers=2`
- [ ] Verify 100% pass rate (286/286) or document failures
- [ ] Document any production-specific issues

### **3. Quality Checks**
- [ ] `npm run lint` - 0 warnings, 0 errors
- [ ] `npm run type-check` - 0 TypeScript errors
- [ ] `npm run build` - completes successfully
- [ ] `npm audit` - no high/critical vulnerabilities
- [ ] Check for any TODO/FIXME comments in code

### **4. Performance Testing**
- [ ] Run Lighthouse audit (Performance, PWA, Best Practices, Accessibility, SEO)
- [ ] Target scores: All > 90
- [ ] Page load times under 3 seconds (test on 3G)
- [ ] Time to Interactive under 5 seconds
- [ ] First Contentful Paint under 2 seconds

### **5. Security Testing**
- [ ] CSP headers properly configured (check browser console)
- [ ] No console errors/warnings in production
- [ ] All API endpoints require authentication (test unauthorized access)
- [ ] Rate limiting works correctly (test Supabase rate limits)
- [ ] HTTPS enforced (no mixed content warnings)
- [ ] Cookies have Secure and HttpOnly flags set

### **6. Cross-Browser Testing**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### **7. Database & API Testing**
- [ ] All tRPC procedures work correctly
- [ ] Database queries are optimized (no N+1 queries)
- [ ] Connection pooling works (test under load)
- [ ] Migrations have been run
- [ ] Seed data is correct

### **8. Authentication & Authorization**
- [ ] Supabase Auth works (Google OAuth, Email)
- [ ] JWT tokens refresh correctly
- [ ] Session persistence works
- [ ] Logout clears all session data
- [ ] Protected routes require authentication
- [ ] Role-based access control works (admin, user, customer, etc.)

### **9. Monitoring & Logging**
- [ ] Sentry configured and capturing errors
- [ ] Sentry performance monitoring enabled
- [ ] Error boundaries catch and report errors
- [ ] No sensitive data in logs

### **10. Environment Configuration**
- [ ] All environment variables set correctly
- [ ] `.env.production` file configured
- [ ] No development-only code running (dev-login API should return 404)
- [ ] Database URL points to production
- [ ] API keys are production keys (not test keys)

---

## 🔄 Process for Adding Items to This List

When ANY issue is deferred for production testing:

1. **Create Entry in This File** with all details:
   - Title and status
   - Issue description and root cause
   - Tests affected (file paths and line numbers)
   - Expected behavior
   - Changes made (if any)
   - Detailed test plan
   - Acceptance criteria
   - Assignment and target date

2. **Tag with Priority**:
   - 🔴 **Critical**: Blocks production deployment
   - 🟡 **High**: Should be tested before deployment
   - 🟢 **Medium**: Can be tested after deployment
   - 🔵 **Low**: Nice to have

3. **Update Documentation**:
   - Reference this checklist in `CLAUDE.md`
   - Update relevant test documentation
   - Add comments in code if applicable

4. **Track Until Resolution**:
   - Set clear owner and deadline
   - Create GitHub issue if needed
   - Review status in every production planning meeting
   - Mark as complete ONLY after verified in production

5. **Never Remove Without Fixing**:
   - Items can only be removed after 100% verified
   - Document resolution date and results
   - Keep audit trail (move to "Completed" section below)

---

## ✅ Completed Production Tests

(Items move here after verified in production)

<!-- Example:
### **PWA Service Worker Functionality**
- **Completed**: 2025-10-15
- **Result**: All 3 tests pass, service worker works correctly
- **Notes**: Verified on Chrome, Firefox, Safari, iOS, Android
-->

---

## 📚 References

- Next.js PWA Documentation: https://github.com/DuCanh2912/next-pwa
- Playwright Testing: https://playwright.dev/docs/intro
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Sentry Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

**Last Updated**: 2025-10-08
**Next Review**: Before production deployment
