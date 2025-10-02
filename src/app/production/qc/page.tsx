"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 ClipboardCheck,
 AlertCircle,
 CheckCircle2,
 Clock,
 Camera,
 Plus,
 Search,
 XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
 pending: {
 label: "Pending",
 className: "badge-neutral",
 icon: <Clock className="w-3 h-3" aria-hidden="true" />,
 },
 in_progress: {
 label: "In Progress",
 className: "bg-blue-100 text-blue-800 border-blue-300",
 icon: <ClipboardCheck className="w-3 h-3" aria-hidden="true" />,
 },
 passed: {
 label: "Passed",
 className: "bg-green-100 text-green-800 border-green-300",
 icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
 },
 failed: {
 label: "Failed",
 className: "bg-red-100 text-red-800 border-red-300",
 icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
 },
 on_hold: {
 label: "On Hold",
 className: "bg-yellow-100 text-yellow-800 border-yellow-300",
 icon: <AlertCircle className="w-3 h-3" aria-hidden="true" />,
 },
};

export default function QCInspectionsPage() {
 const router = useRouter();
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");

 // Fetch QC inspections
 const { data, isLoading } = api.qc.getAllInspections.useQuery({
 status: statusFilter === "all" ? undefined : statusFilter as any,
 limit: 50,
 offset: 0,
 });

 const inspections = data?.inspections || [];

 const filteredInspections = inspections.filter((inspection) => {
 if (!searchQuery) return true;
 const searchLower = searchQuery.toLowerCase();
 return (
 inspection.prototype_production?.prototype?.name.toLowerCase().includes(searchLower) ||
 inspection.production_items?.item_name.toLowerCase().includes(searchLower) ||
 inspection.batch_id?.toLowerCase().includes(searchLower)
 );
 });

 // Statistics
 const stats = {
 total: inspections.length,
 pending: inspections.filter((i) => i.status === "pending").length,
 inProgress: inspections.filter((i) => i.status === "in_progress").length,
 passed: inspections.filter((i) => i.status === "passed").length,
 failed: inspections.filter((i) => i.status === "failed").length,
 };

 return (
 <div className="container mx-auto p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Quality Control</h1>
 <p className="text-muted-foreground">Mobile QC inspections and defect tracking</p>
 </div>
 <Button onClick={() => router.push("/qc/new")}>
 <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
 New Inspection
 </Button>
 </div>

 {/* Statistics Cards */}
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total</CardTitle>
 <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stats.total}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Pending</CardTitle>
 <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold ">{stats.pending}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">In Progress</CardTitle>
 <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Passed</CardTitle>
 <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Failed</CardTitle>
 <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
 </CardContent>
 </Card>
 </div>

 {/* Filters */}
 <Card>
 <CardHeader>
 <CardTitle>Filter Inspections</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col md:flex-row gap-4">
 {/* Search */}
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
 <Input
 placeholder="Search prototypes, items, or batch ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10"
 />
 </div>
 </div>

 {/* Status Filter */}
 <div className="w-full md:w-[200px]">
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger>
 <SelectValue placeholder="Filter by status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="pending">Pending</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="passed">Passed</SelectItem>
 <SelectItem value="failed">Failed</SelectItem>
 <SelectItem value="on_hold">On Hold</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Inspections Table */}
 <Card>
 <CardHeader>
 <CardTitle>QC Inspections</CardTitle>
 </CardHeader>
 <CardContent>
 {isLoading ? (
 <div className="text-center py-8 text-muted-foreground">Loading inspections...</div>
 ) : filteredInspections.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No QC inspections found</p>
 {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
 </div>
 ) : (
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Item/Prototype</TableHead>
 <TableHead>QC Stage</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Defects</TableHead>
 <TableHead>Photos</TableHead>
 <TableHead>Priority</TableHead>
 <TableHead>Started</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredInspections.map((inspection) => {
 const config = statusConfig[inspection.status] || statusConfig.pending;
 return (
 <TableRow
 key={inspection.id}
 className="cursor-pointer hover:bg-muted/50"
 onClick={() => router.push(`/qc/${inspection.id}`)}
 >
 <TableCell>
 <div>
 <p className="font-medium">
 {inspection.prototype_production?.prototype?.name ||
 inspection.production_items?.item_name ||
 "—"}
 </p>
 {inspection.prototype_production && (
 <p className="text-sm text-muted-foreground">
 {inspection.prototype_production.prototype?.prototype_number}
 </p>
 )}
 {inspection.batch_id && (
 <p className="text-sm text-muted-foreground">
 Batch: {inspection.batch_id}
 </p>
 )}
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="outline" className="capitalize">
 {inspection.qc_stage.replace(/_/g, " ")}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
 {config.icon}
 {config.label}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-1">
 <AlertCircle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 {inspection._count?.qc_defects || 0}
 </div>
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-1">
 <Camera className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 {inspection._count?.qc_photos || 0}
 </div>
 </TableCell>
 <TableCell>
 <Badge
 variant="outline"
 className={cn(
 "capitalize",
 inspection.priority === "high" && "bg-red-100 text-red-800 border-red-300",
 inspection.priority === "normal" && "bg-blue-100 text-blue-800 border-blue-300",
 inspection.priority === "low" && "badge-neutral"
 )}
 >
 {inspection.priority}
 </Badge>
 </TableCell>
 <TableCell>
 {inspection.started_at
 ? format(new Date(inspection.started_at), "MMM d, yyyy")
 : "—"}
 </TableCell>
 <TableCell>
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 router.push(`/qc/${inspection.id}`);
 }}
 >
 View
 </Button>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
