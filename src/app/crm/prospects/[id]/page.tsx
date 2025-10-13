"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter} from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  EntityDetailHeader,
  StatusBadge,
  LoadingState,
  EmptyState,
  EditableFieldGroup,
  EditableField,
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

export default function ProspectDetailPage({ params }: PageProps) {
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
    website: '',
    status: 'new',
    prospect_status: 'cold' as ProspectStatus,
    lead_source: 'manual',
    interest_level: 'medium',
    lead_value: 0,
    notes: '',
  });

  const { data, isLoading, error } = api.crm.leads.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Sync formData with fetched prospect data
  useEffect(() => {
    if (data?.lead) {
      const prospect = data.lead;
      setFormData({
        name: prospect.name || '',
        email: prospect.email || '',
        phone: prospect.phone || '',
        company: prospect.company || '',
        website: prospect.website || '',
        status: prospect.status || 'new',
        prospect_status: (prospect.prospect_status as ProspectStatus) || 'cold',
        lead_source: prospect.lead_source || 'manual',
        interest_level: prospect.interest_level || 'medium',
        lead_value: prospect.lead_value || 0,
        notes: prospect.notes || '',
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = api.crm.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Prospect updated successfully");
      setIsEditing(false);
      // Invalidate queries for instant updates
      utils.crm.leads.getById.invalidate();
      utils.crm.leads.getProspects.invalidate();
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update prospect");
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
        website: formData.website || undefined,
        status: formData.status,
        prospect_status: formData.prospect_status,
        lead_source: formData.lead_source || undefined,
        interest_level: formData.interest_level || undefined,
        lead_value: formData.lead_value || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleCancel = () => {
    if (data?.lead) {
      const prospect = data.lead;
      setFormData({
        name: prospect.name || '',
        email: prospect.email || '',
        phone: prospect.phone || '',
        company: prospect.company || '',
        website: prospect.website || '',
        status: prospect.status || 'new',
        prospect_status: (prospect.prospect_status as ProspectStatus) || 'cold',
        lead_source: prospect.lead_source || 'manual',
        interest_level: prospect.interest_level || 'medium',
        lead_value: prospect.lead_value || 0,
        notes: prospect.notes || '',
      });
    }
    setIsEditing(false);
  };

  // Convert to client mutation
  const convertToClientMutation = api.crm.leads.convertToClient.useMutation({
    onSuccess: (data) => {
      toast.success("Prospect converted to client successfully");
      // Invalidate queries for instant updates
      utils.crm.leads.getById.invalidate();
      utils.crm.leads.getProspects.invalidate();
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
      utils.crm.customers.getAll.invalidate();
      // Navigate to the new customer page
      router.push(`/crm/customers/${data.client.id}`);
    },
    onError: (error) => {
      toast.error("Failed to convert prospect: " + error.message);
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
        actions={
          isEditing
            ? [
                { label: 'Cancel', icon: X, onClick: handleCancel },
                { label: 'Save Changes', icon: Check, onClick: handleSave },
              ]
            : [
                { label: 'Edit Prospect', icon: Edit, onClick: () => setIsEditing(true) },
                { label: 'Convert to Client', icon: ArrowRight, onClick: handleConvertToClient, variant: 'default' as const },
              ]
        }
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
            <EditableFieldGroup title="Prospect Information" isEditing={isEditing}>
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
                label="Website"
                value={formData.website}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, website: value })}
                icon={Globe}
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
                value={prospect.created_at ? format(new Date(prospect.created_at), "MMM d, yyyy h:mm a") : '—'}
                isEditing={false}
                icon={Calendar}
              />
            </EditableFieldGroup>

            {/* Prospect Status */}
            <EditableFieldGroup title="Prospect Status" isEditing={isEditing}>
              <EditableField
                label="Prospect Status"
                value={formData.prospect_status}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, prospect_status: value as ProspectStatus })}
                type="select"
                options={PROSPECT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                icon={Thermometer}
              />
              <EditableField
                label="Lead Value"
                value={String(formData.lead_value || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, lead_value: parseFloat(value) || 0 })}
                type="text"
              />
              <EditableField
                label="Pipeline Status"
                value={formData.status}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, status: value })}
                type="select"
                options={LEAD_STATUSES}
              />
              <EditableField
                label="Priority Score"
                value={`${priority}/10`}
                isEditing={false}
                icon={Star}
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
