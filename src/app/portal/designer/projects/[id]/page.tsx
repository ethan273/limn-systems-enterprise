'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { EntityDetailHeader } from '@/components/common/EntityDetailHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ArrowLeft,
  Palette,
  DollarSign,
  AlertCircle,

  FileText,
  Calendar,
  RefreshCw,
  Upload,
  Eye,
  Download,
  Package,
  Layers,
} from 'lucide-react';

interface DesignerProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DesignerProjectDetailPage({ params }: DesignerProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Get current user from tRPC
  const { data: currentUser, isLoading: userLoading } = api.portal.getCurrentUser.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Get design project details
  const { data: project, isLoading, error } = api.portal.getDesignerProjectById.useQuery(
    { projectId: id },
    { enabled: !!currentUser }
  );

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/portal/login?redirect=/portal/designer');
    }
  }, [currentUser, userLoading, router]);

  // Handle project query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Design Project Details"
          subtitle="View project information"
        />
        <EmptyState
          icon={AlertCircle}
          title="Failed to load project"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getDesignerProjectById.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading || !project) {
    return <LoadingState message="Loading project details..." />;
  }

  // Helper function to format dates
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (status: string | null) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved') || statusLower.includes('completed')) return 'success';
    if (statusLower.includes('pending') || statusLower.includes('review')) return 'warning';
    if (statusLower.includes('rejected') || statusLower.includes('revision')) return 'destructive';
    return 'default';
  };

  return (
    <div className="page-container">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/portal/designer/projects')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      {/* Entity Header */}
      <EntityDetailHeader
        icon={Palette}
        title={project.project_name || 'Untitled Project'}
        subtitle={`Project ID: ${project.id.slice(0, 8)}`}
        status={project.current_stage || 'Unknown'}
        statusType={getStatusVariant(project.current_stage) as 'active' | 'inactive' | 'pending' | 'cancelled' | 'completed'}
        metadata={[
          {
            icon: Layers,
            label: 'Project Type',
            value: project.project_type || 'N/A',
          },
          {
            icon: AlertCircle,
            label: 'Priority',
            value: project.priority || 'N/A',
          },
        ]}
      />

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Budget</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(project.budget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-2xl font-bold">{formatDate(project.created_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Deadline</span>
            </div>
            <p className="text-2xl font-bold">{formatDate(project.deadline)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">Stage</span>
            </div>
            <p className="text-2xl font-bold">{project.current_stage || 'Unknown'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="briefs">Briefs</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="prototypes">Prototypes</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">
                  {project.description || 'No description provided'}
                </p>
              </div>

              {project.client_requirements && (
                <div>
                  <h4 className="font-semibold mb-2">Client Requirements</h4>
                  <p className="text-muted-foreground">{project.client_requirements}</p>
                </div>
              )}

              {project.design_notes && (
                <div>
                  <h4 className="font-semibold mb-2">Design Notes</h4>
                  <p className="text-muted-foreground">{project.design_notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{formatDate(project.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{formatDate(project.deadline)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{formatDate(project.completed_at)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span>{formatCurrency(project.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant={project.priority === 'high' ? 'destructive' : 'default'}>
                        {project.priority || 'Normal'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Briefs Tab */}
        <TabsContent value="briefs">
          <Card>
            <CardHeader>
              <CardTitle>Design Briefs</CardTitle>
            </CardHeader>
            <CardContent>
              {project.design_briefs && project.design_briefs.length > 0 ? (
                <div className="space-y-4">
                  {project.design_briefs.map((brief: any) => (
                    <Card key={brief.id}>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">{brief.brief_name || 'Untitled Brief'}</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {brief.brief_description || 'No description'}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(brief.created_at)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No briefs yet"
                  description="Design briefs will appear here once created"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Design Deliverables</CardTitle>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Deliverable
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.design_deliverables && project.design_deliverables.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.design_deliverables.map((deliverable: any) => (
                      <TableRow key={deliverable.id}>
                        <TableCell className="font-medium">
                          {deliverable.deliverable_name || 'Untitled'}
                        </TableCell>
                        <TableCell>{deliverable.deliverable_type || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusBadge status={deliverable.status || 'pending'} />
                        </TableCell>
                        <TableCell>{formatDate(deliverable.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Upload}
                  title="No deliverables yet"
                  description="Upload your design files to get started"
                  action={{
                    label: 'Upload Deliverable',
                    onClick: () => {/* TODO: Implement upload */},
                    icon: Upload,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prototypes Tab */}
        <TabsContent value="prototypes">
          <Card>
            <CardHeader>
              <CardTitle>Prototype Production Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {project.prototypes && project.prototypes.length > 0 ? (
                <div className="space-y-4">
                  {project.prototypes.map((prototype: any) => (
                    <Card key={prototype.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {prototype.prototype_name || 'Untitled Prototype'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {prototype.prototype_description || 'No description'}
                            </p>
                          </div>
                          <StatusBadge status={prototype.status || 'pending'} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Created:</span>
                            <p className="text-sm">{formatDate(prototype.created_at)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Version:</span>
                            <p className="text-sm">{prototype.version || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Production Runs */}
                        {prototype.prototype_production && prototype.prototype_production.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Production Runs
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Run Number</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Start Date</TableHead>
                                  <TableHead>Completion Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {prototype.prototype_production.map((run: any) => (
                                  <TableRow key={run.id}>
                                    <TableCell className="font-medium">
                                      {run.run_number || 'N/A'}
                                    </TableCell>
                                    <TableCell>{run.quantity_produced || 0}</TableCell>
                                    <TableCell>
                                      <StatusBadge status={run.status || 'pending'} />
                                    </TableCell>
                                    <TableCell>{formatDate(run.start_date)}</TableCell>
                                    <TableCell>{formatDate(run.completion_date)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {/* Reviews */}
                        {prototype.prototype_reviews && prototype.prototype_reviews.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Reviews</h4>
                            <div className="space-y-2">
                              {prototype.prototype_reviews.map((review: any) => (
                                <Card key={review.id} className="bg-muted/50">
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="text-sm font-medium">{review.reviewer_name || 'Unknown Reviewer'}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(review.review_date)}</p>
                                      </div>
                                      <StatusBadge status={review.review_outcome || 'pending'} />
                                    </div>
                                    {review.review_notes && (
                                      <p className="text-sm mt-2">{review.review_notes}</p>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        {prototype.prototype_feedback && prototype.prototype_feedback.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Feedback</h4>
                            <div className="space-y-2">
                              {prototype.prototype_feedback.map((feedback: any) => (
                                <Card key={feedback.id} className="bg-muted/50">
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="text-sm font-medium">{feedback.feedback_type || 'General Feedback'}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(feedback.feedback_date)}</p>
                                      </div>
                                      {feedback.priority && (
                                        <Badge variant={feedback.priority === 'high' ? 'destructive' : 'default'}>
                                          {feedback.priority}
                                        </Badge>
                                      )}
                                    </div>
                                    {feedback.feedback_text && (
                                      <p className="text-sm mt-2">{feedback.feedback_text}</p>
                                    )}
                                    {feedback.action_taken && (
                                      <div className="mt-2 pt-2 border-t">
                                        <p className="text-xs font-medium text-muted-foreground">Action Taken:</p>
                                        <p className="text-sm">{feedback.action_taken}</p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No prototypes yet"
                  description="Prototype production runs will appear here once created"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revisions Tab */}
        <TabsContent value="revisions">
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              {project.design_revisions && project.design_revisions.length > 0 ? (
                <div className="space-y-4">
                  {project.design_revisions.map((revision: any) => (
                    <Card key={revision.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">Revision #{revision.revision_number || 'N/A'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(revision.created_at)}
                            </p>
                          </div>
                          <Badge variant={revision.status === 'approved' ? 'success' : 'warning'}>
                            {revision.status || 'Pending'}
                          </Badge>
                        </div>
                        {revision.revision_notes && (
                          <p className="text-sm mt-2">{revision.revision_notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No revisions yet"
                  description="Revision requests will appear here"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {project.documents && project.documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.document_type || 'Document'}</TableCell>
                        <TableCell>{formatDate(doc.created_at)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Project documents will appear here"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
