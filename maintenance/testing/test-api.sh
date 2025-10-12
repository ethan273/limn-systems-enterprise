#!/bin/bash

echo "🚀 Testing tRPC API Setup"
echo "========================"

# Test database connection first
echo ""
echo "1️⃣ Testing database connection..."
node test-db-connection.js | grep "✅"

# Test API endpoint
echo ""
echo "2️⃣ Testing API endpoint..."
curl -X POST http://localhost:3000/api/trpc/tasks.getAll \
  -H "Content-Type: application/json" \
  -d '{"json":{"limit":5,"offset":0}}' \
  2>/dev/null | head -c 100

echo ""
echo ""
echo "3️⃣ Starting development server..."
echo "Run: npm run dev"
echo ""
echo "Then test endpoints:"
echo "  - http://localhost:3000/api/trpc/tasks.getAll"
echo "  - http://localhost:3000/api/trpc/customers.getAll"
echo "  - http://localhost:3000/api/trpc/orders.getAll"
