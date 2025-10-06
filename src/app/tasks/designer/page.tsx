"use client";

import { PageHeader, EmptyState } from "@/components/common";
import { Paintbrush } from "lucide-react";

export default function DesignerTasksPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Designer Tasks"
        subtitle="Tasks assigned to design teams"
      />

      <EmptyState
        icon={Paintbrush}
        title="Coming Soon"
        description="Designer task management interface is under development."
      />
    </div>
  );
}
