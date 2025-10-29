"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const { data: role, isLoading, error } = api.roles.getById.useQuery(
    { id: roleId },
    { enabled: !!roleId }
  );

  if (error || isLoading || !role) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>{isLoading ? "Loading..." : "Role Not Found"}</CardTitle></CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-4">{error.message}</p>}
            <Button onClick={() => router.push("/admin/roles")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/roles")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-3xl font-bold">{role.role_name}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Role Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Role Name</p>
              <p className="flex items-center gap-2"><Shield className="h-4 w-4" />{role.role_name}</p>
            </div>
            {role.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{role.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
