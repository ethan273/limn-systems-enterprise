'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  Mail,
  Building,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface PendingSignUp {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  businessJustification?: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function AdminApprovalDashboard() {
  const [signUps, setSignUps] = useState<PendingSignUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSignUp, setSelectedSignUp] = useState<PendingSignUp | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchPendingSignUps();
  }, []);

  const fetchPendingSignUps = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/sign-ups');
      if (!response.ok) throw new Error('Failed to fetch sign-ups');
      const data = await response.json();
      setSignUps(data.signUps);
    } catch (error) {
      console.error('Error fetching sign-ups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sign-up requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (signUpId: string, actionType: 'approve' | 'reject') => {
    const signUp = signUps.find((s) => s.id === signUpId);
    if (!signUp) return;

    setSelectedSignUp(signUp);
    setAction(actionType);
  };

  const confirmAction = async () => {
    if (!selectedSignUp || !action) return;

    setProcessingId(selectedSignUp.id);
    try {
      const response = await fetch('/api/admin/sign-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSignUp.id,
          action,
          reviewerNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process sign-up');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: data.message,
      });

      // Remove from list
      setSignUps((prev) => prev.filter((s) => s.id !== selectedSignUp.id));

      // Reset state
      setSelectedSignUp(null);
      setAction(null);
      setReviewerNotes('');
    } catch (error) {
      console.error('Error processing sign-up:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process sign-up',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const cancelAction = () => {
    setSelectedSignUp(null);
    setAction(null);
    setReviewerNotes('');
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="stats-grid">
          <Card>
            <CardHeader className="card-header-compact">
              <CardTitle className="card-title-sm">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{signUps.length}</div>
            </CardContent>
          </Card>
        </div>

        <Button
          variant="outline"
          onClick={fetchPendingSignUps}
          disabled={refreshing}
        >
          <RefreshCw className={`icon-sm ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Sign-ups Table */}
      {signUps.length === 0 ? (
        <Card>
          <CardContent className="empty-state">
            <CheckCircle2 className="icon-lg icon-success" aria-hidden="true" />
            <p className="empty-state-title">No Pending Requests</p>
            <p className="empty-state-description">
              All sign-up requests have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Sign-Up Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Company</th>
                    <th>Message</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signUps.map((signUp) => (
                    <tr key={signUp.id}>
                      <td>
                        <div>
                          <div className="font-medium">
                            {signUp.firstName} {signUp.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="icon-xs" aria-hidden="true" />
                            {signUp.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        {signUp.companyName ? (
                          <div className="flex items-center gap-1">
                            <Building className="icon-sm icon-muted" aria-hidden="true" />
                            <span>{signUp.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <div className="max-w-xs">
                          {signUp.businessJustification ? (
                            <p className="text-sm line-clamp-2">{signUp.businessJustification}</p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Calendar className="icon-sm icon-muted" aria-hidden="true" />
                          <span className="text-sm">
                            {format(new Date(signUp.requestedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(signUp.id, 'approve')}
                            disabled={processingId === signUp.id}
                            className="btn-success"
                          >
                            <Check className="icon-sm" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(signUp.id, 'reject')}
                            disabled={processingId === signUp.id}
                            className="btn-destructive"
                          >
                            <X className="icon-sm" aria-hidden="true" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedSignUp} onOpenChange={(open) => !open && cancelAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="icon-lg icon-success" aria-hidden="true" />
                  <span>Approve Sign-Up Request</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="icon-lg icon-destructive" aria-hidden="true" />
                  <span>Reject Sign-Up Request</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'This will create a new user account and grant access to the system.'
                : 'This will decline the sign-up request. The user will not be notified.'}
            </DialogDescription>
          </DialogHeader>

          {selectedSignUp && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm ml-2">
                      {selectedSignUp.firstName} {selectedSignUp.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm ml-2">{selectedSignUp.email}</span>
                  </div>
                  {selectedSignUp.companyName && (
                    <div>
                      <span className="text-sm font-medium">Company:</span>
                      <span className="text-sm ml-2">{selectedSignUp.companyName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="reviewer-notes" className="form-label">
                  <MessageSquare className="icon-sm" aria-hidden="true" />
                  Reviewer Notes (Optional)
                </label>
                <Textarea
                  id="reviewer-notes"
                  placeholder="Add internal notes about this decision..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelAction} disabled={!!processingId}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={!!processingId}
              className={action === 'approve' ? 'btn-success' : 'btn-destructive'}
            >
              {processingId ? (
                <>
                  <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                  Processing...
                </>
              ) : action === 'approve' ? (
                <>
                  <Check className="icon-sm" aria-hidden="true" />
                  Approve
                </>
              ) : (
                <>
                  <X className="icon-sm" aria-hidden="true" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
