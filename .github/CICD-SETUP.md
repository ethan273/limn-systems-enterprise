# CI/CD Configuration Guide

## Required GitHub Secrets

The GitHub Actions workflows require the following secrets to be configured in your repository settings.

### How to Configure Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each of the secrets listed below

### Required Secrets

#### Supabase Configuration (REQUIRED)

These secrets are **mandatory** for the application to function. The middleware and authentication system will fail without them.

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API |

**Example values:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Database Configuration (REQUIRED for tests)

| Secret Name | Description |
|-------------|-------------|
| `TEST_DATABASE_URL` | PostgreSQL connection URL for test database |

**Example:**
```
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/test_db
```

#### Optional Secrets

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `CHROMATIC_PROJECT_TOKEN` | Visual regression testing token | Visual regression tests |
| `SENTRY_AUTH_TOKEN` | Sentry error tracking auth token | Source map uploads |

## Verification

After configuring secrets, you can verify they're working by:

1. **Checking GitHub Actions**: Go to Actions tab and check if workflows run successfully
2. **Local verification**: The middleware will log helpful errors if secrets are missing

### Expected Error When Secrets Are Missing

If secrets are not configured, you'll see errors like:

```
❌ MIDDLEWARE ERROR: Missing required Supabase environment variables
Required environment variables:
  - NEXT_PUBLIC_SUPABASE_URL: ❌ MISSING
  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ❌ MISSING

For GitHub Actions, configure these secrets in:
  Repository Settings > Secrets and variables > Actions
```

## Workflow Files Using Secrets

### `.github/workflows/testing.yml`

The testing workflow uses these secrets in the `auth-security-tests` job:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use different keys** for production, staging, and development
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Limit secret access** to only the workflows that need them
5. **Use environment-specific secrets** for different deployment targets

## Troubleshooting

### Tests are failing with Supabase errors

**Problem:** Tests fail with "Missing required Supabase environment variables"

**Solution:**
1. Verify secrets are configured in GitHub Settings
2. Check secret names match exactly (case-sensitive)
3. Ensure secrets are available to the repository (not just the organization)

### Dev server won't start in GitHub Actions

**Problem:** `npm run dev` fails with configuration errors

**Solution:**
1. Check that the workflow step includes the required env vars
2. Verify the secrets exist and are properly configured
3. Review the GitHub Actions logs for specific error messages

## Getting Supabase Credentials

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** (gear icon) > **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" to see it)

## Support

For issues with CI/CD configuration:
1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
2. Review workflow logs in the Actions tab
3. Ensure all required secrets are configured
