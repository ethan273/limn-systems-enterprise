-- =====================================================
-- Seed Script: Factory Workers & QC Testers
-- Purpose: Add realistic test data for factory and QC workflows
-- Run on: Both DEV and PROD databases
-- =====================================================

-- Clean up existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM user_profiles WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email LIKE '%@limn-factory.test' OR email LIKE '%@limn-qc.test'
-- );
-- DELETE FROM auth.users WHERE email LIKE '%@limn-factory.test' OR email LIKE '%@limn-qc.test';

-- =====================================================
-- FACTORY WORKERS (5 users)
-- =====================================================

-- Factory Worker 1: Production Manager
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'michael.chen@limn-factory.test',
  crypt('Factory123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Michael", "last_name": "Chen", "user_type": "factory"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Michael',
  'Chen',
  'michael.chen@limn-factory.test',
  'factory',
  'Production Manager',
  'Manufacturing',
  '+1-555-0101',
  '+1-555-0102',
  'America/New_York',
  'en',
  NULL,
  'Experienced production manager with 15 years in furniture manufacturing. Specializes in workflow optimization and quality control.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'michael.chen@limn-factory.test'
ON CONFLICT (user_id) DO NOTHING;

-- Factory Worker 2: Assembly Lead
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'sarah.martinez@limn-factory.test',
  crypt('Factory123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Sarah", "last_name": "Martinez", "user_type": "factory"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Sarah',
  'Martinez',
  'sarah.martinez@limn-factory.test',
  'factory',
  'Assembly Team Lead',
  'Manufacturing',
  '+1-555-0201',
  '+1-555-0202',
  'America/Los_Angeles',
  'en',
  NULL,
  'Lead assembler with expertise in upholstered furniture. 10+ years experience managing assembly teams.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'sarah.martinez@limn-factory.test'
ON CONFLICT (user_id) DO NOTHING;

-- Factory Worker 3: Finishing Specialist
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'james.thompson@limn-factory.test',
  crypt('Factory123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "James", "last_name": "Thompson", "user_type": "factory"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'James',
  'Thompson',
  'james.thompson@limn-factory.test',
  'factory',
  'Finishing Specialist',
  'Manufacturing',
  '+1-555-0301',
  '+1-555-0302',
  'America/Chicago',
  'en',
  NULL,
  'Master craftsman specializing in wood finishing, staining, and protective coatings. 12 years experience.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'james.thompson@limn-factory.test'
ON CONFLICT (user_id) DO NOTHING;

-- Factory Worker 4: Upholstery Technician
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'maria.rodriguez@limn-factory.test',
  crypt('Factory123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Maria", "last_name": "Rodriguez", "user_type": "factory"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Maria',
  'Rodriguez',
  'maria.rodriguez@limn-factory.test',
  'factory',
  'Upholstery Technician',
  'Manufacturing',
  '+1-555-0401',
  '+1-555-0402',
  'America/Denver',
  'es',
  NULL,
  'Expert upholstery technician with certifications in leather and fabric work. 8 years professional experience.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'maria.rodriguez@limn-factory.test'
ON CONFLICT (user_id) DO NOTHING;

-- Factory Worker 5: Warehouse Coordinator
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'david.kim@limn-factory.test',
  crypt('Factory123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "David", "last_name": "Kim", "user_type": "factory"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'David',
  'Kim',
  'david.kim@limn-factory.test',
  'factory',
  'Warehouse Coordinator',
  'Logistics',
  '+1-555-0501',
  '+1-555-0502',
  'America/Phoenix',
  'en',
  NULL,
  'Warehouse and logistics coordinator managing inventory, receiving, and shipping. 7 years experience.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'david.kim@limn-factory.test'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- QC TESTERS (5 users)
-- =====================================================

-- QC Tester 1: Senior QC Inspector
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'jennifer.lee@limn-qc.test',
  crypt('QCTest123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Jennifer", "last_name": "Lee", "user_type": "qc_tester"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Jennifer',
  'Lee',
  'jennifer.lee@limn-qc.test',
  'qc_tester',
  'Senior QC Inspector',
  'Quality Control',
  '+1-555-1001',
  '+1-555-1002',
  'America/New_York',
  'en',
  NULL,
  'Senior quality control inspector with ASQ certification. 14 years experience in furniture quality assurance.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'jennifer.lee@limn-qc.test'
ON CONFLICT (user_id) DO NOTHING;

-- QC Tester 2: Final Inspection Specialist
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'robert.anderson@limn-qc.test',
  crypt('QCTest123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Robert", "last_name": "Anderson", "user_type": "qc_tester"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Robert',
  'Anderson',
  'robert.anderson@limn-qc.test',
  'qc_tester',
  'Final Inspection Specialist',
  'Quality Control',
  '+1-555-1101',
  '+1-555-1102',
  'America/Los_Angeles',
  'en',
  NULL,
  'Specialist in final product inspection and customer-ready quality verification. 9 years experience.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'robert.anderson@limn-qc.test'
ON CONFLICT (user_id) DO NOTHING;

-- QC Tester 3: Materials Inspector
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'lisa.patel@limn-qc.test',
  crypt('QCTest123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Lisa", "last_name": "Patel", "user_type": "qc_tester"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Lisa',
  'Patel',
  'lisa.patel@limn-qc.test',
  'qc_tester',
  'Materials QC Inspector',
  'Quality Control',
  '+1-555-1201',
  '+1-555-1202',
  'America/Chicago',
  'en',
  NULL,
  'Materials inspection specialist focusing on wood, fabric, and hardware quality. 11 years experience.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'lisa.patel@limn-qc.test'
ON CONFLICT (user_id) DO NOTHING;

-- QC Tester 4: Dimensional QC Technician
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'carlos.garcia@limn-qc.test',
  crypt('QCTest123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Carlos", "last_name": "Garcia", "user_type": "qc_tester"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Carlos',
  'Garcia',
  'carlos.garcia@limn-qc.test',
  'qc_tester',
  'Dimensional QC Technician',
  'Quality Control',
  '+1-555-1301',
  '+1-555-1302',
  'America/Denver',
  'es',
  NULL,
  'Precision measurement and dimensional accuracy specialist. Expert with CMM and laser measurement tools. 6 years experience.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'carlos.garcia@limn-qc.test'
ON CONFLICT (user_id) DO NOTHING;

-- QC Tester 5: Packaging & Shipping QC
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'amanda.wilson@limn-qc.test',
  crypt('QCTest123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Amanda", "last_name": "Wilson", "user_type": "qc_tester"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  user_type,
  title,
  department,
  phone,
  mobile,
  timezone,
  preferred_language,
  avatar_url,
  bio,
  is_active,
  created_at,
  updated_at
) SELECT
  gen_random_uuid(),
  id,
  'Amanda',
  'Wilson',
  'amanda.wilson@limn-qc.test',
  'qc_tester',
  'Packaging & Shipping QC',
  'Quality Control',
  '+1-555-1401',
  '+1-555-1402',
  'America/Phoenix',
  'en',
  NULL,
  'Quality control specialist for packaging integrity and shipping readiness. 5 years experience preventing transit damage.',
  true,
  NOW(),
  NOW()
FROM auth.users WHERE email = 'amanda.wilson@limn-qc.test'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Add QC Testers to qc_testers table
-- =====================================================

INSERT INTO qc_testers (
  id,
  user_id,
  name,
  email,
  phone,
  certification_level,
  specialization,
  languages,
  is_active,
  performance_rating,
  total_inspections,
  passed_inspections,
  failed_inspections,
  average_inspection_time,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  up.first_name || ' ' || up.last_name,
  up.email,
  up.phone,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN 'senior'
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN 'intermediate'
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN 'intermediate'
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN 'junior'
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN 'junior'
  END,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN ARRAY['Final Inspection', 'Materials', 'Dimensional']
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN ARRAY['Final Inspection', 'Finishing']
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN ARRAY['Materials', 'Hardware']
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN ARRAY['Dimensional', 'Assembly']
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN ARRAY['Packaging', 'Shipping']
  END,
  ARRAY[up.preferred_language],
  true,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN 4.8
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN 4.6
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN 4.7
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN 4.3
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN 4.5
  END,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN 847
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN 623
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN 712
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN 401
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN 356
  END,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN 789
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN 571
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN 658
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN 367
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN 329
  END,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN 58
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN 52
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN 54
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN 34
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN 27
  END,
  CASE
    WHEN up.email = 'jennifer.lee@limn-qc.test' THEN 28
    WHEN up.email = 'robert.anderson@limn-qc.test' THEN 32
    WHEN up.email = 'lisa.patel@limn-qc.test' THEN 25
    WHEN up.email = 'carlos.garcia@limn-qc.test' THEN 35
    WHEN up.email = 'amanda.wilson@limn-qc.test' THEN 22
  END,
  NOW(),
  NOW()
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_type = 'qc_tester'
  AND up.email LIKE '%@limn-qc.test'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Confirmation Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Successfully seeded 5 factory workers and 5 QC testers';
  RAISE NOTICE 'Factory Workers: michael.chen, sarah.martinez, james.thompson, maria.rodriguez, david.kim';
  RAISE NOTICE 'QC Testers: jennifer.lee, robert.anderson, lisa.patel, carlos.garcia, amanda.wilson';
  RAISE NOTICE 'Default password for all test users: Factory123! or QCTest123!';
  RAISE NOTICE 'All emails end with @limn-factory.test or @limn-qc.test';
END $$;
