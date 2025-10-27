/**
 * Process Scheduled Campaigns Cron Job
 *
 * This endpoint is called by Vercel Cron to automatically send
 * campaigns that have reached their scheduled_for timestamp.
 *
 * Schedule: Every 5 minutes (configured in vercel.json)
 *
 * @module cron/process-scheduled-campaigns
 * @created 2025-10-26
 * @phase Grand Plan Phase 5 - Critical Fix
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EmailCampaignService } from '@/lib/services/email-service';

/**
 * GET handler for processing scheduled campaigns
 *
 * This is called by Vercel Cron (no authentication needed)
 * Vercel cron jobs are authenticated via Cron Secret header
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel automatically adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all campaigns scheduled for now or earlier
    const scheduledCampaigns = await db.email_campaigns.findMany({
      where: {
        status: 'scheduled',
        scheduled_for: {
          lte: now,
        },
      },
      orderBy: {
        scheduled_for: 'asc',
      },
    });

    console.log(`[cron:scheduled-campaigns] Found ${scheduledCampaigns.length} campaigns to process`);

    const results: Array<{
      campaign_id: string;
      campaign_name: string;
      success: boolean;
      sent_count?: number;
      error?: string;
    }> = [];

    const service = new EmailCampaignService(db);

    // Process each campaign
    for (const campaign of scheduledCampaigns) {
      try {
        console.log(`[cron:scheduled-campaigns] Processing campaign: ${campaign.id} - ${campaign.campaign_name}`);

        const result = await service.send(campaign.id);

        results.push({
          campaign_id: campaign.id,
          campaign_name: campaign.campaign_name,
          success: true,
          sent_count: result.sent_count,
        });

        console.log(`[cron:scheduled-campaigns] Successfully sent campaign: ${campaign.id}, sent ${result.sent_count} emails`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        results.push({
          campaign_id: campaign.id,
          campaign_name: campaign.campaign_name,
          success: false,
          error: errorMessage,
        });

        console.error(`[cron:scheduled-campaigns] Failed to send campaign: ${campaign.id}`, error);

        // Update campaign status to failed
        await db.email_campaigns.update({
          where: { id: campaign.id },
          data: {
            status: 'cancelled',
            updated_at: new Date(),
          },
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(`[cron:scheduled-campaigns] Completed: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      failed: failureCount,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[cron:scheduled-campaigns] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
