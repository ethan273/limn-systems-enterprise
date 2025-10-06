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
  Building2,
  Calendar,
  Activity,
  ArrowLeft,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

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

  const { data, isLoading, error } = api.crm.contacts.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

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
        title={contact.name || "Unnamed Contact"}
        subtitle={contact.position}
        metadata={[
          ...(contact.company ? [{ icon: Building2, value: contact.company, type: 'text' as const }] : []),
          ...(contact.email ? [{ icon: Mail, value: contact.email, type: 'email' as const }] : []),
          ...(contact.phone ? [{ icon: Phone, value: contact.phone, type: 'phone' as const }] : []),
        ]}
        tags={contact.tags || []}
        actions={[
          {
            label: 'Edit Contact',
            icon: Edit,
            onClick: () => router.push(`/crm/contacts/${id}/edit`),
          },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.totalActivities}</div>
            <p className="stat-label">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">{analytics.completedActivities}</div>
            <p className="stat-label">Activities completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-warning">{analytics.pendingActivities}</div>
            <p className="stat-label">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.engagementScore}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Details */}
            <InfoCard
              title="Contact Details"
              items={[
                { label: 'Email', value: contact.email || '—', type: 'email' },
                { label: 'Phone', value: contact.phone || '—', type: 'phone' },
                { label: 'Company', value: contact.company || '—' },
                { label: 'Position', value: contact.position || '—' },
                { label: 'Source', value: contact.source || '—' },
                {
                  label: 'Created',
                  value: contact.created_at
                    ? format(new Date(contact.created_at), "MMM d, yyyy h:mm a")
                    : "—"
                },
                {
                  label: 'Last Contacted',
                  value: analytics.lastContactDate
                    ? format(new Date(analytics.lastContactDate), "MMM d, yyyy")
                    : "Never"
                },
              ]}
            />

            {/* Notes Section */}
            <InfoCard
              title="Notes"
              items={[
                {
                  label: '',
                  value: contact.notes ? (
                    <p className="text-muted whitespace-pre-wrap">{contact.notes}</p>
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
              {contact.notes ? (
                <div className="notes-content">
                  <p className="whitespace-pre-wrap">{contact.notes}</p>
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No Notes"
                  description="Add notes about this contact to keep track of important information."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
