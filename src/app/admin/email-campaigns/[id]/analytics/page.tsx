/**
 * Email Campaign Analytics Page
 *
 * Detailed analytics for a specific email campaign
 *
 * @module admin/email-campaigns/[id]/analytics
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Mail, Eye, MousePointer, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading: campaignLoading } =
    api.emailCampaigns.getById.useQuery({ id: campaignId });

  const { data: metrics, isLoading: metricsLoading } =
    api.emailCampaigns.getMetrics.useQuery({ id: campaignId });

  const { data: timeline } = api.emailAnalytics.getCampaignTimeline.useQuery({
    campaign_id: campaignId,
    interval: 'day',
  });

  const { data: topLinks } = api.emailAnalytics.getTopLinks.useQuery({
    campaign_id: campaignId,
    limit: 10,
  });

  const { data: eventBreakdown } = api.emailAnalytics.getEventBreakdown.useQuery({
    campaign_id: campaignId,
  });

  if (campaignLoading || metricsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!campaign || !metrics) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/admin/email-campaigns')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <h1 className="text-3xl font-bold">{campaign.campaign_name}</h1>
        <p className="text-muted-foreground">Campaign Analytics</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_recipients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Mail className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.delivered_count}</div>
            <Progress value={metrics.delivery_rate * 100} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {(metrics.delivery_rate * 100).toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.open_count}</div>
            <Progress value={metrics.open_rate * 100} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {(metrics.open_rate * 100).toFixed(1)}% open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicked</CardTitle>
            <MousePointer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.click_count}</div>
            <Progress value={metrics.click_rate * 100} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {(metrics.click_rate * 100).toFixed(1)}% click rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bounced</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bounce_count}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {(metrics.bounce_rate * 100).toFixed(1)}% bounce rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.unsubscribe_count}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {(metrics.unsubscribe_rate * 100).toFixed(1)}% unsubscribe rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click-to-Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.click_to_open_rate * 100).toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.click_count} / {metrics.open_count} opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-lg">
              {metrics.status}
            </Badge>
            {metrics.sent_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sent {format(new Date(metrics.sent_at), 'PPp')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
            <CardDescription>Total events by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventBreakdown?.map((event) => (
                <div key={event.event_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>
                  <div className="text-sm font-medium">{event.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Links */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clicked Links</CardTitle>
            <CardDescription>Most popular links in this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {topLinks && topLinks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Unique</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLinks.map((link, i) => (
                    <TableRow key={i}>
                      <TableCell className="max-w-xs truncate font-mono text-xs">
                        {link.url}
                      </TableCell>
                      <TableCell className="text-right">{link.click_count}</TableCell>
                      <TableCell className="text-right">{link.unique_clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No link clicks yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Event Timeline</CardTitle>
            <CardDescription>Email events over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeline.map((event, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm">
                    {format(new Date(event.timestamp), 'PPP')}
                  </span>
                  <span className="text-sm font-medium">{event.count} events</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Details */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Subject Line</dt>
              <dd className="mt-1 text-sm">{campaign.subject_line}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">From</dt>
              <dd className="mt-1 text-sm">
                {campaign.from_name} &lt;{campaign.from_email}&gt;
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">
                {format(new Date(campaign.created_at), 'PPp')}
              </dd>
            </div>
            {campaign.sent_at && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Sent</dt>
                <dd className="mt-1 text-sm">
                  {format(new Date(campaign.sent_at), 'PPp')}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
