/**
 * Email Campaigns Admin Page
 *
 * UI for managing email campaigns
 *
 * @module admin/email-campaigns
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Trash2, BarChart3, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { RecipientData, CampaignStatus } from '@/lib/services/email-types';

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'secondary',
  scheduled: 'default',
  sending: 'default',
  sent: 'default',
  cancelled: 'destructive',
};

export default function EmailCampaignsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [recipientEmails, setRecipientEmails] = useState<string>('');

  // Queries
  const { data: campaigns, isLoading, refetch } = api.emailCampaigns.list.useQuery();
  const { data: _templates } = api.emailTemplates.list.useQuery({ is_active: true });
  const { data: queueStatus } = api.emailCampaigns.getQueueStatus.useQuery();
  const { data: stats } = api.emailCampaigns.getStats.useQuery();

  // Mutations
  const createMutation = api.emailCampaigns.create.useMutation({
    onSuccess: () => {
      toast.success('Campaign created successfully');
      setIsCreateDialogOpen(false);
      setRecipientEmails('');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const sendMutation = api.emailCampaigns.send.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Campaign sent! ${result.sent_count} emails delivered.`);
      } else {
        toast.warning(
          `Campaign partially sent: ${result.sent_count} succeeded, ${result.failed_count} failed.`
        );
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });

  const deleteMutation = api.emailCampaigns.delete.useMutation({
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
  });

  const cancelMutation = api.emailCampaigns.cancel.useMutation({
    onSuccess: () => {
      toast.success('Campaign cancelled');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to cancel campaign: ${error.message}`);
    },
  });

  const processQueueMutation = api.emailCampaigns.processQueue.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Queue processed: ${result.sent_count} sent, ${result.failed_count} failed.`
      );
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to process queue: ${error.message}`);
    },
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Parse recipients
    const recipientList: RecipientData[] = recipientEmails
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [email, name] = line.split(',').map((s) => s.trim());
        return { email, name };
      });

    createMutation.mutate({
      campaign_name: formData.get('campaign_name') as string,
      subject_line: formData.get('subject_line') as string,
      email_template: formData.get('email_template') as string,
      from_name: (formData.get('from_name') as string) || undefined,
      from_email: (formData.get('from_email') as string) || undefined,
      reply_to: (formData.get('reply_to') as string) || undefined,
      recipient_list: recipientList,
      status: (formData.get('status') as CampaignStatus) || 'draft',
    });
  };

  const handleSend = (id: string) => {
    if (confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      sendMutation.mutate({ id });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this campaign?')) {
      cancelMutation.mutate({ id });
    }
  };

  const filteredCampaigns =
    selectedStatus === 'all'
      ? campaigns
      : campaigns?.filter((c) => c.status === selectedStatus);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email marketing campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => processQueueMutation.mutate()}
            disabled={processQueueMutation.isPending}
          >
            {processQueueMutation.isPending ? 'Processing...' : 'Process Queue'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>
                  Create a new email campaign
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign_name">Campaign Name</Label>
                    <Input
                      id="campaign_name"
                      name="campaign_name"
                      placeholder="November Newsletter"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject_line">Subject Line</Label>
                    <Input
                      id="subject_line"
                      name="subject_line"
                      placeholder="Welcome to our newsletter!"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_template">Email Content (HTML)</Label>
                    <Textarea
                      id="email_template"
                      name="email_template"
                      placeholder="<h1>Hello {{name}}!</h1>"
                      rows={8}
                      required
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {`{{variable}}`} for personalization (e.g., {`{{name}}`}, {`{{email}}`})
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from_name">From Name</Label>
                      <Input
                        id="from_name"
                        name="from_name"
                        placeholder="Limn Systems"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from_email">From Email</Label>
                      <Input
                        id="from_email"
                        name="from_email"
                        type="email"
                        placeholder="no-reply@limn.us.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reply_to">Reply To</Label>
                      <Input
                        id="reply_to"
                        name="reply_to"
                        type="email"
                        placeholder="support@limn.us.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Textarea
                      id="recipients"
                      value={recipientEmails}
                      onChange={(e) => setRecipientEmails(e.target.value)}
                      placeholder="email@example.com, John Doe&#10;another@example.com, Jane Smith"
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      One recipient per line. Format: email@example.com, Name (optional)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="draft">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.reduce((acc, s) => acc + s.sent_count, 0) ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Opens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.reduce((acc, s) => acc + s.open_count, 0) ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueStatus?.find((s) => s.status === 'pending')?.count ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-4">
        <Label>Filter by status:</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            {filteredCampaigns?.length ?? 0} campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns?.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.campaign_name}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {campaign.subject_line}
                  </TableCell>
                  <TableCell>{campaign.total_recipients}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[campaign.status] as any}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.sent_count}</TableCell>
                  <TableCell>{campaign.open_count}</TableCell>
                  <TableCell>{campaign.click_count}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/admin/email-campaigns/${campaign.id}/analytics`)
                        }
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>

                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSend(campaign.id)}
                          disabled={sendMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}

                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(campaign.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
