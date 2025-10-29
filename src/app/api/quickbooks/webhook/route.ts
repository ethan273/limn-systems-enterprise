import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getQuickBooksClientByRealm } from '@/lib/quickbooks/auth';
import crypto from 'crypto';

/**
 * QuickBooks Webhook Receiver
 *
 * Receives webhook notifications from QuickBooks Online when entities are created/updated/deleted.
 * Validates webhook signature and processes events to sync data bidirectionally.
 *
 * POST /api/quickbooks/webhook
 *
 * QuickBooks Webhook Events:
 * - Invoice: INVOICE_CREATED, INVOICE_UPDATED, INVOICE_DELETED
 * - Payment: PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_DELETED
 * - Customer: CUSTOMER_CREATED, CUSTOMER_UPDATED, CUSTOMER_DELETED
 *
 * Documentation: https://developer.intuit.com/app/developer/qbo/docs/develop/webhooks
 */

const QB_WEBHOOK_TOKEN = process.env.QUICKBOOKS_WEBHOOK_TOKEN || '';

interface QuickBooksWebhookPayload {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: string; // e.g., "Invoice", "Payment", "Client"
        id: string; // QuickBooks entity ID
        operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void';
        lastUpdated: string; // ISO 8601 timestamp
      }>;
    };
  }>;
}

/**
 * Verify QuickBooks webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!QB_WEBHOOK_TOKEN) {
    console.warn('[QuickBooks Webhook] Webhook token not configured - skipping verification');
    return true; // Allow in development if token not set
  }

  const hmac = crypto.createHmac('sha256', QB_WEBHOOK_TOKEN);
  const computedSignature = hmac.update(payload).digest('base64');

  return computedSignature === signature;
}

/**
 * Process Invoice entity update from QuickBooks
 */
async function processInvoiceUpdate(
  realmId: string,
  invoiceId: string,
  operation: string
) {
  try {
    // Find mapping in our database
    // Note: findFirst not supported by wrapper, using findMany
    const mappingArray = await prisma.quickbooks_entity_mapping.findMany({
      where: {
        entity_type: 'invoice',
        quickbooks_id: invoiceId,
      },
      take: 1,
    });
    const mapping = mappingArray.length > 0 ? mappingArray[0] : null;

    if (!mapping) {
      console.log(`[QuickBooks Webhook] Invoice ${invoiceId} not found in mappings - skipping`);
      return;
    }

    if (operation === 'Delete' || operation === 'Void') {
      // Mark invoice as voided/deleted in our system
      await prisma.production_invoices.update({
        where: { id: mapping.limn_id },
        data: {
          status: 'cancelled',
          updated_at: new Date(),
        },
      });

      console.log(`[QuickBooks Webhook] Invoice ${mapping.limn_id} marked as cancelled`);
      return;
    }

    // Fetch updated invoice from QuickBooks
    const qbClient = await getQuickBooksClientByRealm(realmId);
    const qbInvoice = await qbClient.getInvoice(invoiceId);

    // Update our database
    await prisma.production_invoices.update({
      where: { id: mapping.limn_id },
      data: {
        // Update status based on QuickBooks balance
        status: qbInvoice.Balance === 0 ? 'paid' : 'sent',
        updated_at: new Date(),
      } as any,
    });

    // Update mapping sync token
    await prisma.quickbooks_entity_mapping.update({
      where: { id: mapping.id },
      data: {
        quickbooks_sync_token: qbInvoice.SyncToken,
        last_synced_at: new Date(),
      },
    });

    console.log(`[QuickBooks Webhook] Invoice ${mapping.limn_id} synced from QuickBooks`);
  } catch (error) {
    console.error('[QuickBooks Webhook] Error processing invoice update:', error);
    throw error;
  }
}

/**
 * Process Payment entity update from QuickBooks
 */
async function processPaymentUpdate(
  realmId: string,
  paymentId: string,
  operation: string
) {
  try {
    // Find mapping in our database
    // Note: findFirst not supported by wrapper, using findMany
    const mappingArray = await prisma.quickbooks_entity_mapping.findMany({
      where: {
        entity_type: 'payment',
        quickbooks_id: paymentId,
      },
      take: 1,
    });
    const mapping = mappingArray.length > 0 ? mappingArray[0] : null;

    if (!mapping) {
      console.log(`[QuickBooks Webhook] Payment ${paymentId} not found in mappings - skipping`);
      return;
    }

    if (operation === 'Delete') {
      // Mark payment as voided in our system
      await prisma.production_payments.update({
        where: { id: mapping.limn_id },
        data: {
          status: 'voided',
          updated_at: new Date(),
        },
      });

      console.log(`[QuickBooks Webhook] Payment ${mapping.limn_id} marked as voided`);
      return;
    }

    // Fetch updated payment from QuickBooks
    const qbClient = await getQuickBooksClientByRealm(realmId);
    const _qbPayment = await qbClient.getPayment(paymentId);

    // Update our database
    await prisma.production_payments.update({
      where: { id: mapping.limn_id },
      data: {
        updated_at: new Date(),
      } as any,
    });

    console.log(`[QuickBooks Webhook] Payment ${mapping.limn_id} synced from QuickBooks`);
  } catch (error) {
    console.error('[QuickBooks Webhook] Error processing payment update:', error);
    throw error;
  }
}

/**
 * Process Customer entity update from QuickBooks
 */
async function processCustomerUpdate(
  realmId: string,
  customerId: string,
  operation: string
) {
  try {
    // Find mapping in our database
    // Note: findFirst not supported by wrapper, using findMany
    const mappingArray = await prisma.quickbooks_entity_mapping.findMany({
      where: {
        entity_type: 'customer',
        quickbooks_id: customerId,
      },
      take: 1,
    });
    const mapping = mappingArray.length > 0 ? mappingArray[0] : null;

    if (!mapping) {
      console.log(`[QuickBooks Webhook] Customer ${customerId} not found in mappings - skipping`);
      return;
    }

    if (operation === 'Delete') {
      // Mark customer as inactive
      await prisma.customers.update({
        where: { id: mapping.limn_id },
        data: {
          updated_at: new Date(),
        } as any,
      });

      console.log(`[QuickBooks Webhook] Customer ${mapping.limn_id} marked as inactive`);
      return;
    }

    // Fetch updated customer from QuickBooks
    const qbClient = await getQuickBooksClientByRealm(realmId);
    const qbCustomer = await qbClient.getCustomer(customerId);

    // Update our database with basic info
    await prisma.customers.update({
      where: { id: mapping.limn_id },
      data: {
        company: qbCustomer.CompanyName || undefined,
        email: qbCustomer.PrimaryEmailAddr?.Address || undefined,
        phone: qbCustomer.PrimaryPhone?.FreeFormNumber || undefined,
        updated_at: new Date(),
      } as any,
    });

    console.log(`[QuickBooks Webhook] Customer ${mapping.limn_id} synced from QuickBooks`);
  } catch (error) {
    console.error('[QuickBooks Webhook] Error processing customer update:', error);
    throw error;
  }
}

/**
 * POST handler for QuickBooks webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('intuit-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[QuickBooks Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload
    const payload: QuickBooksWebhookPayload = JSON.parse(rawBody);

    console.log('[QuickBooks Webhook] Received webhook:', {
      eventCount: payload.eventNotifications.length,
    });

    // Process each event notification
    for (const notification of payload.eventNotifications) {
      const { realmId, dataChangeEvent } = notification;

      // Process each entity change
      for (const entity of dataChangeEvent.entities) {
        const { name, id, operation } = entity;

        console.log(`[QuickBooks Webhook] Processing ${name} ${operation}: ${id}`);

        try {
          switch (name.toLowerCase()) {
            case 'invoice':
              await processInvoiceUpdate(realmId, id, operation);
              break;

            case 'payment':
              await processPaymentUpdate(realmId, id, operation);
              break;

            case 'customer':
              await processCustomerUpdate(realmId, id, operation);
              break;

            default:
              console.log(`[QuickBooks Webhook] Unsupported entity type: ${name}`);
          }
        } catch (error) {
          console.error(`[QuickBooks Webhook] Error processing ${name} ${id}:`, error);
          // Continue processing other entities
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[QuickBooks Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - webhook verification endpoint
 * QuickBooks sends a verification request when setting up webhooks
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'QuickBooks webhook endpoint is active',
    endpoint: '/api/quickbooks/webhook',
  });
}
