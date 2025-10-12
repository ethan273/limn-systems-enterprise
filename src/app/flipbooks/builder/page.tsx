"use client";

import { features } from "@/lib/features";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ArrowLeft, Upload, Save, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState } from "@/components/common";
import { FileUploader } from "@/components/flipbooks/FileUploader";
import { PageCanvas } from "@/components/flipbooks/PageCanvas";
import { SortablePageList } from "@/components/flipbooks/SortablePageList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Flipbook Builder Page
 *
 * Edit flipbook content, add pages, create hotspots, and configure settings.
 * Supports both creating new flipbooks and editing existing ones.
 *
 * FEATURE FLAG: Only accessible when features.flipbooks is enabled
 */
export default function FlipbookBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flipbookId = searchParams.get("id");

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");

  // Redirect if feature is disabled
  useEffect(() => {
    if (!features.flipbooks) {
      router.push("/");
    }
  }, [router]);

  // Don't render if feature is disabled
  if (!features.flipbooks) {
    return null;
  }

  // Query flipbook if editing
  const { data: flipbook, isLoading, refetch } = api.flipbooks.get.useQuery(
    { id: flipbookId! },
    { enabled: !!flipbookId }
  );

  // Mutations
  const updateFlipbook = api.flipbooks.update.useMutation({
    onSuccess: () => {
      toast.success("Flipbook updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update flipbook: ${error.message}`);
    },
  });

  const deletePage = api.flipbooks.deletePage.useMutation({
    onSuccess: () => {
      toast.success("Page deleted");
      refetch();
      setSelectedPageId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete page: ${error.message}`);
    },
  });

  const reorderPages = api.flipbooks.reorderPages.useMutation({
    onSuccess: () => {
      toast.success("Pages reordered");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reorder pages: ${error.message}`);
    },
  });

  const createHotspot = api.flipbooks.createHotspot.useMutation({
    onSuccess: () => {
      toast.success("Hotspot created");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create hotspot: ${error.message}`);
    },
  });

  const updateHotspot = api.flipbooks.updateHotspot.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update hotspot: ${error.message}`);
    },
  });

  const deleteHotspot = api.flipbooks.deleteHotspot.useMutation({
    onSuccess: () => {
      toast.success("Hotspot deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete hotspot: ${error.message}`);
    },
  });

  // Initialize form values from flipbook data
  useEffect(() => {
    if (flipbook) {
      setTitle(flipbook.title);
      setDescription(flipbook.description || "");
      setStatus(flipbook.status as any);
    }
  }, [flipbook]);

  // Handle save
  const handleSave = () => {
    if (!flipbookId) return;

    updateFlipbook.mutate({
      id: flipbookId,
      title,
      description,
      status,
    });
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    setUploadDialogOpen(false);
    refetch();
    toast.success("Upload complete! Refresh to see new pages.");
  };

  // Handle page reorder
  const handlePageReorder = (pageIds: string[]) => {
    if (!flipbookId) return;
    reorderPages.mutate({
      flipbookId,
      pageIds,
    });
  };

  // Handle page delete
  const handlePageDelete = (pageId: string) => {
    deletePage.mutate({ pageId });
  };

  // Handle hotspot creation
  const handleHotspotCreate = (hotspot: any) => {
    if (!selectedPageId) {
      toast.error("Please select a page first");
      return;
    }

    // For demo, use a placeholder product ID
    // In production, this would open a product selector dialog
    const demoProductId = "00000000-0000-0000-0000-000000000001";

    createHotspot.mutate({
      pageId: selectedPageId,
      productId: demoProductId,
      xPercent: hotspot.xPercent,
      yPercent: hotspot.yPercent,
      width: hotspot.width,
      height: hotspot.height,
    });
  };

  // Handle hotspot update
  const handleHotspotUpdate = (hotspotId: string, updates: any) => {
    updateHotspot.mutate({
      hotspotId,
      ...updates,
    });
  };

  // Handle hotspot delete
  const handleHotspotDelete = (hotspotId: string) => {
    deleteHotspot.mutate({ hotspotId });
  };

  if (isLoading && flipbookId) {
    return <LoadingState message="Loading flipbook..." size="lg" />;
  }

  const selectedPage = flipbook?.pages?.find((p: any) => p.id === selectedPageId);

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title={flipbookId ? `Edit: ${flipbook?.title || 'Flipbook'}` : "New Flipbook"}
        subtitle="Upload pages, add hotspots, and configure settings"
        actions={[
          {
            label: 'Back to Library',
            icon: ArrowLeft,
            variant: 'outline',
            onClick: () => router.push("/flipbooks"),
          },
          {
            label: 'Preview',
            icon: Eye,
            variant: 'outline',
            onClick: () => router.push(`/flipbooks/${flipbookId}`),
            disabled: !flipbookId,
          },
          {
            label: 'Save',
            icon: Save,
            onClick: handleSave,
            disabled: !flipbookId || updateFlipbook.isPending,
          },
        ]}
      />

      {/* Builder Interface */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Pages List */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Pages</h2>
            {flipbook?.pages && flipbook.pages.length > 0 ? (
              <SortablePageList
                pages={flipbook.pages}
                selectedPageId={selectedPageId}
                onPageSelect={setSelectedPageId}
                onPageReorder={handlePageReorder}
                onPageDelete={handlePageDelete}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No pages yet</p>
            )}
          </div>

          {/* Upload Section */}
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Upload</h2>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <div className="space-y-2">
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline" size="sm" disabled={!flipbookId}>
                    <FileText className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline" size="sm" disabled={!flipbookId}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Images
                  </Button>
                </DialogTrigger>
              </div>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Upload a PDF or images to create flipbook pages
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="pdf" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pdf">PDF</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf" className="mt-4">
                    <FileUploader
                      flipbookId={flipbookId!}
                      type="pdf"
                      onUploadComplete={handleUploadComplete}
                    />
                  </TabsContent>

                  <TabsContent value="images" className="mt-4">
                    <FileUploader
                      flipbookId={flipbookId!}
                      type="images"
                      onUploadComplete={handleUploadComplete}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {!flipbookId && (
              <p className="text-xs text-muted-foreground mt-3">
                Save your flipbook first to enable uploads
              </p>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="col-span-6">
          <PageCanvas
            page={selectedPage}
            onHotspotCreate={handleHotspotCreate}
            onHotspotUpdate={handleHotspotUpdate}
            onHotspotDelete={handleHotspotDelete}
            editable={true}
            className="h-[700px]"
          />
        </div>

        {/* Right Sidebar - Properties */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Properties</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Flipbook title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {selectedPage && (
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">Page Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Number:</span>
                  <span className="font-medium">{selectedPage.page_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hotspots:</span>
                  <span className="font-medium">{selectedPage.hotspots?.length || 0}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Quick Tips</h2>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>• Drag pages to reorder them</li>
              <li>• Click "Add Hotspot" then click on the page</li>
              <li>• Drag hotspots to reposition</li>
              <li>• Select page to view/edit hotspots</li>
              <li>• Save frequently to keep changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
