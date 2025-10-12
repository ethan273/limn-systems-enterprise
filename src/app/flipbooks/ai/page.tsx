"use client";

import { features } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles, Wand2, Upload, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";

/**
 * AI Flipbook Generation Page
 *
 * AI-powered flipbook creation from product catalogs.
 * Automatically generates layouts, places products, and creates hotspots.
 *
 * FEATURE FLAG: Only accessible when features.flipbooks is enabled
 */
export default function AIGenerationPage() {
  const router = useRouter();

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

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="AI Flipbook Generation"
        subtitle="Let AI create stunning flipbooks from your product catalog"
        actions={[
          {
            label: 'Back to Library',
            onClick: () => router.push("/flipbooks"),
            variant: 'outline',
          },
        ]}
      />

      {/* AI Generation Interface */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">AI-Powered Generation</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your product catalog or select items, and our AI will automatically generate a beautifully designed flipbook with smart layouts and interactive hotspots.
            </p>
          </div>

          {/* Generation Options */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-muted/50 rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors">
              <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Upload Catalog</h3>
              <p className="text-sm text-muted-foreground">
                Upload a PDF or Excel file with your product catalog
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors">
              <Wand2 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Select Products</h3>
              <p className="text-sm text-muted-foreground">
                Choose products from your existing catalog
              </p>
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Features
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="font-medium">Smart Layouts</p>
                  <p className="text-muted-foreground text-xs">Automatic page composition based on product types</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="font-medium">Product Grouping</p>
                  <p className="text-muted-foreground text-xs">Intelligent categorization and organization</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="font-medium">Hotspot Placement</p>
                  <p className="text-muted-foreground text-xs">Automatic interactive element positioning</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="font-medium">Style Matching</p>
                  <p className="text-muted-foreground text-xs">Consistent branding across all pages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              AI generation will be implemented in Phase 4
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This feature will leverage OpenAI's vision models for intelligent layout generation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
