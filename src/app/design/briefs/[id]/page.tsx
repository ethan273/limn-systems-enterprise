"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EntityDetailHeader,
  InfoCard,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Calendar, DollarSign, FileText, User } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function DesignBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const { data: brief, isLoading } = api.designBriefs.getById.useQuery(
    { id: id },
    { enabled: !authLoading && !!user && !!id }
  );

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
        actions={!isApproved && !approveBriefMutation.isPending ? [
          {
            label: "Approve Brief",
            icon: CheckCircle,
            onClick: handleApprove,
          },
        ] : []}
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
            <InfoCard
              title="Brief Information"
              items={[
                { label: 'Status', value: isApproved ? 'Approved' : hasProject ? 'Submitted' : 'Draft', type: 'badge', badgeVariant: isApproved ? 'success' : hasProject ? 'warning' : 'default' },
                { label: 'Created By', value: brief.users_design_briefs_created_byTousers?.email || "—" },
                { label: 'Created Date', value: brief.created_at ? new Date(brief.created_at).toLocaleDateString() : "—" },
                ...(brief.approved_date ? [{ label: 'Approved Date', value: new Date(brief.approved_date).toLocaleDateString() }] : []),
                ...(brief.approved_by ? [{ label: 'Approved By', value: brief.users_design_briefs_approved_byTousers?.email || "—" }] : []),
              ]}
            />

            {/* Project Details */}
            <InfoCard
              title="Project Details"
              items={[
                { label: 'Budget', value: brief.budget ? `$${Number(brief.budget).toLocaleString()}` : "—" },
                { label: 'Timeline', value: brief.timeline || "—" },
                ...(hasProject && brief.design_projects ? [
                  { label: 'Linked Project', value: brief.design_projects.project_name || "—" }
                ] : []),
              ]}
            />
          </div>

          {/* Description */}
          {brief.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{brief.requirements}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Design Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              {brief.requirements ? (
                <p className="whitespace-pre-wrap">{brief.requirements}</p>
              ) : (
                <p className="text-muted-foreground">No requirements specified</p>
              )}
            </CardContent>
          </Card>
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
