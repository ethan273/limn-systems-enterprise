-- Products Module Detail Pages - Database Schema Enhancements
-- This migration adds fields for unified media management and entity relationships

-- ============================================
-- PHASE 1: ENHANCE DOCUMENTS TABLE
-- ============================================

-- Add media classification and usage fields
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS concept_id UUID,
ADD COLUMN IF NOT EXISTS prototype_id UUID,
ADD COLUMN IF NOT EXISTS catalog_item_id UUID,
ADD COLUMN IF NOT EXISTS production_order_id UUID,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS use_for_packaging BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS use_for_labeling BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS use_for_marketing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_primary_image BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_drive_file_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_source VARCHAR(20) DEFAULT 'supabase';

-- Add foreign key constraints for documents
ALTER TABLE documents
ADD CONSTRAINT fk_documents_prototypes FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_concept_id ON documents(concept_id);
CREATE INDEX IF NOT EXISTS idx_documents_prototype_id ON documents(prototype_id);
CREATE INDEX IF NOT EXISTS idx_documents_catalog_item_id ON documents(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_documents_production_order_id ON documents(production_order_id);
CREATE INDEX IF NOT EXISTS idx_documents_media_type ON documents(media_type);
CREATE INDEX IF NOT EXISTS idx_documents_packaging ON documents(use_for_packaging) WHERE use_for_packaging = true;
CREATE INDEX IF NOT EXISTS idx_documents_labeling ON documents(use_for_labeling) WHERE use_for_labeling = true;

-- ============================================
-- PHASE 2: ENHANCE PROTOTYPES TABLE
-- ============================================

-- Add designer, manufacturer, and collection relationships
ALTER TABLE prototypes
ADD COLUMN IF NOT EXISTS designer_id UUID,
ADD COLUMN IF NOT EXISTS manufacturer_id UUID,
ADD COLUMN IF NOT EXISTS collection_id UUID,
ADD COLUMN IF NOT EXISTS concept_id UUID;

-- Add foreign key constraints for prototypes
ALTER TABLE prototypes
ADD CONSTRAINT fk_prototypes_designer FOREIGN KEY (designer_id) REFERENCES designers(id),
ADD CONSTRAINT fk_prototypes_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
ADD CONSTRAINT fk_prototypes_collection FOREIGN KEY (collection_id) REFERENCES collections(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_prototypes_designer_id ON prototypes(designer_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_manufacturer_id ON prototypes(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_collection_id ON prototypes(collection_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_concept_id ON prototypes(concept_id);

-- ============================================
-- PHASE 3: CREATE CONCEPTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  concept_number VARCHAR(50) UNIQUE,

  -- Relationships
  designer_id UUID,
  collection_id UUID,
  created_by UUID NOT NULL,

  -- Status & Classification
  status VARCHAR(50) DEFAULT 'concept',  -- 'concept', 'under_review', 'approved', 'rejected', 'moved_to_prototype'
  priority VARCHAR(20) DEFAULT 'medium',

  -- Specifications
  specifications JSONB,
  target_price DECIMAL(10,2),
  estimated_cost DECIMAL(10,2),

  -- Metadata
  tags TEXT[],
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_concepts_designer FOREIGN KEY (designer_id) REFERENCES designers(id),
  CONSTRAINT fk_concepts_collection FOREIGN KEY (collection_id) REFERENCES collections(id),
  CONSTRAINT fk_concepts_user FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Add indexes for concepts
CREATE INDEX IF NOT EXISTS idx_concepts_designer_id ON concepts(designer_id);
CREATE INDEX IF NOT EXISTS idx_concepts_collection_id ON concepts(collection_id);
CREATE INDEX IF NOT EXISTS idx_concepts_status ON concepts(status);
CREATE INDEX IF NOT EXISTS idx_concepts_concept_number ON concepts(concept_number);
CREATE INDEX IF NOT EXISTS idx_concepts_created_by ON concepts(created_by);

-- Now add foreign key from documents to concepts
ALTER TABLE documents
ADD CONSTRAINT fk_documents_concepts FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE;

-- Add foreign key from prototypes to concepts
ALTER TABLE prototypes
ADD CONSTRAINT fk_prototypes_concepts FOREIGN KEY (concept_id) REFERENCES concepts(id);

-- ============================================
-- PHASE 4: ENHANCE COLLECTIONS TABLE
-- ============================================

-- Add designer_id foreign key
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS designer_id UUID;

-- Add foreign key constraint
ALTER TABLE collections
ADD CONSTRAINT fk_collections_designer FOREIGN KEY (designer_id) REFERENCES designers(id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_collections_designer_id ON collections(designer_id);

-- NOTE: Migration of existing designer names to designer_id will be done in a separate script
-- This requires manual mapping of designer names to designer UUIDs

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN documents.concept_id IS 'Links media to concepts - part of unified media system';
COMMENT ON COLUMN documents.prototype_id IS 'Links media to prototypes - part of unified media system';
COMMENT ON COLUMN documents.catalog_item_id IS 'Links media to catalog items - part of unified media system';
COMMENT ON COLUMN documents.production_order_id IS 'Links media to production orders - part of unified media system';
COMMENT ON COLUMN documents.media_type IS 'Type of media: isometric, line_drawing, rendering, photo, 3d_model, technical_drawing';
COMMENT ON COLUMN documents.use_for_packaging IS 'Flag to indicate if this media should be used for packaging';
COMMENT ON COLUMN documents.use_for_labeling IS 'Flag to indicate if this media should be used for product labels';
COMMENT ON COLUMN documents.google_drive_file_id IS 'Google Drive file ID for files >50MB';
COMMENT ON COLUMN documents.file_source IS 'Storage location: supabase or google_drive';

COMMENT ON TABLE concepts IS 'Product concepts - initial design ideas before prototyping';
COMMENT ON COLUMN prototypes.designer_id IS 'Designer responsible for this prototype';
COMMENT ON COLUMN prototypes.manufacturer_id IS 'Factory/manufacturer who built this prototype';
COMMENT ON COLUMN prototypes.collection_id IS 'Collection this prototype belongs to';
COMMENT ON COLUMN prototypes.concept_id IS 'Original concept this prototype is based on';

COMMENT ON COLUMN collections.designer_id IS 'Primary designer for this collection - replaces designer string field';
