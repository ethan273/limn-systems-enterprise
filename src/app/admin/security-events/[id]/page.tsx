"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function SecurityEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { data: event, isLoading, error } = api.security.getEventById.useQuery(
    { id: eventId },
    { enabled: !!eventId }
  );

  if (error || isLoading || !event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>{isLoading ? "Loading..." : "Security Event Not Found"}</CardTitle></CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-4">{error.message}</p>}
            <Button onClick={() => router.push("/admin/security-events")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/security-events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <h1 className="text-3xl font-bold">Security Event</h1>
        </div>
        <Badge variant={event.severity === 'high' ? 'destructive' : 'default'}>
          {event.severity || 'medium'}
        </Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Event Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Event Type</p>
              <p className="flex items-center gap-2"><Shield className="h-4 w-4" />{event.event_type}</p>
            </div>
            {event.created_at && (
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.created_at), "PPp")}
                </p>
              </div>
            )}
            {event.description && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{event.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
