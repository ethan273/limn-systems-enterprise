import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Time Entries Router
 *
 * Manages time_entries table using ctx.db pattern.
 * Covers time tracking, timers, and productivity analytics.
 */

export const timeEntriesRouter = createTRPCRouter({
  /**
   * Get time entry by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.time_entries.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          description: true,
          start_time: true,
          end_time: true,
          duration: true,
          created_at: true,
          updated_at: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Time entry not found',
        });
      }

      return entry;
    }),

  /**
   * Get all time entries (paginated, with filters)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        task_id: z.string().uuid().optional(),
        user_id: z.string().optional(),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
        is_running: z.boolean().optional(), // Filter for active timers
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, task_id, user_id, start_date, end_date, is_running } = input;

      const where: any = {};

      if (task_id) {
        where.task_id = task_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (start_date || end_date) {
        where.start_time = {};
        if (start_date) {
          where.start_time.gte = start_date;
        }
        if (end_date) {
          where.start_time.lte = end_date;
        }
      }

      if (is_running !== undefined) {
        if (is_running) {
          where.end_time = null;
        } else {
          where.end_time = { not: null };
        }
      }

      const entries = await ctx.db.time_entries.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { start_time: 'desc' },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          description: true,
          start_time: true,
          end_time: true,
          duration: true,
          created_at: true,
          tasks: {
            select: {
              title: true,
              status: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (entries.length > limit) {
        const nextItem = entries.pop();
        nextCursor = nextItem?.id;
      }

      return {
        entries,
        nextCursor,
      };
    }),

  /**
   * Get time entries for specific task
   */
  getByTask: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.time_entries.findMany({
        where: {
          task_id: input.task_id,
        },
        take: input.limit,
        orderBy: { start_time: 'desc' },
        select: {
          id: true,
          user_id: true,
          description: true,
          start_time: true,
          end_time: true,
          duration: true,
          created_at: true,
        },
      });

      const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

      return {
        entries,
        totalDuration,
        totalHours: totalDuration > 0 ? Math.round((totalDuration / 3600) * 10) / 10 : 0,
      };
    }),

  /**
   * Get time entries for specific user
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string(),
        limit: z.number().min(1).max(100).default(50),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        user_id: input.user_id,
      };

      if (input.start_date || input.end_date) {
        where.start_time = {};
        if (input.start_date) {
          where.start_time.gte = input.start_date;
        }
        if (input.end_date) {
          where.start_time.lte = input.end_date;
        }
      }

      const entries = await ctx.db.time_entries.findMany({
        where,
        take: input.limit,
        orderBy: { start_time: 'desc' },
        select: {
          id: true,
          task_id: true,
          description: true,
          start_time: true,
          end_time: true,
          duration: true,
          created_at: true,
          tasks: {
            select: {
              title: true,
              status: true,
            },
          },
        },
      });

      return entries;
    }),

  /**
   * Get current user's time entries
   */
  getMy: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        user_id: ctx.user!.id,
      };

      if (input.start_date || input.end_date) {
        where.start_time = {};
        if (input.start_date) {
          where.start_time.gte = input.start_date;
        }
        if (input.end_date) {
          where.start_time.lte = input.end_date;
        }
      }

      const entries = await ctx.db.time_entries.findMany({
        where,
        take: input.limit,
        orderBy: { start_time: 'desc' },
        select: {
          id: true,
          task_id: true,
          description: true,
          start_time: true,
          end_time: true,
          duration: true,
          created_at: true,
          tasks: {
            select: {
              title: true,
              status: true,
            },
          },
        },
      });

      return entries;
    }),

  /**
   * Get currently running timers (no end_time)
   */
  getActive: protectedProcedure
    .input(
      z.object({
        user_id: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        end_time: null,
      };

      if (input.user_id) {
        where.user_id = input.user_id;
      }

      const activeTimers = await ctx.db.time_entries.findMany({
        where,
        orderBy: { start_time: 'desc' },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          description: true,
          start_time: true,
          tasks: {
            select: {
              title: true,
              status: true,
            },
          },
        },
      });

      return activeTimers;
    }),

  /**
   * Get current user's active timer
   */
  getMyActiveTimer: protectedProcedure.query(async ({ ctx }) => {
    const activeTimer = await ctx.db.time_entries.findFirst({
      where: {
        user_id: ctx.user!.id,
        end_time: null,
      },
      orderBy: { start_time: 'desc' },
      select: {
        id: true,
        task_id: true,
        description: true,
        start_time: true,
        tasks: {
          select: {
            title: true,
            status: true,
          },
        },
      },
    });

    return activeTimer;
  }),

  /**
   * Create time entry
   */
  create: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        user_id: z.string().optional(), // Defaults to current user
        description: z.string().optional(),
        start_time: z.date(),
        end_time: z.date().optional(),
        duration: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task exists
      const task = await ctx.db.tasks.findUnique({
        where: { id: input.task_id },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Calculate duration if end_time provided but duration not
      let duration = input.duration;
      if (input.end_time && !duration) {
        duration = Math.floor((input.end_time.getTime() - input.start_time.getTime()) / 1000);
      }

      const newEntry = await ctx.db.time_entries.create({
        data: {
          task_id: input.task_id,
          user_id: input.user_id || ctx.user!.id,
          description: input.description,
          start_time: input.start_time,
          end_time: input.end_time,
          duration,
        },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          start_time: true,
          end_time: true,
          duration: true,
          created_at: true,
        },
      });

      return newEntry;
    }),

  /**
   * Start new timer (no end_time)
   */
  startTimer: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has active timer
      const existingTimer = await ctx.db.time_entries.findFirst({
        where: {
          user_id: ctx.user!.id,
          end_time: null,
        },
      });

      if (existingTimer) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active timer. Please stop it before starting a new one.',
        });
      }

      // Verify task exists
      const task = await ctx.db.tasks.findUnique({
        where: { id: input.task_id },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const newTimer = await ctx.db.time_entries.create({
        data: {
          task_id: input.task_id,
          user_id: ctx.user!.id,
          description: input.description,
          start_time: new Date(),
        },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          start_time: true,
          description: true,
        },
      });

      return newTimer;
    }),

  /**
   * Stop running timer
   */
  stopTimer: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.time_entries.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true, start_time: true, end_time: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Time entry not found',
        });
      }

      if (entry.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only stop your own timers',
        });
      }

      if (entry.end_time) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Timer is already stopped',
        });
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - entry.start_time.getTime()) / 1000);

      const updatedEntry = await ctx.db.time_entries.update({
        where: { id: input.id },
        data: {
          end_time: endTime,
          duration,
          updated_at: new Date(),
        },
        select: {
          id: true,
          start_time: true,
          end_time: true,
          duration: true,
        },
      });

      return updatedEntry;
    }),

  /**
   * Update time entry
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        description: z.string().optional(),
        start_time: z.date().optional(),
        end_time: z.date().optional(),
        duration: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.time_entries.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true, start_time: true, end_time: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Time entry not found',
        });
      }

      if (entry.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own time entries',
        });
      }

      // Recalculate duration if times changed
      let duration = input.duration;
      const startTime = input.start_time || entry.start_time;
      const endTime = input.end_time !== undefined ? input.end_time : entry.end_time;

      if (endTime && !duration) {
        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      }

      const { id: _id, ...updateData } = input;

      const updatedEntry = await ctx.db.time_entries.update({
        where: { id: input.id },
        data: {
          ...updateData,
          duration,
          updated_at: new Date(),
        },
        select: {
          id: true,
          description: true,
          start_time: true,
          end_time: true,
          duration: true,
          updated_at: true,
        },
      });

      return updatedEntry;
    }),

  /**
   * Delete time entry
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.time_entries.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Time entry not found',
        });
      }

      if (entry.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own time entries',
        });
      }

      await ctx.db.time_entries.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get today's total time for current user
   */
  getTodayTotal: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await ctx.db.time_entries.findMany({
      where: {
        user_id: ctx.user!.id,
        start_time: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        duration: true,
        end_time: true,
      },
    });

    const totalSeconds = entries.reduce((sum, entry) => {
      // If still running, calculate current duration
      if (!entry.end_time) {
        return sum;
      }
      return sum + (entry.duration || 0);
    }, 0);

    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    return {
      totalSeconds,
      totalHours,
      entryCount: entries.length,
    };
  }),

  /**
   * Get time tracking statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        start_date: z.date().optional(),
        end_date: z.date().optional(),
        user_id: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.user_id) {
        where.user_id = input.user_id;
      }

      if (input.start_date || input.end_date) {
        where.start_time = {};
        if (input.start_date) {
          where.start_time.gte = input.start_date;
        }
        if (input.end_date) {
          where.start_time.lte = input.end_date;
        }
      }

      const [totalEntries, completedEntries, activeTimers] = await Promise.all([
        ctx.db.time_entries.count({ where }),
        ctx.db.time_entries.count({
          where: {
            ...where,
            end_time: { not: null },
          },
        }),
        ctx.db.time_entries.count({
          where: {
            ...where,
            end_time: null,
          },
        }),
      ]);

      // Get total duration
      const entries = await ctx.db.time_entries.findMany({
        where: {
          ...where,
          end_time: { not: null },
        },
        select: {
          duration: true,
        },
      });

      const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
      const avgHoursPerEntry = completedEntries > 0 ? Math.round((totalSeconds / completedEntries / 3600) * 10) / 10 : 0;

      // Get time by task
      const byTask = await ctx.db.time_entries.groupBy({
        by: ['task_id'],
        where: {
          ...where,
          end_time: { not: null },
        },
        _sum: {
          duration: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            duration: 'desc',
          },
        },
        take: 10,
      });

      return {
        totalEntries,
        completedEntries,
        activeTimers,
        totalSeconds,
        totalHours,
        avgHoursPerEntry,
        topTasks: byTask.map(task => ({
          task_id: task.task_id,
          total_seconds: task._sum.duration || 0,
          total_hours: Math.round(((task._sum.duration || 0) / 3600) * 10) / 10,
          entry_count: task._count,
        })),
      };
    }),
});
