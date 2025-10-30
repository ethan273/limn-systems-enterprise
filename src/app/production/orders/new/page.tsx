"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { LoadingState } from "@/components/common";

/**
 * Production Orders are created from CRM Projects
 * This page redirects to the projects page
 */
export default function NewProductionOrderPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to CRM projects where production orders are created
    router.push("/crm/projects");
  }, [router]);

  return (
    <div className="page-container">
      <Breadcrumb />
      <LoadingState message="Redirecting to Projects..." size="lg" />
    </div>
  );
}
