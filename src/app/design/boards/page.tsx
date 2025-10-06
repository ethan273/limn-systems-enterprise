"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatsGrid,
  EmptyState,
  LoadingState,
  type StatItem,
} from "@/components/common";
import { Plus, Image as ImageIcon, Share2 } from "lucide-react";
import Link from "next/link";
import { CreateMoodBoardModal } from "@/components/design/CreateMoodBoardModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function MoodBoardsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
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

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Boards',
      value: filteredBoards.length,
      description: 'All mood boards',
      icon: ImageIcon,
      iconColor: 'primary',
    },
    {
      title: 'Active',
      value: filteredBoards.filter((b: any) => b.status === 'active').length,
      description: 'Currently active',
      icon: ImageIcon,
      iconColor: 'info',
    },
    {
      title: 'Shared',
      value: filteredBoards.filter((b: any) => b.is_shared).length,
      description: 'Shared boards',
      icon: Share2,
      iconColor: 'success',
    },
    {
      title: 'Approved',
      value: filteredBoards.filter((b: any) => b.status === 'approved').length,
      description: 'Finalized',
      icon: ImageIcon,
      iconColor: 'success',
    },
  ];

  if (authLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Mood Boards"
        subtitle="Create and manage mood boards for design inspiration"
        actions={[
          {
            label: 'Create Board',
            icon: Plus,
            onClick: () => setCreateModalOpen(true),
          },
        ]}
      />

      {/* Filters */}
      <Card className="card">
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper flex-1">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="filter-select w-[180px]">
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
              <SelectTrigger className="filter-select w-[180px]">
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
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <StatsGrid stats={stats} columns={4} />

      {/* Boards Grid */}
      {isLoading ? (
        <LoadingState message="Loading mood boards..." size="lg" />
      ) : filteredBoards.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No mood boards found"
          description="Create your first mood board to get started."
          action={{
            label: 'Create Board',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board: any) => (
            <Card key={board.id} className="mood-board-card">
              <Link href={`/design/boards/${board.id}`}>
                <div className="mood-board-preview">
                  {board.images && Array.isArray(board.images) && board.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                      {board.images.slice(0, 4).map((img: any, index: number) => (
                        <div key={index} className="mood-board-thumbnail">
                          {img.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img.url}
                              alt={img.title || `Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                    <Share2 className="h-4 w-4 text-info flex-shrink-0" />
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

      {/* Create Modal */}
      <CreateMoodBoardModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
