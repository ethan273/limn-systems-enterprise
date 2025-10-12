#!/bin/bash

# Supabase Pro Connection Update Script
# Run this after copying your connection strings from the dashboard

echo "🔧 Supabase Pro Connection Update"
echo "=================================="
echo ""
echo "Please paste your connection strings from the Supabase Dashboard:"
echo ""

# Prompt for Direct Connection
echo "1. DIRECT CONNECTION (from 'Connection string' section):"
echo "   Should look like: postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"
read -p "Paste here: " DIRECT_URL

# Prompt for Pooled Connection
echo ""
echo "2. POOLED CONNECTION (from 'Connection pooling' → 'Transaction' mode):"
echo "   Should look like: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
read -p "Paste here: " DATABASE_URL

# Create new .env file
echo ""
echo "📝 Creating new .env file..."

cat > .env.new << EOF
# Supabase Pro Connection - Updated $(date)
NEXT_PUBLIC_SUPABASE_URL=https://kufakdnlhhcwynkfchbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database connections
DATABASE_URL="${DATABASE_URL}"
DIRECT_URL="${DIRECT_URL}"

# Shadow database for migrations (using direct connection)
SHADOW_DATABASE_URL="${DIRECT_URL}"
EOF

# Backup old .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up old .env file"
fi

# Replace .env with new one
mv .env.new .env
echo "✅ Updated .env file"

# Test connection
echo ""
echo "🧪 Testing new connection..."
echo ""

node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: '${DATABASE_URL}',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => client.query('SELECT NOW()'))
  .then(res => {
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('⏰ Server time:', res.rows[0].now);
    return client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
"

echo ""
echo "📋 Next steps:"
echo "1. Run: npx prisma generate"
echo "2. Run: npx prisma db pull"
echo "3. Continue with API development!"
