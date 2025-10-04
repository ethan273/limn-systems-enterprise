"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Folder, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DesignProjectsPage() {
 const [stageFilter, setStageFilter] = useState<string>("all");
 const [priorityFilter, setPriorityFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const { user, loading: authLoading } = useAuthContext();
 const router = useRouter();

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const { data, isLoading } = api.designProjects.getAll.useQuery(
 {
 designStage: stageFilter === "all" ? undefined : stageFilter,
 search: searchQuery || undefined,
 limit: 50,
 },
 { enabled: !authLoading && !!user }
 );

 const filteredProjects = (data?.projects || []).filter((project: any) => {
 if (priorityFilter !== "all" && project.priority !== priorityFilter) {
 return false;
 }
 return true;
 });

 const getStageBadge = (stage: string) => {
 switch (stage) {
 case 'brief_creation':
 return <Badge variant="outline" className="badge-primary">Brief Creation</Badge>;
 case 'concept':
 return <Badge variant="outline" className="badge-primary">Concept</Badge>;
 case 'draft':
 return <Badge variant="outline" className="badge-warning">Draft</Badge>;
 case 'revision':
 return <Badge variant="outline" className="badge-warning">Revision</Badge>;
 case 'final':
 return <Badge variant="outline" className="badge-success">Final</Badge>;
 case 'approved':
 return <Badge variant="outline" className="badge-success">Approved</Badge>;
 default:
 return <Badge variant="outline" className="badge-neutral">{stage}</Badge>;
 }
 };

 const getPriorityBadge = (priority: string) => {
 switch (priority) {
 case 'low':
 return <Badge variant="outline" className="badge-neutral">Low</Badge>;
 case 'normal':
 return <Badge variant="outline" className="badge-primary">Normal</Badge>;
 case 'high':
 return <Badge variant="outline" className="badge-warning">High</Badge>;
 case 'urgent':
 return <Badge variant="outline" className="badge-error">Urgent</Badge>;
 default:
 return <Badge variant="outline" className="badge-neutral">{priority}</Badge>;
 }
 };

 if (authLoading) {
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

 if (!user) {
 return null;
 }

 return (
 <div className="container mx-auto py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Design Projects</h1>
 <p className="text-muted-foreground">
 Manage design projects from concept to final approval
 </p>
 </div>
 <Button>
 <Plus className="mr-2 h-4 w-4" />
 New Project
 </Button>
 </div>

 {/* Filters */}
 <div className="flex gap-4 filters-section">
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search by project name or code..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 w-full"
 />
 </div>
 </div>
 <Select value={stageFilter} onValueChange={setStageFilter}>
 <SelectTrigger className="w-[200px]">
 <SelectValue placeholder="Filter by stage" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Stages</SelectItem>
 <SelectItem value="brief_creation">Brief Creation</SelectItem>
 <SelectItem value="concept">Concept</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="revision">Revision</SelectItem>
 <SelectItem value="final">Final</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 </SelectContent>
 </Select>
 <Select value={priorityFilter} onValueChange={setPriorityFilter}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Filter by priority" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Priorities</SelectItem>
 <SelectItem value="low">Low</SelectItem>
 <SelectItem value="normal">Normal</SelectItem>
 <SelectItem value="high">High</SelectItem>
 <SelectItem value="urgent">Urgent</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Summary Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Folder className="h-4 w-4" />
 <span>Total Projects</span>
 </div>
 <div className="text-2xl font-bold">{filteredProjects.length}</div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Folder className="h-4 w-4" />
 <span>In Progress</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredProjects.filter((p: any) => ['concept', 'draft', 'revision'].includes(p.current_stage)).length}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <AlertCircle className="h-4 w-4" />
 <span>High Priority</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredProjects.filter((p: any) => p.priority === 'high' || p.priority === 'urgent').length}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Folder className="h-4 w-4" />
 <span>Approved</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredProjects.filter((p: any) => p.current_stage === 'approved').length}
 </div>
 </div>
 </div>

 {/* Projects Table */}
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Project Code</TableHead>
 <TableHead>Name</TableHead>
 <TableHead>Designer</TableHead>
 <TableHead>Stage</TableHead>
 <TableHead>Priority</TableHead>
 <TableHead>Target Launch</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8">Loading design projects...</TableCell>
 </TableRow>
 ) : filteredProjects.length === 0 ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8">
 <div className="space-y-2">
 <p className="text-muted-foreground">No design projects found</p>
 <Button variant="outline" size="sm">
 <Plus className="mr-2 h-4 w-4" />
 Create your first project
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredProjects.map((project: any) => (
 <TableRow key={project.id}>
 <TableCell>
 <Link href={`/design/projects/${project.id}`} className="font-medium text-info hover:underline">
 {project.project_code || "—"}
 </Link>
 </TableCell>
 <TableCell>
 <div>
 <div className="font-medium">{project.project_name}</div>
 {project.project_type && (
 <div className="text-sm text-muted-foreground">{project.project_type}</div>
 )}
 </div>
 </TableCell>
 <TableCell>{project.designers?.name || "—"}</TableCell>
 <TableCell>{getStageBadge(project.current_stage)}</TableCell>
 <TableCell>{getPriorityBadge(project.priority)}</TableCell>
 <TableCell>
 {project.target_launch_date ? (
 <div className="flex items-center gap-2 text-sm">
 <Calendar className="h-4 w-4 text-muted-foreground" />
 {new Date(project.target_launch_date).toLocaleDateString()}
 </div>
 ) : (
 "—"
 )}
 </TableCell>
 <TableCell className="text-right">
 <Link href={`/design/projects/${project.id}`}>
 <Button variant="outline" size="sm">
 View Details
 </Button>
 </Link>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}
