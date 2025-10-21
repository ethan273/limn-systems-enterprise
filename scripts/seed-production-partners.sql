-- ============================================================================
-- PRODUCTION DATABASE: Add Realistic Partner Data (Sourcing Agents + Employees)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD SOURCING AGENTS
-- ============================================================================

INSERT INTO partners (
  type, company_name, business_name, primary_contact, primary_email, primary_phone,
  website, address_line1, city, state, postal_code, country,
  specializations, capabilities, certifications, languages,
  payment_terms, currency, status, quality_rating, notes
) VALUES
  ('sourcing_agent', 'Asia Sourcing Solutions Ltd', 'ASS Sourcing', 'Wei Chen',
   'info@asiasourcingsolutions.com', '+86 21 6288 9900',
   'www.asiasourcingsolutions.com', '1508 Zhongrong Jasper Tower, 633 Lujiazui Ring Road',
   'Shanghai', 'Shanghai', '200120', 'China',
   ARRAY['Furniture Sourcing', 'Factory Audits', 'Quality Control', 'Logistics Coordination'],
   ARRAY['Multi-Factory Management', 'Technical Specifications Review', 'Sample Development', 'Cost Negotiation'],
   ARRAY['ISO 9001', 'BSCI Audit Certified'],
   ARRAY['English', 'Mandarin', 'Cantonese'],
   '30% deposit, 70% before shipment', 'USD', 'active', 4.8,
   'Specializes in high-end hospitality furniture. Strong network of factories in Guangdong and Zhejiang provinces. 15+ years experience.'),

  ('sourcing_agent', 'Vietnam Sourcing Experts Co., Ltd', 'VSE Sourcing', 'Nguyen Thi Lan',
   'contact@vietnamsourcingexperts.vn', '+84 28 3827 5500',
   'www.vnsourcingexperts.com', '15th Floor, Me Linh Point Tower, 2 Ngo Duc Ke Street',
   'Ho Chi Minh City', 'Ho Chi Minh', '700000', 'Vietnam',
   ARRAY['Wood Furniture', 'Outdoor Furniture', 'Rattan & Wicker', 'Quality Inspection'],
   ARRAY['Factory Vetting', 'Price Benchmarking', 'Container Consolidation', 'Export Documentation'],
   ARRAY['WRAP Certified', 'Sedex Member'],
   ARRAY['English', 'Vietnamese'],
   '30% deposit, balance against B/L copy', 'USD', 'active', 4.7,
   'Excellent for eco-friendly and sustainable furniture. Strong relationships with FSC-certified factories.'),

  ('sourcing_agent', 'India Manufacturing Liaison Pvt Ltd', 'IML Sourcing', 'Rajesh Kumar',
   'info@indiamanufacturingliaison.in', '+91 11 4567 8900',
   'www.imlsourcing.in', 'A-42, Sector 63, Noida',
   'Noida', 'Uttar Pradesh', '201301', 'India',
   ARRAY['Metal Furniture', 'Upholstery', 'Contract Furniture', 'Custom Metalwork'],
   ARRAY['Design Development', 'Prototyping', 'Production Monitoring', 'Third-Party Testing'],
   ARRAY['SA8000 Certified'],
   ARRAY['English', 'Hindi', 'Punjabi'],
   '40% deposit, 30% mid-production, 30% before shipment', 'USD', 'active', 4.6,
   'Specializes in hospitality and commercial furniture. Strong in metalwork and upholstery.'),

  ('sourcing_agent', 'Southeast Asia Procurement Partners', 'SEAPP', 'Somchai Rattanavong',
   'info@seaprocurement.com', '+66 2 056 2300',
   'www.seaprocurement.com', '999/9 The Offices at CentralWorld, Rama 1 Road',
   'Bangkok', NULL, '10330', 'Thailand',
   ARRAY['Teak Furniture', 'Bamboo Products', 'Resort Furniture', 'Multi-Country Sourcing'],
   ARRAY['Regional Factory Network', 'Compliance Verification', 'Shipping Coordination'],
   ARRAY['FSC Certified Agent'],
   ARRAY['English', 'Thai', 'Lao', 'Khmer'],
   '30% deposit, 70% on completion', 'USD', 'active', 4.5,
   'Multi-country sourcing across Thailand, Laos, Cambodia. Excellent for natural materials and resort-style furniture.'),

  ('sourcing_agent', 'European Quality Sourcing GmbH', 'EQS Sourcing', 'Klaus Mueller',
   'info@euqualitysourcing.de', '+49 89 5454 7890',
   'www.eqsourcing.eu', 'Leopoldstrasse 244',
   'Munich', NULL, '80807', 'Germany',
   ARRAY['Luxury Furniture', 'European Standards Compliance', 'High-End Upholstery'],
   ARRAY['CE Compliance', 'Material Testing', 'European Factory Network'],
   ARRAY['ISO 9001', 'CE Marking Certified'],
   ARRAY['English', 'German', 'Italian', 'French'],
   'Net 30 days', 'EUR', 'active', 4.9,
   'Premium sourcing agent for European and high-end markets. Strict quality standards. Higher costs but excellent results.');

-- ============================================================================
-- 2. ADD EMPLOYEES FOR SOURCING AGENTS
-- ============================================================================

-- Asia Sourcing Solutions employees
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Asia Sourcing Solutions Ltd' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_qc, is_production, is_finance, languages, timezone)
VALUES
  ((SELECT id FROM partner), 'Wei Chen', 'Managing Director', 'wei.chen@asiasourcingsolutions.com',
   '+86 21 6288 9900', '+86 138 1234 5678', true, false, false, false,
   ARRAY['English', 'Mandarin'], 'Asia/Shanghai'),
  ((SELECT id FROM partner), 'Zhang Li', 'QC Manager', 'zhang.li@asiasourcingsolutions.com',
   '+86 21 6288 9901', NULL, false, true, true, false,
   ARRAY['English', 'Mandarin'], 'Asia/Shanghai'),
  ((SELECT id FROM partner), 'Liu Feng', 'Production Coordinator', 'liu.feng@asiasourcingsolutions.com',
   '+86 21 6288 9902', NULL, false, false, true, false,
   ARRAY['English', 'Mandarin', 'Cantonese'], 'Asia/Shanghai'),
  ((SELECT id FROM partner), 'Wang Mei', 'Finance Manager', 'wang.mei@asiasourcingsolutions.com',
   '+86 21 6288 9903', NULL, false, false, false, true,
   ARRAY['English', 'Mandarin'], 'Asia/Shanghai');

-- Vietnam Sourcing Experts employees
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Vietnam Sourcing Experts Co., Ltd' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_qc, is_production, is_finance, languages, timezone)
VALUES
  ((SELECT id FROM partner), 'Nguyen Thi Lan', 'Director', 'lan.nguyen@vietnamsourcingexperts.vn',
   '+84 28 3827 5500', '+84 90 123 4567', true, true, false, false,
   ARRAY['English', 'Vietnamese'], 'Asia/Ho_Chi_Minh'),
  ((SELECT id FROM partner), 'Tran Van Huy', 'Production Supervisor', 'huy.tran@vietnamsourcingexperts.vn',
   '+84 28 3827 5501', NULL, false, false, true, false,
   ARRAY['English', 'Vietnamese'], 'Asia/Ho_Chi_Minh'),
  ((SELECT id FROM partner), 'Le Thi Mai', 'Quality Inspector', 'mai.le@vietnamsourcingexperts.vn',
   '+84 28 3827 5502', NULL, false, true, false, false,
   ARRAY['English', 'Vietnamese'], 'Asia/Ho_Chi_Minh');

-- India Manufacturing Liaison employees
WITH partner AS (SELECT id FROM partners WHERE company_name = 'India Manufacturing Liaison Pvt Ltd' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_qc, is_production, is_finance, languages, timezone)
VALUES
  ((SELECT id FROM partner), 'Rajesh Kumar', 'Managing Partner', 'rajesh.kumar@indiamanufacturingliaison.in',
   '+91 11 4567 8900', '+91 98 1234 5678', true, false, true, false,
   ARRAY['English', 'Hindi'], 'Asia/Kolkata'),
  ((SELECT id FROM partner), 'Priya Sharma', 'Quality Assurance Lead', 'priya.sharma@indiamanufacturingliaison.in',
   '+91 11 4567 8901', NULL, false, true, false, false,
   ARRAY['English', 'Hindi'], 'Asia/Kolkata'),
  ((SELECT id FROM partner), 'Amit Patel', 'Accounts Manager', 'amit.patel@indiamanufacturingliaison.in',
   '+91 11 4567 8902', NULL, false, false, false, true,
   ARRAY['English', 'Hindi', 'Gujarati'], 'Asia/Kolkata');

-- Southeast Asia Procurement Partners employees
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Southeast Asia Procurement Partners' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_qc, is_production, is_finance, languages, timezone)
VALUES
  ((SELECT id FROM partner), 'Somchai Rattanavong', 'Regional Director', 'somchai@seaprocurement.com',
   '+66 2 056 2300', '+66 81 234 5678', true, false, false, false,
   ARRAY['English', 'Thai'], 'Asia/Bangkok'),
  ((SELECT id FROM partner), 'Siriwan Pongpanich', 'Operations Manager', 'siriwan@seaprocurement.com',
   '+66 2 056 2301', NULL, false, true, true, false,
   ARRAY['English', 'Thai'], 'Asia/Bangkok');

-- European Quality Sourcing employees
WITH partner AS (SELECT id FROM partners WHERE company_name = 'European Quality Sourcing GmbH' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_qc, is_production, is_finance, languages, timezone)
VALUES
  ((SELECT id FROM partner), 'Klaus Mueller', 'CEO', 'klaus.mueller@euqualitysourcing.de',
   '+49 89 5454 7890', '+49 172 345 6789', true, true, false, false,
   ARRAY['English', 'German', 'Italian'], 'Europe/Berlin'),
  ((SELECT id FROM partner), 'Anna Schmidt', 'Production Coordinator', 'anna.schmidt@euqualitysourcing.de',
   '+49 89 5454 7891', NULL, false, false, true, false,
   ARRAY['English', 'German', 'French'], 'Europe/Berlin');

-- ============================================================================
-- 3. ADD EMPLOYEES TO EXISTING FACTORIES
-- ============================================================================

-- Shanghai Artisan Furniture Co.
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Shanghai Artisan Furniture Co.' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_qc, is_production, is_finance, languages, timezone)
SELECT (SELECT id FROM partner), 'Chen Wei', 'General Manager', 'chen.wei@shanghaiartisan.cn',
  '+86 21 5888 6600', '+86 138 0123 4567', true, false, true, false,
  ARRAY['English', 'Mandarin'], 'Asia/Shanghai'
WHERE NOT EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner));

WITH partner AS (SELECT id FROM partners WHERE company_name = 'Shanghai Artisan Furniture Co.' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, is_qc, is_production, languages, timezone)
SELECT (SELECT id FROM partner), 'Li Xiu', 'QC Manager', 'li.xiu@shanghaiartisan.cn',
  '+86 21 5888 6601', true, true, ARRAY['English', 'Mandarin'], 'Asia/Shanghai'
WHERE EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner))
  AND NOT EXISTS (SELECT 1 FROM partner_contacts WHERE email = 'li.xiu@shanghaiartisan.cn');

-- Hanoi Wood Craft Manufacturing
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Hanoi Wood Craft Manufacturing' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_production, languages, timezone)
SELECT (SELECT id FROM partner), 'Nguyen Van Minh', 'Factory Director', 'minh.nguyen@hanoiwoodcraft.vn',
  '+84 24 3971 5000', '+84 91 234 5678', true, true, ARRAY['English', 'Vietnamese'], 'Asia/Ho_Chi_Minh'
WHERE NOT EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner));

-- Bangkok Bamboo Manufacturing
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Bangkok Bamboo Manufacturing' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_production, languages, timezone)
SELECT (SELECT id FROM partner), 'Somchai Wongsa', 'Managing Director', 'somchai@bangkokbamboo.co.th',
  '+66 2 234 5678', '+66 81 123 4567', true, true, ARRAY['English', 'Thai'], 'Asia/Bangkok'
WHERE NOT EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner));

-- Mumbai Metalworks & Furniture
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Mumbai Metalworks & Furniture' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_production, languages, timezone)
SELECT (SELECT id FROM partner), 'Ravi Kapoor', 'Director', 'ravi.kapoor@mumbaimetal.in',
  '+91 22 2567 8900', '+91 98 2345 6789', true, true, ARRAY['English', 'Hindi'], 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner));

-- Bali Teak Furniture Manufacturing
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Bali Teak Furniture Manufacturing' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_production, languages, timezone)
SELECT (SELECT id FROM partner), 'Made Wirawan', 'Owner', 'made@baliteak.id',
  '+62 361 234567', '+62 812 3456 7890', true, true, ARRAY['English', 'Indonesian'], 'Asia/Makassar'
WHERE NOT EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner));

-- Milano Luxury Furnishings
WITH partner AS (SELECT id FROM partners WHERE company_name = 'Milano Luxury Furnishings' LIMIT 1)
INSERT INTO partner_contacts (partner_id, name, role, email, phone, mobile, is_primary, is_production, languages, timezone)
SELECT (SELECT id FROM partner), 'Marco Rossi', 'Direttore Generale', 'marco.rossi@milanoluxury.it',
  '+39 02 8900 1234', '+39 335 123 4567', true, true, ARRAY['English', 'Italian', 'French'], 'Europe/Rome'
WHERE NOT EXISTS (SELECT 1 FROM partner_contacts WHERE partner_id = (SELECT id FROM partner));

COMMIT;

-- Verification queries
SELECT '=== SOURCING AGENTS ===' as section;
SELECT company_name, city, country FROM partners WHERE type = 'sourcing_agent' ORDER BY company_name;

SELECT '=== EMPLOYEE COUNTS ===' as section;
SELECT p.company_name, p.type, COUNT(pc.id) as employee_count
FROM partners p
LEFT JOIN partner_contacts pc ON p.id = pc.partner_id
WHERE p.type IN ('factory', 'sourcing_agent')
GROUP BY p.id, p.company_name, p.type
ORDER BY p.type, employee_count DESC, p.company_name
LIMIT 50;
