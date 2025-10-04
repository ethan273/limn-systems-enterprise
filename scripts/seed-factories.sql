-- Seed Factories Data
-- Creates 20 realistic factory partner records

INSERT INTO partners (
  type,
  company_name,
  primary_contact,
  primary_email,
  primary_phone,
  address_line1,
  city,
  state,
  postal_code,
  country,
  website,
  specializations,
  quality_rating,
  status,
  payment_terms,
  notes,
  created_at,
  updated_at
) VALUES
-- Factory 1: Chinese Furniture Manufacturer
('factory', 'Shanghai Artisan Furniture Co.', 'Wei Chen', 'wei.chen@shanghaiartisan.com', '+86-21-5876-4321', '123 Industrial Zone', 'Shanghai', 'Shanghai', '200000', 'China', 'https://shanghaiartisan.com', ARRAY['Chairs', 'Tables', 'Upholstery'], 4.8, 'active', 'Net 45', 'Premium quality, fast turnaround', NOW() - INTERVAL '2 years', NOW()),

-- Factory 2: Italian Luxury Furniture
('factory', 'Milano Luxury Furnishings', 'Marco Rossi', 'marco.rossi@milanoluxury.it', '+39-02-8765-4321', 'Via della Moda 45', 'Milan', 'Lombardy', '20121', 'Italy', 'https://milanoluxury.it', ARRAY['Sofas', 'Armchairs', 'Custom Upholstery'], 4.9, 'active', 'Net 60', 'Exceptional craftsmanship, luxury materials', NOW() - INTERVAL '3 years', NOW()),

-- Factory 3: Vietnamese Wood Specialists
('factory', 'Hanoi Wood Craft Manufacturing', 'Nguyen Tran', 'nguyen@hanoiwood.vn', '+84-24-3876-5432', '56 Export Processing Zone', 'Hanoi', 'Hanoi', '100000', 'Vietnam', 'https://hanoiwood.vn', ARRAY['Tables', 'Storage', 'Wood Finishing'], 4.6, 'active', 'Net 30', 'Sustainable wood sourcing, excellent pricing', NOW() - INTERVAL '18 months', NOW()),

-- Factory 4: Polish Upholstery Specialists
('factory', 'Warsaw Premium Upholstery', 'Anna Kowalski', 'anna@warsawupholstery.pl', '+48-22-123-4567', 'ul. Przemyslowa 89', 'Warsaw', 'Mazovia', '00-450', 'Poland', 'https://warsawupholstery.pl', ARRAY['Sofas', 'Chairs', 'Ottomans', 'Custom Fabrics'], 4.7, 'active', 'Net 45', 'EU-based production, fast shipping to Europe', NOW() - INTERVAL '1 year', NOW()),

-- Factory 5: Turkish Contract Furniture
('factory', 'Istanbul Contract Solutions', 'Mehmet Yilmaz', 'mehmet@istanbulcontract.tr', '+90-212-456-7890', 'Organize Sanayi Bolgesi 34', 'Istanbul', 'Istanbul', '34500', 'Turkey', 'https://istanbulcontract.tr', ARRAY['Contract Furniture', 'Hospitality', 'Restaurant Seating'], 4.5, 'active', 'Net 30', 'Large-scale production capacity, contract specialists', NOW() - INTERVAL '2 years', NOW()),

-- Factory 6: Indian Metal & Wood
('factory', 'Mumbai Metalworks & Furniture', 'Raj Patel', 'raj.patel@mumbaimetal.in', '+91-22-2345-6789', 'Plot 45, MIDC Area', 'Mumbai', 'Maharashtra', '400001', 'India', 'https://mumbaimetal.in', ARRAY['Metal Frames', 'Industrial Furniture', 'Tables'], 4.4, 'active', 'Net 45', 'Competitive pricing, metal expertise', NOW() - INTERVAL '8 months', NOW()),

-- Factory 7: Malaysian Rattan Specialists
('factory', 'Kuala Lumpur Rattan Works', 'Siti Abdullah', 'siti@klrattan.my', '+60-3-8765-4321', '78 Industrial Park', 'Kuala Lumpur', 'Federal Territory', '50000', 'Malaysia', 'https://klrattan.my', ARRAY['Outdoor Furniture', 'Rattan', 'Wicker'], 4.6, 'active', 'Net 30', 'Natural materials specialist, sustainable practices', NOW() - INTERVAL '15 months', NOW()),

-- Factory 8: Indonesian Teak Manufacturer
('factory', 'Bali Teak Furniture Manufacturing', 'Wayan Surya', 'wayan@baliteak.id', '+62-361-234-567', 'Jl. Bypass Ngurah Rai 123', 'Denpasar', 'Bali', '80361', 'Indonesia', 'https://baliteak.id', ARRAY['Outdoor Furniture', 'Teak', 'Garden Furniture'], 4.7, 'active', 'Net 45', 'Premium teak, outdoor specialists', NOW() - INTERVAL '2 years', NOW()),

-- Factory 9: Portuguese Cork & Wood
('factory', 'Lisbon Cork & Wood Industries', 'João Silva', 'joao@lisboncork.pt', '+351-21-987-6543', 'Zona Industrial de Sacavém', 'Lisbon', 'Lisbon', '2685-001', 'Portugal', 'https://lisboncork.pt', ARRAY['Sustainable Materials', 'Cork Furniture', 'Eco-friendly'], 4.8, 'active', 'Net 60', 'Eco-friendly production, unique materials', NOW() - INTERVAL '1 year', NOW()),

-- Factory 10: Brazilian Modern Furniture
('factory', 'São Paulo Modern Designs', 'Carlos Santos', 'carlos@spmodern.br', '+55-11-3456-7890', 'Av. Industrial 567', 'São Paulo', 'São Paulo', '01000-000', 'Brazil', 'https://spmodern.br', ARRAY['Modern Furniture', 'Contemporary Design', 'Custom Pieces'], 4.5, 'active', 'Net 45', 'Modern aesthetic, South American market access', NOW() - INTERVAL '10 months', NOW()),

-- Factory 11: German Precision Manufacturing
('factory', 'Munich Precision Furnishings', 'Hans Schmidt', 'hans@munichprecision.de', '+49-89-1234-5678', 'Industriestraße 42', 'Munich', 'Bavaria', '80335', 'Germany', 'https://munichprecision.de', ARRAY['Office Furniture', 'Precision Engineering', 'German Quality'], 4.9, 'active', 'Net 60', 'Highest quality standards, German engineering', NOW() - INTERVAL '4 years', NOW()),

-- Factory 12: Mexican Solid Wood
('factory', 'Guadalajara Solid Wood Factory', 'Maria Garcia', 'maria@guadalajarawood.mx', '+52-33-1234-5678', 'Parque Industrial 890', 'Guadalajara', 'Jalisco', '44100', 'Mexico', 'https://guadalajarawood.mx', ARRAY['Solid Wood', 'Dining Tables', 'Rustic Furniture'], 4.3, 'active', 'Net 30', 'North American proximity, good pricing', NOW() - INTERVAL '6 months', NOW()),

-- Factory 13: Thai Bamboo Specialists
('factory', 'Bangkok Bamboo Manufacturing', 'Somchai Pong', 'somchai@bangkokbamboo.th', '+66-2-345-6789', '234 Industrial Estate', 'Bangkok', 'Bangkok', '10400', 'Thailand', 'https://bangkokbamboo.th', ARRAY['Bamboo Furniture', 'Sustainable', 'Asian Design'], 4.5, 'active', 'Net 30', 'Sustainable bamboo, Asian aesthetic', NOW() - INTERVAL '1 year', NOW()),

-- Factory 14: Spanish Wrought Iron
('factory', 'Barcelona Metalwork Studios', 'Isabel Martinez', 'isabel@barcelonametal.es', '+34-93-456-7890', 'Polígono Industrial 56', 'Barcelona', 'Catalonia', '08025', 'Spain', 'https://barcelonametal.es', ARRAY['Wrought Iron', 'Metal Furniture', 'Outdoor'], 4.6, 'active', 'Net 45', 'Artistic metalwork, Mediterranean style', NOW() - INTERVAL '2 years', NOW()),

-- Factory 15: UK Contract Manufacturing
('factory', 'Birmingham Contract Furnishings', 'James Wilson', 'james@birminghamcontract.uk', '+44-121-234-5678', 'Birmingham Business Park', 'Birmingham', 'West Midlands', 'B1 1AA', 'United Kingdom', 'https://birminghamcontract.uk', ARRAY['Contract Furniture', 'Commercial', 'Healthcare Furniture'], 4.7, 'active', 'Net 60', 'UK standards compliant, healthcare specialist', NOW() - INTERVAL '3 years', NOW()),

-- Factory 16: South African Hardwood
('factory', 'Cape Town Hardwood Furniture', 'Thabo Mbeki', 'thabo@capetownhardwood.za', '+27-21-876-5432', '45 Industria Road', 'Cape Town', 'Western Cape', '7530', 'South Africa', 'https://capetownhardwood.za', ARRAY['Hardwood', 'African Woods', 'Luxury Furniture'], 4.6, 'pending_approval', 'Net 45', 'Unique African hardwoods, new partnership', NOW() - INTERVAL '1 month', NOW()),

-- Factory 17: Canadian Pine Specialists
('factory', 'Toronto Pine Manufacturing', 'Emily Chen', 'emily@torontopine.ca', '+1-416-789-0123', '789 Industrial Ave', 'Toronto', 'Ontario', 'M5V 3A8', 'Canada', 'https://torontopine.ca', ARRAY['Pine Furniture', 'Scandinavian Style', 'Sustainable'], 4.5, 'active', 'Net 45', 'North American production, Scandinavian designs', NOW() - INTERVAL '9 months', NOW()),

-- Factory 18: Australian Outdoor Specialists
('factory', 'Sydney Outdoor Furniture Co.', 'Sarah Thompson', 'sarah@sydneyoutdoor.au', '+61-2-9876-5432', '123 Enterprise Way', 'Sydney', 'New South Wales', '2000', 'Australia', 'https://sydneyoutdoor.au', ARRAY['Outdoor Furniture', 'Weather-resistant', 'Coastal Style'], 4.7, 'active', 'Net 30', 'Weather-resistant specialist, Pacific market', NOW() - INTERVAL '1 year', NOW()),

-- Factory 19: Korean Modern Manufacturing
('factory', 'Seoul Modern Furniture Factory', 'Kim Min-jun', 'minjun@seoulmodern.kr', '+82-2-1234-5678', '567 Gangnam Industrial Zone', 'Seoul', 'Seoul', '06000', 'South Korea', 'https://seoulmodern.kr', ARRAY['Modern Design', 'Minimalist', 'Technology Integration'], 4.8, 'active', 'Net 45', 'Cutting-edge design, technology integration', NOW() - INTERVAL '15 months', NOW()),

-- Factory 20: French Provincial Furniture
('factory', 'Paris Provincial Furniture Atelier', 'Sophie Dubois', 'sophie@parisatelier.fr', '+33-1-4567-8901', '89 Rue de l''Industrie', 'Paris', 'Île-de-France', '75001', 'France', 'https://parisatelier.fr', ARRAY['Provincial Style', 'French Design', 'Luxury'], 4.9, 'active', 'Net 60', 'French craftsmanship, luxury provincial style', NOW() - INTERVAL '5 years', NOW());

-- Confirmation message
SELECT 'Successfully seeded 20 factory partner records' AS status;
