import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF, InvoiceData } from '@/lib/pdf/invoice-template';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoice with related data
    const invoice = await db.production_invoices.findUnique({
      where: { id },
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

      // Company info
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

    // Convert stream to buffer
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
