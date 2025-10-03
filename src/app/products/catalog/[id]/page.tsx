"use client";

/**
 * Catalog Item Detail Page
 *
 * Comprehensive detail view for production-ready catalog items with 4-tab interface:
 * 1. Overview - Images, specifications, dimensions, base SKU
 * 2. Sales Analytics - Units sold, revenue, popular material combinations, order history
 * 3. Documents - CAD files, PDFs, certifications (hybrid Supabase/Google Drive storage)
 * 4. Quality & QC - Summary statistics and recent QC inspections
 *
 * Created: October 2, 2025
 * Architecture: See /docs/catalog-detail-page/CATALOG_ITEM_DETAIL_IMPLEMENTATION_PLAN.md
 */

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";

// Tab components (will be created next)
import CatalogOverviewTab from "@/components/catalog/CatalogOverviewTab";
import CatalogSalesTab from "@/components/catalog/CatalogSalesTab";
import CatalogDocumentsTab from "@/components/catalog/CatalogDocumentsTab";
import CatalogQualityTab from "@/components/catalog/CatalogQualityTab";

interface CatalogDetailPageProps {
  params: {
    id: string;
  };
}

export default function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  const router = useRouter();
  const { id } = params;

  // Fetch catalog item with full details
  const { data: catalogItem, isLoading, error } = api.items.getCatalogItemById.useQuery({
    itemId: id,
  });

  if (isLoading) {
    return (
      <div className="catalog-detail-layout">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading catalog item...</p>
        </div>
      </div>
    );
  }

  if (error || !catalogItem) {
    return (
      <div className="catalog-detail-layout">
        <Card className="error-card">
          <CardHeader>
            <CardTitle>Error Loading Catalog Item</CardTitle>
            <CardDescription>
              {error?.message || "Catalog item not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="catalog-detail-layout">
      {/* Header */}
      <div className="catalog-detail-header">
        <div className="header-content">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/products/catalog")}
            className="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>

          <div className="header-title-section">
            <div className="title-with-icon">
              <Package className="title-icon" />
              <h1 className="catalog-detail-title">{catalogItem.name}</h1>
            </div>

            <div className="header-badges">
              {catalogItem.active && (
                <Badge className="badge-success">Active</Badge>
              )}
              {catalogItem.type && (
                <Badge variant="default">{catalogItem.type}</Badge>
              )}
              {catalogItem.furniture_type && (
                <Badge variant="outline">
                  {catalogItem.furniture_type.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>

          <div className="header-meta">
            {catalogItem.base_sku && (
              <div className="meta-item">
                <span className="meta-label">Base SKU:</span>
                <span className="meta-value base-sku">{catalogItem.base_sku}</span>
              </div>
            )}
            {catalogItem.list_price && (
              <div className="meta-item">
                <span className="meta-label">List Price:</span>
                <span className="meta-value price">
                  ${Number(catalogItem.list_price).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4-Tab Interface */}
      <div className="catalog-detail-tabs">
        <Tabs defaultValue="overview" className="tabs-container">
          <TabsList className="tabs-list">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="quality">Quality & QC</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="tab-content">
            <CatalogOverviewTab catalogItem={catalogItem} />
          </TabsContent>

          <TabsContent value="sales" className="tab-content">
            <CatalogSalesTab itemId={id} />
          </TabsContent>

          <TabsContent value="documents" className="tab-content">
            <CatalogDocumentsTab itemId={id} />
          </TabsContent>

          <TabsContent value="quality" className="tab-content">
            <CatalogQualityTab itemId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
