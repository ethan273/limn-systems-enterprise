'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState, EmptyState } from '@/components/common';
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Star,
  MessageSquare,
  Award,
  Clock,
  FileEdit,
  ThumbsUp,
} from 'lucide-react';

/**
 * Designer Quality & Performance Page
 * View performance metrics, ratings, and feedback
 */
export default function DesignerQualityPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const { data: performanceData, isLoading: loadingPerformance, error: performanceError } =
    api.portal.getDesignerPerformance.useQuery();
  const { data: feedbackData, isLoading: loadingFeedback, error: feedbackError } =
    api.portal.getDesignerFeedback.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const isLoading = loadingPerformance || loadingFeedback;
  const error = performanceError || feedbackError;

  const metrics = performanceData?.aggregateMetrics;
  const performanceRecords = performanceData?.performanceRecords || [];
  const revisions = feedbackData?.revisions || [];
  const prototypeFeedback = feedbackData?.prototypeFeedback || [];

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-success';
    if (rating >= 3.5) return 'text-warning';
    return 'text-destructive';
  };

  // Get rating label
  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Average';
    return 'Needs Improvement';
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Quality & Performance</h1>
          <p className="page-subtitle">View performance metrics and feedback</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load performance data"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              utils.portal.getDesignerPerformance.invalidate();
              utils.portal.getDesignerFeedback.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading performance data..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quality & Performance</h1>
        <p className="page-subtitle">Track your design quality and performance metrics</p>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">Projects completed</p>
          </CardContent>
        </Card>

        {/* Average Quality Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(metrics?.avgQualityRating || 0)}`}>
              {metrics?.avgQualityRating?.toFixed(1) || '0.0'} / 5.0
            </div>
            <p className="text-xs text-muted-foreground">
              {getRatingLabel(metrics?.avgQualityRating || 0)}
            </p>
          </CardContent>
        </Card>

        {/* On-Time Delivery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.onTimeDeliveryRate || 0}%</div>
            <Progress value={metrics?.onTimeDeliveryRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        {/* Average Revisions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revisions</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgRevisionCount?.toFixed(1) || '0.0'}</div>
            <p className="text-xs text-muted-foreground">Per project</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rating Breakdown
          </CardTitle>
          <CardDescription>Your performance across key metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quality Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Quality</label>
              <span className={`text-sm font-bold ${getRatingColor(metrics?.avgQualityRating || 0)}`}>
                {metrics?.avgQualityRating?.toFixed(1) || '0.0'} / 5.0
              </span>
            </div>
            <Progress value={(metrics?.avgQualityRating || 0) * 20} />
          </div>

          {/* Creativity Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Creativity</label>
              <span className={`text-sm font-bold ${getRatingColor(metrics?.avgCreativityRating || 0)}`}>
                {metrics?.avgCreativityRating?.toFixed(1) || '0.0'} / 5.0
              </span>
            </div>
            <Progress value={(metrics?.avgCreativityRating || 0) * 20} />
          </div>

          {/* Communication Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Communication</label>
              <span className={`text-sm font-bold ${getRatingColor(metrics?.avgCommunicationRating || 0)}`}>
                {metrics?.avgCommunicationRating?.toFixed(1) || '0.0'} / 5.0
              </span>
            </div>
            <Progress value={(metrics?.avgCommunicationRating || 0) * 20} />
          </div>

          {/* Would Rehire Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Client Satisfaction (Would Rehire)</label>
              <span className="text-sm font-bold">
                {metrics?.wouldRehireRate || 0}%
              </span>
            </div>
            <Progress value={metrics?.wouldRehireRate || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Feedback and History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback & History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Performance History</TabsTrigger>
              <TabsTrigger value="revisions">Revisions</TabsTrigger>
              <TabsTrigger value="feedback">Prototype Feedback</TabsTrigger>
            </TabsList>

            {/* Performance History Tab */}
            <TabsContent value="overview" className="space-y-4">
              {performanceRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">No performance records yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete projects to start tracking your performance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {performanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          {record.design_projects?.name || 'Project'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {record.quality_rating && (
                            <Badge variant="outline">
                              Quality: {record.quality_rating}/5
                            </Badge>
                          )}
                          {record.creativity_rating && (
                            <Badge variant="outline">
                              Creativity: {record.creativity_rating}/5
                            </Badge>
                          )}
                          {record.communication_rating && (
                            <Badge variant="outline">
                              Communication: {record.communication_rating}/5
                            </Badge>
                          )}
                          {record.on_time_delivery && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              On Time
                            </Badge>
                          )}
                          {record.would_rehire && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              Would Rehire
                            </Badge>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                        )}
                        {record.revision_count !== null && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Revisions: {record.revision_count}
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(record.created_at!).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Revisions Tab */}
            <TabsContent value="revisions" className="space-y-4">
              {revisions.length === 0 ? (
                <div className="text-center py-12">
                  <FileEdit className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">No revision requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                        <FileEdit className="h-6 w-6 text-warning" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">
                            Revision #{revision.revision_number}
                          </h3>
                          {revision.approved ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {revision.design_projects?.name}
                        </p>
                        {revision.revision_notes && (
                          <p className="text-sm mt-2">{revision.revision_notes}</p>
                        )}
                        {revision.designer_response && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="font-medium text-xs text-muted-foreground mb-1">
                              Your Response:
                            </p>
                            <p>{revision.designer_response}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested {new Date(revision.request_date!).toLocaleDateString()}
                          {revision.users_design_revisions_requested_byTousers && (
                            <> by {revision.users_design_revisions_requested_byTousers.name}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Prototype Feedback Tab */}
            <TabsContent value="feedback" className="space-y-4">
              {prototypeFeedback.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">No prototype feedback yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prototypeFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          {feedback.prototypes?.name} v{feedback.prototypes?.version}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {feedback.prototypes?.design_projects?.name}
                        </p>
                        {feedback.feedback_text && (
                          <p className="text-sm mt-2">{feedback.feedback_text}</p>
                        )}
                        {feedback.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span className="text-sm font-medium">{feedback.rating}/5</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(feedback.feedback_date!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
