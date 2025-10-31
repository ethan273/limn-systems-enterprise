import { Breadcrumb } from "@/components/common";
import PortalAccessManagement from "@/components/admin/PortalAccessManagement";

export default function PortalAccessPage() {
  return (
    <div className="container mx-auto py-6">
      <Breadcrumb />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Portal Access Management</h1>
        <p className="text-muted-foreground">
          Manage user portal access and module permissions
        </p>
      </div>

      <PortalAccessManagement />
    </div>
  );
}
