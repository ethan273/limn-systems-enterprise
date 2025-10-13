"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Grid, List, Calendar, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { CreateFromTemplateDialog } from "@/components/design-boards/CreateFromTemplateDialog";

// Design Boards list page with grid/list views
export default function DesignBoardsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Fetch boards - user authentication handled by middleware, user_id extracted from session in tRPC
  const { data, isLoading } = api.designBoards.boards.getMyBoards.useQuery({
    limit: 50,
    offset: 0,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Create board mutation
  const createBoardMutation = api.designBoards.boards.create.useMutation({
    onSuccess: (newBoard) => {
      toast.success("Board created successfully");
      router.push(`/design/boards/${newBoard.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create board: ${error.message}`);
    },
  });

  const boards = data?.items || [];

  // Filter boards by search term
  const filteredBoards = boards.filter((board) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      board.name.toLowerCase().includes(searchLower) ||
      board.description?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateBoard = () => {
    createBoardMutation.mutate({
      name: "Untitled Board",
      description: "",
      board_type: "freeform",
      status: "active",
    });
  };

  const handleOpenBoard = (boardId: string) => {
    router.push(`/design/boards/${boardId}`);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Design Boards</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Design Boards</h1>
          <p className="page-description">
            Collaborative whiteboards for brainstorming, design reviews, and team collaboration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Use Template
          </Button>
          <Button onClick={handleCreateBoard} disabled={createBoardMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            {createBoardMutation.isPending ? "Creating..." : "New Board"}
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Boards</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="template">Templates</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Board List */}
      {filteredBoards.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No boards yet"
          description="Create your first board to start collaborating with your team"
          action={{
            label: "Create Board",
            onClick: handleCreateBoard,
          }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBoards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpenBoard(board.id)}
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {board.thumbnail_url ? (
                  <img
                    src={board.thumbnail_url}
                    alt={board.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl text-primary/20 font-bold">
                    {board.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Status Badge */}
                {board.status !== "active" && (
                  <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium">
                    {board.status}
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="truncate">{board.name}</CardTitle>
                {board.description && (
                  <CardDescription className="line-clamp-2">
                    {board.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{board.board_collaborators?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {board.last_activity_at
                        ? new Date(board.last_activity_at).toLocaleDateString()
                        : "No activity"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBoards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenBoard(board.id)}
            >
              <div className="flex items-center p-4 gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded flex items-center justify-center flex-shrink-0">
                  {board.thumbnail_url ? (
                    <img
                      src={board.thumbnail_url}
                      alt={board.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-2xl text-primary/20 font-bold">
                      {board.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{board.name}</h3>
                  {board.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {board.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{board.board_collaborators?.length || 0} collaborators</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {board.last_activity_at
                          ? new Date(board.last_activity_at).toLocaleDateString()
                          : "No activity"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                {board.status !== "active" && (
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-xs font-medium">
                    {board.status}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create from Template Dialog */}
      <CreateFromTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        userId={user?.id || ""}
      />
    </div>
  );
}
