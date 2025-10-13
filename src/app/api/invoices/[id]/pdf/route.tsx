import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF, InvoiceData } from '@/lib/pdf/invoice-template';

/**
 * Invoice PDF Generation API
 *
 * Generates and returns a PDF for a specific invoice.
 * Can be downloaded or emailed to the customer.
 *
 * GET /api/invoices/[id]/pdf
 *
 * Query Parameters:
 * - download: If set, triggers browser download (default: true)
 * - email: If set to customer email, sends PDF via email
 *
 * Response:
 * - application/pdf stream
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Fetch invoice with related data
    const invoice = await prisma.production_invoices.findUnique({
      where: { id: invoiceId },
      include: {
        production_orders: {
          include: {
            projects: {
              include: {
                customers: true,
              },
            },
          },
        },
        production_invoice_line_items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get customer data
    const customer = invoice.production_orders?.projects?.customers;
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found for this invoice' },
        { status: 404 }
      );
    }

    // Calculate totals from line items
    const lineItems = invoice.production_invoice_line_items || [];
    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number((item as any).total_price || item.total || 0),
      0
    );
    const tax = Number((invoice as any).tax_amount) || 0;
    const discount = Number((invoice as any).discount_amount) || 0;
    const shipping = 0; // Add shipping if needed
    const total = Number((invoice as any).total_amount || invoice.total);
    const amountPaid = Number(invoice.amount_paid) || 0;
    const amountDue = total - amountPaid;

    // Prepare invoice data for PDF
    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date.toISOString(),
      dueDate: invoice.due_date?.toISOString(),
      status: invoice.status || 'draft',
      orderNumber: invoice.production_orders?.order_number,

      // Company info (hardcoded - should come from settings)
      companyName: 'Limn Systems',
      companyAddress: '123 Business St',
      companyCity: 'San Francisco',
      companyState: 'CA',
      companyZip: '94105',
      companyPhone: '(555) 123-4567',
      companyEmail: 'billing@limn.systems',

      // Customer info
      customerName: customer.name || 'Unknown Customer',
      customerCompany: (customer as any).company_name || customer.company || undefined,
      customerAddress: (customer as any).billing_address || undefined,
      customerCity: (customer as any).billing_city || undefined,
      customerState: (customer as any).billing_state || undefined,
      customerZip: (customer as any).billing_zip || undefined,
      customerEmail: customer.email || undefined,

      // Line items
      lineItems: lineItems.map((item) => ({
        description: item.description || (item as any).item_name || 'Production Item',
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        discount: (item as any).discount_amount ? Number((item as any).discount_amount) : undefined,
        total: Number((item as any).total_price || item.total || 0),
      })),

      // Totals
      subtotal,
      tax,
      taxRate: (invoice as any).tax_rate ? Number((invoice as any).tax_rate) * 100 : undefined,
      discount: discount > 0 ? discount : undefined,
      shipping: shipping > 0 ? shipping : undefined,
      total,
      amountPaid: amountPaid > 0 ? amountPaid : undefined,
      amountDue,

      // Notes
      notes: (invoice as any).notes || undefined,
      terms: (invoice as any).terms || 'Payment is due within 30 days of invoice date.',
    };

    // Generate PDF stream
    const stream = await renderToStream(<InvoicePDF data={invoiceData} />);

    // Check if email parameter is provided
    const searchParams = request.nextUrl.searchParams;
    const emailTo = searchParams.get('email');

    if (emailTo) {
      // TODO: Implement email sending
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: `Email functionality not yet implemented. PDF would be sent to ${emailTo}`,
      });
    }

    // Convert stream to buffer for response
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as downloadable file
    const filename = `invoice-${invoice.invoice_number}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Invoice PDF] Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}
