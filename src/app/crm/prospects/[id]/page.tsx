"use client";

import React, { use, useState } from "react";
import { useRouter} from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  EntityDetailHeader,
  InfoCard,
  StatusBadge,
  LoadingState,
  EmptyState,
} from "@/components/common";
import {
  User,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Thermometer,
  Globe,
  Activity,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

type ProspectStatus = 'cold' | 'warm' | 'hot';

const PROSPECT_STATUSES: {
  value: ProspectStatus;
  label: string;
  className: string;
  description: string;
}[] = [
  {
    value: 'hot',
    label: 'Hot',
    className: 'priority-high',
    description: 'Ready to buy, high interest'
  },
  {
    value: 'warm',
    label: 'Warm',
    className: 'priority-medium',
    description: 'Engaged, needs nurturing'
  },
  {
    value: 'cold',
    label: 'Cold',
    className: 'priority-low',
    description: 'Early stage, requires attention'
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProspectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.crm.leads.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  // Convert to client mutation
  const convertToClientMutation = api.crm.leads.convertToClient.useMutation({
    onSuccess: () => {
      router.push("/crm/clients");
    },
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading prospect details..." size="md" />
      </div>
    );
  }

  if (error || !data || !data.lead) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Prospect Not Found"
          description="The prospect you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Prospects',
            onClick: () => router.push("/crm/prospects"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const { lead: prospect, activities, analytics } = data;
  const prospectConfig = PROSPECT_STATUSES.find(s => s.value === prospect.prospect_status);

  // Calculate priority score (same logic as list page)
  const getProspectPriority = (): number => {
    const statusPriority = { 'hot': 3, 'warm': 2, 'cold': 1 };
    const statusScore = statusPriority[prospect.prospect_status as ProspectStatus] || 0;
    const valueScore = prospect.lead_value ? Math.min(prospect.lead_value / 10000, 3) : 0;
    const timeScore = prospect.created_at ?
      Math.max(0, 3 - Math.floor((Date.now() - new Date(prospect.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7))) : 0;

    return Math.round(statusScore + valueScore + timeScore);
  };

  const priority = getProspectPriority();

  const handleConvertToClient = () => {
    if (confirm(`Convert ${prospect.name} to a client?`)) {
      convertToClientMutation.mutate({
        leadId: prospect.id,
        clientData: {
          name: prospect.name,
          email: prospect.email || "",
          phone: prospect.phone || "",
          company: prospect.company || "",
          type: 'client',
        },
      });
    }
  };

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/crm/prospects")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Prospect Header */}
      <EntityDetailHeader
        icon={User}
        title={prospect.name || "Unnamed Prospect"}
        subtitle={prospect.company || undefined}
        status={prospectConfig?.label}
        metadata={[
          ...(prospect.email ? [{ icon: Mail, value: prospect.email, type: 'email' as const }] : []),
          ...(prospect.phone ? [{ icon: Phone, value: prospect.phone, type: 'phone' as const }] : []),
          ...(prospect.website ? [{ icon: Globe, value: prospect.website, type: 'link' as const }] : []),
          { icon: Star, value: `Priority: ${priority}/10`, type: 'text' as const },
        ]}
        tags={prospect.tags || []}
        actions={[
          {
            label: 'Edit Prospect',
            icon: Edit,
            onClick: () => router.push(`/crm/prospects/${id}/edit`),
          },
          {
            label: 'Convert to Client',
            icon: ArrowRight,
            onClick: handleConvertToClient,
            variant: 'default' as const,
          },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Prospect Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">
              ${prospect.lead_value?.toLocaleString() || "0"}
            </div>
            <p className="stat-label">Potential deal value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lead Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{prospect.status ? prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1) : "N/A"}</div>
            <p className="stat-label">Current pipeline stage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.totalActivities || 0}</div>
            <p className="stat-label">Total interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pipeline Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.daysInPipeline || 0}</div>
            <p className="stat-label">Days in pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <Activity className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activities" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Activities ({activities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="notes" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prospect Details */}
            <InfoCard
              title="Prospect Details"
              items={[
                { label: 'Email', value: prospect.email || '—', type: 'email' },
                { label: 'Phone', value: prospect.phone || '—', type: 'phone' },
                { label: 'Company', value: prospect.company || '—' },
                { label: 'Website', value: prospect.website || '—', type: prospect.website ? 'link' : 'text', ...(prospect.website && { href: prospect.website }) },
                { label: 'Lead Source', value: prospect.lead_source || '—' },
                { label: 'Interest Level', value: prospect.interest_level || '—' },
                { label: 'Contact Method', value: prospect.contact_method || '—' },
                { label: 'Created', value: prospect.created_at ? format(new Date(prospect.created_at), "MMM d, yyyy h:mm a") : '—' },
              ]}
            />

            {/* Prospect Management */}
            <Card>
              <CardHeader>
                <CardTitle>Prospect Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prospectConfig && (
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className={`icon-md ${prospectConfig.className}`} aria-hidden="true" />
                        <h3 className="font-semibold">{prospectConfig.label} Prospect</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{prospectConfig.description}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Priority Score:</span>
                      <div className="flex items-center gap-1">
                        <Star className={`icon-sm ${priority >= 5 ? 'text-warning' : 'text-muted-foreground'}`} aria-hidden="true" />
                        <span className="font-semibold">{priority}/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lead Value:</span>
                      <span className="font-semibold">${prospect.lead_value?.toLocaleString() || "0"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pipeline Stage:</span>
                      <Badge variant="outline" className="badge-neutral">
                        {prospect.pipeline_stage || prospect.status || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <InfoCard
              title="Notes"
              items={[
                { label: '', value: prospect.notes ? <p className="text-muted whitespace-pre-wrap">{prospect.notes}</p> : <p className="text-muted">No notes available</p> },
              ]}
            />
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              {!activities || activities.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No Activities Yet"
                  description="Activities like calls, emails, and meetings will appear here."
                />
              ) : (
                <div className="activity-timeline">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="activity-timeline-item">
                      <div className="activity-timeline-icon">
                        {activity.status === "completed" ? (
                          <CheckCircle2 className="icon-sm status-completed" aria-hidden="true" />
                        ) : (
                          <Clock className="icon-sm status-pending" aria-hidden="true" />
                        )}
                      </div>
                      <div className="activity-timeline-content">
                        <div className="activity-timeline-header">
                          <h4 className="activity-timeline-title">{activity.title || "Untitled Activity"}</h4>
                          <StatusBadge status={activity.status || "unknown"} />
                        </div>
                        {activity.type && (
                          <p className="activity-timeline-type">
                            <span className="activity-type-badge">{activity.type}</span>
                          </p>
                        )}
                        {activity.description && (
                          <p className="activity-timeline-description">{activity.description}</p>
                        )}
                        {activity.created_at && (
                          <p className="activity-timeline-date">
                            <Calendar className="icon-xs" aria-hidden="true" />
                            {format(new Date(activity.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Prospect Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.notes ? (
                <div className="notes-content">
                  <p className="whitespace-pre-wrap">{prospect.notes}</p>
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No Notes"
                  description="Add notes about this prospect to keep track of important information."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
