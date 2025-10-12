#!/bin/bash

echo "🚀 Applying Clients Terminology Update & Testing API"
echo "===================================================="
echo ""

# Step 1: Apply migration
echo "1️⃣ Applying database migration..."
echo ""

# Get database URL from .env file
export DATABASE_URL=$(grep DIRECT_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

echo "Database URL found: ${DATABASE_URL:0:30}..."
echo ""

# Apply migration
psql "$DATABASE_URL" < migrations/002_clients_terminology.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check your database connection."
    exit 1
fi

echo ""
echo "2️⃣ Testing database changes..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testChanges() {
  try {
    // Test clients view
    const clients = await prisma.\$queryRaw\`SELECT COUNT(*) FROM clients\`;
    console.log('✅ Clients view working: ' + clients[0].count + ' clients found');
    
    // Test prospect_status field
    const leads = await prisma.\$queryRaw\`
      SELECT COUNT(*) FROM leads WHERE prospect_status IS NOT NULL
    \`;
    console.log('✅ Prospect status field added: ' + leads[0].count + ' leads with status');
    
    // Test order_items
    const orderItems = await prisma.\$queryRaw\`SELECT COUNT(*) FROM order_items\`;
    console.log('✅ Order items table: ' + orderItems[0].count + ' items found');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

testChanges();
"

echo ""
echo "3️⃣ Starting development server..."
echo ""
echo "Run in new terminal: npm run dev"
echo ""
echo "Then test these endpoints:"
echo "  curl -X POST http://localhost:3000/api/trpc/clients.getAll -H 'Content-Type: application/json' -d '{\"json\":{\"limit\":5}}'"
echo "  curl -X POST http://localhost:3000/api/trpc/tasks.getAll -H 'Content-Type: application/json' -d '{\"json\":{\"limit\":5}}'"
echo "  curl -X POST http://localhost:3000/api/trpc/orders.getAll -H 'Content-Type: application/json' -d '{\"json\":{\"limit\":5}}'"
echo ""
echo "✅ Setup complete!"
