/**
 * Service Worker Notification Action Handler
 *
 * Handles notification action button clicks
 */

// Handle notification click (on notification body)
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  console.log('[SW] Notification clicked:', { action, data });

  notification.close();

  // Handle different actions
  if (action === 'view' || !action) {
    // View action or clicking notification body
    event.waitUntil(handleViewAction(data));
  } else if (action === 'complete') {
    event.waitUntil(handleCompleteAction(data));
  } else if (action === 'approve') {
    event.waitUntil(handleApproveAction(data));
  } else if (action === 'reject') {
    event.waitUntil(handleRejectAction(data));
  } else if (action === 'reply') {
    event.waitUntil(handleReplyAction(data));
  } else if (action === 'archive') {
    event.waitUntil(handleArchiveAction(data));
  } else if (action === 'snooze') {
    event.waitUntil(handleSnoozeAction(data));
  } else if (action === 'view-all') {
    event.waitUntil(handleViewAllAction(data));
  } else if (action === 'clear-all') {
    event.waitUntil(handleClearAllAction(data));
  }
});

/**
 * Handle view action - navigate to appropriate page
 */
async function handleViewAction(data) {
  const urlMap = {
    task: `/tasks/${data.taskId}`,
    order: `/orders/${data.orderId}`,
    message: `/messages/${data.messageId}`,
    group: getGroupUrl(data.tag),
  };

  const url = urlMap[data.type] || '/dashboard';

  return focusOrOpenWindow(url);
}

/**
 * Handle complete action for tasks
 */
async function handleCompleteAction(data) {
  if (data.type === 'task' && data.taskId) {
    // Send API request to complete task
    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: data.taskId }),
      });

      // Show success notification
      await self.registration.showNotification('Task Completed', {
        body: `"${data.title}" marked as complete`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `task-complete-${data.taskId}`,
      });
    } catch (error) {
      console.error('[SW] Error completing task:', error);

      // Show error notification
      await self.registration.showNotification('Error', {
        body: 'Failed to complete task. Please try again.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'task-complete-error',
      });
    }
  }
}

/**
 * Handle approve action for orders
 */
async function handleApproveAction(data) {
  if (data.type === 'order' && data.orderId) {
    try {
      await fetch('/api/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId }),
      });

      await self.registration.showNotification('Order Approved', {
        body: `Order ${data.orderNumber} has been approved`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `order-approved-${data.orderId}`,
      });
    } catch (error) {
      console.error('[SW] Error approving order:', error);

      await self.registration.showNotification('Error', {
        body: 'Failed to approve order. Please try again.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'order-approve-error',
      });
    }
  }
}

/**
 * Handle reject action for orders
 */
async function handleRejectAction(data) {
  if (data.type === 'order' && data.orderId) {
    try {
      await fetch('/api/orders/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId }),
      });

      await self.registration.showNotification('Order Rejected', {
        body: `Order ${data.orderNumber} has been rejected`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `order-rejected-${data.orderId}`,
      });
    } catch (error) {
      console.error('[SW] Error rejecting order:', error);

      await self.registration.showNotification('Error', {
        body: 'Failed to reject order. Please try again.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'order-reject-error',
      });
    }
  }
}

/**
 * Handle reply action for messages
 */
async function handleReplyAction(data) {
  if (data.type === 'message' && data.messageId) {
    // Open message reply page
    return focusOrOpenWindow(`/messages/${data.messageId}/reply`);
  }
}

/**
 * Handle archive action for messages
 */
async function handleArchiveAction(data) {
  if (data.type === 'message' && data.messageId) {
    try {
      await fetch('/api/messages/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: data.messageId }),
      });

      await self.registration.showNotification('Message Archived', {
        body: 'Message has been archived',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `message-archived-${data.messageId}`,
      });
    } catch (error) {
      console.error('[SW] Error archiving message:', error);
    }
  }
}

/**
 * Handle snooze action for tasks
 */
async function handleSnoozeAction(data) {
  if (data.type === 'task' && data.taskId) {
    try {
      // Snooze for 1 hour
      const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000);

      await fetch('/api/tasks/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: data.taskId, snoozeUntil }),
      });

      await self.registration.showNotification('Task Snoozed', {
        body: `"${data.title}" snoozed for 1 hour`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `task-snoozed-${data.taskId}`,
      });
    } catch (error) {
      console.error('[SW] Error snoozing task:', error);
    }
  }
}

/**
 * Handle view all action for grouped notifications
 */
async function handleViewAllAction(data) {
  const url = getGroupUrl(data.tag);
  return focusOrOpenWindow(url);
}

/**
 * Handle clear all action for grouped notifications
 */
async function handleClearAllAction(data) {
  // Get all notifications with this tag
  const notifications = await self.registration.getNotifications({
    tag: data.tag,
  });

  // Close all matching notifications
  notifications.forEach(notification => notification.close());
}

/**
 * Get URL for grouped notifications
 */
function getGroupUrl(tag) {
  const urlMap = {
    tasks: '/tasks',
    orders: '/orders',
    messages: '/messages',
    alerts: '/dashboard',
  };

  return urlMap[tag] || '/dashboard';
}

/**
 * Focus existing window or open new one
 */
async function focusOrOpenWindow(url) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  // Check if there's already a window open
  for (const client of clients) {
    if (client.url === url && 'focus' in client) {
      return client.focus();
    }
  }

  // If no window found, open a new one
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  const data = notification.data || {};

  console.log('[SW] Notification closed:', data);

  // Track notification dismissal analytics
  event.waitUntil(
    fetch('/api/analytics/notification-dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.id,
        type: data.type,
        dismissedAt: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error('[SW] Error tracking notification dismissal:', error);
    })
  );
});
