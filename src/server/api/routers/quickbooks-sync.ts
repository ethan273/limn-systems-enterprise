import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { quickbooksClient } from '@/lib/quickbooks/client';
import type { QuickBooksInvoice, QuickBooksPayment, QuickBooksCustomer } from '@/lib/quickbooks/client';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get QuickBooks tokens from database and set them on the client
 */
async function loadQuickBooksTokens(ctx: any) {
  const auth = await ctx.db.quickbooks_auth.findFirst({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  });

  if (!auth) {
    throw new Error('QuickBooks not connected. Please connect your QuickBooks account first.');
  }

  quickbooksClient.setTokens({
    access_token: auth.access_token,
    refresh_token: auth.refresh_token,
    token_expiry: new Date(auth.token_expiry),
    refresh_token_expiry: new Date(auth.refresh_token_expiry),
    realm_id: auth.company_id,
  });

  return auth;
}

/**
 * Save updated tokens to database (after refresh)
 */
async function saveQuickBooksTokens(ctx: any, authId: string) {
  // Check if tokens were refreshed
  if (quickbooksClient.isAccessTokenExpired()) {
    const newTokens = await quickbooksClient.refreshAccessToken();

    await ctx.db.quickbooks_auth.update({
      where: { id: authId },
      data: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        token_expiry: newTokens.token_expiry,
        refresh_token_expiry: newTokens.refresh_token_expiry,
      },
    });
  }
}

/**
 * Get or create QuickBooks customer mapping
 */
async function getOrCreateCustomerMapping(
  ctx: any,
  limnCustomerId: string,
  customerData: any
): Promise<string> {
  // Check if customer already mapped
  const existing = await ctx.db.quickbooks_entity_mapping.findFirst({
    where: {
      entity_type: 'customer',
      limn_id: limnCustomerId,
    },
  });

  if (existing) {
    return existing.quickbooks_id;
  }

  // Create customer in QuickBooks
  const qbCustomer: QuickBooksCustomer = {
    DisplayName: customerData.name || `Customer ${limnCustomerId.slice(0, 8)}`,
    CompanyName: customerData.company_name,
    GivenName: customerData.first_name,
    FamilyName: customerData.last_name,
    PrimaryEmailAddr: customerData.email ? { Address: customerData.email } : undefined,
    PrimaryPhone: customerData.phone ? { FreeFormNumber: customerData.phone } : undefined,
  };

  const createdCustomer = await quickbooksClient.syncCustomer(qbCustomer);

  // Save mapping
  await ctx.db.quickbooks_entity_mapping.create({
    data: {
      entity_type: 'customer',
      limn_id: limnCustomerId,
      quickbooks_id: createdCustomer.Id!,
      sync_status: 'completed',
    },
  });

  return createdCustomer.Id!;
}

/**
 * Get default QuickBooks item for production items
 */
async function getDefaultItemId(ctx: any): Promise<string> {
  // Check if we have a default item mapped
  const existing = await ctx.db.quickbooks_entity_mapping.findFirst({
    where: {
      entity_type: 'item',
      limn_id: 'default-production-item',
    },
  });

  if (existing) {
    return existing.quickbooks_id;
  }

  // Return a hardcoded value - must be configured manually in QuickBooks
  // Or create a default "Production Item" service in QuickBooks
  throw new Error(
    'Default QuickBooks item not configured. Please set up a default production item in QuickBooks and map it.'
  );
}

// ============================================================================
// ROUTER
// ============================================================================

export const quickbooksSyncRouter = createTRPCRouter({

  // Check QuickBooks connection status
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const auth = await ctx.db.quickbooks_auth.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    if (!auth) {
      return {
        connected: false,
        message: 'QuickBooks not connected',
      };
    }

    const tokenExpired = new Date() >= new Date(auth.token_expiry);
    const refreshExpired = new Date() >= new Date(auth.refresh_token_expiry);

    return {
      connected: true,
      company_name: auth.company_name,
      token_expired: tokenExpired,
      refresh_token_expired: refreshExpired,
      connected_at: auth.created_at,
    };
  }),

  // Sync production invoice to QuickBooks
  syncInvoice: protectedProcedure
    .input(z.object({
      production_invoice_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Load QuickBooks tokens
        const auth = await loadQuickBooksTokens(ctx);

        // Get production invoice with related data
        const invoice = await ctx.db.production_invoices.findUnique({
          where: { id: input.production_invoice_id },
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
          throw new Error('Production invoice not found');
        }

        // Check if already synced
        const existingMapping = await ctx.db.quickbooks_entity_mapping.findFirst({
          where: {
            entity_type: 'invoice',
            limn_id: input.production_invoice_id,
          },
        });

        // Get or create customer mapping
        const customer = invoice.production_orders?.projects?.customers;
        if (!customer) {
          throw new Error('Customer not found for this production order');
        }

        const qbCustomerId = await getOrCreateCustomerMapping(ctx, customer.id, customer);
        const qbItemId = await getDefaultItemId(ctx);

        // Prepare QuickBooks invoice
        const qbInvoice: QuickBooksInvoice = {
          ...(existingMapping ? {
            Id: existingMapping.quickbooks_id,
            SyncToken: existingMapping.quickbooks_sync_token || undefined,
          } : {}),
          DocNumber: invoice.invoice_number,
          TxnDate: new Date(invoice.invoice_date).toISOString().split('T')[0],
          DueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : undefined,
          CustomerRef: {
            value: qbCustomerId,
          },
          Line: (invoice.production_invoice_line_items || []).map((item: any) => ({
            Amount: Number(item.total_price),
            DetailType: "SalesItemLineDetail" as const,
            Description: item.description || item.item_name,
            SalesItemLineDetail: {
              Qty: item.quantity,
              UnitPrice: Number(item.unit_price),
              ItemRef: {
                value: qbItemId,
                name: "Production Item",
              },
            },
          })),
          PrivateNote: `Production Order: ${invoice.production_orders?.order_number}`,
        };

        // Create or update invoice in QuickBooks
        const syncedInvoice = existingMapping
          ? await quickbooksClient.updateInvoice(qbInvoice)
          : await quickbooksClient.createInvoice(qbInvoice);

        // Save or update mapping
        if (existingMapping) {
          await ctx.db.quickbooks_entity_mapping.update({
            where: { id: existingMapping.id },
            data: {
              quickbooks_sync_token: syncedInvoice.SyncToken,
              last_synced_at: new Date(),
              sync_status: 'completed',
            },
          });
        } else {
          await ctx.db.quickbooks_entity_mapping.create({
            data: {
              entity_type: 'invoice',
              limn_id: input.production_invoice_id,
              quickbooks_id: syncedInvoice.Id!,
              quickbooks_sync_token: syncedInvoice.SyncToken,
              sync_status: 'completed',
            },
          });
        }

        // Log sync
        await ctx.db.quickbooks_sync_log.create({
          data: {
            sync_type: 'invoice',
            sync_direction: 'to_quickbooks',
            entity_id: input.production_invoice_id,
            quickbooks_id: syncedInvoice.Id,
            action: existingMapping ? 'update' : 'create',
            status: 'completed',
            request_data: qbInvoice,
            response_data: syncedInvoice,
            completed_at: new Date(),
            created_by: ctx.session?.user?.id,
          },
        });

        // Save updated tokens
        await saveQuickBooksTokens(ctx, auth.id);

        return {
          success: true,
          quickbooks_invoice_id: syncedInvoice.Id,
          message: 'Invoice synced to QuickBooks successfully',
        };
      } catch (error: any) {
        console.error('Error syncing invoice to QuickBooks:', error);

        // Log failed sync
        await ctx.db.quickbooks_sync_log.create({
          data: {
            sync_type: 'invoice',
            sync_direction: 'to_quickbooks',
            entity_id: input.production_invoice_id,
            action: 'create',
            status: 'failed',
            error_message: error.message,
            completed_at: new Date(),
            created_by: ctx.session?.user?.id,
          },
        });

        throw new Error(`Failed to sync invoice to QuickBooks: ${error.message}`);
      }
    }),

  // Sync payment to QuickBooks
  syncPayment: protectedProcedure
    .input(z.object({
      production_payment_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Load QuickBooks tokens
        const auth = await loadQuickBooksTokens(ctx);

        // Get payment with related data
        const payment = await ctx.db.production_payments.findUnique({
          where: { id: input.production_payment_id },
          include: {
            production_invoices: {
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
              },
            },
          },
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        // Check if already synced
        const existingMapping = await ctx.db.quickbooks_entity_mapping.findFirst({
          where: {
            entity_type: 'payment',
            limn_id: input.production_payment_id,
          },
        });

        if (existingMapping) {
          return {
            success: true,
            quickbooks_payment_id: existingMapping.quickbooks_id,
            message: 'Payment already synced to QuickBooks',
          };
        }

        // Get customer mapping
        const customer = payment.production_invoices?.production_orders?.projects?.customers;
        if (!customer) {
          throw new Error('Customer not found for this payment');
        }

        const qbCustomerId = await getOrCreateCustomerMapping(ctx, customer.id, customer);

        // Get invoice mapping
        const invoiceMapping = await ctx.db.quickbooks_entity_mapping.findFirst({
          where: {
            entity_type: 'invoice',
            limn_id: payment.production_invoice_id,
          },
        });

        if (!invoiceMapping) {
          throw new Error('Invoice must be synced to QuickBooks before syncing payment');
        }

        // Prepare QuickBooks payment
        const qbPayment: QuickBooksPayment = {
          TxnDate: new Date(payment.payment_date).toISOString().split('T')[0],
          TotalAmt: Number(payment.amount),
          CustomerRef: {
            value: qbCustomerId,
          },
          PaymentRefNum: payment.transaction_id || payment.payment_number,
          PrivateNote: payment.notes || `Payment for ${payment.production_invoices?.invoice_number}`,
          Line: [{
            Amount: Number(payment.amount),
            LinkedTxn: [{
              TxnId: invoiceMapping.quickbooks_id,
              TxnType: "Invoice" as const,
            }],
          }],
        };

        // Create payment in QuickBooks
        const syncedPayment = await quickbooksClient.createPayment(qbPayment);

        // Save mapping
        await ctx.db.quickbooks_entity_mapping.create({
          data: {
            entity_type: 'payment',
            limn_id: input.production_payment_id,
            quickbooks_id: syncedPayment.Id!,
            sync_status: 'completed',
          },
        });

        // Log sync
        await ctx.db.quickbooks_sync_log.create({
          data: {
            sync_type: 'payment',
            sync_direction: 'to_quickbooks',
            entity_id: input.production_payment_id,
            quickbooks_id: syncedPayment.Id,
            action: 'create',
            status: 'completed',
            request_data: qbPayment,
            response_data: syncedPayment,
            completed_at: new Date(),
            created_by: ctx.session?.user?.id,
          },
        });

        // Save updated tokens
        await saveQuickBooksTokens(ctx, auth.id);

        return {
          success: true,
          quickbooks_payment_id: syncedPayment.Id,
          message: 'Payment synced to QuickBooks successfully',
        };
      } catch (error: any) {
        console.error('Error syncing payment to QuickBooks:', error);

        // Log failed sync
        await ctx.db.quickbooks_sync_log.create({
          data: {
            sync_type: 'payment',
            sync_direction: 'to_quickbooks',
            entity_id: input.production_payment_id,
            action: 'create',
            status: 'failed',
            error_message: error.message,
            completed_at: new Date(),
            created_by: ctx.session?.user?.id,
          },
        });

        throw new Error(`Failed to sync payment to QuickBooks: ${error.message}`);
      }
    }),

  // Get sync history for an entity
  getSyncHistory: protectedProcedure
    .input(z.object({
      entity_id: z.string().uuid(),
      entity_type: z.enum(['invoice', 'payment', 'customer']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.quickbooks_sync_log.findMany({
        where: {
          entity_id: input.entity_id,
          ...(input.entity_type && { sync_type: input.entity_type }),
        },
        orderBy: { started_at: 'desc' },
        limit: 50,
      });

      return logs;
    }),

  // Get sync statistics
  getSyncStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalSyncs, completedSyncs, failedSyncs, invoiceMappings, paymentMappings] = await Promise.all([
      ctx.db.quickbooks_sync_log.count(),
      ctx.db.quickbooks_sync_log.count({ where: { status: 'completed' } }),
      ctx.db.quickbooks_sync_log.count({ where: { status: 'failed' } }),
      ctx.db.quickbooks_entity_mapping.count({ where: { entity_type: 'invoice' } }),
      ctx.db.quickbooks_entity_mapping.count({ where: { entity_type: 'payment' } }),
    ]);

    return {
      totalSyncs,
      completedSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? Math.round((completedSyncs / totalSyncs) * 100) : 0,
      invoicesSynced: invoiceMappings,
      paymentsSynced: paymentMappings,
    };
  }),
});
