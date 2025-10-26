"use client";

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api/client";
import { ArrowLeft, Save, Eye, FileText, Image as ImageIcon, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, EmptyState } from "@/components/common";
import { FileUploader } from "@/components/flipbooks/FileUploader";
import { PageCanvas } from "@/components/flipbooks/PageCanvas";
import { SortablePageList } from "@/components/flipbooks/SortablePageList";
import { ProductPicker } from "@/components/flipbooks/ProductPicker";
import { LinkTypeSelector } from "@/components/flipbooks/LinkTypeSelector";
import { TOCBuilder } from "@/components/flipbooks/builder/TOCBuilder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Flipbook Builder Page Content
 *
 * Edit flipbook content, add pages, create hotspots, and configure settings.
 * Supports both creating new flipbooks and editing existing ones.
 */
function FlipbookBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flipbookId = searchParams.get("id");

  // Redirect to upload page if no flipbook ID is provided
  useEffect(() => {
    if (!flipbookId) {
      toast.info("Please create a flipbook first by uploading a PDF");
      router.replace("/flipbooks/upload");
    }
  }, [flipbookId, router]);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"pdf" | "images">("pdf");
  const [linkTypeSelectorOpen, setLinkTypeSelectorOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // FIXME: status state disabled - status field is Unsupported type in Prisma
  // const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");

  // Query flipbook if editing
  const { data: flipbook, isLoading, error } = api.flipbooks.get.useQuery(
    { id: flipbookId! },
    { enabled: !!flipbookId }
  );

  // DEBUG: Log query data
  useEffect(() => {
    if (flipbook) {
      console.log("[Builder] Flipbook data loaded:", {
        id: flipbook.id,
        title: flipbook.title,
        pageCount: flipbook.page_count,
        pagesArrayLength: flipbook.flipbook_pages?.length || 0,
        pages: flipbook.flipbook_pages?.map(p => ({ id: p.id, page_number: p.page_number })) || []
      });
    }
  }, [flipbook]);

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

  const generateTOC = api.flipbooks.generateTOC.useMutation({
    onSuccess: () => {
      // Invalidate queries for instant updates
      utils.flipbooks.get.invalidate();
    },
    onError: (error) => {
      console.error("Failed to generate TOC:", error);
    },
  });

  // Initialize form values from flipbook data
  useEffect(() => {
    if (flipbook) {
      setTitle(flipbook.title);
      setDescription(flipbook.description || "");
      // NOTE: status field is Unsupported type in Prisma, cannot be read
      // setStatus(flipbook.status as any);
    }
  }, [flipbook]);

  // Handle save
  const handleSave = () => {
    if (!flipbookId) return;

    updateFlipbook.mutate({
      id: flipbookId,
      title,
      description,
      // FIXME: status removed - Unsupported type in Prisma
      // status,
    });
  };

  // Handle upload complete - automatically generate TOC for PDF uploads
  const handleUploadComplete = async (result?: any) => {
    setUploadDialogOpen(false);
    // Invalidate queries for instant updates
    utils.flipbooks.get.invalidate();

    // If it was a PDF upload and we have a PDF URL, auto-generate TOC
    if (result?.pdfUrl && uploadType === "pdf") {
      toast.info("Generating Table of Contents from PDF...");

      try {
        // Import client-side extractor dynamically (only loads in browser)
        const { extractTOCFromPDFInBrowser } = await import(
          "@/lib/flipbooks/toc-extractor-client"
        );

        // Extract TOC in browser
        const extractionResult = await extractTOCFromPDFInBrowser(
          result.pdfUrl
        );

        if (extractionResult.success && extractionResult.itemCount > 0) {
          // Create TOC data structure
          const generatedTocData = {
            items: extractionResult.items,
            autoGenerated: true,
            lastModified: new Date().toISOString(),
            version: "1.0" as const,
          };

          // Send to server for storage
          await generateTOC.mutateAsync({
            flipbookId: flipbookId!,
            tocData: generatedTocData,
            itemCount: extractionResult.itemCount,
            warnings: extractionResult.warnings,
          });

          toast.success(
            `Table of Contents generated with ${extractionResult.itemCount} items!`,
            {
              description: "You can edit it in the TOC tab.",
              duration: 5000,
            }
          );
        } else {
          toast.info("PDF uploaded successfully. No TOC bookmarks found in PDF.", {
            description: "You can manually create TOC items in the TOC tab.",
          });
        }
      } catch (error) {
        console.error("Failed to auto-generate TOC:", error);
        toast.info("PDF uploaded successfully. TOC generation failed.", {
          description: "You can manually generate TOC in the TOC tab.",
        });
      }
    } else {
      toast.success("Upload complete! Refresh to see new pages.");
    }
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

  // Handle hotspot creation - open link type selector
  const handleHotspotCreate = (hotspot: any) => {
    if (!selectedPageId) {
      toast.error("Please select a page first");
      return;
    }

    // Store pending hotspot data and open link type selector
    setPendingHotspot(hotspot);
    setLinkTypeSelectorOpen(true);
  };

  // Handle link type: Product selection
  const handleLinkTypeProduct = () => {
    setLinkTypeSelectorOpen(false);
    setProductPickerOpen(true);
  };

  // Handle link type: URL (external or video)
  const handleLinkTypeUrl = (url: string, label?: string) => {
    if (!pendingHotspot || !selectedPageId) return;

    createHotspot.mutate({
      pageId: selectedPageId,
      targetUrl: url,
      label,
      xPercent: pendingHotspot.xPercent,
      yPercent: pendingHotspot.yPercent,
      width: pendingHotspot.width,
      height: pendingHotspot.height,
    });

    setLinkTypeSelectorOpen(false);
    setPendingHotspot(null);
  };

  // Handle link type: Page jump
  const handleLinkTypePage = (pageNumber: number) => {
    if (!pendingHotspot || !selectedPageId) return;

    // Find the page by page_number to get its ID
    const targetPage = flipbook?.flipbook_pages?.find((p: any) => p.page_number === pageNumber);
    if (!targetPage) {
      toast.error(`Page ${pageNumber} not found`);
      return;
    }

    createHotspot.mutate({
      pageId: selectedPageId,
      targetPageId: targetPage.id,
      label: `Go to page ${pageNumber}`,
      xPercent: pendingHotspot.xPercent,
      yPercent: pendingHotspot.yPercent,
      width: pendingHotspot.width,
      height: pendingHotspot.height,
    });

    setLinkTypeSelectorOpen(false);
    setPendingHotspot(null);
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

    setProductPickerOpen(false);
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

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Edit Flipbook"
          subtitle="Upload pages, add hotspots, and configure settings"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load flipbook"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.flipbooks.get.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Show loading while redirecting (no flipbook ID)
  if (!flipbookId) {
    return <LoadingState message="Redirecting to upload page..." size="lg" />;
  }

  if (isLoading && flipbookId) {
    return <LoadingState message="Loading flipbook..." size="lg" />;
  }

  const selectedPage = flipbook?.flipbook_pages?.find((p: any) => p.id === selectedPageId);

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
            {flipbook?.flipbook_pages && flipbook.flipbook_pages.length > 0 ? (
              <SortablePageList
                pages={flipbook.flipbook_pages as any}
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
            {/* Upload buttons - set type and open dialog */}
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                disabled={!flipbookId}
                onClick={() => {
                  setUploadType("pdf");
                  setUploadDialogOpen(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                disabled={!flipbookId}
                onClick={() => {
                  setUploadType("images");
                  setUploadDialogOpen(true);
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Upload a PDF or images to create flipbook pages
                  </DialogDescription>
                </DialogHeader>

                {/* Use uploadType state to control active tab */}
                <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as "pdf" | "images")} className="w-full">
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
              {/* FIXME: Status dropdown disabled - status field is Unsupported type in Prisma */}
              {/* <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
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

      {/* Link Type Selector Dialog */}
      <LinkTypeSelector
        open={linkTypeSelectorOpen}
        onClose={() => {
          setLinkTypeSelectorOpen(false);
          setPendingHotspot(null);
        }}
        onSelectProduct={handleLinkTypeProduct}
        onSelectUrl={handleLinkTypeUrl}
        onSelectPage={handleLinkTypePage}
        totalPages={flipbook?.page_count || flipbook?.flipbook_pages?.length || 1}
      />

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
  return (
    <Suspense fallback={<LoadingState message="Loading builder..." size="lg" />}>
      <FlipbookBuilderContent />
    </Suspense>
  );
}
