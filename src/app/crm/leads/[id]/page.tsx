"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Building2,
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

const interestLevels: Record<string, { label: string; className: string }> = {
  low: { label: "Low Interest", className: "badge-neutral" },
  medium: { label: "Medium Interest", className: "bg-warning-muted text-warning border-warning" },
  high: { label: "High Interest", className: "status-completed" },
  unknown: { label: "Unknown", className: "badge-neutral" },
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const leadId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.crm.leads.getById.useQuery(
    { id: leadId },
    { enabled: !!user && !!leadId }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading lead details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">Lead Not Found</h3>
          <p className="empty-state-description">
            The lead you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/crm/leads")} className="btn-primary">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const { lead, activities, analytics } = data;
  const currentStage = pipelineStages.find(s => s.value === analytics.currentStage) || pipelineStages[0];
  const interestLevel = interestLevels[analytics.interestLevel] || interestLevels.unknown;

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

      {/* Lead Info Card */}
      <Card className="detail-header-card">
        <CardContent>
          <div className="detail-header">
            <div className="detail-avatar">
              <User className="detail-avatar-icon" aria-hidden="true" />
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{lead.name || "Unnamed Lead"}</h1>
              <div className="detail-meta">
                {lead.company && (
                  <span className="detail-meta-item">
                    <Building2 className="icon-sm" aria-hidden="true" />
                    {lead.company}
                  </span>
                )}
                <Badge variant="outline" className={currentStage.color}>
                  {currentStage.label}
                </Badge>
                <Badge variant="outline" className={interestLevel.className}>
                  {interestLevel.label}
                </Badge>
              </div>
              <div className="detail-contact-info">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="detail-contact-link">
                    <Mail className="icon-sm" aria-hidden="true" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="detail-contact-link">
                    <Phone className="icon-sm" aria-hidden="true" />
                    {lead.phone}
                  </a>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="detail-contact-link">
                    <Globe className="icon-sm" aria-hidden="true" />
                    {lead.website}
                  </a>
                )}
              </div>
              {lead.tags && lead.tags.length > 0 && (
                <div className="tag-list">
                  {lead.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="badge-neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-actions">
              <Button className="btn-primary">
                <Edit className="icon-sm" aria-hidden="true" />
                Edit Lead
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {isActive && <Badge className="badge-primary">Current</Badge>}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lead Details */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="detail-list">
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Status</dt>
                    <dd className="detail-list-value">{lead.status || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Lead Source</dt>
                    <dd className="detail-list-value">{lead.lead_source || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Contact Method</dt>
                    <dd className="detail-list-value">{lead.contact_method || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Created</dt>
                    <dd className="detail-list-value">
                      {lead.created_at
                        ? format(new Date(lead.created_at), "MMM d, yyyy h:mm a")
                        : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Last Contacted</dt>
                    <dd className="detail-list-value">
                      {analytics.lastContactDate
                        ? format(new Date(analytics.lastContactDate), "MMM d, yyyy")
                        : "Never"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Follow-up Date</dt>
                    <dd className="detail-list-value">
                      {lead.follow_up_date
                        ? format(new Date(lead.follow_up_date), "MMM d, yyyy")
                        : "Not scheduled"}
                    </dd>
                  </div>
                  {lead.converted_at && (
                    <div className="detail-list-item">
                      <dt className="detail-list-label">Converted On</dt>
                      <dd className="detail-list-value">
                        {format(new Date(lead.converted_at), "MMM d, yyyy")}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.notes ? (
                  <p className="text-muted whitespace-pre-wrap">{lead.notes}</p>
                ) : (
                  <p className="text-muted">No notes available</p>
                )}
              </CardContent>
            </Card>
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
                <div className="empty-state">
                  <Clock className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Activities Yet</h3>
                  <p className="empty-state-description">
                    Activities like calls, emails, and meetings will appear here.
                  </p>
                </div>
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
                          <Badge
                            variant="outline"
                            className={
                              activity.status === "completed"
                                ? "status-completed"
                                : activity.status === "pending"
                                ? "status-pending"
                                : "badge-neutral"
                            }
                          >
                            {activity.status || "unknown"}
                          </Badge>
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
                <div className="empty-state">
                  <MessageSquare className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Notes</h3>
                  <p className="empty-state-description">
                    Add notes about this lead to keep track of important information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
