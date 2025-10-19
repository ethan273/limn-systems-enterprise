# Vercel Deployment Guide

## 🚨 Critical: Environment Variables Required

Your application requires these environment variables to function. The errors you're experiencing ("permission denied for schema public", "Failed to fetch from tasks") are caused by **missing environment variables in Vercel**.

### Required Environment Variables

Navigate to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add the following variables for **all environments** (Production, Preview, Development):

#### 1. Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (⚠️ secret!) → `SUPABASE_SERVICE_ROLE_KEY`

#### 2. Database Connection (Optional - for Prisma)

```
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

## 📋 Deployment Checklist

### Before Deploying to Vercel:

- [ ] **Environment Variables Added**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` set
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` set
  - [ ] All three variables set for **Production**, **Preview**, AND **Development** environments

- [ ] **Build Configuration**
  - [ ] Framework Preset: **Next.js**
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm install`
  - [ ] Node Version: **20.x** (set in Project Settings)

- [ ] **Environment-Specific Settings**
  - [ ] Production variables configured
  - [ ] Preview variables configured (same as production for testing)
  - [ ] Development variables configured

- [ ] **Vercel Configuration File**
  - [ ] `vercel.json` exists (optional - we use default settings)
  - [ ] Memory settings configured if needed (not required for standard deployment)

### After Deploying:

- [ ] Visit deployment URL
- [ ] Test login functionality
- [ ] Verify dashboard loads without "permission denied" errors
- [ ] Check browser console for errors
- [ ] Verify data fetching works

## 🔧 How to Add Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click **Settings** tab
4. Click **Environment Variables** in the sidebar
5. For each variable:
   - **Key**: Enter variable name (e.g., `SUPABASE_SERVICE_ROLE_KEY`)
   - **Value**: Paste the value
   - **Environments**: Select **Production**, **Preview**, **Development** (check all three)
   - Click **Save**
6. **Redeploy** your application after adding all variables

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Add variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Repeat for preview and development environments
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
# ... etc
```

### Method 3: `.env.production` (Not Recommended for Secrets)

⚠️ **WARNING**: Do NOT use this method for `SUPABASE_SERVICE_ROLE_KEY` as it would expose secrets in git!

## 🔍 Troubleshooting

### Error: "permission denied for schema public"

**Cause 1**: Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable

**Solution**:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
2. Ensure the key is the **service_role** key (NOT the anon key)
3. Redeploy the application

**Cause 2**: Database schema permissions not configured (even with correct service_role key)

**Solution - Run this SQL in Supabase SQL Editor:**

```sql
-- Grant schema-level permissions to service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Make it permanent for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS IN SCHEMA public TO service_role;
```

**Why this is needed:**
- Supabase RLS requires BOTH table-level policies AND schema-level permissions
- Even if your service_role key is correct, without schema permissions it cannot access tables
- This is a **one-time setup** per Supabase project
- No redeploy needed after running this SQL

### Error: "Failed to fetch from tasks"

**Cause**: Database queries failing due to missing service role key

**Solution**: Same as above - add `SUPABASE_SERVICE_ROLE_KEY`

### Error: Double Authentication Required (FIXED - October 18, 2025)

**Status**: ✅ **RESOLVED**

**Cause**: Cookies with `sameSite: 'lax'` were being dropped during OAuth redirect chains in incognito/private browsing mode

**Solution Applied**:
Changed cookie configuration in `/src/app/auth/callback/route.ts`:
```javascript
// OLD (caused issues in incognito):
sameSite: 'lax'

// NEW (works in incognito):
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
```

**Why This Works**:
- Modern browsers (Chrome 115+, Safari 16.4+) have strict cookie handling in incognito mode
- OAuth flows involve multiple redirects: Google → /auth/callback → /auth/establish-session → /dashboard
- `sameSite: 'lax'` cookies can be dropped during these redirects in incognito mode
- `sameSite: 'none'` (with `secure: true`) allows cookies to persist across OAuth redirects

**Configuration**:
- Production (HTTPS): `sameSite: 'none', secure: true` - Works in incognito
- Development (HTTP): `sameSite: 'lax', secure: false` - Works normally

**Deployment Required**: Yes - Redeploy to production to apply this fix

**Verification After Deployment**:
1. Open incognito/private browsing window
2. Navigate to production URL
3. Sign in with Google OAuth
4. Should redirect to dashboard in **one authentication** (not two)
5. Check Vercel logs - should see: `sameSite=none, secure=true, httpOnly=true`

**Additional Check** (if still having issues):
Verify your deployment domain is in Supabase's authorized URLs:
- Go to Supabase Dashboard → Authentication → URL Configuration
- Add your Vercel domain to Site URL and Redirect URLs
- Example: `https://your-app.vercel.app`

### Error: "Supabase configuration missing"

**Cause**: Environment variables not loaded or named incorrectly

**Solution**:
1. Verify variable names match **exactly** (case-sensitive)
2. Check that all three environment types are configured
3. Redeploy after making changes

## 🔄 Redeployment Required

**IMPORTANT**: After adding or modifying environment variables, you MUST redeploy your application:

1. Go to **Deployments** tab in Vercel
2. Click the **︙** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

## 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)
- [Supabase Setup Guide](https://supabase.com/docs/guides/getting-started)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## ✅ Verification Steps

After setting environment variables and redeploying:

```bash
# Check Vercel deployment logs
vercel logs

# Verify environment variables are set (in Vercel dashboard)
# Settings → Environment Variables → Should show all three variables
```

Visit your deployment:
1. Try logging in
2. Check dashboard loads
3. Verify no "permission denied" errors
4. Check browser DevTools → Network tab for failed requests

## 🔐 Security Notes

- ⚠️ **NEVER commit** `SUPABASE_SERVICE_ROLE_KEY` to git
- ⚠️ **NEVER expose** service role key in client-side code
- ✅ **ALWAYS** add `.env*.local` to `.gitignore`
- ✅ **ALWAYS** use Vercel dashboard or CLI to set secret variables

## Need Help?

If you're still experiencing issues after following this guide:
1. Check Vercel deployment logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure Supabase project is active and accessible
4. Check that your Vercel domain is added to Supabase's authorized URLs
