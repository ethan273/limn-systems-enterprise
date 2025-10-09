'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Palette,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
} from 'lucide-react';

/**
 * Designer Portal Dashboard
 * External portal for designer partners to view their projects and performance
 * Phase 3: Migrated to use portal router with enforcePortalAccessByType
 */
export default function DesignerPortalPage() {
  const router = useRouter();

  // Use portal router procedures (enforces designer portal access)
  const { data: _userInfo } = api.portal.getCurrentUser.useQuery();
  const { data: stats, isLoading: _statsLoading } = api.portal.getDesignerDashboardStats.useQuery();
  const { data: projectsData, isLoading: projectsLoading } = api.portal.getDesignerProjects.useQuery({
    limit: 50,
    offset: 0,
  });

  const projects = projectsData?.projects || [];

  // Stats from portal router (show 0 while loading)
  const activeProjects = stats?.activeProjects || 0;
  const pendingReviews = stats?.pendingReviews || 0;
  const completedProjects = stats?.completedProjects || 0;

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      concept: 'Concept',
      sketching: 'Sketching',
      rendering: 'Rendering',
      revisions: 'Revisions',
      approved: 'Approved',
    };
    return <Badge variant="outline">{statusLabels[status as keyof typeof statusLabels] || status}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Designer Dashboard</h1>
        <p className="page-subtitle">Manage your design projects and track your performance</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently in design</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Design Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Design Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No design projects assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/designer/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{project.project_name || 'Untitled Project'}</h3>
                        {getStatusBadge(project.current_stage)}
                      </div>
                      <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {formatDate(project.created_at)}</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/designer/documents')}
            >
              <FileText className="h-6 w-6" />
              <span>View Documents</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/designer/quality')}
            >
              <CheckCircle className="h-6 w-6" />
              <span>Quality Reports</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/designer/settings')}
            >
              <Palette className="h-6 w-6" />
              <span>Designer Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
