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
 Package,
 Clock,
 PackageCheck,
 Truck,
 Box,
 Weight,
 Plus,
 Search,
 AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
 className: "bg-info-muted text-info border-info",
 icon: <Package className="w-3 h-3" aria-hidden="true" />,
 },
 packed: {
 label: "Packed",
 className: "bg-success-muted text-success border-success",
 icon: <PackageCheck className="w-3 h-3" aria-hidden="true" />,
 },
 shipped: {
 label: "Shipped",
 className: "bg-primary-muted text-primary border-primary",
 icon: <Truck className="w-3 h-3" aria-hidden="true" />,
 },
};

export default function PackingJobsPage() {
 const router = useRouter();
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");

 // Fetch packing jobs
 const { data, isLoading } = api.packing.getAllJobs.useQuery({
 status: statusFilter === "all" ? undefined : statusFilter as any,
 limit: 50,
 offset: 0,
 });

 const jobs = data?.jobs || [];

 const filteredJobs = jobs.filter((job) => {
 if (!searchQuery) return true;
 const searchLower = searchQuery.toLowerCase();
 return (
 job.order_items?.description?.toLowerCase().includes(searchLower) ||
 job.tracking_number?.toLowerCase().includes(searchLower)
 );
 });

 // Statistics
 const stats = {
 total: jobs.length,
 pending: jobs.filter((j) => j.packing_status === "pending").length,
 inProgress: jobs.filter((j) => j.packing_status === "in_progress").length,
 packed: jobs.filter((j) => j.packing_status === "packed").length,
 shipped: jobs.filter((j) => j.packing_status === "shipped").length,
 };

 return (
 <div className="container mx-auto p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Packing Jobs</h1>
 <p className="text-muted-foreground">Manage packing and prepare items for shipment</p>
 </div>
 <Button onClick={() => router.push("/packing/new")}>
 <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
 New Packing Job
 </Button>
 </div>

 {/* Statistics Cards */}
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
 <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
 <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Packed</CardTitle>
 <PackageCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-success">{stats.packed}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Shipped</CardTitle>
 <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-primary">{stats.shipped}</div>
 </CardContent>
 </Card>
 </div>

 {/* Filters */}
 <Card>
 <CardHeader>
 <CardTitle>Filter Packing Jobs</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col md:flex-row gap-4">
 {/* Search */}
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
 <Input
 placeholder="Search items or tracking number..."
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
 <SelectItem value="packed">Packed</SelectItem>
 <SelectItem value="shipped">Shipped</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Packing Jobs Table */}
 <Card>
 <CardHeader>
 <CardTitle>Packing Jobs</CardTitle>
 </CardHeader>
 <CardContent>
 {isLoading ? (
 <div className="text-center py-8 text-muted-foreground">Loading packing jobs...</div>
 ) : filteredJobs.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <Package className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No packing jobs found</p>
 {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
 </div>
 ) : (
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Item Description</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Boxes</TableHead>
 <TableHead>Weight</TableHead>
 <TableHead>Priority</TableHead>
 <TableHead>Tracking</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredJobs.map((job) => {
 const config = statusConfig[job.packing_status] || statusConfig.pending;
 const packingProgress = job.quantity > 0
 ? Math.round((job.packed_quantity / job.quantity) * 100)
 : 0;

 return (
 <TableRow
 key={job.id}
 className="cursor-pointer hover:bg-muted/50"
 onClick={() => router.push(`/packing/${job.id}`)}
 >
 <TableCell>
 <div>
 <p className="font-medium">
 {job.order_items?.description || "—"}
 </p>
 {job.special_instructions && (
 <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
 <AlertCircle className="w-3 h-3" aria-hidden="true" />
 {job.special_instructions}
 </p>
 )}
 </div>
 </TableCell>
 <TableCell>
 <div>
 <p className="font-medium">
 {job.packed_quantity} / {job.quantity}
 </p>
 <p className="text-xs text-muted-foreground">
 {packingProgress}% packed
 </p>
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
 {config.icon}
 {config.label}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-1">
 <Box className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 {job._count?.packing_boxes || 0}
 </div>
 </TableCell>
 <TableCell>
 {job.total_weight ? (
 <div className="flex items-center gap-1">
 <Weight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 {Number(job.total_weight).toFixed(2)} lbs
 </div>
 ) : (
 "—"
 )}
 </TableCell>
 <TableCell>
 <Badge
 variant="outline"
 className={cn(
 "capitalize",
 job.priority === "high" && "bg-destructive-muted text-destructive border-destructive",
 job.priority === "normal" && "bg-info-muted text-info border-info",
 job.priority === "low" && "badge-neutral"
 )}
 >
 {job.priority}
 </Badge>
 </TableCell>
 <TableCell>
 {job.tracking_number ? (
 <span className="text-sm font-mono">{job.tracking_number}</span>
 ) : (
 <span className="text-sm text-muted-foreground">—</span>
 )}
 </TableCell>
 <TableCell>
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 router.push(`/packing/${job.id}`);
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
