"use client";

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic';

import { features } from "@/lib/features";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api/client";
import { ArrowLeft, Save, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState } from "@/components/common";
import { FileUploader } from "@/components/flipbooks/FileUploader";
import { PageCanvas } from "@/components/flipbooks/PageCanvas";
import { SortablePageList } from "@/components/flipbooks/SortablePageList";
import { ProductPicker } from "@/components/flipbooks/ProductPicker";
import { TOCBuilder } from "@/components/flipbooks/builder/TOCBuilder";
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
 * Flipbook Builder Page Content
 *
 * Edit flipbook content, add pages, create hotspots, and configure settings.
 * Supports both creating new flipbooks and editing existing ones.
 *
 * FEATURE FLAG: Only accessible when features.flipbooks is enabled
 */
function FlipbookBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flipbookId = searchParams.get("id");

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");

  // Query flipbook if editing
  const { data: flipbook, isLoading } = api.flipbooks.get.useQuery(
    { id: flipbookId! },
    { enabled: !!flipbookId && features.flipbooks }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Mutations
  const updateFlipbook = api.flipbooks.update.useMutation({
    onSuccess: () => {
      toast.success("Flipbook updated successfully");
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update flipbook: ${error.message}`);
    },
  });

  const deletePage = api.flipbooks.deletePage.useMutation({
    onSuccess: () => {
      toast.success("Page deleted");
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
      setSelectedPageId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete page: ${error.message}`);
    },
  });

  const reorderPages = api.flipbooks.reorderPages.useMutation({
    onSuccess: () => {
      toast.success("Pages reordered");
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to reorder pages: ${error.message}`);
    },
  });

  const createHotspot = api.flipbooks.createHotspot.useMutation({
    onSuccess: () => {
      toast.success("Hotspot created");
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create hotspot: ${error.message}`);
    },
  });

  const updateHotspot = api.flipbooks.updateHotspot.useMutation({
    onSuccess: () => {
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update hotspot: ${error.message}`);
    },
  });

  const deleteHotspot = api.flipbooks.deleteHotspot.useMutation({
    onSuccess: () => {
      toast.success("Hotspot deleted");
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
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
    // Invalidate queries for instant updates
    utils.flipbooks.get.invalidate();
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

  // Handle hotspot creation - open product picker
  const handleHotspotCreate = (hotspot: any) => {
    if (!selectedPageId) {
      toast.error("Please select a page first");
      return;
    }

    // Store pending hotspot data and open product picker
    setPendingHotspot(hotspot);
    setProductPickerOpen(true);
  };

  // Handle product selection from picker
  const handleProductSelect = (productId: string) => {
    if (!pendingHotspot || !selectedPageId) return;

    createHotspot.mutate({
      pageId: selectedPageId,
      productId,
      xPercent: pendingHotspot.xPercent,
      yPercent: pendingHotspot.yPercent,
      width: pendingHotspot.width,
      height: pendingHotspot.height,
    });

    setPendingHotspot(null);
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
      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pages">Pages & Hotspots</TabsTrigger>
          <TabsTrigger value="toc">Table of Contents</TabsTrigger>
        </TabsList>

        {/* Pages & Hotspots Tab */}
        <TabsContent value="pages">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Pages List */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Pages</h2>
            {flipbook?.pages && flipbook.pages.length > 0 ? (
              <SortablePageList
                pages={flipbook.pages as any}
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
            page={selectedPage as any}
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
              <li>• Click &quot;Add Hotspot&quot; then click on the page</li>
              <li>• Drag hotspots to reposition</li>
              <li>• Select page to view/edit hotspots</li>
              <li>• Save frequently to keep changes</li>
            </ul>
          </div>
        </div>
      </div>
        </TabsContent>

        {/* Table of Contents Tab */}
        <TabsContent value="toc">
          {flipbookId ? (
            <TOCBuilder flipbookId={flipbookId} />
          ) : (
            <div className="bg-card rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                Save your flipbook first to manage table of contents
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Picker Dialog */}
      <ProductPicker
        open={productPickerOpen}
        onClose={() => {
          setProductPickerOpen(false);
          setPendingHotspot(null);
        }}
        onSelect={handleProductSelect}
      />
    </div>
  );
}

/**
 * Flipbook Builder Page - Wrapper with Suspense
 * Wraps the content in Suspense to handle useSearchParams() correctly
 */
export default function FlipbookBuilderPage() {
  // Feature check before Suspense
  if (!features.flipbooks) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingState message="Loading builder..." size="lg" />}>
      <FlipbookBuilderContent />
    </Suspense>
  );
}
