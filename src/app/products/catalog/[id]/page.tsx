"use client";

import { use } from "react";
import { ProductDetailPage } from "@/components/products/ProductDetailPage";

interface CatalogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  const { id } = use(params);
  return <ProductDetailPage productId={id} productType="catalog" />;
}
