#!/bin/bash

# Update Database Password and Run Prisma Setup
# Usage: ./update-db-and-pull.sh "your-password-here"

if [ -z "$1" ]; then
  echo "❌ Please provide the database password"
  echo "Usage: ./update-db-and-pull.sh \"your-password-here\""
  exit 1
fi

PASSWORD=$1
echo "🔐 Updating database configuration..."
echo "Password: ${PASSWORD:0:3}..."
echo ""

# Update .env file with proper connection strings
cat > .env.new << EOF
# Your Supabase URL stays the same
NEXT_PUBLIC_SUPABASE_URL=https://kufakdnlhhcwynkfchbb.supabase.co

# Publishable key (formerly anon) - safe for browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Vhi9mzNZrn6FfqiTXbd8vA_6kA7I5SS

# Secret key (formerly service_role) - server only, never expose
SUPABASE_SERVICE_ROLE_KEY=sb_secret_nZ67pqDex4ATjC55zfCFaQ_kFeLCx9m

# Database URLs for Prisma
# Use pooler (port 6543) for app queries
DATABASE_URL=postgresql://postgres.kufakdnlhhcwynkfchbb:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Use direct connection (port 5432) for migrations and introspection  
DIRECT_URL=postgresql://postgres.kufakdnlhhcwynkfchbb:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# QuickBooks Integration
QUICKBOOKS_CLIENT_ID=ABDLjkYz6JfojfUIyaeZStXRjPPpQ4HN1o0NIPJ3jEv24u9rMV
QUICKBOOKS_CLIENT_SECRET=Y8zAkXCgDTQmOY3JfGU9NvxArftz2IjhyuDDnO6X
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Seko Logistics API (Mock Mode)
NEXT_PUBLIC_SEKO_PROFILE_ID=LIMN_PROFILE_TEST
SEKO_API_KEY=
SEKO_API_SECRET=
NEXT_PUBLIC_SEKO_ENV=qa
NEXT_PUBLIC_SEKO_BASE_URL=https://qawebapi.myseko.com

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=MG663254a58e99bec81cbffeaa02f8e8c5
TWILIO_AUTH_TOKEN=1868e3ab64f4bb69f39703dd43c16c8d
TWILIO_FROM_NUMBER=+18339583439

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
EOF

# Backup old .env file
cp .env .env.backup
echo "✅ Backed up old .env to .env.backup"

# Replace with new .env
mv .env.new .env
echo "✅ Updated .env file with new password"
echo ""

echo "🔄 Running Prisma db pull..."
npx prisma db pull

echo ""
echo "🔄 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Complete! Prisma schema should now be updated."
echo ""
echo "📋 Next steps:"
echo "1. Check prisma/schema.prisma for your database schema"
echo "2. Run 'npm run dev' to test the application"
