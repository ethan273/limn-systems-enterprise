"use client";

import { PageHeader } from "@/components/common";
import TaskTemplates from "@/components/TaskTemplates";

export default function TaskTemplatesPage() {
  const handleCreateFromTemplate = (templateId: string) => {
    // Navigate to create task with template pre-filled
    console.log('Creating tasks from template:', templateId);
    // In a real implementation, this would:
    // 1. Fetch the template data
    // 2. Pre-populate a task creation form or
    // 3. Automatically create tasks from the template
    // 4. Navigate back to the tasks list
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Task Templates"
        subtitle="Reusable task templates for common workflows"
      />

      <TaskTemplates onCreateFromTemplate={handleCreateFromTemplate} />
    </div>
  );
}
