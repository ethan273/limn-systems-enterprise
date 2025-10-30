"use client";

import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Key, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ApiCredentialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const credId = params.id as string;

  const { data: credential, isLoading, error } = api.apiCredentials.getById.useQuery(
    { id: credId },
    { enabled: !!credId }
  );

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>API Credential Not Found</CardTitle></CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error.message || "Unable to load credential"}</p>
            <Button onClick={() => router.push("/admin/api-management/credentials")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>Credential Not Found</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/api-management/credentials")}>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/api-management/credentials")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{credential.display_name}</h1>
            <p className="text-muted-foreground">API Credential Details</p>
          </div>
        </div>
        <Badge variant={credential.is_active ? "default" : "secondary"}>
          {credential.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Credential Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Service Name</h3>
              <p className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />{credential.service_name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Credential Type</h3>
              <p className="text-base">{credential.credential_type}</p>
            </div>
            {/* Scopes field doesn't exist in api_credentials schema - commented out */}
            {/* {(credential as any).scopes && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Scopes</h3>
                <div className="flex flex-wrap gap-2">
                  {((credential as any).scopes as string[]).map((scope: string, i: number) => (
                    <Badge key={i} variant="outline"><Shield className="h-3 w-3 mr-1" />{scope}</Badge>
                  ))}
                </div>
              </div>
            )} */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {credential.created_at ? format(new Date(credential.created_at), "PPp") : "N/A"}
              </p>
            </div>
            {credential.expires_at && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Expires At</h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(credential.expires_at), "PPp")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
