import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  user_id: string;
  user: {
    email: string;
    full_name: string;
    created_at: string;
  };
  company_name: string;
  company_size: string;
  use_case: string;
  requested_role: string;
  created_at: string;
}

export default function UserApprovals() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select(`
          *,
          user:users(email, full_name, created_at)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    approvalId: string, 
    userId: string, 
    approved: boolean
  ) => {
    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from('user_approvals')
        .update({
          status: approved ? 'approved' : 'rejected',          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // Update user status if approved
      if (approved) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            status: 'approved',
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (userError) throw userError;

        // Send welcome email
        await fetch('/api/emails/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      }

      toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`);
      fetchPendingUsers();
    } catch (error) {      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    }
  };

  if (loading) return <div>Loading pending approvals...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pending User Approvals</h2>
      
      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending approvals
          </CardContent>
        </Card>
      ) : (
        pendingUsers.map((approval) => (
          <Card key={approval.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {approval.user.full_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {approval.user.email}
                  </p>
                </div>
                <Badge variant="outline">                  {approval.requested_role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-sm text-muted-foreground">
                    {approval.company_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Company Size</p>
                  <p className="text-sm text-muted-foreground">
                    {approval.company_size || 'Not provided'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Use Case</p>
                  <p className="text-sm text-muted-foreground">
                    {approval.use_case || 'Not provided'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Registered {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApproval(approval.id, approval.user_id, true)}
                  className="flex-1"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleApproval(approval.id, approval.user_id, false)}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}