# Supabase Environment Variables Verification Guide

## Quick Verification Steps

### 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Find these values:

#### Project URL
```
URL: https://[project-ref].supabase.co
```
→ Copy this EXACTLY for `NEXT_PUBLIC_SUPABASE_URL`

#### Project API Keys

**anon / public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cWtianlmYmFya3Vmd3ZkbWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM0MjA3NDgsImV4cCI6MjAwODk5Njc0OH0...
```
→ **Look for `"role":"anon"`** in the JWT
→ Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**service_role key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cWtianlmYmFya3Vmd3ZkbWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MzQyMDc0OCwiZXhwIjoyMDA4OTk2NzQ4fQ...
```
→ **Look for `"role":"service_role"`** in the JWT
→ Copy this for `SUPABASE_SERVICE_ROLE_KEY`

### 2. Verify Which Key is Which

You can decode the JWT to verify:

```bash
# On macOS/Linux, decode the JWT payload
echo "YOUR_KEY_HERE" | cut -d'.' -f2 | base64 -d | jq
```

Expected output for **anon key**:
```json
{
  "iss": "supabase",
  "ref": "your-project-ref",
  "role": "anon",  ← Look for this
  "iat": 1693420748,
  "exp": 2008996748
}
```

Expected output for **service_role key**:
```json
{
  "iss": "supabase",
  "ref": "your-project-ref",
  "role": "service_role",  ← Look for this
  "iat": 1693420748,
  "exp": 2008996748
}
```

### 3. Common Mistakes

❌ **WRONG:** Using the anon key for both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
- **Symptom:** Authentication works but database queries fail with "permission denied"

❌ **WRONG:** Using keys from different Supabase projects
- **Symptom:** Authentication fails or database queries fail

❌ **WRONG:** Using development database keys in production
- **Symptom:** Tables don't exist, different data

### 4. Vercel Environment Variable Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables for **Production**, **Preview**, AND **Development**:

```
NEXT_PUBLIC_SUPABASE_URL = https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc... (anon key with "role":"anon")
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc... (service role key with "role":"service_role")
```

5. **Critical:** After updating, you MUST **redeploy** for changes to take effect
   - Go to **Deployments** tab
   - Click **...** menu on latest deployment
   - Click **Redeploy**

### 5. Test the Configuration

After deploying, check the Vercel runtime logs. You should see:

✅ **Success:**
```
[getSupabaseAdmin] Environment check:
  hasUrl: true
  urlValue: https://[project-ref].supabase...
  hasServiceKey: true
  serviceKeyPrefix: eyJhbGciOiJIUzI1NiIsI...
  nodeEnv: production

[getSupabaseAdmin] Testing database connectivity...
[getSupabaseAdmin] ✅ Database test PASSED - successfully queried orders table
```

❌ **Permission Error (Wrong Key):**
```
[getSupabaseAdmin] ❌ Database test FAILED: { code: '42501', message: 'permission denied for schema public' }
[getSupabaseAdmin] 🚨 PERMISSION DENIED ERROR:
  This suggests the SUPABASE_SERVICE_ROLE_KEY may be incorrect.
```
→ **Fix:** Verify you're using the service_role key (with `"role":"service_role"`), not the anon key

❌ **Table Not Found (Wrong Project):**
```
[getSupabaseAdmin] ❌ Database test FAILED: { code: '42P01', message: 'relation "public.orders" does not exist' }
[getSupabaseAdmin] 🚨 TABLE NOT FOUND ERROR:
  The "orders" table does not exist in the database.
```
→ **Fix:** Verify NEXT_PUBLIC_SUPABASE_URL points to the correct Supabase project (dev vs prod)

## Troubleshooting Checklist

- [ ] Verified NEXT_PUBLIC_SUPABASE_URL matches your Supabase project URL
- [ ] Verified NEXT_PUBLIC_SUPABASE_ANON_KEY is the anon key (decoded JWT shows `"role":"anon"`)
- [ ] Verified SUPABASE_SERVICE_ROLE_KEY is the service role key (decoded JWT shows `"role":"service_role"`)
- [ ] All three variables are set for Production, Preview, AND Development in Vercel
- [ ] Redeployed after updating environment variables
- [ ] Checked Vercel runtime logs for diagnostic messages
- [ ] Verified using the correct Supabase project (dev vs prod database)

## Need Help?

Run this command locally to verify your .env.local is correct:
```bash
npm run verify-env
```

Check Vercel runtime logs:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to **Runtime Logs** tab
4. Look for `[getSupabaseAdmin]` messages
