-- Add swatch_url column to materials table
ALTER TABLE "public"."materials" ADD COLUMN "swatch_url" TEXT;

-- Add comment
COMMENT ON COLUMN "public"."materials"."swatch_url" IS 'URL to material swatch image';
