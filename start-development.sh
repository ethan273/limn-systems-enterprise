#!/bin/bash

# Limn Systems Enterprise - Quick Start Script
# Run this to begin API development immediately

echo "🚀 Starting Limn Systems Enterprise API Development"
echo "=================================================="

# 1. Test Database Connection
echo "1️⃣ Testing Database Connection..."
node test-db-connection.js

# 2. Create tRPC Router Structure
echo ""
echo "2️⃣ Creating tRPC API Structure..."
mkdir -p src/server/api/routers
mkdir -p src/server/api/trpc
mkdir -p src/lib
echo "✅ Directories created"

# 3. Generate TypeScript types from Prisma
echo ""
echo "3️⃣ Generating TypeScript types..."
npx prisma generate

# 4. Start Development Server
echo ""
echo "4️⃣ Starting Next.js Development Server..."
echo "=================================================="
echo "📋 Your API will be available at:"
echo "   http://localhost:3000/api/trpc/*"
echo ""
echo "📊 Database Studio available at:"
echo "   npx prisma studio"
echo "=================================================="
npm run dev
