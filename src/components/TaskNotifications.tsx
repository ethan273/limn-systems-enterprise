"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Calendar,
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
  onNotificationClick?: (notification: TaskNotification) => void;
}

export default function TaskNotifications({ onNotificationClick }: TaskNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock current user
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

  // Initialize with mock notifications
  useEffect(() => {
    const mockNotifications: TaskNotification[] = [
      {
        id: "1",
        type: 'task_assigned',
        title: "New task assigned",
        message: "You have been assigned to 'Fix login bug'",
        taskId: "task-1",
        taskTitle: "Fix login bug",
        userId: "manager-1",
        userName: "Sarah Johnson",
        isRead: false,
        isImportant: true,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        id: "2",
        type: 'task_commented',
        title: "New comment",
        message: "Mike Johnson commented on 'Database migration'",
        taskId: "task-2",
        taskTitle: "Database migration",
        userId: "user-2",
        userName: "Mike Johnson",
        isRead: false,
        isImportant: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        id: "3",
        type: 'task_due_soon',
        title: "Task due soon",
        message: "'Update documentation' is due in 2 hours",
        taskId: "task-3",
        taskTitle: "Update documentation",
        userId: "system",
        userName: "System",
        isRead: false,
        isImportant: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        id: "4",
        type: 'task_completed',
        title: "Task completed",
        message: "Jane Smith completed 'Design review'",
        taskId: "task-4",
        taskTitle: "Design review",
        userId: "user-3",
        userName: "Jane Smith",
        isRead: true,
        isImportant: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: "5",
        type: 'task_mentioned',
        title: "You were mentioned",
        message: "You were mentioned in 'Project planning'",
        taskId: "task-5",
        taskTitle: "Project planning",
        userId: "user-4",
        userName: "Alex Chen",
        isRead: true,
        isImportant: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "6",
        type: 'task_overdue',
        title: "Task overdue",
        message: "'Client presentation' is overdue by 1 day",
        taskId: "task-6",
        taskTitle: "Client presentation",
        userId: "system",
        userName: "System",
        isRead: true,
        isImportant: true,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const importantUnreadCount = notifications.filter(n => !n.isRead && n.isImportant).length;

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
        return <Bell className="h-4 w-4 text-gray-400" />;
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
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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
          className="relative hover:bg-gray-800"
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
          {notifications.length > 0 ? (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-700/20 transition-colors ${
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
                            !notification.isRead ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
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
            <div className="text-center py-12 px-6 text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm">You're all caught up! New notifications will appear here.</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="flex items-center justify-between text-xs text-gray-500">
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