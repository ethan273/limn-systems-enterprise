"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { EditableFieldGroup, EditableField } from "@/components/common/EditableField";
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
  Check,
  X,
  Building2,
  TrendingUp,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'ads', label: 'Advertising' },
  { value: 'manual', label: 'Manual Entry' },
];

const INTEREST_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    lead_source: 'manual',
    interest_level: 'medium',
    notes: '',
  });

  const { data, isLoading, error } = api.crm.leads.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Sync formData with fetched lead data
  useEffect(() => {
    if (data?.lead) {
      const lead = data.lead;
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        status: lead.status || 'new',
        lead_source: lead.lead_source || 'manual',
        interest_level: lead.interest_level || 'medium',
        notes: lead.notes || '',
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = api.crm.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      setIsEditing(false);
      // Invalidate queries for instant updates
      utils.crm.leads.getById.invalidate();
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    updateMutation.mutate({
      id: id,
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        status: formData.status,
        lead_source: formData.lead_source || undefined,
        interest_level: formData.interest_level || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleCancel = () => {
    if (data?.lead) {
      const lead = data.lead;
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        status: lead.status || 'new',
        lead_source: lead.lead_source || 'manual',
        interest_level: lead.interest_level || 'medium',
        notes: lead.notes || '',
      });
    }
    setIsEditing(false);
  };

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
        subtitle={lead.company || undefined}
        metadata={[
          ...(lead.email ? [{ icon: Mail, value: lead.email, type: 'email' as const }] : []),
          ...(lead.phone ? [{ icon: Phone, value: lead.phone, type: 'phone' as const }] : []),
          ...(lead.website ? [{ icon: Globe, value: lead.website, type: 'link' as const, href: lead.website }] : []),
        ]}
        tags={lead.tags || []}
        actions={
          isEditing
            ? [
                { label: 'Cancel', icon: X, onClick: handleCancel },
                { label: 'Save Changes', icon: Check, onClick: handleSave },
              ]
            : [
                { label: 'Edit Lead', icon: Edit, onClick: () => setIsEditing(true) },
              ]
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lead Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">${(analytics?.leadValue || 0).toLocaleString()}</div>
            <p className="stat-label">Estimated value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Days in Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics?.daysInPipeline || 0}</div>
            <p className="stat-label">Since creation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pipeline Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics?.pipelineProgress || 0}%</div>
            <p className="stat-label">Completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics?.totalActivities || 0}</div>
            <p className="stat-label">{analytics?.completedActivities || 0} completed</p>
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
              const isActive = stage.value === analytics?.currentStage;
              const isPassed = pipelineStages.findIndex(s => s.value === analytics?.currentStage) > idx;

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
            <EditableFieldGroup title="Lead Information" isEditing={isEditing}>
              <EditableField
                label="Name"
                value={formData.name}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                icon={User}
              />
              <EditableField
                label="Email"
                value={formData.email}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, email: value })}
                type="email"
                required
                icon={Mail}
              />
              <EditableField
                label="Phone"
                value={formData.phone}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                type="phone"
                icon={Phone}
              />
              <EditableField
                label="Company"
                value={formData.company}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, company: value })}
                icon={Building2}
              />
              <EditableField
                label="Status"
                value={formData.status}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, status: value })}
                type="select"
                options={LEAD_STATUSES}
              />
              <EditableField
                label="Lead Source"
                value={formData.lead_source}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, lead_source: value })}
                type="select"
                options={LEAD_SOURCES}
                icon={TrendingUp}
              />
              <EditableField
                label="Interest Level"
                value={formData.interest_level}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, interest_level: value })}
                type="select"
                options={INTEREST_LEVELS}
                icon={Target}
              />
              <EditableField
                label="Created"
                value={lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy h:mm a") : '—'}
                isEditing={false}
                icon={Calendar}
              />
              <EditableField
                label="Last Contacted"
                value={analytics?.lastContactDate ? format(new Date(analytics.lastContactDate), "MMM d, yyyy") : 'Never'}
                isEditing={false}
              />
            </EditableFieldGroup>

            {/* Notes Section */}
            <EditableFieldGroup title="Notes" isEditing={isEditing}>
              <EditableField
                label="Notes"
                value={formData.notes}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                type="textarea"
                icon={MessageSquare}
              />
            </EditableFieldGroup>
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
              <EditableField
                label="Notes"
                value={formData.notes}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                type="textarea"
                icon={MessageSquare}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
