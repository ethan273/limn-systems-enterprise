import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating api_credentials table...');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.api_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(200) NOT NULL,
        description TEXT,
        credential_type VARCHAR(50) DEFAULT 'api_key',
        credentials JSONB NOT NULL,
        environment VARCHAR(50) DEFAULT 'production',
        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    console.log('Creating indexes...');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_api_credentials_service
      ON public.api_credentials(service_name);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_api_credentials_active
      ON public.api_credentials(is_active);
    `);

    console.log('Creating update trigger...');

    // Create updated_at trigger function if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_api_credentials_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop existing trigger if it exists
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS update_api_credentials_updated_at_trigger
      ON public.api_credentials;
    `);

    // Create the trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER update_api_credentials_updated_at_trigger
      BEFORE UPDATE ON public.api_credentials
      FOR EACH ROW
      EXECUTE FUNCTION update_api_credentials_updated_at();
    `);

    console.log('✅ Successfully created api_credentials table with triggers');

  } catch (error) {
    console.error('Error creating api_credentials table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
