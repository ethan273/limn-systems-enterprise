"use client";

import { use,  useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { EditableFieldGroup, EditableField } from "@/components/common/EditableField";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Layers, Briefcase, User, Edit, Check, X, Target, MessageSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

const PROJECT_TYPES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'textile', label: 'Textile' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'accessory', label: 'Accessory' },
];

const PROJECT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function DesignProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
 const router = useRouter();
 const { user, loading: authLoading } = useAuthContext();
 const [isEditing, setIsEditing] = useState(false);
 const [formData, setFormData] = useState({
   project_name: '',
   project_code: '',
   description: '',
   project_type: 'furniture',
   priority: 'medium',
   target_launch_date: '',
   budget: 0,
   next_action: '',
 });

 // Auth is handled by middleware - no client-side redirect needed

 const { data: project, isLoading } = api.designProjects.getById.useQuery(
 { id: id },
 { enabled: !authLoading && !!user && !!id }
 );

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Sync formData with fetched project data
 useEffect(() => {
   if (project) {
     setFormData({
       project_name: project.project_name || '',
       project_code: project.project_code || '',
       description: project.description || '',
       project_type: project.project_type || 'furniture',
       priority: project.priority || 'medium',
       target_launch_date: project.target_launch_date ? format(new Date(project.target_launch_date), "yyyy-MM-dd") : '',
       budget: project.budget ? Number(project.budget) : 0,
       next_action: project.next_action || '',
     });
   }
 }, [project]);

 // Update mutation
 const updateMutation = api.designProjects.update.useMutation({
   onSuccess: () => {
     toast({
       title: "Success",
       description: "Design project updated successfully",
     });
     setIsEditing(false);
     // Invalidate queries for instant updates
     utils.designProjects.getById.invalidate({ id });
     utils.designProjects.getAll.invalidate();
   },
   onError: (error) => {
     toast({
       title: "Error",
       description: error.message || "Failed to update design project",
       variant: "destructive",
     });
   },
 });

 const handleSave = () => {
   if (!formData.project_name) {
     toast({
       title: "Error",
       description: "Project name is required",
       variant: "destructive",
     });
     return;
   }

   updateMutation.mutate({
     id: id,
     project_name: formData.project_name,
     project_code: formData.project_code || undefined,
     description: formData.description || undefined,
     project_type: formData.project_type,
     priority: formData.priority,
     target_launch_date: formData.target_launch_date || undefined,
     budget: formData.budget || undefined,
     next_action: formData.next_action || undefined,
   });
 };

 const handleCancel = () => {
   if (project) {
     setFormData({
       project_name: project.project_name || '',
       project_code: project.project_code || '',
       description: project.description || '',
       project_type: project.project_type || 'furniture',
       priority: project.priority || 'medium',
       target_launch_date: project.target_launch_date ? format(new Date(project.target_launch_date), "yyyy-MM-dd") : '',
       budget: project.budget ? Number(project.budget) : 0,
       next_action: project.next_action || '',
     });
   }
   setIsEditing(false);
 };

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
 actions={
   isEditing
     ? [
         { label: 'Cancel', icon: X, onClick: handleCancel },
         { label: 'Save Changes', icon: Check, onClick: handleSave },
       ]
     : [
         { label: 'Edit Project', icon: Edit, onClick: () => setIsEditing(true) },
       ]
 }
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
 <EditableFieldGroup title="Project Details" isEditing={isEditing}>
   <EditableField
     label="Project Name"
     value={formData.project_name}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, project_name: value })}
     required
     icon={Briefcase}
   />
   <EditableField
     label="Project Code"
     value={formData.project_code}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, project_code: value })}
     type="text"
   />
   <EditableField
     label="Description"
     value={formData.description}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, description: value })}
     type="textarea"
   />
   <EditableField
     label="Designer"
     value={project.designers?.name || "Not assigned"}
     isEditing={false}
     icon={User}
   />
   <EditableField
     label="Collection"
     value={project.furniture_collections?.name || "—"}
     isEditing={false}
     icon={Layers}
   />
   <EditableField
     label="Project Type"
     value={formData.project_type}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, project_type: value })}
     type="select"
     options={PROJECT_TYPES}
   />
   <EditableField
     label="Priority"
     value={formData.priority}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, priority: value })}
     type="select"
     options={PROJECT_PRIORITIES}
     icon={Target}
   />
   <EditableField
     label="Days in Stage"
     value={`${project.days_in_stage || 0} days`}
     isEditing={false}
   />
 </EditableFieldGroup>

 {/* Timeline & Budget */}
 <EditableFieldGroup title="Timeline & Budget" isEditing={isEditing}>
   <EditableField
     label="Target Launch"
     value={formData.target_launch_date}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, target_launch_date: value })}
     type="date"
     icon={Calendar}
   />
   <EditableField
     label="Budget"
     value={String(formData.budget || 0)}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, budget: parseFloat(value) || 0 })}
     type="text"
     icon={DollarSign}
   />
   <EditableField
     label="Next Action"
     value={formData.next_action}
     isEditing={isEditing}
     onChange={(value) => setFormData({ ...formData, next_action: value })}
     type="textarea"
     icon={MessageSquare}
   />
 </EditableFieldGroup>
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
