"use client";

import { BellIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useNotificationsRealtime } from "@/hooks/useRealtimeSubscription";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationDropdown() {
  const queryClient = useQueryClient();

  // Get unread count for badge
  const { data: unreadData } = api.notifications.getUnreadCount.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Get notifications with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
  } = api.notifications.getNotifications.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // Mark as read mutation
  const markAsRead = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['notifications', 'getUnreadCount']] });
      queryClient.invalidateQueries({ queryKey: [['notifications', 'getNotifications']] });
    },
  });

  // Mark all as read mutation
  const markAllAsRead = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['notifications']] });
    },
  });

  // Subscribe to realtime notification updates
  useNotificationsRealtime({
    queryKey: ['notifications'],
    event: 'INSERT', // Only listen for new notifications
  });

  const allNotifications = (data?.pages.flatMap((page) => page.notifications) || []) as any[];
  const unreadCount = (unreadData?.count || 0) as number;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="header-icon-button"
          aria-label={`Open notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="w-5 h-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="notification-badge" aria-hidden="true">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80"
        sideOffset={8}
        style={{
          border: 'none',
          borderWidth: 0,
          outline: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead.mutate();
              }}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            allNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-4 py-3 cursor-pointer ${
                  !notification.read_at ? 'bg-muted/50' : ''
                }`}
                onClick={() => {
                  if (!notification.read_at) {
                    markAsRead.mutate({ notificationId: notification.id });
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
                onSelect={() => {
                  if (!notification.read_at) {
                    markAsRead.mutate({ notificationId: notification.id });
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at || ''), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {hasNextPage && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetchNextPage();
              }}
              className="w-full px-4 py-2 text-xs text-center text-primary hover:underline cursor-pointer"
            >
              Load more
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
