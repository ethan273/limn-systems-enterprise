"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Users, Download, Settings, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { DrawingToolbar } from "@/components/design-boards/DrawingToolbar";
import { PropertiesPanel } from "@/components/design-boards/PropertiesPanel";
import { LayersPanel } from "@/components/design-boards/LayersPanel";
import { BoardSettingsDialog } from "@/components/design-boards/BoardSettingsDialog";
import { BoardShareDialog } from "@/components/design-boards/BoardShareDialog";
import { DocumentUploadDialog } from "@/components/design-boards/DocumentUploadDialog";
import * as fabric from "fabric";

// Dynamically import heavy canvas component
const DesignBoardCanvas = dynamic(
  () => import("@/components/design-boards/DesignBoardCanvas").then((mod) => mod.DesignBoardCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ),
  }
);
import { useBoardStore } from "@/lib/design-boards/board-store";
import { exportToPNG, exportToSVG, exportToJSON } from "@/lib/design-boards/export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DesignBoardEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Get current user from tRPC (standardized auth pattern)
  const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
  const userId = currentUser?.id || "";

  const [boardName, setBoardName] = useState("Untitled Board");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);

  // Get selected objects and theme from Zustand store
  const { selectedObjects, theme } = useBoardStore();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Fetch board data
  const { data: boardData, isLoading } = api.designBoards.boards.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const board = boardData?.board;

  // Update board name when data loads
  useEffect(() => {
    if (board?.name) {
      setBoardName(board.name);
    }
  }, [board]);

  // Update board mutation
  const updateBoardMutation = api.designBoards.boards.update.useMutation({
    onSuccess: () => {
      toast.success("Board saved successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Failed to save board: ${error.message}`);
      setIsSaving(false);
    },
  });

  const handleSaveBoard = (_canvasData: any) => {
    if (!id) return;

    setIsSaving(true);
    updateBoardMutation.mutate({
      id,
      data: {
        name: boardName,
        updated_at: new Date(),
      },
    });
  };

  const handleUpdateBoardName = () => {
    if (!id || !boardName.trim()) return;

    updateBoardMutation.mutate({
      id,
      data: {
        name: boardName.trim(),
      },
    });
    setIsEditingName(false);
  };

  const handleBack = () => {
    router.push("/design/boards");
  };

  const handleExportPNG = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }
    exportToPNG(canvas, `${boardName}.png`);
    toast.success("Exported as PNG");
  };

  const handleExportSVG = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }
    exportToSVG(canvas, `${boardName}.svg`);
    toast.success("Exported as SVG");
  };

  const handleExportJSON = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }
    exportToJSON(canvas, `${boardName}.json`);
    toast.success("Exported as JSON");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-8">
        <h1 className="text-2xl font-bold mb-4">Board Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The board you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Boards
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background z-50">
        {/* Left: Back Button & Board Name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="h-6 w-px bg-border" />

          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onBlur={handleUpdateBoardName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateBoardName();
                  if (e.key === "Escape") {
                    setBoardName(board.name);
                    setIsEditingName(false);
                  }
                }}
                className="h-8 w-64"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-lg font-semibold hover:text-primary transition-colors"
            >
              {boardName}
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsDocumentUploadOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Upload
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Share
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!canvas}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPNG}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSVG}>
                Export as SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => handleSaveBoard({})}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Drawing Toolbar */}
      <DrawingToolbar canvas={canvas} />

      {/* Canvas Area with Properties Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <DesignBoardCanvas
            boardId={id}
            userId={userId}
            board={board}
            onCanvasReady={setCanvas}
          />
        </div>

        {/* Right Sidebar: Properties & Layers */}
        <div className="w-96 flex-shrink-0 border-l bg-background overflow-y-auto p-4 space-y-4">
          <PropertiesPanel
            canvas={canvas}
            selectedObjects={selectedObjects}
          />
          <LayersPanel
            canvas={canvas}
            selectedObjects={selectedObjects}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <BoardSettingsDialog
        _open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      {/* Share Dialog */}
      <BoardShareDialog
        _open={isShareOpen}
        onOpenChange={setIsShareOpen}
        boardId={id}
        boardName={boardName}
      />

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        _open={isDocumentUploadOpen}
        onOpenChange={setIsDocumentUploadOpen}
        canvas={canvas}
      />
    </div>
  );
}
