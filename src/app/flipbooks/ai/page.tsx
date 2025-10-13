"use client";

import { features } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, Wand2, Upload, Settings, Loader2, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, DataTable } from "@/components/common";
import { api } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [style, setStyle] = useState<"modern" | "classic" | "minimal">("modern");
  const [maxProductsPerPage, setMaxProductsPerPage] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);

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

  // Query products for selection
  const { data: productsData, isLoading: productsLoading } = api.products.list.useQuery({
    limit: 100,
  });

  const products = productsData?.items || [];

  // Handle product selection toggle
  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all
  const selectAll = () => {
    setSelectedProducts(products.map((p) => p.id));
  };

  // Handle clear all
  const clearAll = () => {
    setSelectedProducts([]);
  };

  // Handle AI generation
  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/flipbooks/generate-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          style,
          maxProductsPerPage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      const result = await response.json();

      toast.success(`Flipbook generated! ${result.layout.totalPages} pages created.`);

      // Redirect to builder
      router.push(`/flipbooks/builder?id=${result.flipbookId}`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(`Failed to generate flipbook: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

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
              Select products from your catalog, and our AI will automatically generate a beautifully designed flipbook with smart layouts and interactive hotspots.
            </p>
          </div>

          {/* Product Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selected Products</h3>
              <Dialog open={productSelectorOpen} onOpenChange={setProductSelectorOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Select Products ({selectedProducts.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Select Products</DialogTitle>
                    <DialogDescription>
                      Choose products to include in your AI-generated flipbook
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {selectedProducts.length} of {products.length} selected
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectAll}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearAll}>
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {productsLoading ? (
                      <LoadingState message="Loading products..." />
                    ) : (
                      <div className="border rounded-lg max-h-96 overflow-y-auto">
                        <div className="divide-y">
                          {products.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleProduct(product.id)}
                            >
                              <Checkbox
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={() => toggleProduct(product.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.sku} • {product.category || "Uncategorized"}
                                </p>
                              </div>
                              {product.base_price && (
                                <div className="text-sm font-medium">
                                  ${parseFloat(product.base_price).toFixed(2)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={() => setProductSelectorOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedProducts.length > 0 ? (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for generation
                </p>
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning">
                  Please select products to continue
                </p>
              </div>
            )}
          </div>

          {/* Generation Settings */}
          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Generation Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Style</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['modern', 'classic', 'minimal'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        style === s
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {style === s && <Check className="h-4 w-4 text-primary" />}
                        <span className="text-sm font-medium capitalize">{s}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Max Products Per Page</label>
                <select
                  value={maxProductsPerPage}
                  onChange={(e) => setMaxProductsPerPage(parseInt(e.target.value))}
                  className="w-full mt-2 px-3 py-2 bg-background border rounded-md text-sm"
                >
                  <option value={1}>1 product per page (Featured)</option>
                  <option value={2}>2 products per page</option>
                  <option value={3}>3 products per page</option>
                  <option value={4}>4 products per page (Recommended)</option>
                  <option value={6}>6 products per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">AI Features</h3>
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

          {/* Generate Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={selectedProducts.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Flipbook...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate AI Flipbook
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            Generation typically takes 10-30 seconds depending on the number of products
          </p>
        </div>
      </div>
    </div>
  );
}
