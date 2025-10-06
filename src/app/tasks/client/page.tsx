"use client";

import { PageHeader, EmptyState } from "@/components/common";
import { Users } from "lucide-react";

export default function ClientTasksPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Client Tasks"
        subtitle="Tasks related to client requests and deliverables"
      />

      <EmptyState
        icon={Users}
        title="Coming Soon"
        description="Client task management interface is under development."
      />
    </div>
  );
}
