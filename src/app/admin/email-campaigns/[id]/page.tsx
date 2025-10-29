/**
 * Email Campaign Detail Page
 *
 * Displays full details of an email campaign including status, recipients, and metrics
 *
 * @module admin/email-campaigns/[id]
 * @created 2025-10-28
 * @phase Grand Plan Phase 5 - Missing Pages Fix
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointer,
  XCircle,
  Calendar,
  User,
  Send,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

export default function EmailCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading, error } = api.emailCampaigns.getById.useQuery(
    { id: campaignId },
    { enabled: !!campaignId }
  );

  const { data: _metrics } = api.emailCampaigns.getMetrics.useQuery(
    { id: campaignId },
    { enabled: !!campaignId }
  );

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              {error.message || "Unable to load campaign details"}
            </p>
            <Button onClick={() => router.push("/admin/email-campaigns")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading campaign details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested email campaign could not be found.</p>
            <Button onClick={() => router.push("/admin/email-campaigns")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800 border-gray-300" },
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800 border-blue-300" },
      sending: { label: "Sending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      sent: { label: "Sent", className: "bg-green-100 text-green-800 border-green-300" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-300" },
    };

    const info = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge variant="outline" className={info.className}>
        {info.label}
      </Badge>
    );
  };

  // Calculate engagement rates
  const sentCount = campaign.sent_count || 0;
  const openRate = sentCount > 0 ? ((campaign.open_count || 0) / sentCount * 100).toFixed(1) : "0.0";
  const clickRate = sentCount > 0 ? ((campaign.click_count || 0) / sentCount * 100).toFixed(1) : "0.0";
  const bounceRate = sentCount > 0 ? ((campaign.bounce_count || 0) / sentCount * 100).toFixed(1) : "0.0";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/email-campaigns")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.campaign_name}</h1>
            <p className="text-muted-foreground">Campaign Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/email-campaigns/${campaignId}/analytics`)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Campaign Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Information</CardTitle>
            {getStatusBadge(campaign.status || "draft")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject Line</h3>
              <p className="text-base">{campaign.subject_line}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Recipients</h3>
              <p className="text-base">{campaign.total_recipients?.toLocaleString() || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">From Name</h3>
              <p className="text-base">{campaign.from_name || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">From Email</h3>
              <p className="text-base">{campaign.from_email || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Reply To</h3>
              <p className="text-base">{campaign.reply_to || "Not specified"}</p>
            </div>
            {campaign.scheduled_for && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Scheduled For</h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(campaign.scheduled_for), "PPp")}
                </p>
              </div>
            )}
            {campaign.sent_at && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Sent At</h3>
                <p className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {format(new Date(campaign.sent_at), "PPp")}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p className="text-base">
                {campaign.created_at ? format(new Date(campaign.created_at), "PPp") : "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-base">
                {campaign.updated_at ? format(new Date(campaign.updated_at), "PPp") : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Metrics</CardTitle>
          <CardDescription>
            Performance statistics for this email campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center p-4 bg-accent rounded-lg">
              <Mail className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{campaign.sent_count?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-accent rounded-lg">
              <Eye className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{campaign.open_count?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Opens ({openRate}%)</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-accent rounded-lg">
              <MousePointer className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{campaign.click_count?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Clicks ({clickRate}%)</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-accent rounded-lg">
              <XCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-2xl font-bold">{campaign.bounce_count?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Bounces ({bounceRate}%)</p>
            </div>
          </div>

          {campaign.unsubscribe_count !== null && campaign.unsubscribe_count > 0 && (
            <div className="mt-6 p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {campaign.unsubscribe_count} Unsubscribe{campaign.unsubscribe_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Template Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
          <CardDescription>
            Template content for this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <pre className="text-sm whitespace-pre-wrap break-words">
              {campaign.email_template}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Recipient List Card */}
      {campaign.recipient_list && Array.isArray(campaign.recipient_list) && campaign.recipient_list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipients ({campaign.recipient_list.length})</CardTitle>
            <CardDescription>
              Email addresses included in this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {campaign.recipient_list.map((recipient: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segment Criteria Card */}
      {campaign.segment_criteria && Object.keys(campaign.segment_criteria).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Segment Criteria</CardTitle>
            <CardDescription>
              Filters applied to select recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(campaign.segment_criteria, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
