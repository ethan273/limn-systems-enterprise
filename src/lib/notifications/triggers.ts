/**
 * Notification Triggers
 *
 * Event-driven notification system for key business workflows.
 * Automatically sends notifications when important events occur.
 *
 * Part of Phase 1C Implementation
 */

import { sendNotification } from './unified-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Trigger: Order Status Change
 *
 * Sends notification when order status changes.
 * Notifies customer via email + in-app.
 */
export async function triggerOrderStatusChange(params: {
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
}): Promise<void> {
  try {
    // Get customer user if needed
    const customer = await prisma.customers.findUnique({
      where: { id: params.customerId },
      select: { id: true, name: true, email: true },
    });

    if (!customer) {
      console.warn(`[Notifications] Customer not found: ${params.customerId}`);
      return;
    }

    // Get user_id for in-app notification
    const userProfile = await prisma.user_profiles.findFirst({
      where: { email: customer.email },
      select: { id: true },
    });

    if (!userProfile) {
      console.warn(`[Notifications] User profile not found for customer: ${customer.email}`);
      return;
    }

    await sendNotification({
      recipients: [
        {
          userId: userProfile.id,
          email: customer.email || undefined,
          name: customer.name || undefined,
        },
      ],
      title: `Order #${params.orderNumber} Status Updated`,
      message: `Your order status has changed from "${params.oldStatus}" to "${params.newStatus}".`,
      category: 'order',
      priority: 'normal',
      actionUrl: `/crm/orders/${params.orderId}`,
      actionLabel: 'View Order',
      channels: ['email', 'in_app'],
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
      },
    });

    console.log(`[Notifications] Order status change notification sent for order ${params.orderNumber}`);
  } catch (error) {
    console.error('[Notifications] Error sending order status notification:', error);
  }
}

/**
 * Trigger: Task Assignment
 *
 * Sends notification when task is assigned.
 * Notifies assignee via in-app + email + optional Google Chat.
 */
export async function triggerTaskAssignment(params: {
  taskId: string;
  taskName: string;
  assigneeId: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assignedBy?: string;
  dueDate?: Date;
  priority?: string;
}): Promise<void> {
  try {
    // Get assignee details
    const assignee = await prisma.user_profiles.findUnique({
      where: { id: params.assigneeId },
      select: { id: true, email: true, full_name: true, first_name: true, last_name: true },
    });

    if (!assignee) {
      console.warn(`[Notifications] Assignee not found: ${params.assigneeId}`);
      return;
    }

    const assigneeName = assignee.full_name || `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim();
    const dueDateStr = params.dueDate ? new Date(params.dueDate).toLocaleDateString() : 'No due date';

    await sendNotification({
      recipients: [
        {
          userId: assignee.id,
          email: assignee.email || undefined,
          name: assigneeName,
        },
      ],
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${params.taskName}". Due: ${dueDateStr}`,
      category: 'task',
      priority: params.priority === 'high' || params.priority === 'urgent' ? 'high' : 'normal',
      actionUrl: `/production/tasks?id=${params.taskId}`,
      actionLabel: 'View Task',
      channels: ['in_app', 'email', 'google_chat'],
      metadata: {
        taskId: params.taskId,
        taskName: params.taskName,
        assignedBy: params.assignedBy,
        dueDate: params.dueDate,
        priority: params.priority,
      },
    });

    console.log(`[Notifications] Task assignment notification sent for task ${params.taskName}`);
  } catch (error) {
    console.error('[Notifications] Error sending task assignment notification:', error);
  }
}

/**
 * Trigger: Production Milestone
 *
 * Sends notification when production reaches a milestone.
 * Notifies production team via Google Chat + customer via in-app.
 */
export async function triggerProductionMilestone(params: {
  orderId: string;
  orderNumber: string;
  milestone: string;
  productionStage: string;
  customerId: string;
}): Promise<void> {
  try {
    // Notify production team via Google Chat
    // Get production team members (users with department 'production')
    const productionUsers = await prisma.user_profiles.findMany({
      where: {
        department: 'production',
      },
      select: { id: true, email: true, full_name: true },
    });

    // Notify production team
    if (productionUsers.length > 0) {
      await sendNotification({
        recipients: productionUsers.map(user => ({
          userId: user.id,
          email: user.email || undefined,
          name: user.full_name || undefined,
        })),
        title: `Production Milestone: ${params.milestone}`,
        message: `Order #${params.orderNumber} has reached production stage: ${params.productionStage}`,
        category: 'production',
        priority: 'normal',
        actionUrl: `/production/orders/${params.orderId}`,
        actionLabel: 'View Order',
        channels: ['google_chat', 'in_app'],
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          milestone: params.milestone,
          productionStage: params.productionStage,
        },
      });
    }

    // Also notify customer
    const customer = await prisma.customers.findUnique({
      where: { id: params.customerId },
      select: { id: true, name: true, email: true },
    });

    if (customer) {
      const userProfile = await prisma.user_profiles.findFirst({
        where: { email: customer.email },
        select: { id: true },
      });

      if (userProfile) {
        await sendNotification({
          recipients: [
            {
              userId: userProfile.id,
              email: customer.email || undefined,
              name: customer.name || undefined,
            },
          ],
          title: `Production Update: Order #${params.orderNumber}`,
          message: `Your order has reached a new production milestone: ${params.milestone}`,
          category: 'production',
          priority: 'normal',
          actionUrl: `/portal/customer/orders`,
          actionLabel: 'View Orders',
          channels: ['in_app'],
          metadata: {
            orderId: params.orderId,
            orderNumber: params.orderNumber,
            milestone: params.milestone,
          },
        });
      }
    }

    console.log(`[Notifications] Production milestone notification sent for order ${params.orderNumber}`);
  } catch (error) {
    console.error('[Notifications] Error sending production milestone notification:', error);
  }
}

/**
 * Trigger: Payment Received
 *
 * Sends notification when payment is received.
 * Notifies customer via email + in-app.
 */
export async function triggerPaymentReceived(params: {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  customerId: string;
  paymentMethod?: string;
  transactionId?: string;
}): Promise<void> {
  try {
    // Get customer details
    const customer = await prisma.customers.findUnique({
      where: { id: params.customerId },
      select: { id: true, name: true, email: true },
    });

    if (!customer) {
      console.warn(`[Notifications] Customer not found: ${params.customerId}`);
      return;
    }

    // Get user_id for in-app notification
    const userProfile = await prisma.user_profiles.findFirst({
      where: { email: customer.email },
      select: { id: true },
    });

    if (!userProfile) {
      console.warn(`[Notifications] User profile not found for customer: ${customer.email}`);
      return;
    }

    const amountFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(params.amount);

    await sendNotification({
      recipients: [
        {
          userId: userProfile.id,
          email: customer.email || undefined,
          name: customer.name || undefined,
        },
      ],
      title: `Payment Received - Invoice #${params.invoiceNumber}`,
      message: `We have received your payment of ${amountFormatted} for invoice #${params.invoiceNumber}. Thank you!`,
      category: 'payment',
      priority: 'normal',
      actionUrl: `/portal/customer/financials`,
      actionLabel: 'View Invoices',
      channels: ['email', 'in_app'],
      metadata: {
        invoiceId: params.invoiceId,
        invoiceNumber: params.invoiceNumber,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        transactionId: params.transactionId,
      },
    });

    console.log(`[Notifications] Payment notification sent for invoice ${params.invoiceNumber}`);
  } catch (error) {
    console.error('[Notifications] Error sending payment notification:', error);
  }
}

/**
 * Trigger: QC Failure
 *
 * Sends notification when QC inspection fails.
 * Notifies production team via Google Chat + factory via email.
 */
export async function triggerQCFailure(params: {
  inspectionId: string;
  orderId: string;
  orderNumber: string;
  defectsFound: number;
  inspectorName: string;
  factoryId: string;
  notes?: string;
}): Promise<void> {
  try {
    // Notify production team via Google Chat
    const productionUsers = await prisma.user_profiles.findMany({
      where: {
        department: 'production',
      },
      select: { id: true, email: true, full_name: true },
    });

    if (productionUsers.length > 0) {
      await sendNotification({
        recipients: productionUsers.map(user => ({
          userId: user.id,
          email: user.email || undefined,
          name: user.full_name || undefined,
        })),
        title: `🚨 QC Inspection Failed - Order #${params.orderNumber}`,
        message: `QC inspection failed with ${params.defectsFound} defect(s). Immediate action required.`,
        category: 'alert',
        priority: 'urgent',
        actionUrl: `/production/quality-inspections/${params.inspectionId}`,
        actionLabel: 'View Inspection',
        channels: ['google_chat', 'in_app'],
        metadata: {
          inspectionId: params.inspectionId,
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          defectsFound: params.defectsFound,
          inspectorName: params.inspectorName,
          notes: params.notes,
        },
      });
    }

    // Notify factory
    const factory = await prisma.manufacturers.findUnique({
      where: { id: params.factoryId },
      select: { id: true, company_name: true, email: true },
    });

    if (factory?.email) {
      // Get factory user profile
      const factoryUser = await prisma.user_profiles.findFirst({
        where: { email: factory.email },
        select: { id: true },
      });

      if (factoryUser) {
        await sendNotification({
          recipients: [
            {
              userId: factoryUser.id,
              email: factory.email || undefined,
              name: factory.company_name || undefined,
            },
          ],
          title: `QC Inspection Failed - Order #${params.orderNumber}`,
          message: `Your recent production for order #${params.orderNumber} did not pass quality inspection. ${params.defectsFound} defect(s) found. Please review and take corrective action.`,
          category: 'alert',
          priority: 'high',
          actionUrl: `/portal/factory/quality`,
          actionLabel: 'View Quality Reports',
          channels: ['email', 'in_app'],
          metadata: {
            inspectionId: params.inspectionId,
            orderId: params.orderId,
            orderNumber: params.orderNumber,
            defectsFound: params.defectsFound,
            notes: params.notes,
          },
        });
      }
    }

    console.log(`[Notifications] QC failure notification sent for order ${params.orderNumber}`);
  } catch (error) {
    console.error('[Notifications] Error sending QC failure notification:', error);
  }
}
