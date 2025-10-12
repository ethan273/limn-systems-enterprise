"use client";

/**
 * Product Picker Dialog
 *
 * Allows users to search and select products for hotspot linking
 */

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/common";
import { Search } from "lucide-react";

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
}

export function ProductPicker({ open, onClose, onSelect }: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Query products
  const { data, isLoading } = api.products.list.useQuery(
    {
      limit: 50,
      search: searchTerm || undefined,
    },
    { enabled: open }
  );

  const products = data?.items || [];

  const handleSelect = (productId: string) => {
    onSelect(productId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
          <DialogDescription>
            Choose a product to link to this hotspot
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products List */}
        <div className="overflow-y-auto max-h-[400px] space-y-2">
          {isLoading ? (
            <LoadingState message="Loading products..." />
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No products found" : "No products available"}
            </div>
          ) : (
            products.map((product: any) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product.id)}
                className="w-full p-3 bg-card hover:bg-accent rounded-lg border text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                      {product.category && ` • ${product.category}`}
                    </div>
                  </div>
                  {product.base_price && (
                    <div className="text-sm font-medium">
                      ${parseFloat(product.base_price).toFixed(2)}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
