'use client'

import { useState } from 'react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { CheckIcon, XIcon, ClockIcon, UserIcon, BuildingIcon, PhoneIcon, MailIcon } from 'lucide-react'

export function AdminApprovalPanel() {
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'denied' | 'all'>('pending')

  // Fetch pending requests
  const { data: requestsData, isLoading, refetch } = api.auth.getPendingRequests.useQuery({
    status: selectedStatus,
    limit: 50
  })

  // Get statistics
  const { data: stats } = api.auth.getRequestStats.useQuery()

  // Review mutation
  const reviewMutation = api.auth.reviewRequest.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message)
      refetch()
      setAdminNotes(prev => ({ ...prev, [data.request.id]: '' }))
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to review request')
    }
  })

  const handleReview = (requestId: string, action: 'approve' | 'deny') => {
    reviewMutation.mutate({
      requestId,
      action,
      adminNotes: adminNotes[requestId]
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'approved':
        return 'bg-green-500/10 text-green-500'
      case 'denied':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'client':
        return <UserIcon className="h-4 w-4" />
      case 'contractor':
        return <BuildingIcon className="h-4 w-4" />
      case 'manufacturer':
        return <BuildingIcon className="h-4 w-4" />
      case 'designer':
        return <UserIcon className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.stats.denied}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.approvalRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
          <CardDescription>Review and manage user access requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="denied">Denied</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
              ) : requestsData?.requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {selectedStatus === 'all' ? '' : selectedStatus} requests found
                </div>
              ) : (
                requestsData?.requests.map((request: any) => (
                  <Card key={request.id} className="border">
                    <CardContent className="pt-6">
                      <div className="grid gap-4">
                        {/* Header with status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getUserTypeIcon(request.user_type || '')}
                            <span className="text-sm font-medium capitalize">
                              {request.user_type}
                            </span>
                          </div>
                        </div>

                        {/* User Information */}
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <MailIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{request.company_name}</span>
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{request.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Reason for Access */}
                        {request.reason_for_access && (
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium mb-1">Reason for Access:</p>
                            <p className="text-sm text-muted-foreground">
                              {request.reason_for_access}
                            </p>
                          </div>
                        )}

                        {/* Admin Notes Section */}
                        {request.status === 'pending' && (
                          <>
                            <Textarea
                              placeholder="Add admin notes (optional)..."
                              value={adminNotes[request.id] || ''}
                              onChange={(e) => setAdminNotes(prev => ({ 
                                ...prev, 
                                [request.id]: e.target.value 
                              }))}
                              className="min-h-[80px]"
                            />
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReview(request.id, 'approve')}
                                disabled={reviewMutation.isPending}
                                className="flex-1"
                                variant="default"
                              >
                                <CheckIcon className="mr-2 h-4 w-4" />
                                Approve & Send Magic Link
                              </Button>
                              <Button
                                onClick={() => handleReview(request.id, 'deny')}
                                disabled={reviewMutation.isPending}
                                className="flex-1"
                                variant="destructive"
                              >
                                <XIcon className="mr-2 h-4 w-4" />
                                Deny Request
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Show existing admin notes for reviewed requests */}
                        {request.admin_notes && request.status !== 'pending' && (
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">
                              {request.admin_notes}
                            </p>
                          </div>
                        )}

                        {/* Show reviewer info */}
                        {request.reviewer && (
                          <div className="text-sm text-muted-foreground">
                            Reviewed by {request.reviewer.email} 
                            {request.reviewed_at && (
                              <span> • {formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats?.recentRequests && stats.recentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 7 days of access requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{request.email}</p>
                      <p className="text-xs text-muted-foreground">{request.company_name}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}