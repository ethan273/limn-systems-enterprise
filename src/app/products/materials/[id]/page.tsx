"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ArrowLeft, Package } from "lucide-react";

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;

  const { data: material, isLoading, error } = api.materials.getById.useQuery(
    { id: materialId },
    { enabled: !!materialId }
  );

  if (error || isLoading || !material) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>{isLoading ? "Loading..." : "Material Not Found"}</CardTitle></CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-4">{error.message}</p>}
            <Button onClick={() => router.push("/products/materials")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/products/materials")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-3xl font-bold">{material.material_name}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Material Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Material Name</p>
              <p className="flex items-center gap-2"><Package className="h-4 w-4" />{material.material_name}</p>
            </div>
            {material.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{material.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
