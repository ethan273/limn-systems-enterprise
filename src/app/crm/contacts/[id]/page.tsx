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
import { EditableField, EditableFieldGroup } from "@/components/common";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Activity,
  ArrowLeft,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContactDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, error, refetch } = api.crm.contacts.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  // Form data state for in-place editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: '',
    notes: '',
  });

  // Sync form data with fetched contact data
  useEffect(() => {
    if (data?.contact) {
      setFormData({
        name: data.contact.name || '',
        email: data.contact.email || '',
        phone: data.contact.phone || '',
        company: data.contact.company || '',
        position: data.contact.position || '',
        source: data.contact.source || '',
        notes: data.contact.notes || '',
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = api.crm.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to update contact: " + error.message);
    },
  });

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    await updateMutation.mutateAsync({
      id,
      data: {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        position: formData.position || undefined,
        source: formData.source || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (data?.contact) {
      setFormData({
        name: data.contact.name || '',
        email: data.contact.email || '',
        phone: data.contact.phone || '',
        company: data.contact.company || '',
        position: data.contact.position || '',
        source: data.contact.source || '',
        notes: data.contact.notes || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading contact details..." size="md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Contact Not Found"
          description="The contact you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Contacts',
            onClick: () => router.push("/crm/contacts"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const { contact, activities, analytics } = data;

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/crm/contacts")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Contact Header */}
      <EntityDetailHeader
        icon={User}
        title={formData.name || "Unnamed Contact"}
        subtitle={formData.position || undefined}
        metadata={[
          ...(formData.company ? [{ icon: Building2, value: formData.company, type: 'text' as const }] : []),
          ...(formData.email ? [{ icon: Mail, value: formData.email, type: 'email' as const }] : []),
          ...(formData.phone ? [{ icon: Phone, value: formData.phone, type: 'phone' as const }] : []),
        ]}
        tags={contact.tags || []}
        actions={
          isEditing
            ? [
                {
                  label: 'Cancel',
                  icon: X,
                  variant: 'outline' as const,
                  onClick: handleCancel,
                },
                {
                  label: updateMutation.isPending ? 'Saving...' : 'Save Changes',
                  icon: Check,
                  onClick: handleSave,
                  disabled: updateMutation.isPending,
                },
              ]
            : [
                {
                  label: 'Edit Contact',
                  icon: Edit,
                  onClick: () => setIsEditing(true),
                },
              ]
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics?.totalActivities || 0}</div>
            <p className="stat-label">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">{analytics?.completedActivities || 0}</div>
            <p className="stat-label">Activities completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-warning">{analytics?.pendingActivities || 0}</div>
            <p className="stat-label">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics?.engagementScore || 0}</div>
            <p className="stat-label">Out of 100</p>
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
            Activities ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <EditableFieldGroup title="Contact Information" isEditing={isEditing} columns={2}>
            <EditableField
              label="Full Name"
              value={formData.name}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
              icon={User}
            />

            <EditableField
              label="Position"
              value={formData.position}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, position: value })}
              icon={Briefcase}
            />

            <EditableField
              label="Email"
              value={formData.email}
              type="email"
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, email: value })}
              icon={Mail}
            />

            <EditableField
              label="Phone"
              value={formData.phone}
              type="phone"
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, phone: value })}
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
              label="Source"
              value={formData.source}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, source: value })}
            />

            <div className="col-span-2">
              <EditableField
                label="Created"
                value={contact.created_at ? format(new Date(contact.created_at), "MMM d, yyyy h:mm a") : "—"}
                isEditing={false}
                icon={Calendar}
              />
            </div>

            <div className="col-span-2">
              <EditableField
                label="Last Contacted"
                value={analytics?.lastContactDate ? format(new Date(analytics.lastContactDate), "MMM d, yyyy") : "Never"}
                isEditing={false}
                icon={Clock}
              />
            </div>

            <div className="col-span-2">
              <EditableField
                label="Notes"
                value={formData.notes}
                type="textarea"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, notes: value })}
              />
            </div>
          </EditableFieldGroup>
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
              <CardTitle>Contact Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <EditableField
                  label=""
                  value={formData.notes}
                  type="textarea"
                  isEditing={true}
                  onChange={(value) => setFormData({ ...formData, notes: value })}
                  className="min-h-[200px]"
                />
              ) : (
                formData.notes ? (
                  <div className="notes-content">
                    <p className="whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="No Notes"
                    description="Add notes about this contact to keep track of important information."
                  />
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
