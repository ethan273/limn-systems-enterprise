"use client";

import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading, error } = api.users.getById.useQuery(
    { id: userId },
    { enabled: !!userId }
  );

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>User Not Found</CardTitle></CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error.message ||  "Unable to load user"}</p>
            <Button onClick={() => router.push("/admin/users")}>
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

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>User Not Found</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/users")}>
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
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
            <p className="text-muted-foreground">User Details</p>
          </div>
        </div>
        <Badge variant={user.email_verified ? "default" : "secondary"}>
          {user.email_verified ? "Verified" : "Unverified"}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>User Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
              <p className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />{user.name || "Not set"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
              <p className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />{user.email}
              </p>
            </div>
            {user.user_type && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">User Type</h3>
                <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />{user.user_type}</Badge>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {user.created_at ? format(new Date(user.created_at), "PPp") : "N/A"}
              </p>
            </div>
            {user.last_sign_in_at && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Sign In</h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(user.last_sign_in_at), "PPp")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
