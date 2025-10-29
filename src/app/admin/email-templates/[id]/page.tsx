"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";

export default function EmailTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const { data: template, isLoading, error } = api.emailTemplates.getById.useQuery(
    { id: templateId },
    { enabled: !!templateId }
  );

  if (error || isLoading || !template) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>{isLoading ? "Loading..." : "Email Template Not Found"}</CardTitle></CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-4">{error.message}</p>}
            <Button onClick={() => router.push("/admin/email-templates")}>
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
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/email-templates")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-3xl font-bold">{template.template_name}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Template Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Template Name</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{template.template_name}</p>
            </div>
            {template.subject && (
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p>{template.subject}</p>
              </div>
            )}
            {template.body && (
              <div>
                <p className="text-sm text-muted-foreground">Body</p>
                <pre className="text-sm bg-muted p-4 rounded">{template.body}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
