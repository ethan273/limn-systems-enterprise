-- CreateEnum for address types
DO $$ BEGIN
 CREATE TYPE address_type AS ENUM ('Business', 'Residential');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Address fields
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'USA',

    -- Address metadata
    address_type address_type NOT NULL DEFAULT 'Business',
    is_primary BOOLEAN NOT NULL DEFAULT false,

    -- Polymorphic relationships (entity can be contact, lead, or customer)
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

    -- Audit fields
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    created_by UUID,

    -- Ensure address belongs to exactly one entity
    CONSTRAINT address_entity_check CHECK (
        (contact_id IS NOT NULL AND lead_id IS NULL AND customer_id IS NULL) OR
        (contact_id IS NULL AND lead_id IS NOT NULL AND customer_id IS NULL) OR
        (contact_id IS NULL AND lead_id IS NULL AND customer_id IS NOT NULL)
    )
);

-- Add indexes for performance
CREATE INDEX idx_addresses_contact_id ON addresses(contact_id);
CREATE INDEX idx_addresses_lead_id ON addresses(lead_id);
CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX idx_addresses_is_primary ON addresses(is_primary);

-- Migrate existing customer address data to addresses table
INSERT INTO addresses (
    address_line_1,
    address_line_2,
    city,
    state_province,
    postal_code,
    country,
    address_type,
    is_primary,
    customer_id,
    created_at,
    updated_at
)
SELECT
    COALESCE(billing_address_line1, ''),
    billing_address_line2,
    COALESCE(billing_city, city, ''),
    COALESCE(billing_state, state, ''),
    COALESCE(billing_zip, zip, ''),
    COALESCE(billing_country, country, 'USA'),
    'Business'::address_type,
    true,
    id,
    created_at,
    updated_at
FROM customers
WHERE billing_address_line1 IS NOT NULL
   OR city IS NOT NULL
   OR billing_city IS NOT NULL;

-- Add first_name and last_name to contacts
ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing name data in contacts (split on first space)
UPDATE contacts
SET
    first_name = CASE
        WHEN name IS NOT NULL AND position(' ' IN name) > 0
        THEN SPLIT_PART(name, ' ', 1)
        ELSE name
    END,
    last_name = CASE
        WHEN name IS NOT NULL AND position(' ' IN name) > 0
        THEN SUBSTRING(name FROM position(' ' IN name) + 1)
        ELSE NULL
    END
WHERE name IS NOT NULL;

-- Add first_name and last_name to leads
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing name data in leads
UPDATE leads
SET
    first_name = CASE
        WHEN name IS NOT NULL AND position(' ' IN name) > 0
        THEN SPLIT_PART(name, ' ', 1)
        ELSE name
    END,
    last_name = CASE
        WHEN name IS NOT NULL AND position(' ' IN name) > 0
        THEN SUBSTRING(name FROM position(' ' IN name) + 1)
        ELSE NULL
    END
WHERE name IS NOT NULL;

-- Add first_name and last_name to customers
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing name data in customers
UPDATE customers
SET
    first_name = CASE
        WHEN name IS NOT NULL AND position(' ' IN name) > 0
        THEN SPLIT_PART(name, ' ', 1)
        ELSE name
    END,
    last_name = CASE
        WHEN name IS NOT NULL AND position(' ' IN name) > 0
        THEN SUBSTRING(name FROM position(' ' IN name) + 1)
        ELSE NULL
    END
WHERE name IS NOT NULL;

-- Add shipping_address_id to projects
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL;

-- Create index for shipping address lookups
CREATE INDEX idx_projects_shipping_address_id ON projects(shipping_address_id);

-- Add trigger to automatically update updated_at on addresses
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_addresses_updated_at();

-- Add comment to document the migration
COMMENT ON TABLE addresses IS 'Stores addresses for contacts, leads, and customers with support for multiple addresses per entity';
