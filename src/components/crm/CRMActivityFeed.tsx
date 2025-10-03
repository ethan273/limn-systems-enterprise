'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
// Avatar component not used in this file
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 // DialogTrigger not used
} from '@/components/ui/dialog';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
 Calendar,
 Clock,
 User,
 Phone,
 Mail,
 MessageSquare,
 FileText,
 DollarSign,
 CheckCircle,
 Plus,
 Search,
 ExternalLink,
 Video,
 Coffee,
 Briefcase,
 Target,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Activity Types
export type ActivityType =
 | 'call'
 | 'email'
 | 'meeting'
 | 'note'
 | 'task'
 | 'deal'
 | 'proposal'
 | 'follow_up'
 | 'demo'
 | 'contract'
 | 'payment'
 | 'status_change'
 | 'other';

// Activity Status
export type ActivityStatus = 'pending' | 'completed' | 'cancelled' | 'overdue';

export interface CRMActivity {
 id: string;
 type: ActivityType;
 title: string;
 description?: string;
 status: ActivityStatus;
 created_at: Date;
 updated_at: Date;
 due_date?: Date;
 completed_at?: Date;
 user_id: string;
 user_name: string;
 entity_type: 'contact' | 'lead' | 'customer' | 'opportunity';
 entity_id: string;
 entity_name: string;
 metadata?: Record<string, any>;
}

interface CRMActivityFeedProps {
 activities: CRMActivity[];
 onActivityAdd?: (_activity: Omit<CRMActivity, 'id' | 'created_at' | 'updated_at'>) => void;
 onActivityUpdate?: (_id: string, _updates: Partial<CRMActivity>) => void;
 entityType?: 'contact' | 'lead' | 'customer' | 'opportunity';
 entityId?: string;
 showAddButton?: boolean;
 showFilters?: boolean;
 maxHeight?: string;
 className?: string;
 currentUserId?: string;
 currentUserName?: string;
}

interface AddActivityDialogProps {
 open: boolean;
 onOpenChange: (_open: boolean) => void;
 onActivityAdd: (_activity: Omit<CRMActivity, 'id' | 'created_at' | 'updated_at'>) => void;
 entityType?: 'contact' | 'lead' | 'customer' | 'opportunity';
 entityId?: string;
 entityName?: string;
 currentUserId?: string;
 currentUserName?: string;
}

function AddActivityDialog({
 open,
 onOpenChange,
 onActivityAdd,
 entityType,
 entityId,
 entityName,
 currentUserId,
 currentUserName,
}: AddActivityDialogProps) {
 const [activityType, setActivityType] = useState<ActivityType>('note');
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [dueDate, setDueDate] = useState('');
 const [status, setStatus] = useState<ActivityStatus>('pending');

 const handleSubmit = () => {
 if (!title.trim() || !currentUserId || !currentUserName) return;

 const activity: Omit<CRMActivity, 'id' | 'created_at' | 'updated_at'> = {
 type: activityType,
 title: title.trim(),
 description: description.trim() || undefined,
 status,
 due_date: dueDate ? new Date(dueDate) : undefined,
 completed_at: status === 'completed' ? new Date() : undefined,
 user_id: currentUserId,
 user_name: currentUserName,
 entity_type: entityType || 'contact',
 entity_id: entityId || '',
 entity_name: entityName || '',
 metadata: {},
 };

 onActivityAdd(activity);

 // Reset form
 setTitle('');
 setDescription('');
 setDueDate('');
 setStatus('pending');
 onOpenChange(false);
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle>Add Activity</DialogTitle>
 <DialogDescription>
 Record a new activity or interaction
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4">
 <div>
 <Label htmlFor="activity-type">Activity Type</Label>
 <Select value={activityType} onValueChange={(value: ActivityType) => setActivityType(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="call">Phone Call</SelectItem>
 <SelectItem value="email">Email</SelectItem>
 <SelectItem value="meeting">Meeting</SelectItem>
 <SelectItem value="note">Note</SelectItem>
 <SelectItem value="task">Task</SelectItem>
 <SelectItem value="demo">Demo</SelectItem>
 <SelectItem value="proposal">Proposal</SelectItem>
 <SelectItem value="follow_up">Follow Up</SelectItem>
 <SelectItem value="contract">Contract</SelectItem>
 <SelectItem value="other">Other</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor="activity-title">Title *</Label>
 <Input
 id="activity-title"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Brief description of the activity"
 />
 </div>

 <div>
 <Label htmlFor="activity-description">Description</Label>
 <Textarea
 id="activity-description"
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Additional details about the activity"
 rows={3}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label htmlFor="activity-status">Status</Label>
 <Select value={status} onValueChange={(value: ActivityStatus) => setStatus(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="pending">Pending</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 <SelectItem value="cancelled">Cancelled</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor="activity-due-date">Due Date</Label>
 <Input
 id="activity-due-date"
 type="datetime-local"
 value={dueDate}
 onChange={(e) => setDueDate(e.target.value)}
 />
 </div>
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button onClick={handleSubmit} disabled={!title.trim()}>
 Add Activity
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}

function getActivityIcon(type: ActivityType) {
 switch (type) {
 case 'call': return Phone;
 case 'email': return Mail;
 case 'meeting': return Video;
 case 'note': return MessageSquare;
 case 'task': return CheckCircle;
 case 'deal': return DollarSign;
 case 'proposal': return FileText;
 case 'follow_up': return Clock;
 case 'demo': return Coffee;
 case 'contract': return Briefcase;
 case 'payment': return DollarSign;
 case 'status_change': return Target;
 default: return MessageSquare;
 }
}

function getActivityColor(type: ActivityType) {
 switch (type) {
 case 'call': return 'text-blue-400';
 case 'email': return 'text-purple-400';
 case 'meeting': return 'text-green-400';
 case 'note': return 'text-tertiary';
 case 'task': return 'text-orange-400';
 case 'deal': return 'text-yellow-400';
 case 'proposal': return 'text-indigo-400';
 case 'follow_up': return 'text-pink-400';
 case 'demo': return 'text-emerald-400';
 case 'contract': return 'text-violet-400';
 case 'payment': return 'text-green-400';
 case 'status_change': return 'text-cyan-400';
 default: return 'text-tertiary';
 }
}

function getStatusColor(status: ActivityStatus) {
 switch (status) {
 case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
 case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
 case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
 case 'overdue': return 'bg-red-500/10 text-red-400 border-red-500/20';
 default: return 'card text-tertiary border/20';
 }
}

export function CRMActivityFeed({
 activities,
 onActivityAdd,
 onActivityUpdate,
 entityType,
 entityId,
 showAddButton = true,
 showFilters = true,
 maxHeight = '400px',
 className = '',
 currentUserId,
 currentUserName,
}: CRMActivityFeedProps) {
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
 const [filterStatus, _setFilterStatus] = useState<ActivityStatus | 'all'>('all');
 const [searchTerm, setSearchTerm] = useState('');
 const [activeTab, setActiveTab] = useState('all');

 // Filter activities
 const filteredActivities = activities.filter((activity) => {
 const matchesType = filterType === 'all' || activity.type === filterType;
 const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
 const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 activity.user_name.toLowerCase().includes(searchTerm.toLowerCase());

 if (activeTab === 'pending') {
 return matchesType && matchesStatus && matchesSearch && activity.status === 'pending';
 }
 if (activeTab === 'completed') {
 return matchesType && matchesStatus && matchesSearch && activity.status === 'completed';
 }

 return matchesType && matchesStatus && matchesSearch;
 });

 // Sort activities by creation date (newest first)
 const sortedActivities = filteredActivities.sort((a, b) =>
 new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
 );

 const handleActivityAdd = (activity: Omit<CRMActivity, 'id' | 'created_at' | 'updated_at'>) => {
 if (onActivityAdd) {
 onActivityAdd(activity);
 }
 };

 const markAsCompleted = (activityId: string) => {
 if (onActivityUpdate) {
 onActivityUpdate(activityId, {
 status: 'completed',
 completed_at: new Date(),
 });
 }
 };

 return (
 <div className={`space-y-4 ${className}`}>
 {/* Header */}
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-medium text-foreground">Activity Feed</h3>
 {showAddButton && onActivityAdd && currentUserId && (
 <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
 <Plus className="w-4 h-4 mr-2" />
 Add Activity
 </Button>
 )}
 </div>

 {/* Filters */}
 {showFilters && (
 <div className="space-y-3">
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="all">All Activities</TabsTrigger>
 <TabsTrigger value="pending">Pending</TabsTrigger>
 <TabsTrigger value="completed">Completed</TabsTrigger>
 </TabsList>
 </Tabs>

 <div className="flex flex-col sm:flex-row gap-2">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
 <Input
 placeholder="Search activities..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10"
 />
 </div>
 <Select value={filterType} onValueChange={(value: ActivityType | 'all') => setFilterType(value)}>
 <SelectTrigger className="w-40">
 <SelectValue placeholder="Type" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Types</SelectItem>
 <SelectItem value="call">Phone Call</SelectItem>
 <SelectItem value="email">Email</SelectItem>
 <SelectItem value="meeting">Meeting</SelectItem>
 <SelectItem value="note">Note</SelectItem>
 <SelectItem value="task">Task</SelectItem>
 <SelectItem value="demo">Demo</SelectItem>
 <SelectItem value="proposal">Proposal</SelectItem>
 <SelectItem value="follow_up">Follow Up</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 )}

 {/* Activity List */}
 <div
 className="space-y-3 overflow-y-auto pr-2"
 style={{ maxHeight }}
 >
 {sortedActivities.length === 0 ? (
 <div className="text-center py-8">
 <MessageSquare className="w-12 h-12 text-tertiary mx-auto mb-4" />
 <h4 className="text-lg font-medium text-foreground mb-2">No activities found</h4>
 <p className="text-tertiary mb-4">
 {searchTerm || filterType !== 'all' || filterStatus !== 'all'
 ? 'Try adjusting your filters'
 : 'Start tracking interactions and activities'
 }
 </p>
 {showAddButton && onActivityAdd && currentUserId && (
 <Button onClick={() => setIsAddDialogOpen(true)}>
 <Plus className="w-4 h-4 mr-2" />
 Add First Activity
 </Button>
 )}
 </div>
 ) : (
 sortedActivities.map((activity) => {
 const Icon = getActivityIcon(activity.type);
 const isOverdue = activity.due_date && new Date(activity.due_date) < new Date() && activity.status === 'pending';
 const activityStatus = isOverdue ? 'overdue' : activity.status;

 return (
 <div
 key={activity.id}
 className="flex gap-3 p-4 card/50 rounded-lg border border hover:border transition-colors"
 >
 {/* Activity Icon */}
 <div className={`flex-shrink-0 w-10 h-10 rounded-full card flex items-center justify-center ${getActivityColor(activity.type)}`}>
 <Icon className="w-5 h-5" />
 </div>

 {/* Activity Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1 min-w-0">
 <h4 className="font-medium text-foreground truncate">{activity.title}</h4>
 <div className="flex items-center gap-2 mt-1">
 <Badge className={getStatusColor(activityStatus)}>
 {activityStatus === 'overdue' ? 'Overdue' : activity.status}
 </Badge>
 <span className="text-sm text-tertiary capitalize">
 {activity.type.replace('_', ' ')}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {activity.status === 'pending' && onActivityUpdate && (
 <Button
 size="sm"
 variant="outline"
 onClick={() => markAsCompleted(activity.id)}
 className="h-7 px-2"
 >
 <CheckCircle className="w-3 h-3 mr-1" />
 Complete
 </Button>
 )}
 </div>
 </div>

 {activity.description && (
 <p className="text-sm text-tertiary mt-2 line-clamp-3">
 {activity.description}
 </p>
 )}

 {/* Activity Metadata */}
 <div className="flex items-center gap-4 mt-3 text-xs text-tertiary">
 <div className="flex items-center gap-1">
 <User className="w-3 h-3" />
 {activity.user_name}
 </div>
 <div className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
 </div>
 {activity.due_date && (
 <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
 <Calendar className="w-3 h-3" />
 Due {format(new Date(activity.due_date), 'MMM d, HH:mm')}
 </div>
 )}
 {activity.entity_name && (
 <div className="flex items-center gap-1">
 <ExternalLink className="w-3 h-3" />
 {activity.entity_name}
 </div>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Add Activity Dialog */}
 {onActivityAdd && (
 <AddActivityDialog
 open={isAddDialogOpen}
 onOpenChange={setIsAddDialogOpen}
 onActivityAdd={handleActivityAdd}
 entityType={entityType}
 entityId={entityId}
 currentUserId={currentUserId}
 currentUserName={currentUserName}
 />
 )}
 </div>
 );
}

// Simplified activity feed for specific entities
export function EntityActivityFeed({
 entityType,
 entityId,
 entityName: _entityName,
 activities,
 onActivityAdd,
 onActivityUpdate,
 currentUserId,
 currentUserName,
 className = '',
}: {
 entityType: 'contact' | 'lead' | 'customer' | 'opportunity';
 entityId: string;
 entityName: string;
 activities: CRMActivity[];
 onActivityAdd?: (_activity: Omit<CRMActivity, 'id' | 'created_at' | 'updated_at'>) => void;
 onActivityUpdate?: (_id: string, _updates: Partial<CRMActivity>) => void;
 currentUserId?: string;
 currentUserName?: string;
 className?: string;
}) {
 const entityActivities = activities.filter(
 activity => activity.entity_type === entityType && activity.entity_id === entityId
 );

 return (
 <CRMActivityFeed
 activities={entityActivities}
 onActivityAdd={onActivityAdd}
 onActivityUpdate={onActivityUpdate}
 entityType={entityType}
 entityId={entityId}
 currentUserId={currentUserId}
 currentUserName={currentUserName}
 className={className}
 />
 );
}