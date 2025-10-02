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

export default function ProspectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const prospectId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.crm.leads.getById.useQuery(
    { id: prospectId },
    { enabled: !!user && !!prospectId }
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
        <div className="loading-state">Loading prospect details...</div>
      </div>
    );
  }

  if (error || !data || !data.lead) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">Prospect Not Found</h3>
          <p className="empty-state-description">
            The prospect you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/crm/prospects")} className="btn-primary">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back to Prospects
          </Button>
        </div>
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

      {/* Prospect Info Card */}
      <Card className="detail-header-card">
        <CardContent>
          <div className="detail-header">
            <div className="detail-avatar">
              <User className="detail-avatar-icon" aria-hidden="true" />
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{prospect.name || "Unnamed Prospect"}</h1>
              <div className="detail-meta">
                {prospect.company && (
                  <span className="detail-meta-item">
                    <Building2 className="icon-sm" aria-hidden="true" />
                    {prospect.company}
                  </span>
                )}
                {prospectConfig && (
                  <Badge variant="outline" className={prospectConfig.className}>
                    <Thermometer className="icon-xs" aria-hidden="true" />
                    {prospectConfig.label}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Star className={`icon-sm ${priority >= 5 ? 'text-yellow-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                  <span className="text-sm">Priority: {priority}/10</span>
                </div>
              </div>
              <div className="detail-contact-info">
                {prospect.email && (
                  <a href={`mailto:${prospect.email}`} className="detail-contact-link">
                    <Mail className="icon-sm" aria-hidden="true" />
                    {prospect.email}
                  </a>
                )}
                {prospect.phone && (
                  <a href={`tel:${prospect.phone}`} className="detail-contact-link">
                    <Phone className="icon-sm" aria-hidden="true" />
                    {prospect.phone}
                  </a>
                )}
                {prospect.website && (
                  <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="detail-contact-link">
                    <Globe className="icon-sm" aria-hidden="true" />
                    {prospect.website}
                  </a>
                )}
              </div>
              {prospect.tags && prospect.tags.length > 0 && (
                <div className="tag-list">
                  {prospect.tags.map((tag: string, idx: number) => (
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
                Edit Prospect
              </Button>
              <Button onClick={handleConvertToClient} className="btn-success">
                <ArrowRight className="icon-sm" aria-hidden="true" />
                Convert to Client
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="stats-grid">
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
          <div className="tab-content-grid">
            {/* Prospect Details */}
            <Card>
              <CardHeader>
                <CardTitle>Prospect Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="detail-list">
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Email</dt>
                    <dd className="detail-list-value">{prospect.email || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Phone</dt>
                    <dd className="detail-list-value">{prospect.phone || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Company</dt>
                    <dd className="detail-list-value">{prospect.company || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Website</dt>
                    <dd className="detail-list-value">
                      {prospect.website ? (
                        <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {prospect.website}
                        </a>
                      ) : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Lead Source</dt>
                    <dd className="detail-list-value">{prospect.lead_source || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Interest Level</dt>
                    <dd className="detail-list-value">{prospect.interest_level || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Contact Method</dt>
                    <dd className="detail-list-value">{prospect.contact_method || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Created</dt>
                    <dd className="detail-list-value">
                      {prospect.created_at
                        ? format(new Date(prospect.created_at), "MMM d, yyyy h:mm a")
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

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
                        <Star className={`icon-sm ${priority >= 5 ? 'text-yellow-400' : 'text-muted-foreground'}`} aria-hidden="true" />
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
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.notes ? (
                  <p className="text-muted whitespace-pre-wrap">{prospect.notes}</p>
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
              {!activities || activities.length === 0 ? (
                <div className="empty-state">
                  <Clock className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Activities Yet</h3>
                  <p className="empty-state-description">
                    Activities like calls, emails, and meetings will appear here.
                  </p>
                </div>
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
              <CardTitle>Prospect Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.notes ? (
                <div className="notes-content">
                  <p className="whitespace-pre-wrap">{prospect.notes}</p>
                </div>
              ) : (
                <div className="empty-state">
                  <MessageSquare className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Notes</h3>
                  <p className="empty-state-description">
                    Add notes about this prospect to keep track of important information.
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
