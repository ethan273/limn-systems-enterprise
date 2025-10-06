"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  Activity,
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const pipelineStages = [
  { value: "initial", label: "Initial Contact", color: "badge-neutral" },
  { value: "qualified", label: "Qualified", color: "status-pending" },
  { value: "proposal", label: "Proposal Sent", color: "bg-info-muted text-info border-info" },
  { value: "negotiation", label: "Negotiation", color: "bg-primary-muted text-primary border-primary" },
  { value: "won", label: "Won", color: "status-completed" },
  { value: "lost", label: "Lost", color: "status-cancelled" },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.crm.leads.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading lead details..." size="md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Lead Not Found"
          description="The lead you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Leads',
            onClick: () => router.push("/crm/leads"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const { lead, activities, analytics } = data;

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/crm/leads")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Lead Header */}
      <EntityDetailHeader
        icon={User}
        title={lead.name || "Unnamed Lead"}
        subtitle={lead.company}
        metadata={[
          ...(lead.email ? [{ icon: Mail, value: lead.email, type: 'email' as const }] : []),
          ...(lead.phone ? [{ icon: Phone, value: lead.phone, type: 'phone' as const }] : []),
          ...(lead.website ? [{ icon: Globe, value: lead.website, type: 'link' as const, href: lead.website }] : []),
        ]}
        tags={lead.tags || []}
        actions={[
          {
            label: 'Edit Lead',
            icon: Edit,
            onClick: () => router.push(`/crm/leads/${id}/edit`),
          },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lead Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">${analytics.leadValue.toLocaleString()}</div>
            <p className="stat-label">Estimated value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Days in Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.daysInPipeline}</div>
            <p className="stat-label">Since creation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pipeline Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.pipelineProgress}%</div>
            <p className="stat-label">Completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.totalActivities}</div>
            <p className="stat-label">{analytics.completedActivities} completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="pipeline-visual">
            {pipelineStages.filter(s => s.value !== "lost").map((stage, idx) => {
              const isActive = stage.value === analytics.currentStage;
              const isPassed = pipelineStages.findIndex(s => s.value === analytics.currentStage) > idx;

              return (
                <div key={stage.value} className="pipeline-stage">
                  <div className={`pipeline-stage-indicator ${isActive ? "active" : isPassed ? "completed" : "pending"}`}>
                    {isPassed ? (
                      <CheckCircle2 className="icon-sm" aria-hidden="true" />
                    ) : (
                      <span className="pipeline-stage-number">{idx + 1}</span>
                    )}
                  </div>
                  <div className="pipeline-stage-label">
                    <p className="pipeline-stage-title">{stage.label}</p>
                    {isActive && <span className="badge badge-primary">Current</span>}
                  </div>
                  {idx < pipelineStages.length - 2 && (
                    <div className={`pipeline-stage-connector ${isPassed ? "completed" : "pending"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <Activity className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activities" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Activities ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Details */}
            <InfoCard
              title="Lead Details"
              items={[
                { label: 'Status', value: lead.status || '—' },
                { label: 'Lead Source', value: lead.lead_source || '—' },
                { label: 'Contact Method', value: lead.contact_method || '—' },
                {
                  label: 'Created',
                  value: lead.created_at
                    ? format(new Date(lead.created_at), "MMM d, yyyy h:mm a")
                    : '—'
                },
                {
                  label: 'Last Contacted',
                  value: analytics.lastContactDate
                    ? format(new Date(analytics.lastContactDate), "MMM d, yyyy")
                    : 'Never'
                },
                {
                  label: 'Follow-up Date',
                  value: lead.follow_up_date
                    ? format(new Date(lead.follow_up_date), "MMM d, yyyy")
                    : 'Not scheduled'
                },
                ...(lead.converted_at ? [{
                  label: 'Converted On',
                  value: format(new Date(lead.converted_at), "MMM d, yyyy")
                }] : []),
              ]}
            />

            {/* Notes Section */}
            <InfoCard
              title="Notes"
              items={[
                {
                  label: '',
                  value: lead.notes ? (
                    <p className="text-muted whitespace-pre-wrap">{lead.notes}</p>
                  ) : (
                    <p className="text-muted">No notes available</p>
                  ),
                },
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
              {activities.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No Activities Yet"
                  description="Activities like calls, emails, and meetings will appear here."
                />
              ) : (
                <div className="activity-timeline">
                  {activities.map((activity) => (
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
              <CardTitle>Lead Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.notes ? (
                <div className="notes-content">
                  <p className="whitespace-pre-wrap">{lead.notes}</p>
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No Notes"
                  description="Add notes about this lead to keep track of important information."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
