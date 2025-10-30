/**
 * Messaging tRPC Router
 *
 * Internal messaging system for team collaboration.
 * Supports threads, messages, attachments, @mentions, and read receipts.
 *
 * Part of Phase 2A Implementation
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const messagingRouter = createTRPCRouter({
  // ============================================================================
  // THREADS
  // ============================================================================

  /**
   * Get all threads for current user
   */
  getMyThreads: protectedProcedure
    .input(
      z.object({
        status: z.enum(['open', 'closed', 'archived']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const where: any = {
        participant_ids: {
          has: userId,
        },
      };

      if (input.status) {
        where.status = input.status;
      }

      const [threads, total] = await Promise.all([
        ctx.db.communication_threads.findMany({
          where,
          include: {
            thread_messages: {
              orderBy: { sent_at: 'desc' },
              take: 1, // Get last message for preview
            },
            thread_participants: {
              include: {
                user_profiles: {
                  select: {
                    id: true,
                    full_name: true,
                    email: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
          orderBy: {
            last_message_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.communication_threads.count({ where }),
      ]);

      return {
        threads,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get single thread by ID
   */
  getThreadById: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const thread = await ctx.db.communication_threads.findUnique({
        where: { id: input.threadId },
        include: {
          thread_participants: {
            include: {
              user_profiles: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' });
      }

      // Check if user is participant
      if (!thread.participant_ids.includes(userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a thread participant' });
      }

      return thread;
    }),

  /**
   * Create new thread
   */
  createThread: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string().uuid(),
        subject: z.string().optional(),
        participantIds: z.array(z.string().uuid()),
        initialMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Ensure creator is in participants
      const allParticipants = Array.from(new Set([userId, ...input.participantIds]));

      const thread = await ctx.db.communication_threads.create({
        data: {
          entity_type: input.entityType,
          entity_id: input.entityId,
          subject: input.subject,
          participant_ids: allParticipants,
          created_by: userId,
          last_message_at: new Date(),
        },
        include: {
          thread_participants: {
            include: {
              user_profiles: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Create participants records
      await Promise.all(
        allParticipants.map((participantId) =>
          ctx.db.thread_participants.create({
            data: {
              thread_id: thread.id,
              user_id: participantId,
            },
          })
        )
      );

      // Send initial message if provided
      if (input.initialMessage) {
        await ctx.db.thread_messages.create({
          data: {
            thread_id: thread.id,
            message: input.initialMessage,
            sent_by: userId,
          },
        });
      }

      return thread;
    }),

  /**
   * Update thread status
   */
  updateThreadStatus: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        status: z.enum(['open', 'closed', 'archived']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Verify user is participant
      const thread = await ctx.db.communication_threads.findUnique({
        where: { id: input.threadId },
        select: { participant_ids: true },
      });

      if (!thread?.participant_ids.includes(userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a thread participant' });
      }

      return await ctx.db.communication_threads.update({
        where: { id: input.threadId },
        data: {
          status: input.status,
          updated_at: new Date(),
        },
      });
    }),

  /**
   * Add participants to thread
   */
  addParticipants: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        userIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const thread = await ctx.db.communication_threads.findUnique({
        where: { id: input.threadId },
        select: { participant_ids: true },
      });

      if (!thread) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found' });
      }

      if (!thread.participant_ids.includes(userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a thread participant' });
      }

      // Get new participants (not already in thread)
      const newParticipants = input.userIds.filter(
        (id) => !thread.participant_ids.includes(id)
      );

      if (newParticipants.length === 0) {
        return thread;
      }

      // Update thread with new participants
      const updatedThread = await ctx.db.communication_threads.update({
        where: { id: input.threadId },
        data: {
          participant_ids: [...thread.participant_ids, ...newParticipants],
          updated_at: new Date(),
        },
      });

      // Create participant records
      await Promise.all(
        newParticipants.map((participantId) =>
          ctx.db.thread_participants.create({
            data: {
              thread_id: input.threadId,
              user_id: participantId,
            },
          })
        )
      );

      return updatedThread;
    }),

  // ============================================================================
  // MESSAGES
  // ============================================================================

  /**
   * Get messages in thread
   */
  getThreadMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Verify user is participant
      const thread = await ctx.db.communication_threads.findUnique({
        where: { id: input.threadId },
        select: { participant_ids: true },
      });

      if (!thread?.participant_ids.includes(userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a thread participant' });
      }

      const [messages, total] = await Promise.all([
        ctx.db.thread_messages.findMany({
          where: { thread_id: input.threadId },
          include: {
            user_profiles: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
          orderBy: { sent_at: 'asc' },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.thread_messages.count({
          where: { thread_id: input.threadId },
        }),
      ]);

      return {
        messages,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Send message in thread
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        message: z.string().min(1),
        messageType: z.enum(['text', 'file', 'image', 'system']).default('text'),
        attachments: z.array(
          z.object({
            fileName: z.string(),
            fileUrl: z.string(),
            fileSize: z.number(),
            mimeType: z.string(),
          })
        ).optional(),
        mentions: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Verify user is participant
      const thread = await ctx.db.communication_threads.findUnique({
        where: { id: input.threadId },
        select: { participant_ids: true },
      });

      if (!thread?.participant_ids.includes(userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a thread participant' });
      }

      // Create message
      const message = await ctx.db.thread_messages.create({
        data: {
          thread_id: input.threadId,
          message: input.message,
          message_type: input.messageType,
          attachments: input.attachments || [],
          sent_by: userId,
          read_by: [userId], // Sender has read it
        },
        include: {
          user_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      });

      // Update thread's last message time
      await ctx.db.communication_threads.update({
        where: { id: input.threadId },
        data: {
          last_message_at: new Date(),
          updated_at: new Date(),
        },
      });

      // TODO: Send notifications to @mentioned users and thread participants
      // This will be handled by notification system integration in Phase 2D

      return message;
    }),

  /**
   * Mark message as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const message = await ctx.db.thread_messages.findUnique({
        where: { id: input.messageId },
        select: { read_by: true, thread_id: true },
      });

      if (!message) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
      }

      // Check if already read
      if (message.read_by.includes(userId)) {
        return message;
      }

      return await ctx.db.thread_messages.update({
        where: { id: input.messageId },
        data: {
          read_by: [...message.read_by, userId],
        },
      });
    }),

  /**
   * Mark all messages in thread as read
   */
  markThreadAsRead: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Verify user is participant
      const thread = await ctx.db.communication_threads.findUnique({
        where: { id: input.threadId },
        select: { participant_ids: true },
      });

      if (!thread?.participant_ids.includes(userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a thread participant' });
      }

      // Get all unread messages
      const unreadMessages = await ctx.db.thread_messages.findMany({
        where: {
          thread_id: input.threadId,
          NOT: {
            read_by: {
              has: userId,
            },
          },
        },
        select: { id: true, read_by: true },
      });

      // Mark all as read
      await Promise.all(
        unreadMessages.map((msg) =>
          ctx.db.thread_messages.update({
            where: { id: msg.id },
            data: {
              read_by: [...msg.read_by, userId],
            },
          })
        )
      );

      return { markedCount: unreadMessages.length };
    }),

  /**
   * Edit message
   */
  editMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
        newMessage: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const message = await ctx.db.thread_messages.findUnique({
        where: { id: input.messageId },
        select: { sent_by: true },
      });

      if (!message) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
      }

      // Only sender can edit
      if (message.sent_by !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Can only edit own messages' });
      }

      return await ctx.db.thread_messages.update({
        where: { id: input.messageId },
        data: {
          message: input.newMessage,
          edited: true,
          edited_at: new Date(),
        },
      });
    }),

  /**
   * Get unread count for user
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    // Get all threads user is in
    const threads = await ctx.db.communication_threads.findMany({
      where: {
        participant_ids: {
          has: userId,
        },
        status: 'open',
      },
      select: { id: true },
    });

    const threadIds = threads.map(t => t.id);

    // Count unread messages
    const unreadCount = await ctx.db.thread_messages.count({
      where: {
        thread_id: { in: threadIds },
        NOT: {
          sent_by: userId, // Don't count own messages
          read_by: {
            has: userId,
          },
        },
      },
    });

    return { unreadCount };
  }),

  /**
   * Search messages
   */
  searchMessages: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        threadId: z.string().uuid().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Get user's thread IDs
      const threads = await ctx.db.communication_threads.findMany({
        where: {
          participant_ids: {
            has: userId,
          },
          ...(input.threadId ? { id: input.threadId } : {}),
        },
        select: { id: true },
      });

      const threadIds = threads.map(t => t.id);

      const messages = await ctx.db.thread_messages.findMany({
        where: {
          thread_id: { in: threadIds },
          message: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        include: {
          user_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          communication_threads: {
            select: {
              id: true,
              subject: true,
              entity_type: true,
            },
          },
        },
        orderBy: { sent_at: 'desc' },
        take: input.limit,
      });

      return messages;
    }),
});
