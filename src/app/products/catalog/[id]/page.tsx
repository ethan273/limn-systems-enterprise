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

import { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  EntityDetailHeader,
  LoadingState,
  EmptyState,
} from "@/components/common";
import { ArrowLeft, Package, DollarSign, Tag } from "lucide-react";

// Tab components (will be created next)
import CatalogOverviewTab from "@/components/catalog/CatalogOverviewTab";
import CatalogSalesTab from "@/components/catalog/CatalogSalesTab";
import CatalogDocumentsTab from "@/components/catalog/CatalogDocumentsTab";
import CatalogQualityTab from "@/components/catalog/CatalogQualityTab";

interface CatalogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch catalog item with full details
  const { data: catalogItem, isLoading, error } = api.items.getCatalogItemById.useQuery({
    itemId: id,
  });

  if (isLoading) {
    return (
      <div className="catalog-detail-layout">
        <LoadingState message="Loading catalog item..." size="md" />
      </div>
    );
  }

  if (error || !catalogItem) {
    return (
      <div className="catalog-detail-layout">
        <EmptyState
          icon={Package}
          title="Error Loading Catalog Item"
          description={error?.message || "Catalog item not found"}
          action={{
            label: 'Go Back',
            onClick: () => router.back(),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  return (
    <div className="catalog-detail-layout">
      {/* Header */}
      <div className="page-header">
        <Button
          variant="ghost"
          onClick={() => router.push("/products/catalog")}
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Entity Header */}
      <EntityDetailHeader
        icon={Package}
        title={catalogItem.name}
        subtitle={catalogItem.type || undefined}
        status={catalogItem.active ? 'active' : 'inactive'}
        metadata={[
          ...(catalogItem.base_sku ? [{ icon: Tag, value: `SKU: ${catalogItem.base_sku}`, label: 'SKU' }] : []),
          ...(catalogItem.list_price ? [{ icon: DollarSign, value: `$${Number(catalogItem.list_price).toLocaleString()}`, label: 'Price' }] : []),
          ...(catalogItem.furniture_type ? [{ icon: Package, value: catalogItem.furniture_type.replace(/_/g, " "), label: 'Type' }] : []),
        ]}
      />

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
