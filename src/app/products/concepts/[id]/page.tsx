"use client";

import { use } from "react";
import { ProductDetailPage } from "@/components/products/ProductDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConceptDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <ProductDetailPage productId={resolvedParams.id} productType="concept" />;
}
