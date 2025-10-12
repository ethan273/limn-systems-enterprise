"use client";

import { features } from "@/lib/features";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api/client";
import { ArrowLeft, Upload, Plus, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState } from "@/components/common";

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
  const { data: flipbook, isLoading } = api.flipbooks.get.useQuery(
    { id: flipbookId! },
    { enabled: !!flipbookId }
  );

  if (isLoading && flipbookId) {
    return <LoadingState message="Loading flipbook..." size="lg" />;
  }

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
            onClick: () => {
              // Save logic will be implemented in Phase 3
            },
          },
        ]}
      />

      {/* Builder Interface */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Pages List */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Pages</h2>
            <div className="space-y-2">
              {flipbook?.pages && flipbook.pages.length > 0 ? (
                flipbook.pages.map((page: any) => (
                  <div
                    key={page.id}
                    className="p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Page {page.page_number}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pages yet</p>
              )}
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </div>

          {/* Upload Section */}
          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Upload</h2>
            <div className="space-y-3">
              <Button className="w-full" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Upload a PDF or individual images to create flipbook pages
            </p>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="col-span-6">
          <div className="bg-card rounded-lg border p-8 min-h-[600px]">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Flipbook Builder</h3>
                <p className="text-muted-foreground max-w-md">
                  The visual editor for adding pages, placing hotspots, and configuring transitions will be implemented in Phase 3.
                  <br /><br />
                  Features will include:
                </p>
                <ul className="text-sm text-muted-foreground mt-4 space-y-1">
                  <li>• Drag-and-drop page ordering</li>
                  <li>• Interactive hotspot placement</li>
                  <li>• Page transition configuration</li>
                  <li>• Real-time preview</li>
                  <li>• Product linking</li>
                </ul>
              </div>
            </div>
          </div>
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
                  defaultValue={flipbook?.title}
                  placeholder="Flipbook title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  rows={3}
                  defaultValue={flipbook?.description || ''}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Page Turn Sound</span>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span>Auto Play</span>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span>Show Thumbnails</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
