"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EntityDetailHeader,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
import { EditableFieldGroup, EditableField } from "@/components/common/EditableField";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Calendar, DollarSign, FileText, User, Edit, Check, X, MessageSquare } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function DesignBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: 0,
    timeline: '',
  });

  // Auth is handled by middleware - no client-side redirect needed

  const { data: brief, isLoading, refetch } = api.designBriefs.getById.useQuery(
    { id: id },
    { enabled: !authLoading && !!user && !!id }
  );

  // Sync formData with fetched brief data
  useEffect(() => {
    if (brief) {
      setFormData({
        title: brief.title || '',
        description: brief.description || '',
        requirements: brief.requirements || '',
        budget: brief.budget ? Number(brief.budget) : 0,
        timeline: brief.timeline || '',
      });
    }
  }, [brief]);

  // Update mutation
  const updateMutation = api.designBriefs.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Design brief updated successfully",
      });
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update design brief",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: id,
      data: {
        title: formData.title,
        description: formData.description || undefined,
        requirements: formData.requirements || undefined,
        budget: formData.budget || undefined,
        timeline: formData.timeline || undefined,
      },
    });
  };

  const handleCancel = () => {
    if (brief) {
      setFormData({
        title: brief.title || '',
        description: brief.description || '',
        requirements: brief.requirements || '',
        budget: brief.budget ? Number(brief.budget) : 0,
        timeline: brief.timeline || '',
      });
    }
    setIsEditing(false);
  };

  const approveBriefMutation = api.designBriefs.approve.useMutation();

  const handleApprove = async () => {
    try {
      await approveBriefMutation.mutateAsync({ id: id });
      toast({
        title: "Success",
        description: "Design brief approved successfully!",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve design brief. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading design brief..." size="lg" />
      </div>
    );
  }

  if (!user || !brief) {
    return (
      <div className="page-container">
        <EmptyState
          icon={FileText}
          title="Design Brief Not Found"
          description="The design brief you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Design Briefs',
            onClick: () => router.push("/design/briefs"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const isApproved = !!brief.approved_by;
  const hasProject = !!brief.design_projects;
  const status = isApproved ? 'approved' : hasProject ? 'submitted' : 'draft';

  const metadata: EntityMetadata[] = [
    { icon: Calendar, value: brief.created_at ? new Date(brief.created_at).toLocaleDateString() : "—", label: 'Created' },
    { icon: User, value: brief.users_design_briefs_created_byTousers?.email || "—", label: 'Created By' },
  ];

  if (brief.approved_date) {
    metadata.push({ icon: Calendar, value: new Date(brief.approved_date).toLocaleDateString(), label: 'Approved' });
  }
  if (brief.budget) {
    metadata.push({ icon: DollarSign, value: `$${Number(brief.budget).toLocaleString()}`, label: 'Budget' });
  }

  return (
    <div className="page-container">
      <EntityDetailHeader
        icon={FileText}
        title={brief.title}
        subtitle={brief.description || "No description provided"}
        metadata={metadata}
        status={status}
        actions={
          isEditing
            ? [
                { label: 'Cancel', icon: X, onClick: handleCancel },
                { label: 'Save Changes', icon: Check, onClick: handleSave },
              ]
            : [
                ...(!isApproved && !approveBriefMutation.isPending ? [
                  {
                    label: "Approve Brief",
                    icon: CheckCircle,
                    onClick: handleApprove,
                  },
                ] : []),
                { label: 'Edit Brief', icon: Edit, onClick: () => setIsEditing(true) },
              ]
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableFieldGroup title="Brief Information" isEditing={isEditing}>
              <EditableField
                label="Title"
                value={formData.title}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, title: value })}
                required
                icon={FileText}
              />
              <EditableField
                label="Description"
                value={formData.description}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, description: value })}
                type="textarea"
              />
              <EditableField
                label="Status"
                value={isApproved ? 'Approved' : hasProject ? 'Submitted' : 'Draft'}
                isEditing={false}
              />
              <EditableField
                label="Created By"
                value={brief.users_design_briefs_created_byTousers?.email || "—"}
                isEditing={false}
                icon={User}
              />
              <EditableField
                label="Created Date"
                value={brief.created_at ? new Date(brief.created_at).toLocaleDateString() : "—"}
                isEditing={false}
                icon={Calendar}
              />
              {brief.approved_date && (
                <EditableField
                  label="Approved Date"
                  value={new Date(brief.approved_date).toLocaleDateString()}
                  isEditing={false}
                  icon={Calendar}
                />
              )}
              {brief.approved_by && (
                <EditableField
                  label="Approved By"
                  value={brief.users_design_briefs_approved_byTousers?.email || "—"}
                  isEditing={false}
                  icon={User}
                />
              )}
            </EditableFieldGroup>

            {/* Project Details */}
            <EditableFieldGroup title="Project Details" isEditing={isEditing}>
              <EditableField
                label="Budget"
                value={String(formData.budget || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, budget: parseFloat(value) || 0 })}
                type="text"
                icon={DollarSign}
              />
              <EditableField
                label="Timeline"
                value={formData.timeline}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, timeline: value })}
                type="text"
                icon={Calendar}
              />
              {hasProject && brief.design_projects && (
                <EditableField
                  label="Linked Project"
                  value={brief.design_projects.project_name || "—"}
                  isEditing={false}
                />
              )}
            </EditableFieldGroup>
          </div>

          {/* Requirements */}
          <EditableFieldGroup title="Requirements" isEditing={isEditing}>
            <EditableField
              label="Requirements"
              value={formData.requirements}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, requirements: value })}
              type="textarea"
              icon={MessageSquare}
            />
          </EditableFieldGroup>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <EditableFieldGroup title="Design Requirements" isEditing={isEditing}>
            <EditableField
              label="Requirements"
              value={formData.requirements}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, requirements: value })}
              type="textarea"
              icon={MessageSquare}
            />
          </EditableFieldGroup>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Associated Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {hasProject && brief.design_projects ? (
                <div className="space-y-2">
                  <p className="font-medium">{brief.design_projects.project_name}</p>
                  {brief.design_projects.description && (
                    <p className="text-sm text-muted-foreground">{brief.design_projects.description}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No projects associated with this brief</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No documents uploaded</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
