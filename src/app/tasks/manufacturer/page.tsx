"use client";

import { PageHeader, EmptyState } from "@/components/common";
import { Factory } from "lucide-react";

export default function ManufacturerTasksPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Manufacturer Tasks"
        subtitle="Tasks assigned to manufacturing teams"
      />

      <EmptyState
        icon={Factory}
        title="Coming Soon"
        description="Manufacturer task management interface is under development."
      />
    </div>
  );
}
