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
import { Search, Plus, FileText, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DesignBriefsPage() {
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const { user, loading: authLoading } = useAuthContext();
 const router = useRouter();

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const { data, isLoading } = api.designBriefs.getAll.useQuery(
 {
 status: statusFilter === "all" ? undefined : statusFilter,
 search: searchQuery || undefined,
 limit: 50,
 },
 { enabled: !authLoading && !!user }
 );

 const filteredBriefs = data?.briefs || [];

 const getStatusBadge = (brief: any) => {
 const hasProject = !!brief.design_projects;
 const isApproved = !!brief.approved_by;

 if (!hasProject) {
 return <Badge variant="outline" className="badge-neutral">Draft</Badge>;
 }
 if (!isApproved) {
 return <Badge variant="outline" className="badge-warning">Submitted</Badge>;
 }

 const stage = brief.design_projects?.current_stage;
 switch (stage) {
 case 'brief_creation':
 return <Badge variant="outline" className="badge-primary">Approved</Badge>;
 case 'concept':
 case 'draft':
 case 'revision':
 return <Badge variant="outline" className="badge-primary">In Progress</Badge>;
 case 'final':
 case 'approved':
 return <Badge variant="outline" className="badge-success">Completed</Badge>;
 default:
 return <Badge variant="outline" className="badge-primary">Approved</Badge>;
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
 <h1 className="text-3xl font-bold">Design Briefs</h1>
 <p className="text-muted-foreground">
 Manage design briefs and requirements for new product development
 </p>
 </div>
 <Link href="/design/briefs/new">
 <Button>
 <Plus className="mr-2 h-4 w-4" />
 Create Brief
 </Button>
 </Link>
 </div>

 {/* Filters */}
 <div className="flex gap-4 filters-section">
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search by title or description..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 w-full"
 />
 </div>
 </div>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[200px]">
 <SelectValue placeholder="Filter by status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="submitted">Submitted</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Summary Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>Total Briefs</span>
 </div>
 <div className="text-2xl font-bold">{filteredBriefs.length}</div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>Draft</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredBriefs.filter((b: any) => !b.design_projects).length}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>In Progress</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredBriefs.filter((b: any) =>
 b.design_projects && ['concept', 'draft', 'revision'].includes(b.design_projects.current_stage)
 ).length}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>Completed</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredBriefs.filter((b: any) =>
 b.design_projects && ['final', 'approved'].includes(b.design_projects.current_stage)
 ).length}
 </div>
 </div>
 </div>

 {/* Briefs Table */}
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Title</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Designer</TableHead>
 <TableHead>Created Date</TableHead>
 <TableHead>Target Market</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8">Loading design briefs...</TableCell>
 </TableRow>
 ) : filteredBriefs.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-8">
 <div className="space-y-2">
 <p className="text-muted-foreground">No design briefs found</p>
 <Link href="/design/briefs/new">
 <Button variant="outline" size="sm">
 <Plus className="mr-2 h-4 w-4" />
 Create your first brief
 </Button>
 </Link>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredBriefs.map((brief: any) => (
 <TableRow key={brief.id}>
 <TableCell>
 <Link href={`/design/briefs/${brief.id}`} className="font-medium text-info hover:underline">
 {brief.title}
 </Link>
 {brief.description && (
 <p className="text-sm text-muted-foreground line-clamp-1">{brief.description}</p>
 )}
 </TableCell>
 <TableCell>{getStatusBadge(brief)}</TableCell>
 <TableCell>
 {brief.design_projects?.designers?.name || "—"}
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-2 text-sm">
 <Calendar className="h-4 w-4 text-muted-foreground" />
 {brief.created_at ? new Date(brief.created_at).toLocaleDateString() : "—"}
 </div>
 </TableCell>
 <TableCell>
 {brief.target_market || "—"}
 </TableCell>
 <TableCell className="text-right">
 <Link href={`/design/briefs/${brief.id}`}>
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
