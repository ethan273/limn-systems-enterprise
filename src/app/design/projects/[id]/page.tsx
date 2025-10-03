"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Layers } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DesignProjectDetailPage({ params }: { params: { id: string } }) {
 const router = useRouter();
 const { user, loading: authLoading } = useAuthContext();

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const { data: project, isLoading } = api.designProjects.getById.useQuery(
 { id: params.id },
 { enabled: !authLoading && !!user && !!params.id }
 );

 const updateProgressMutation = api.designProjects.updateProgress.useMutation();

 const handleStageUpdate = async (newStage: string) => {
 try {
 await updateProgressMutation.mutateAsync({
 id: params.id,
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
 <div className="container mx-auto py-6">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading...</p>
 </div>
 </div>
 </div>
 );
 }

 if (!user || !project) {
 return null;
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
 <div className="container mx-auto py-6 max-w-6xl">
 {/* Header */}
 <div className="mb-6">
 <Link href="/design/projects">
 <Button variant="ghost" size="sm" className="mb-4">
 <ArrowLeft className="mr-2 h-4 w-4" />
 Back to Projects
 </Button>
 </Link>
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-3xl font-bold">{project.project_name}</h1>
 <Badge variant="outline" className="capitalize">
 {project.current_stage.replace('_', ' ')}
 </Badge>
 </div>
 <p className="text-muted-foreground">
 Project Code: {project.project_code || "Not assigned"}
 </p>
 </div>
 <div className="space-y-2">
 <div className="text-sm text-muted-foreground mb-1">Update Stage:</div>
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
 </div>

 <Tabs defaultValue="overview" className="space-y-6">
 <TabsList>
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="briefs">Briefs</TabsTrigger>
 <TabsTrigger value="boards">Mood Boards</TabsTrigger>
 <TabsTrigger value="documents">Documents</TabsTrigger>
 <TabsTrigger value="revisions">Revisions</TabsTrigger>
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
 <div className="w-full card rounded-full h-3 dark:card">
 <div
 className="bg-blue-600 h-3 rounded-full transition-all"
 style={{ width: `${getStageProgress(project.current_stage)}%` }}
 />
 </div>
 <div className="flex justify-between text-xs text-muted-foreground">
 {stages.map((stage) => (
 <span
 key={stage.value}
 className={project.current_stage === stage.value ? "font-bold text-blue-600" : ""}
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
 <Card>
 <CardHeader>
 <CardTitle>Project Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Designer</span>
 <span className="text-sm font-medium">{project.designers?.name || "Not assigned"}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Collection</span>
 <span className="text-sm font-medium">{project.furniture_collections?.name || "—"}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Project Type</span>
 <span className="text-sm font-medium">{project.project_type || "—"}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Priority</span>
 <Badge variant="outline" className="capitalize">
 {project.priority}
 </Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Days in Stage</span>
 <span className="text-sm font-medium">{project.days_in_stage || 0} days</span>
 </div>
 </CardContent>
 </Card>

 {/* Timeline & Budget */}
 <Card>
 <CardHeader>
 <CardTitle>Timeline & Budget</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {project.target_launch_date && (
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 Target Launch
 </span>
 <span className="text-sm font-medium">
 {new Date(project.target_launch_date).toLocaleDateString()}
 </span>
 </div>
 )}
 {project.budget && (
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground flex items-center gap-2">
 <DollarSign className="h-4 w-4" />
 Budget
 </span>
 <span className="text-sm font-medium">${Number(project.budget).toFixed(2)}</span>
 </div>
 )}
 {project.next_action && (
 <div className="border-t pt-4">
 <span className="text-sm text-muted-foreground block mb-1">Next Action</span>
 <p className="text-sm">{project.next_action}</p>
 </div>
 )}
 </CardContent>
 </Card>
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
 className={`flex items-center gap-3 p-3 rounded ${
 isCompleted ? 'bg-green-50 border border-green-200' : 'card border border'
 }`}
 >
 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
 isCompleted ? 'bg-green-500 text-foreground' : 'border '
 }`}>
 {isCompleted ? '✓' : index + 1}
 </div>
 <span className={`font-medium ${isCompleted ? 'text-green-700' : ''}`}>
 {stage.label}
 </span>
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
 <CardContent className="py-12 text-center">
 <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
 <p className="text-muted-foreground">No design briefs associated with this project</p>
 <Link href="/design/briefs/new">
 <Button variant="outline" size="sm" className="mt-4">
 Create Brief
 </Button>
 </Link>
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
 <CardContent className="py-12 text-center">
 <div className="flex justify-center mb-4">
 <Image className="h-12 w-12 text-muted-foreground" aria-label="No mood boards icon" />
 </div>
 <p className="text-muted-foreground">No mood boards created for this project</p>
 <Button variant="outline" size="sm" className="mt-4">
 Create Mood Board
 </Button>
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
 <CardContent className="py-12 text-center">
 <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
 <p className="text-muted-foreground">No documents uploaded</p>
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
 <div key={revision.id} className="flex items-start gap-3 p-3 border rounded">
 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
 <Layers className="h-4 w-4 text-blue-600" />
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
 ))}
 </div>
 </CardContent>
 </Card>
 ) : (
 <Card>
 <CardContent className="py-12 text-center">
 <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
 <p className="text-muted-foreground">No revisions recorded</p>
 </CardContent>
 </Card>
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}
