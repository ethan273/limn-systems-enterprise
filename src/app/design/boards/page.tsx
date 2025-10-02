"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Image as ImageIcon, Share2 } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function MoodBoardsPage() {
 const [typeFilter, setTypeFilter] = useState<string>("all");
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const { user, loading: authLoading } = useAuthContext();
 const router = useRouter();

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const { data, isLoading } = api.moodBoards.getAll.useQuery(
 {
 boardType: typeFilter === "all" ? undefined : typeFilter,
 status: statusFilter === "all" ? undefined : statusFilter,
 limit: 50,
 },
 { enabled: !authLoading && !!user }
 );

 const filteredBoards = data?.boards || [];

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'draft':
 return <Badge variant="outline" className="badge-neutral">Draft</Badge>;
 case 'active':
 return <Badge variant="outline" className="badge-primary">Active</Badge>;
 case 'approved':
 return <Badge variant="outline" className="badge-success">Approved</Badge>;
 case 'archived':
 return <Badge variant="outline" className="badge-warning">Archived</Badge>;
 default:
 return <Badge variant="outline" className="badge-neutral">{status}</Badge>;
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
 <h1 className="text-3xl font-bold">Mood Boards</h1>
 <p className="text-muted-foreground">
 Create and manage mood boards for design inspiration
 </p>
 </div>
 <Button>
 <Plus className="mr-2 h-4 w-4" />
 Create Board
 </Button>
 </div>

 {/* Filters */}
 <div className="flex gap-4 filters-section">
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search boards..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 w-full"
 />
 </div>
 </div>
 <Select value={typeFilter} onValueChange={setTypeFilter}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Filter by type" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Types</SelectItem>
 <SelectItem value="mood">Mood</SelectItem>
 <SelectItem value="material">Material</SelectItem>
 <SelectItem value="color">Color</SelectItem>
 <SelectItem value="concept">Concept</SelectItem>
 </SelectContent>
 </Select>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Filter by status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="active">Active</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="archived">Archived</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Summary Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <ImageIcon className="h-4 w-4" />
 <span>Total Boards</span>
 </div>
 <div className="text-2xl font-bold">{filteredBoards.length}</div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <ImageIcon className="h-4 w-4" />
 <span>Active</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredBoards.filter((b: any) => b.status === 'active').length}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Share2 className="h-4 w-4" />
 <span>Shared</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredBoards.filter((b: any) => b.is_shared).length}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <ImageIcon className="h-4 w-4" />
 <span>Approved</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredBoards.filter((b: any) => b.status === 'approved').length}
 </div>
 </div>
 </div>

 {/* Boards Grid */}
 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading mood boards...</p>
 </div>
 </div>
 ) : filteredBoards.length === 0 ? (
 <Card>
 <CardContent className="py-12 text-center">
 <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
 <p className="text-muted-foreground mb-4">No mood boards found</p>
 <Button variant="outline">
 <Plus className="mr-2 h-4 w-4" />
 Create your first board
 </Button>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredBoards.map((board: any) => (
 <Card key={board.id} className="overflow-hidden hover:shadow-lg transition-shadow">
 <Link href={`/design/boards/${board.id}`}>
 <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
 {board.images && Array.isArray(board.images) && board.images.length > 0 ? (
 <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
 {board.images.slice(0, 4).map((img: any, index: number) => (
 <div key={index} className="card rounded"></div>
 ))}
 </div>
 ) : (
 <ImageIcon className="h-12 w-12 text-secondary" />
 )}
 </div>
 </Link>
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <CardTitle className="text-lg line-clamp-1">{board.name}</CardTitle>
 <CardDescription className="line-clamp-2">
 {board.description || "No description"}
 </CardDescription>
 </div>
 {board.is_shared && (
 <Share2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
 )}
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Type</span>
 <Badge variant="outline" className="capitalize">{board.board_type}</Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Status</span>
 {getStatusBadge(board.status)}
 </div>
 {board.design_projects && (
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Project</span>
 <span className="text-sm font-medium line-clamp-1">
 {board.design_projects.project_name}
 </span>
 </div>
 )}
 {board.designers && (
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Designer</span>
 <span className="text-sm font-medium">{board.designers.name}</span>
 </div>
 )}
 <Link href={`/design/boards/${board.id}`} className="block">
 <Button variant="outline" size="sm" className="w-full mt-2">
 View Board
 </Button>
 </Link>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
