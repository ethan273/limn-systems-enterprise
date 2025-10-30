"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/common";

export default function DesignDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const { data: doc, isLoading, error } = api.documents.getById.useQuery(
    { id: docId },
    { enabled: !!docId }
  );

  if (error || isLoading || !doc) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>{isLoading ? "Loading..." : "Document Not Found"}</CardTitle></CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-4">{error.message}</p>}
            <Button onClick={() => router.push("/design/documents")}>
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
        <Button variant="outline" size="sm" onClick={() => router.push("/design/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-3xl font-bold">{doc.file_name}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Document Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">File Name</p>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4" />{doc.file_name}</p>
            </div>
            {doc.file_path && (
              <div>
                <p className="text-sm text-muted-foreground">File Path</p>
                <p className="text-xs font-mono">{doc.file_path}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
