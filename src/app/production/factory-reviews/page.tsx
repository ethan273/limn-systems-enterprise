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
  Factory,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-300",
  },
};

export default function FactoryReviewsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch factory review sessions
  const { data, isLoading } = api.factoryReviews.getAllSessions.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
    offset: 0,
  });

  const sessions = data?.sessions || [];

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      session.session_name.toLowerCase().includes(searchLower) ||
      session.prototype_production?.prototype?.name.toLowerCase().includes(searchLower) ||
      session.location?.toLowerCase().includes(searchLower)
    );
  });

  // Statistics
  const stats = {
    total: sessions.length,
    scheduled: sessions.filter((s) => s.status === "scheduled").length,
    inProgress: sessions.filter((s) => s.status === "in_progress").length,
    completed: sessions.filter((s) => s.status === "completed").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Factory Reviews</h1>
          <p className="text-muted-foreground">On-site prototype inspection sessions</p>
        </div>
        <Button onClick={() => router.push("/factory-reviews/new")}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          New Review Session
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                <Input
                  placeholder="Search sessions, prototypes, or locations..."
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Review Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Factory className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>No factory review sessions found</p>
              {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Prototype</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const config = statusConfig[session.status] || statusConfig.scheduled;
                    return (
                      <TableRow
                        key={session.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/factory-reviews/${session.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{session.session_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Review #{session.session_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {session.prototype_production?.prototype?.name || "—"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {session.prototype_production?.prototype?.prototype_number || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(session.review_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                            {session.location || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(config.className)}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            {session._count?.photos || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            {session._count?.comments || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/factory-reviews/${session.id}`);
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
