# Vercel Environment Variables Checklist

## 🚨 CRITICAL: These MUST be set in Vercel for the app to work

### Required for ALL environments (Production, Preview, Development)

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

### ✅ Checklist - Verify ALL of these are set:

#### 1. Supabase Connection (CRITICAL)
```
NEXT_PUBLIC_SUPABASE_URL=https://hwaxogapihsqleyzpqtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Where to find these values:**
- Go to: https://supabase.com/dashboard/project/hwaxogapihsqleyzpqtj/settings/api
- Copy:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

#### 2. Database URL (Optional but recommended)
```
DATABASE_URL=postgresql://postgres:<password>@db.hwaxogapihsqleyzpqtj.supabase.co:5432/postgres
```

**Where to find this:**
- Go to: https://supabase.com/dashboard/project/hwaxogapihsqleyzpqtj/settings/database
- Copy the "Connection string" under "Connection pooling" or "Direct connection"
- Replace `[YOUR-PASSWORD]` with your actual database password

#### 3. OAuth (if using Google login)
```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

#### 4. Next.js Configuration
```
NEXTAUTH_URL=https://limn-systems-enterprise.vercel.app
NEXTAUTH_SECRET=<generate-random-secret>
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🔍 How to Verify

### Step 1: Check Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project: `limn-systems-enterprise`
3. Go to **Settings** → **Environment Variables**
4. Verify ALL the variables above are present

### Step 2: Check Variable Scope

Each variable should be enabled for:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 3: Redeploy After Adding Variables

1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Select **Use existing build cache** = OFF
5. Click **Redeploy**

---

## 🐛 Common Issues

### Issue: All tRPC queries return 500 errors

**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel
2. Redeploy
3. Clear browser cache (see below)

### Issue: "Supabase configuration missing" error in logs

**Cause:** Missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`

**Fix:** Add both variables and redeploy

### Issue: Service worker shows cached 500 errors

**Fix:** Clear service worker:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Click **Unregister**
5. Click **Clear storage** > **Clear site data**
6. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 📋 Current Diagnosis

Based on the browser errors you're seeing:
```
Failed to load resource: the server responded with a status of 500 ()
(tasks.getAllTasks,notifications.getUnreadCount,userProfile.getCurrentUser...)
```

**Root cause:** The tRPC server is crashing because it can't connect to Supabase.

**Most likely missing:** `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Next Steps

1. **Verify env vars** on Vercel (use checklist above)
2. **Add missing variables** (especially `SUPABASE_SERVICE_ROLE_KEY`)
3. **Redeploy** (disable build cache)
4. **Clear service worker** in browser
5. **Test** - refresh the dashboard

If errors persist after this, check Vercel logs:
- Go to **Deployments** → Latest deployment → **Functions** tab
- Look for error messages that show why tRPC is failing
