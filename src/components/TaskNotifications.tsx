"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar as _Avatar, AvatarFallback as _AvatarFallback, AvatarImage as _AvatarImage } from "@/components/ui/avatar";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 Bell,
 BellDot,
 Check,
 CheckCheck,
 Trash2,
 Settings,
 User,
 MessageSquare,
 CheckCircle2,
 Clock,
 AlertTriangle,
 FileText,
 Users,
 Calendar as _Calendar,
 Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type NotificationType =
 | 'task_assigned'
 | 'task_completed'
 | 'task_commented'
 | 'task_due_soon'
 | 'task_overdue'
 | 'task_status_changed'
 | 'task_mentioned'
 | 'task_priority_changed';

interface TaskNotification {
 id: string;
 type: NotificationType;
 title: string;
 message: string;
 taskId: string;
 taskTitle: string;
 userId: string;
 userName: string;
 userAvatar?: string;
 isRead: boolean;
 isImportant: boolean;
 createdAt: Date;
 actionUrl?: string;
}

interface TaskNotificationsProps {
 onNotificationClick?: (_notification: TaskNotification) => void;
}

export default function TaskNotifications({ onNotificationClick }: TaskNotificationsProps) {
 const { user } = useAuth();
 const [isOpen, setIsOpen] = useState(false);
 const [notifications, setNotifications] = useState<TaskNotification[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 // Get current user ID from auth
 const currentUserId = user?.id;

 // Load notifications from API
 useEffect(() => {
 const loadNotifications = async () => {
 if (!currentUserId) {
 setIsLoading(false);
 return;
 }

 try {
 // TODO: Implement notifications API endpoint
 // const notificationsData = await api.notifications.getUserNotifications.query({ userId: currentUserId });
 // setNotifications(notificationsData);
 console.log('Loading notifications for user:', currentUserId);
 // For now, set empty array since we don't have the API yet
 setNotifications([]);
 } catch (error) {
 console.error('Failed to load notifications:', error);
 setNotifications([]);
 } finally {
 setIsLoading(false);
 }
 };

 loadNotifications();
 }, [currentUserId]);

 const unreadCount = notifications.filter(n => !n.isRead).length;
 const _importantUnreadCount = notifications.filter(n => !n.isRead && n.isImportant).length;

 const getNotificationIcon = (type: NotificationType) => {
 switch (type) {
 case 'task_assigned':
 return <User className="h-4 w-4 text-blue-400" />;
 case 'task_completed':
 return <CheckCircle2 className="h-4 w-4 text-green-400" />;
 case 'task_commented':
 return <MessageSquare className="h-4 w-4 text-cyan-400" />;
 case 'task_due_soon':
 return <Clock className="h-4 w-4 text-yellow-400" />;
 case 'task_overdue':
 return <AlertTriangle className="h-4 w-4 text-red-400" />;
 case 'task_status_changed':
 return <FileText className="h-4 w-4 text-purple-400" />;
 case 'task_mentioned':
 return <Users className="h-4 w-4 text-pink-400" />;
 case 'task_priority_changed':
 return <Star className="h-4 w-4 text-orange-400" />;
 default:
 return <Bell className="h-4 w-4 text-tertiary" />;
 }
 };

 const getNotificationColor = (type: NotificationType) => {
 switch (type) {
 case 'task_assigned':
 return 'border-blue-500/30 bg-blue-500/5';
 case 'task_completed':
 return 'border-green-500/30 bg-green-500/5';
 case 'task_commented':
 return 'border-cyan-500/30 bg-cyan-500/5';
 case 'task_due_soon':
 return 'border-yellow-500/30 bg-yellow-500/5';
 case 'task_overdue':
 return 'border-red-500/30 bg-red-500/5';
 case 'task_status_changed':
 return 'border-purple-500/30 bg-purple-500/5';
 case 'task_mentioned':
 return 'border-pink-500/30 bg-pink-500/5';
 case 'task_priority_changed':
 return 'border-orange-500/30 bg-orange-500/5';
 default:
 return 'border/30 card';
 }
 };

 const markAsRead = async (notificationId: string) => {
 setNotifications(prev =>
 prev.map(n =>
 n.id === notificationId ? { ...n, isRead: true } : n
 )
 );

 try {
 // TODO: Implement notification API endpoints
 // await api.notifications.markAsRead.mutate({ notificationId });
 console.log('Marking notification as read:', notificationId);
 } catch (error) {
 console.error('Failed to mark notification as read:', error);
 // Revert the optimistic update
 setNotifications(prev =>
 prev.map(n =>
 n.id === notificationId ? { ...n, isRead: false } : n
 )
 );
 }
 };

 const markAllAsRead = async () => {
 const unreadNotifications = notifications.filter(n => !n.isRead);

 setNotifications(prev =>
 prev.map(n => ({ ...n, isRead: true }))
 );

 try {
 // TODO: Implement notification API endpoints
 // await api.notifications.markAllAsRead.mutate({ userId: currentUserId });
 console.log('Marking all notifications as read for user:', currentUserId);
 } catch (error) {
 console.error('Failed to mark all notifications as read:', error);
 // Revert the optimistic update
 setNotifications(prev =>
 prev.map(n => {
 const wasUnread = unreadNotifications.find(un => un.id === n.id);
 return wasUnread ? { ...n, isRead: false } : n;
 })
 );
 }
 };

 const deleteNotification = async (notificationId: string) => {
 const deletedNotification = notifications.find(n => n.id === notificationId);

 setNotifications(prev =>
 prev.filter(n => n.id !== notificationId)
 );

 try {
 // TODO: Implement notification API endpoints
 // await api.notifications.deleteNotification.mutate({ notificationId });
 console.log('Deleting notification:', notificationId);
 } catch (error) {
 console.error('Failed to delete notification:', error);
 // Revert the optimistic update
 if (deletedNotification) {
 setNotifications(prev => [...prev, deletedNotification].sort((a, b) =>
 new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
 ));
 }
 }
 };

 const clearAllNotifications = async () => {
 const previousNotifications = [...notifications];

 setNotifications([]);

 try {
 // TODO: Implement notification API endpoints
 // await api.notifications.clearAll.mutate({ userId: currentUserId });
 console.log('Clearing all notifications for user:', currentUserId);
 } catch (error) {
 console.error('Failed to clear all notifications:', error);
 // Revert the optimistic update
 setNotifications(previousNotifications);
 }
 };

 const handleNotificationClick = (notification: TaskNotification) => {
 if (!notification.isRead) {
 markAsRead(notification.id);
 }
 onNotificationClick?.(notification);
 setIsOpen(false);
 };

 return (
 <Dialog open={isOpen} onOpenChange={setIsOpen}>
 <DialogTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="relative hover:card"
 >
 {unreadCount > 0 ? (
 <BellDot className="h-5 w-5" />
 ) : (
 <Bell className="h-5 w-5" />
 )}
 {unreadCount > 0 && (
 <Badge
 variant="destructive"
 className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
 >
 {unreadCount > 99 ? '99+' : unreadCount}
 </Badge>
 )}
 </Button>
 </DialogTrigger>

 <DialogContent className="max-w-lg max-h-[80vh] p-0">
 <DialogHeader className="p-6 pb-0">
 <div className="flex items-center justify-between">
 <DialogTitle className="flex items-center gap-2">
 <Bell className="h-5 w-5" />
 Notifications
 {unreadCount > 0 && (
 <Badge variant="secondary">
 {unreadCount} unread
 </Badge>
 )}
 </DialogTitle>
 <DialogDescription>
 View and manage your task-related notifications.
 </DialogDescription>

 <div className="flex items-center gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm">
 <Settings className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem
 onClick={markAllAsRead}
 disabled={unreadCount === 0}
 >
 <CheckCheck className="h-4 w-4 mr-2" />
 Mark all as read
 </DropdownMenuItem>
 <DropdownMenuItem
 onClick={clearAllNotifications}
 disabled={notifications.length === 0}
 className="text-red-400"
 >
 <Trash2 className="h-4 w-4 mr-2" />
 Clear all
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem>
 <Settings className="h-4 w-4 mr-2" />
 Notification Settings
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </DialogHeader>

 <div className="max-h-[60vh] overflow-y-auto">
 {isLoading ? (
 <div className="text-center py-12 px-6 text-tertiary">
 <Bell className="h-12 w-12 mx-auto mb-4 text-secondary animate-pulse" />
 <h3 className="text-lg font-medium mb-2">Loading notifications...</h3>
 <p className="text-sm">Please wait while we fetch your notifications.</p>
 </div>
 ) : notifications.length > 0 ? (
 <div className="space-y-1 p-2">
 {notifications.map((notification) => (
 <div
 key={notification.id}
 className={`p-4 rounded-lg border cursor-pointer hover:card/20 transition-colors ${
 getNotificationColor(notification.type)
 } ${
 !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
 }`}
 onClick={() => handleNotificationClick(notification)}
 >
 <div className="flex items-start gap-3">
 <div className="flex-shrink-0 pt-1">
 {getNotificationIcon(notification.type)}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1 min-w-0">
 <p className={`text-sm font-medium ${
 !notification.isRead ? 'text-white' : 'text-tertiary'
 }`}>
 {notification.title}
 </p>
 <p className="text-sm text-tertiary mt-1">
 {notification.message}
 </p>

 <div className="flex items-center gap-2 mt-2">
 <span className="text-xs text-secondary">
 {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
 </span>
 {notification.isImportant && (
 <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">
 Important
 </Badge>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1">
 {!notification.isRead && (
 <div className="w-2 h-2 bg-blue-500 rounded-full" />
 )}

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
 onClick={(e) => e.stopPropagation()}
 >
 <Settings className="h-3 w-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
 {!notification.isRead ? (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 markAsRead(notification.id);
 }}
 >
 <Check className="h-4 w-4 mr-2" />
 Mark as read
 </DropdownMenuItem>
 ) : (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 setNotifications(prev =>
 prev.map(n =>
 n.id === notification.id ? { ...n, isRead: false } : n
 )
 );
 }}
 >
 <Bell className="h-4 w-4 mr-2" />
 Mark as unread
 </DropdownMenuItem>
 )}
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 deleteNotification(notification.id);
 }}
 className="text-red-400"
 >
 <Trash2 className="h-4 w-4 mr-2" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-12 px-6 text-tertiary">
 <Bell className="h-12 w-12 mx-auto mb-4 text-secondary" />
 <h3 className="text-lg font-medium mb-2">No notifications</h3>
 <p className="text-sm">You&apos;re all caught up! New notifications will appear here.</p>
 </div>
 )}
 </div>

 {notifications.length > 0 && (
 <div className="p-4 border-t border card/30">
 <div className="flex items-center justify-between text-xs text-secondary">
 <span>{notifications.length} total notifications</span>
 {unreadCount > 0 && (
 <Button
 variant="ghost"
 size="sm"
 onClick={markAllAsRead}
 className="text-xs h-6"
 >
 Mark all as read
 </Button>
 )}
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>
 );
}