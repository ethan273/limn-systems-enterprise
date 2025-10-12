# UPDATE YOUR CONNECTION STRINGS

# 1. Go to Supabase Dashboard: https://supabase.com/dashboard
# 2. Select your ACTUAL project (not kufakdnlhhcwynkfchbb)
# 3. Go to Settings → Database
# 4. Copy the connection strings and paste them below:

# Direct Connection (from "Connection string" section):
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Pooled Connection (from "Connection pooling" → "Transaction" mode):
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# After updating above, run:
# 1. Update .env file with correct DATABASE_URL
# 2. Update prisma/schema.prisma if using DIRECT_URL
# 3. Run: npx prisma generate
# 4. Test connection: npx prisma db pull --print

echo "Update the connection strings above with your ACTUAL Supabase Pro project details!"
