'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  Phone,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Building2,
  Target,
  Handshake,
  FileText,
  Star,
  X,
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isThisWeek } from 'date-fns';

// Notification Types
export type CRMNotificationType =
  | 'follow_up_due'
  | 'meeting_reminder'
  | 'deal_stage_change'
  | 'lead_assignment'
  | 'customer_milestone'
  | 'payment_due'
  | 'contract_expiry'
  | 'activity_overdue'
  | 'lead_score_change'
  | 'opportunity_won'
  | 'opportunity_lost'
  | 'birthday'
  | 'anniversary'
  | 'renewal_reminder'
  | 'hot_lead'
  | 'system_alert'
  | 'team_update';

// Notification Priority
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification Status
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';

export interface CRMNotification {
  id: string;
  type: CRMNotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  created_at: Date;
  read_at?: Date;
  entity_type?: 'contact' | 'lead' | 'customer' | 'opportunity' | 'deal';
  entity_id?: string;
  entity_name?: string;
  user_id?: string;
  user_name?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
}

interface CRMNotificationsProps {
  notifications: CRMNotification[];
  onNotificationRead?: (id: string) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationAction?: (notification: CRMNotification) => void;
  onBulkMarkRead?: (ids: string[]) => void;
  onBulkDismiss?: (ids: string[]) => void;
  showBellIcon?: boolean;
  maxDisplayCount?: number;
  className?: string;
}

interface NotificationCenterProps {
  notifications: CRMNotification[];
  onNotificationRead?: (id: string) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationAction?: (notification: CRMNotification) => void;
  onBulkMarkRead?: (ids: string[]) => void;
  onBulkDismiss?: (ids: string[]) => void;
}

function getNotificationIcon(type: CRMNotificationType) {
  switch (type) {
    case 'follow_up_due': return Clock;
    case 'meeting_reminder': return Calendar;
    case 'deal_stage_change': return TrendingUp;
    case 'lead_assignment': return Users;
    case 'customer_milestone': return Star;
    case 'payment_due': return DollarSign;
    case 'contract_expiry': return FileText;
    case 'activity_overdue': return AlertTriangle;
    case 'lead_score_change': return Target;
    case 'opportunity_won': return CheckCircle;
    case 'opportunity_lost': return X;
    case 'birthday': return Star;
    case 'anniversary': return Star;
    case 'renewal_reminder': return Calendar;
    case 'hot_lead': return TrendingUp;
    case 'system_alert': return AlertTriangle;
    case 'team_update': return Users;
    default: return Bell;
  }
}

function getNotificationColor(type: CRMNotificationType, priority: NotificationPriority) {
  if (priority === 'urgent') return 'text-red-400';
  if (priority === 'high') return 'text-orange-400';

  switch (type) {
    case 'follow_up_due': return 'text-yellow-400';
    case 'meeting_reminder': return 'text-blue-400';
    case 'deal_stage_change': return 'text-green-400';
    case 'lead_assignment': return 'text-purple-400';
    case 'customer_milestone': return 'text-indigo-400';
    case 'payment_due': return 'text-yellow-400';
    case 'contract_expiry': return 'text-orange-400';
    case 'activity_overdue': return 'text-red-400';
    case 'lead_score_change': return 'text-cyan-400';
    case 'opportunity_won': return 'text-green-400';
    case 'opportunity_lost': return 'text-red-400';
    case 'birthday': return 'text-pink-400';
    case 'anniversary': return 'text-violet-400';
    case 'renewal_reminder': return 'text-blue-400';
    case 'hot_lead': return 'text-orange-400';
    case 'system_alert': return 'text-yellow-400';
    case 'team_update': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

function getPriorityColor(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'low': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

function NotificationCenter({
  notifications,
  onNotificationRead,
  onNotificationDismiss,
  onNotificationAction,
  onBulkMarkRead,
  onBulkDismiss,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredNotifications = notifications.filter((notification) => {
    switch (activeTab) {
      case 'unread':
        return notification.status === 'unread';
      case 'today':
        return isToday(new Date(notification.created_at));
      case 'this_week':
        return isThisWeek(new Date(notification.created_at));
      default:
        return notification.status !== 'archived';
    }
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const todayCount = notifications.filter(n => isToday(new Date(n.created_at))).length;

  const handleNotificationClick = (notification: CRMNotification) => {
    if (notification.status === 'unread' && onNotificationRead) {
      onNotificationRead(notification.id);
    }
    if (onNotificationAction) {
      onNotificationAction(notification);
    }
  };

  const handleBulkMarkRead = () => {
    if (onBulkMarkRead && selectedIds.length > 0) {
      onBulkMarkRead(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkDismiss = () => {
    if (onBulkDismiss && selectedIds.length > 0) {
      onBulkDismiss(selectedIds);
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>
                Mark Read ({selectedIds.length})
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDismiss}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="today" className="text-xs">
            Today {todayCount > 0 && `(${todayCount})`}
          </TabsTrigger>
          <TabsTrigger value="this_week" className="text-xs">Week</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No notifications</h4>
                <p className="text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const isSelected = selectedIds.includes(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                        notification.status === 'unread'
                          ? 'bg-gray-800/30 border-l-2 border-blue-500'
                          : ''
                      } ${isSelected ? 'bg-blue-500/10' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(notification.id);
                        }}
                        className="mt-1"
                      />

                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm ${notification.status === 'unread' ? 'font-semibold text-white' : 'font-medium text-gray-300'} truncate`}>
                                {notification.title}
                              </h4>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              {notification.entity_name && (
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  {notification.entity_name}
                                </span>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {notification.status === 'unread' && onNotificationRead && (
                                <DropdownMenuItem onClick={() => onNotificationRead(notification.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              {onNotificationDismiss && (
                                <DropdownMenuItem
                                  onClick={() => onNotificationDismiss(notification.id)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Dismiss
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {notification.action_label && notification.action_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNotificationAction) {
                                onNotificationAction(notification);
                              }
                            }}
                          >
                            {notification.action_label}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CRMNotifications({
  notifications,
  onNotificationRead,
  onNotificationDismiss,
  onNotificationAction,
  onBulkMarkRead,
  onBulkDismiss,
  showBellIcon = true,
  maxDisplayCount = 5,
  className = '',
}: CRMNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const recentNotifications = notifications
    .filter(n => n.status !== 'archived')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, maxDisplayCount);

  const urgentNotifications = notifications.filter(
    n => n.status === 'unread' && n.priority === 'urgent'
  );

  return (
    <div className={`relative ${className}`}>
      {showBellIcon ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              {unreadCount > 0 ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0">
            <NotificationCenter
              notifications={notifications}
              onNotificationRead={onNotificationRead}
              onNotificationDismiss={onNotificationDismiss}
              onNotificationAction={onNotificationAction}
              onBulkMarkRead={onBulkMarkRead}
              onBulkDismiss={onBulkDismiss}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <NotificationCenter
          notifications={notifications}
          onNotificationRead={onNotificationRead}
          onNotificationDismiss={onNotificationDismiss}
          onNotificationAction={onNotificationAction}
          onBulkMarkRead={onBulkMarkRead}
          onBulkDismiss={onBulkDismiss}
        />
      )}

      {/* Urgent Notifications Toast */}
      {urgentNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {urgentNotifications.slice(0, 3).map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className="bg-red-900/90 border border-red-500/50 rounded-lg p-4 max-w-sm shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
                    <p className="text-red-200 text-xs mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {notification.action_label && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs border-red-400 text-red-400 hover:bg-red-500/20"
                          onClick={() => onNotificationAction?.(notification)}
                        >
                          {notification.action_label}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                        onClick={() => onNotificationDismiss?.(notification.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Quick notification variants
export function NotificationBell({
  notifications,
  onNotificationRead,
  onNotificationAction,
  className = '',
}: {
  notifications: CRMNotification[];
  onNotificationRead?: (id: string) => void;
  onNotificationAction?: (notification: CRMNotification) => void;
  className?: string;
}) {
  return (
    <CRMNotifications
      notifications={notifications}
      onNotificationRead={onNotificationRead}
      onNotificationAction={onNotificationAction}
      showBellIcon={true}
      maxDisplayCount={10}
      className={className}
    />
  );
}

export function NotificationPanel({
  notifications,
  onNotificationRead,
  onNotificationDismiss,
  onNotificationAction,
  className = '',
}: {
  notifications: CRMNotification[];
  onNotificationRead?: (id: string) => void;
  onNotificationDismiss?: (id: string) => void;
  onNotificationAction?: (notification: CRMNotification) => void;
  className?: string;
}) {
  return (
    <CRMNotifications
      notifications={notifications}
      onNotificationRead={onNotificationRead}
      onNotificationDismiss={onNotificationDismiss}
      onNotificationAction={onNotificationAction}
      showBellIcon={false}
      className={className}
    />
  );
}

// Utility functions for creating notifications
export function createFollowUpNotification(
  entityName: string,
  entityType: 'contact' | 'lead' | 'customer',
  entityId: string,
  dueDate: Date
): Omit<CRMNotification, 'id' | 'created_at'> {
  return {
    type: 'follow_up_due',
    title: `Follow up due: ${entityName}`,
    message: `Follow up scheduled for ${format(dueDate, 'MMM d, yyyy at HH:mm')}`,
    priority: 'medium',
    status: 'unread',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    action_label: 'View Details',
    action_url: `/crm/${entityType}s/${entityId}`,
  };
}

export function createMeetingReminderNotification(
  title: string,
  startTime: Date,
  participants: string[]
): Omit<CRMNotification, 'id' | 'created_at'> {
  return {
    type: 'meeting_reminder',
    title: `Meeting reminder: ${title}`,
    message: `Meeting starts at ${format(startTime, 'HH:mm')} with ${participants.join(', ')}`,
    priority: 'high',
    status: 'unread',
    action_label: 'Join Meeting',
  };
}

export function createHotLeadNotification(
  leadName: string,
  leadId: string,
  score: number
): Omit<CRMNotification, 'id' | 'created_at'> {
  return {
    type: 'hot_lead',
    title: `Hot lead alert: ${leadName}`,
    message: `Lead score increased to ${score}. Immediate attention recommended.`,
    priority: 'urgent',
    status: 'unread',
    entity_type: 'lead',
    entity_id: leadId,
    entity_name: leadName,
    action_label: 'View Lead',
    action_url: `/crm/leads/${leadId}`,
  };
}