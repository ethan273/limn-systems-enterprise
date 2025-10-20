-- =====================================================
-- Seed Script: Factory Workers & QC Testers (v2 - Schema Corrected)
-- Purpose: Add realistic test data for factory and QC workflows
-- Run on: Both DEV and PROD databases
-- =====================================================

-- =====================================================
-- FACTORY WORKERS (5 users)
-- =====================================================

-- Factory Worker 1: Production Manager
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'michael.chen@limn-factory.test',
    crypt('Factory123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Michael", "last_name": "Chen"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'michael.chen@limn-factory.test',
    'Michael',
    'Chen',
    'factory',
    'Production Manager',
    'Manufacturing',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Michael',
    last_name = 'Chen',
    title = 'Production Manager',
    department = 'Manufacturing',
    updated_at = NOW();
END $$;

-- Factory Worker 2: Assembly Lead
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sarah.martinez@limn-factory.test',
    crypt('Factory123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Sarah", "last_name": "Martinez"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'sarah.martinez@limn-factory.test',
    'Sarah',
    'Martinez',
    'factory',
    'Assembly Team Lead',
    'Manufacturing',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Sarah',
    last_name = 'Martinez',
    title = 'Assembly Team Lead',
    department = 'Manufacturing',
    updated_at = NOW();
END $$;

-- Factory Worker 3: Finishing Specialist
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'james.thompson@limn-factory.test',
    crypt('Factory123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "James", "last_name": "Thompson"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'james.thompson@limn-factory.test',
    'James',
    'Thompson',
    'factory',
    'Finishing Specialist',
    'Manufacturing',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'James',
    last_name = 'Thompson',
    title = 'Finishing Specialist',
    department = 'Manufacturing',
    updated_at = NOW();
END $$;

-- Factory Worker 4: Upholstery Technician
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'maria.rodriguez@limn-factory.test',
    crypt('Factory123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Maria", "last_name": "Rodriguez"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'maria.rodriguez@limn-factory.test',
    'Maria',
    'Rodriguez',
    'factory',
    'Upholstery Technician',
    'Manufacturing',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Maria',
    last_name = 'Rodriguez',
    title = 'Upholstery Technician',
    department = 'Manufacturing',
    updated_at = NOW();
END $$;

-- Factory Worker 5: Warehouse Coordinator
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'david.kim@limn-factory.test',
    crypt('Factory123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "David", "last_name": "Kim"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'david.kim@limn-factory.test',
    'David',
    'Kim',
    'factory',
    'Warehouse Coordinator',
    'Logistics',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'David',
    last_name = 'Kim',
    title = 'Warehouse Coordinator',
    department = 'Logistics',
    updated_at = NOW();
END $$;

-- =====================================================
-- QC TESTERS (5 users)
-- =====================================================

-- QC Tester 1: Senior QC Inspector
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jennifer.lee@limn-qc.test',
    crypt('QCTest123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Jennifer", "last_name": "Lee"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'jennifer.lee@limn-qc.test',
    'Jennifer',
    'Lee',
    'qc_tester',
    'Senior QC Inspector',
    'Quality Control',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Jennifer',
    last_name = 'Lee',
    title = 'Senior QC Inspector',
    department = 'Quality Control',
    updated_at = NOW();
END $$;

-- QC Tester 2: Final Inspection Specialist
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'robert.anderson@limn-qc.test',
    crypt('QCTest123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Robert", "last_name": "Anderson"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'robert.anderson@limn-qc.test',
    'Robert',
    'Anderson',
    'qc_tester',
    'Final Inspection Specialist',
    'Quality Control',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Robert',
    last_name = 'Anderson',
    title = 'Final Inspection Specialist',
    department = 'Quality Control',
    updated_at = NOW();
END $$;

-- QC Tester 3: Materials Inspector
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'lisa.patel@limn-qc.test',
    crypt('QCTest123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Lisa", "last_name": "Patel"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'lisa.patel@limn-qc.test',
    'Lisa',
    'Patel',
    'qc_tester',
    'Materials QC Inspector',
    'Quality Control',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Lisa',
    last_name = 'Patel',
    title = 'Materials QC Inspector',
    department = 'Quality Control',
    updated_at = NOW();
END $$;

-- QC Tester 4: Dimensional QC Technician
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'carlos.garcia@limn-qc.test',
    crypt('QCTest123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Carlos", "last_name": "Garcia"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'carlos.garcia@limn-qc.test',
    'Carlos',
    'Garcia',
    'qc_tester',
    'Dimensional QC Technician',
    'Quality Control',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Carlos',
    last_name = 'Garcia',
    title = 'Dimensional QC Technician',
    department = 'Quality Control',
    updated_at = NOW();
END $$;

-- QC Tester 5: Packaging & Shipping QC
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'amanda.wilson@limn-qc.test',
    crypt('QCTest123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Amanda", "last_name": "Wilson"}',
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_user_id;

  INSERT INTO user_profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    title,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    'amanda.wilson@limn-qc.test',
    'Amanda',
    'Wilson',
    'qc_tester',
    'Packaging & Shipping QC',
    'Quality Control',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Amanda',
    last_name = 'Wilson',
    title = 'Packaging & Shipping QC',
    department = 'Quality Control',
    updated_at = NOW();
END $$;

-- =====================================================
-- Confirmation Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Successfully seeded 5 factory workers and 5 QC testers';
  RAISE NOTICE '';
  RAISE NOTICE 'Factory Workers (@limn-factory.test):';
  RAISE NOTICE '  - Michael Chen (Production Manager)';
  RAISE NOTICE '  - Sarah Martinez (Assembly Team Lead)';
  RAISE NOTICE '  - James Thompson (Finishing Specialist)';
  RAISE NOTICE '  - Maria Rodriguez (Upholstery Technician)';
  RAISE NOTICE '  - David Kim (Warehouse Coordinator)';
  RAISE NOTICE '';
  RAISE NOTICE 'QC Testers (@limn-qc.test):';
  RAISE NOTICE '  - Jennifer Lee (Senior QC Inspector)';
  RAISE NOTICE '  - Robert Anderson (Final Inspection Specialist)';
  RAISE NOTICE '  - Lisa Patel (Materials QC Inspector)';
  RAISE NOTICE '  - Carlos Garcia (Dimensional QC Technician)';
  RAISE NOTICE '  - Amanda Wilson (Packaging & Shipping QC)';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE '  Factory users password: Factory123!';
  RAISE NOTICE '  QC users password: QCTest123!';
END $$;
