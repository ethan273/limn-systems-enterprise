import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating api_usage_logs table...');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.api_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name VARCHAR(100) NOT NULL,
        endpoint VARCHAR(500),
        method VARCHAR(10),
        status_code INTEGER,
        response_time_ms INTEGER,
        error_message TEXT,
        request_size INTEGER,
        response_size INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        CONSTRAINT fk_api_usage_service
          FOREIGN KEY (service_name)
          REFERENCES public.api_credentials(service_name)
          ON DELETE CASCADE
      );
    `);

    console.log('Creating indexes...');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_api_usage_service
      ON public.api_usage_logs(service_name);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_api_usage_created_at
      ON public.api_usage_logs(created_at);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_api_usage_status
      ON public.api_usage_logs(status_code);
    `);

    console.log('✅ Successfully created api_usage_logs table with indexes');

  } catch (error) {
    console.error('Error creating api_usage_logs table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
