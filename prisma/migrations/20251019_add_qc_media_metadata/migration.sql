
-- QC & Factory Review PWA Enhancement - Migration 9 of 10
-- Add media metadata columns to qc_photos for offline/PWA support

ALTER TABLE public.qc_photos
ADD COLUMN IF NOT EXISTS device_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS upload_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB;

CREATE INDEX IF NOT EXISTS idx_qc_photos_upload_status
  ON public.qc_photos(upload_status);
