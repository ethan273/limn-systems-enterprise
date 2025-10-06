"use client";

import { use,  useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Layers, Briefcase, User, Edit } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DesignProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
 const router = useRouter();
 const { user, loading: authLoading } = useAuthContext();

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const { data: project, isLoading } = api.designProjects.getById.useQuery(
 { id: id },
 { enabled: !authLoading && !!user && !!id }
 );

 const updateProgressMutation = api.designProjects.updateProgress.useMutation();

 const handleStageUpdate = async (newStage: string) => {
 try {
 await updateProgressMutation.mutateAsync({
 id: id,
 current_stage: newStage,
 });
 toast({
 title: "Success",
 description: "Project stage updated successfully!",
 });
 window.location.reload();
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to update project stage. Please try again.",
 variant: "destructive",
 });
 }
 };

 if (authLoading || isLoading) {
 return (
 <div className="page-container">
 <LoadingState message="Loading project details..." size="md" />
 </div>
 );
 }

 if (!user || !project) {
 return (
 <div className="page-container">
 <EmptyState
 icon={Briefcase}
 title="Project Not Found"
 description="The project you're looking for doesn't exist or you don't have permission to view it."
 action={{
 label: 'Back to Projects',
 onClick: () => router.push("/design/projects"),
 icon: ArrowLeft,
 }}
 />
 </div>
 );
 }

 const stages = [
 { value: 'brief_creation', label: 'Brief Creation' },
 { value: 'concept', label: 'Concept' },
 { value: 'draft', label: 'Draft' },
 { value: 'revision', label: 'Revision' },
 { value: 'final', label: 'Final' },
 { value: 'approved', label: 'Approved' },
 ];

 const getStageProgress = (stage: string) => {
 const stageIndex = stages.findIndex(s => s.value === stage);
 return ((stageIndex + 1) / stages.length) * 100;
 };

 return (
 <div className="page-container">
 {/* Header Section */}
 <div className="page-header">
 <Button
 onClick={() => router.push("/design/projects")}
 variant="ghost"
 className="btn-secondary"
 >
 <ArrowLeft className="icon-sm" aria-hidden="true" />
 Back
 </Button>
 </div>

 {/* Project Header */}
 <EntityDetailHeader
 icon={Briefcase}
 title={project.project_name || "Untitled Project"}
 subtitle={project.project_code || undefined}
 metadata={[
 { icon: User, value: project.designers?.name || "Not assigned", label: 'Designer' },
 ...(project.furniture_collections?.name ? [{ icon: Layers, value: project.furniture_collections.name, label: 'Collection' }] : []),
 ...(project.target_launch_date ? [{ icon: Calendar, value: new Date(project.target_launch_date).toLocaleDateString(), label: 'Target Launch' }] : []),
 ...(project.budget ? [{ icon: DollarSign, value: `$${Number(project.budget).toFixed(2)}`, label: 'Budget' }] : []),
 ]}
 status={project.current_stage}
 actions={[
 {
 label: 'Edit Project',
 icon: Edit,
 onClick: () => router.push(`/design/projects/${project.id}/edit`),
 },
 ]}
 />

 {/* Stage Update Control */}
 <div className="mb-6">
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">Update Stage:</span>
 <Select value={project.current_stage} onValueChange={handleStageUpdate}>
 <SelectTrigger className="w-[200px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {stages.map((stage) => (
 <SelectItem key={stage.value} value={stage.value}>
 {stage.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <Tabs defaultValue="overview">
 <TabsList className="tabs-list">
 <TabsTrigger value="overview" className="tabs-trigger">Overview</TabsTrigger>
 <TabsTrigger value="briefs" className="tabs-trigger">Briefs</TabsTrigger>
 <TabsTrigger value="boards" className="tabs-trigger">Mood Boards</TabsTrigger>
 <TabsTrigger value="documents" className="tabs-trigger">Documents</TabsTrigger>
 <TabsTrigger value="revisions" className="tabs-trigger">Revisions</TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-6">
 {/* Progress Indicator */}
 <Card>
 <CardHeader>
 <CardTitle>Project Progress</CardTitle>
 <CardDescription>Current stage: {project.current_stage.replace('_', ' ')}</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div className="design-progress-track">
 <div
 className="design-progress-bar"
 style={{ width: `${getStageProgress(project.current_stage)}%` }}
 />
 </div>
 <div className="flex justify-between text-xs text-muted-foreground">
 {stages.map((stage) => (
 <span
 key={stage.value}
 className={project.current_stage === stage.value ? "font-bold text-primary" : ""}
 >
 {stage.label}
 </span>
 ))}
 </div>
 </div>
 </CardContent>
 </Card>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Project Details */}
 <InfoCard
 title="Project Details"
 items={[
 { label: 'Designer', value: project.designers?.name || "Not assigned" },
 { label: 'Collection', value: project.furniture_collections?.name || "—" },
 { label: 'Project Type', value: project.project_type || "—" },
 { label: 'Priority', value: <Badge variant="outline" className="capitalize">{project.priority}</Badge> },
 { label: 'Days in Stage', value: `${project.days_in_stage || 0} days` },
 ]}
 />

 {/* Timeline & Budget */}
 <InfoCard
 title="Timeline & Budget"
 items={[
 ...(project.target_launch_date ? [{
 label: 'Target Launch',
 value: new Date(project.target_launch_date).toLocaleDateString(),
 icon: Calendar,
 }] : []),
 ...(project.budget ? [{
 label: 'Budget',
 value: `$${Number(project.budget).toFixed(2)}`,
 icon: DollarSign,
 }] : []),
 ...(project.next_action ? [{
 label: 'Next Action',
 value: project.next_action,
 }] : []),
 ]}
 />
 </div>

 {/* Milestones */}
 <Card>
 <CardHeader>
 <CardTitle>Project Milestones</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {stages.map((stage, index) => {
 const isCompleted = stages.findIndex(s => s.value === project.current_stage) >= index;
 return (
 <div
 key={stage.value}
 className={isCompleted ? 'deliverable-card-completed' : 'deliverable-card'}
 >
 <div className="flex items-center gap-3">
 <div className={isCompleted ? 'deliverable-icon-bg-completed' : 'deliverable-icon-bg'}>
 {isCompleted ? '✓' : index + 1}
 </div>
 <span className="font-medium">
 {stage.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 {/* Briefs Tab */}
 <TabsContent value="briefs" className="space-y-6">
 {project.design_briefs && project.design_briefs.length > 0 ? (
 <div className="space-y-4">
 {project.design_briefs.map((brief: any) => (
 <Card key={brief.id}>
 <CardHeader>
 <CardTitle>{brief.title}</CardTitle>
 {brief.description && <CardDescription>{brief.description}</CardDescription>}
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <p className="text-sm text-muted-foreground">
 Created: {brief.created_at ? new Date(brief.created_at).toLocaleDateString() : "—"}
 </p>
 {brief.approved_date && (
 <p className="text-sm text-muted-foreground">
 Approved: {new Date(brief.approved_date).toLocaleDateString()}
 </p>
 )}
 </div>
 <Link href={`/design/briefs/${brief.id}`}>
 <Button variant="outline" size="sm">
 View Brief
 </Button>
 </Link>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="card-content-compact">
 <EmptyState
 icon={FileText}
 title="No Design Briefs"
 description="No design briefs associated with this project"
 action={{
 label: 'Create Brief',
 onClick: () => router.push("/design/briefs/new"),
 }}
 />
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Mood Boards Tab */}
 <TabsContent value="boards" className="space-y-6">
 {project.mood_boards && project.mood_boards.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {project.mood_boards.map((board: any) => (
 <Card key={board.id}>
 <CardHeader>
 <CardTitle className="text-lg">{board.name}</CardTitle>
 {board.description && <CardDescription className="text-sm">{board.description}</CardDescription>}
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Type</span>
 <Badge variant="outline">{board.board_type}</Badge>
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Status</span>
 <Badge variant="outline">{board.status}</Badge>
 </div>
 <Link href={`/design/boards/${board.id}`}>
 <Button variant="outline" size="sm" className="w-full mt-2">
 View Board
 </Button>
 </Link>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="card-content-compact">
 <EmptyState
 icon={Image}
 title="No Mood Boards"
 description="No mood boards created for this project"
 />
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Documents Tab */}
 <TabsContent value="documents" className="space-y-6">
 {project.documents && project.documents.length > 0 ? (
 <Card>
 <CardHeader>
 <CardTitle>Project Documents</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {project.documents.map((doc: any) => (
 <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
 <div className="flex items-center gap-3">
 <FileText className="h-5 w-5 text-muted-foreground" />
 <div>
 <p className="font-medium text-sm">{doc.document_type || "Document"}</p>
 <p className="text-xs text-muted-foreground">
 {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
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
 <CardContent className="card-content-compact">
 <EmptyState
 icon={FileText}
 title="No Documents"
 description="No documents uploaded"
 />
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Revisions Tab */}
 <TabsContent value="revisions" className="space-y-6">
 {project.design_revisions && project.design_revisions.length > 0 ? (
 <Card>
 <CardHeader>
 <CardTitle>Revision History</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {project.design_revisions.map((revision: any, index: number) => (
 <div key={revision.id} className="deliverable-card">
 <div className="flex items-start gap-3">
 <div className="deliverable-icon-bg">
 <Layers className="h-4 w-4" />
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-sm">Revision {index + 1}</span>
 <span className="text-xs text-muted-foreground">
 {revision.created_at ? new Date(revision.created_at).toLocaleDateString() : "—"}
 </span>
 </div>
 {revision.revision_notes && (
 <p className="text-sm text-muted-foreground">{revision.revision_notes}</p>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 ) : (
 <Card>
 <CardContent className="card-content-compact">
 <EmptyState
 icon={Layers}
 title="No Revisions"
 description="No revisions recorded"
 />
 </CardContent>
 </Card>
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}
