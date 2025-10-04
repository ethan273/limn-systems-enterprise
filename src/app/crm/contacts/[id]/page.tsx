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
  Briefcase,
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

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const contactId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.crm.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !!user && !!contactId }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading contact details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">Contact Not Found</h3>
          <p className="empty-state-description">
            The contact you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/crm/contacts")} className="btn-primary">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back to Contacts
          </Button>
        </div>
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

      {/* Contact Info Card */}
      <Card className="detail-header-card">
        <CardContent>
          <div className="detail-header">
            <div className="detail-avatar">
              <User className="detail-avatar-icon" aria-hidden="true" />
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{contact.name || "Unnamed Contact"}</h1>
              <div className="detail-meta">
                {contact.position && (
                  <span className="detail-meta-item">
                    <Briefcase className="icon-sm" aria-hidden="true" />
                    {contact.position}
                  </span>
                )}
                {contact.company && (
                  <span className="detail-meta-item">
                    <Building2 className="icon-sm" aria-hidden="true" />
                    {contact.company}
                  </span>
                )}
              </div>
              <div className="detail-contact-info">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="detail-contact-link">
                    <Mail className="icon-sm" aria-hidden="true" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="detail-contact-link">
                    <Phone className="icon-sm" aria-hidden="true" />
                    {contact.phone}
                  </a>
                )}
              </div>
              {contact.tags && contact.tags.length > 0 && (
                <div className="tag-list">
                  {contact.tags.map((tag, idx) => (
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
                Edit Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="detail-list">
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Email</dt>
                    <dd className="detail-list-value">{contact.email || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Phone</dt>
                    <dd className="detail-list-value">{contact.phone || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Company</dt>
                    <dd className="detail-list-value">{contact.company || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Position</dt>
                    <dd className="detail-list-value">{contact.position || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Source</dt>
                    <dd className="detail-list-value">{contact.source || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Created</dt>
                    <dd className="detail-list-value">
                      {contact.created_at
                        ? format(new Date(contact.created_at), "MMM d, yyyy h:mm a")
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
                </dl>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.notes ? (
                  <p className="text-muted whitespace-pre-wrap">{contact.notes}</p>
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
              <CardTitle>Contact Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.notes ? (
                <div className="notes-content">
                  <p className="whitespace-pre-wrap">{contact.notes}</p>
                </div>
              ) : (
                <div className="empty-state">
                  <MessageSquare className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Notes</h3>
                  <p className="empty-state-description">
                    Add notes about this contact to keep track of important information.
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
