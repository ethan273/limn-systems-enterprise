/**
 * EMERGENCY HOTFIX for Vercel + Prisma
 * Replace your src/lib/prisma.ts with this file IMMEDIATELY
 * This will fix your connection issues right away
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Parse connection string and add Vercel-friendly params
function getOptimizedConnectionString(): string {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // If we already have a pooling URL (Supabase port 6543), use it
  if (dbUrl.includes(':6543')) {
    return dbUrl;
  }

  // Add connection pooling parameters for Vercel
  const url = new URL(dbUrl);
  
  // Critical serverless parameters
  url.searchParams.set('pgbouncer', 'true');
  url.searchParams.set('connection_limit', '1');
  url.searchParams.set('pool_timeout', '2');
  
  // Prevent connection hanging
  url.searchParams.set('connect_timeout', '10');
  url.searchParams.set('statement_timeout', '10000');
  url.searchParams.set('idle_in_transaction_session_timeout', '10000');
  
  return url.toString();
}

// Create optimized Prisma client
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: getOptimizedConnectionString(),
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'minimal',
  });
};

// Use singleton pattern for client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Only cache in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// CRITICAL: Clean up connections in serverless
if (process.env.NODE_ENV === 'production') {
  // Disconnect on function exit
  process.on('exit', () => {
    prisma.$disconnect();
  });
  
  // Handle serverless timeouts
  process.on('SIGTERM', () => {
    prisma.$disconnect();
  });
  
  process.on('SIGINT', () => {
    prisma.$disconnect();
  });
}

export default prisma;

/**
 * DEPLOYMENT CHECKLIST:
 * 
 * 1. Replace src/lib/prisma.ts with this file
 * 2. Set in Vercel Dashboard:
 *    - DATABASE_URL = Your Supabase pooling URL (port 6543)
 *    - Or add ?pgbouncer=true&connection_limit=1 to existing URL
 * 3. Redeploy
 * 
 * This should fix your issues IMMEDIATELY
 */