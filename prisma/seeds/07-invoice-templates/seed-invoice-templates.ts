/**
 * Seed Script: Invoice Templates
 *
 * Seeds 3 default invoice PDF templates:
 * 1. Modern Blue (Default)
 * 2. Classic Black
 * 3. Minimal Modern
 */

import { PrismaClient } from '@prisma/client';

/**
 * Seed invoice templates
 */
export async function seedInvoiceTemplates(prisma: PrismaClient) {
  console.log('  → Creating default invoice templates...');

  // Clean existing templates
  await prisma.invoice_templates.deleteMany({});

  // Template 1: Modern Blue (Default)
  const modernBlue = await prisma.invoice_templates.create({
    data: {
      name: 'Modern Blue',
      template_type: 'standard',
      is_default: true,

      // Branding
      company_name: 'Limn Systems',
      company_address: '123 Design Street',
      company_city_state_zip: 'San Francisco, CA 94102',
      company_phone: '(415) 555-0100',
      company_email: 'hello@limnsystems.com',
      company_website: 'www.limnsystems.com',

      // Typography - Roboto as requested
      font_family: 'Roboto',
      font_size_base: 10,
      font_size_heading: 24,
      font_size_subheading: 14,

      // Colors - Modern Blue scheme
      color_primary: '#2563eb',      // Blue 600
      color_secondary: '#64748b',    // Slate 500
      color_text: '#0f172a',         // Slate 900
      color_border: '#e2e8f0',       // Slate 200
      color_background: '#ffffff',

      // Layout Options
      show_company_logo: true,
      show_payment_terms: true,
      show_bank_details: false,
      show_notes_section: true,
      show_tax_summary: true,

      // Payment Terms
      default_payment_terms: 'Net 30',

      // Custom Fields
      footer_text: 'Thank you for your business!',
      notes_text: 'Please remit payment within 30 days of invoice date.',
    },
  });

  // Template 2: Classic Black
  const classicBlack = await prisma.invoice_templates.create({
    data: {
      name: 'Classic Black',
      template_type: 'standard',
      is_default: false,

      // Branding
      company_name: 'Limn Systems',
      company_address: '123 Design Street',
      company_city_state_zip: 'San Francisco, CA 94102',
      company_phone: '(415) 555-0100',
      company_email: 'hello@limnsystems.com',
      company_website: 'www.limnsystems.com',

      // Typography - Inter for classic look
      font_family: 'Inter',
      font_size_base: 10,
      font_size_heading: 22,
      font_size_subheading: 13,

      // Colors - Classic Black scheme
      color_primary: '#000000',      // Black
      color_secondary: '#6b7280',    // Gray 500
      color_text: '#1f2937',         // Gray 800
      color_border: '#d1d5db',       // Gray 300
      color_background: '#ffffff',

      // Layout Options
      show_company_logo: true,
      show_payment_terms: true,
      show_bank_details: true,
      show_notes_section: true,
      show_tax_summary: true,

      // Payment Terms
      default_payment_terms: 'Due upon receipt',
      bank_name: 'Chase Bank',
      bank_account_number: '****1234',
      bank_routing_number: '****5678',

      // Custom Fields
      footer_text: 'Authorized Signature: _____________________',
      notes_text: 'Payment terms: Due upon receipt. Late payments subject to 1.5% monthly interest.',
    },
  });

  // Template 3: Minimal Modern
  const minimalModern = await prisma.invoice_templates.create({
    data: {
      name: 'Minimal Modern',
      template_type: 'standard',
      is_default: false,

      // Branding
      company_name: 'Limn Systems',
      company_address: '123 Design Street',
      company_city_state_zip: 'San Francisco, CA 94102',
      company_phone: '(415) 555-0100',
      company_email: 'hello@limnsystems.com',
      company_website: 'www.limnsystems.com',

      // Typography - Helvetica for minimal look
      font_family: 'Helvetica',
      font_size_base: 9,
      font_size_heading: 28,
      font_size_subheading: 12,

      // Colors - Minimal Modern scheme
      color_primary: '#0f172a',      // Slate 900
      color_secondary: '#94a3b8',    // Slate 400
      color_text: '#1e293b',         // Slate 800
      color_border: '#f1f5f9',       // Slate 100
      color_background: '#fafafa',   // Light gray

      // Layout Options
      show_company_logo: true,
      show_payment_terms: true,
      show_bank_details: false,
      show_notes_section: false,
      show_tax_summary: true,

      // Payment Terms
      default_payment_terms: 'Net 15',

      // Custom Fields
      footer_text: '',
      notes_text: '',
    },
  });

  console.log(`  ✅ Created 3 default invoice templates:`);
  console.log(`     - ${modernBlue.name} (Default)`);
  console.log(`     - ${classicBlack.name}`);
  console.log(`     - ${minimalModern.name}`);
}
