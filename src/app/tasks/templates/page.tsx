"use client";

import { PageHeader, Breadcrumb } from "@/components/common";
import TaskTemplates from "@/components/TaskTemplates";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TaskTemplatesPage() {
  const router = useRouter();

  const handleCreateFromTemplate = (templateId: string) => {
    // Navigate to tasks page with template query param
    toast.success("Template selected. Redirecting to create tasks...");
    router.push(`/tasks?template=${templateId}`);
  };

  return (
    <div className="page-container">
      <Breadcrumb />
      <PageHeader
        title="Task Templates"
        subtitle="Reusable task templates for common workflows"
      />

      <TaskTemplates onCreateFromTemplate={handleCreateFromTemplate} />
    </div>
  );
}
