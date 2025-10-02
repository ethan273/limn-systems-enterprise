"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Calendar, DollarSign, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DesignBriefDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const { data: brief, isLoading } = api.designBriefs.getById.useQuery(
    { id: params.id },
    { enabled: !authLoading && !!user && !!params.id }
  );

  const approveBriefMutation = api.designBriefs.approve.useMutation();

  const handleApprove = async () => {
    try {
      await approveBriefMutation.mutateAsync({ id: params.id });
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !brief) {
    return null;
  }

  const isApproved = !!brief.approved_by;
  const hasProject = !!brief.design_projects;

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/design/briefs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Briefs
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{brief.title}</h1>
            <p className="text-muted-foreground mt-1">
              {brief.description || "No description provided"}
            </p>
          </div>
          {!isApproved && (
            <Button onClick={handleApprove} disabled={approveBriefMutation.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {approveBriefMutation.isPending ? "Approving..." : "Approve Brief"}
            </Button>
          )}
        </div>
      </div>

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
            {/* Brief Status */}
            <Card>
              <CardHeader>
                <CardTitle>Brief Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {isApproved ? (
                    <Badge variant="outline" className="badge-success">
                      Approved
                    </Badge>
                  ) : hasProject ? (
                    <Badge variant="outline" className="badge-warning">
                      Submitted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="badge-neutral">
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {brief.created_at ? new Date(brief.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
                {brief.approved_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Approved</span>
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(brief.approved_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created By</span>
                  <span className="text-sm">
                    {brief.users_design_briefs_created_byTousers?.email || "—"}
                  </span>
                </div>
                {brief.approved_by && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Approved By</span>
                    <span className="text-sm">
                      {brief.users_design_briefs_approved_byTousers?.email || "—"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Market & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Target Market</span>
                  <span className="text-sm font-medium">{brief.target_market || "—"}</span>
                </div>
                {(brief.price_point_min || brief.price_point_max) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price Range</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {brief.price_point_min ? `$${Number(brief.price_point_min).toFixed(2)}` : "—"}
                      {" - "}
                      {brief.price_point_max ? `$${Number(brief.price_point_max).toFixed(2)}` : "—"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Associated Project */}
          {brief.design_projects && (
            <Card>
              <CardHeader>
                <CardTitle>Associated Design Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{brief.design_projects.project_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Code: {brief.design_projects.project_code || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stage: {brief.design_projects.current_stage}
                    </p>
                  </div>
                  <Link href={`/design/projects/${brief.design_projects.id}`}>
                    <Button variant="outline" size="sm">
                      View Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Materials Preference</CardTitle>
            </CardHeader>
            <CardContent>
              {brief.materials_preference && Array.isArray(brief.materials_preference) && brief.materials_preference.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {brief.materials_preference.map((material: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {material}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No materials specified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Style References</CardTitle>
            </CardHeader>
            <CardContent>
              {brief.style_references && Array.isArray(brief.style_references) && brief.style_references.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {brief.style_references.map((style: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-purple-50">
                      {style}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No style references specified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Functional Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {brief.functional_requirements || "No functional requirements specified"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          {brief.design_projects ? (
            <Card>
              <CardHeader>
                <CardTitle>Associated Design Project</CardTitle>
                <CardDescription>
                  This brief is associated with the following design project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{brief.design_projects.project_name}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Project Code: {brief.design_projects.project_code || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Current Stage: {brief.design_projects.current_stage}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Designer: {brief.design_projects.designers?.name || "—"}
                        </p>
                      </div>
                    </div>
                    <Link href={`/design/projects/${brief.design_projects.id}`}>
                      <Button variant="outline">
                        View Project
                      </Button>
                    </Link>
                  </div>

                  {/* Deliverables */}
                  {brief.design_projects.design_deliverables && brief.design_projects.design_deliverables.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-3">Deliverables</h4>
                      <div className="space-y-2">
                        {brief.design_projects.design_deliverables.map((deliverable: any) => (
                          <div key={deliverable.id} className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{deliverable.deliverable_type}</span>
                            <Badge variant="outline" className="ml-auto">
                              {deliverable.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No design project associated with this brief yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          {brief.design_projects?.documents && brief.design_projects.documents.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Related Documents</CardTitle>
                <CardDescription>
                  Documents from the associated design project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brief.design_projects.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{doc.document_type || "Document"}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
