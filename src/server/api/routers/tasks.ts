import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { db } from '@/lib/db';

// Schema for creating tasks - matches updated database schema
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assigned_to: z.array(z.string().uuid()).default([]),
  created_by: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  department: z.enum(['admin', 'production', 'design', 'sales']).default('admin'),
  visibility: z.enum(['company', 'project', 'private']).default('company'),
  mentioned_users: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  due_date: z.string().datetime().optional(),
  start_date: z.string().datetime().optional(),
  estimated_hours: z.number().optional(),
  actual_hours: z.number().optional(),
  position: z.number().optional(),
  watchers: z.array(z.string().uuid()).default([]),
  depends_on: z.array(z.string().uuid()).default([]),
  blocks: z.array(z.string().uuid()).default([]),
  task_type: z.string().default('task'),
  // New fields
  reporter_id: z.string().uuid().optional(),
  resolution: z.string().optional(),
});

// Schema for task attachments
const taskAttachmentSchema = z.object({
  task_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  mime_type: z.string().optional(),
  thumbnail_path: z.string().optional(),
  uploaded_by: z.string().uuid(),
});

// Schema for task activities
const taskActivitySchema = z.object({
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  activity_type: z.enum(['comment', 'status_change', 'assignment', 'attachment', 'entity_linked', 'task_created']),
  content: z.string().optional(),
  old_value: z.any().optional(),
  new_value: z.any().optional(),
  mentioned_users: z.array(z.string().uuid()).default([]),
});

// Schema for task entity links
const taskEntityLinkSchema = z.object({
  task_id: z.string().uuid(),
  entity_type: z.enum(['client', 'project', 'order', 'collection', 'item', 'designer', 'manufacturer', 'partner']),
  entity_id: z.string().uuid(),
  entity_name: z.string().optional(),
  link_type: z.enum(['related', 'blocks', 'depends_on']).default('related'),
  created_by: z.string().uuid(),
});

// Schema for updating tasks  
const updateTaskSchema = createTaskSchema.partial();

// Generate base CRUD operations
const baseCrud = createCrudRouter({
  name: 'Task',
  model: 'tasks' as any,
  createSchema: createTaskSchema,
  updateSchema: updateTaskSchema,
  defaultOrderBy: { created_at: 'desc' },
  defaultInclude: {
    project: true,
  },
  searchFields: ['title', 'description'],
});

// Extend with custom task-specific operations
export const tasksRouter = createTRPCRouter({
  ...baseCrud._def.procedures,

  // Create a new task
  create: publicProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx: _ctx, input }) => {
      return await db.createTask(input);
    }),
  
  // Get all tasks with filters
  getAllTasks: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      department: z.enum(['admin', 'production', 'design', 'sales']).optional(),
      search: z.string().optional(),
      sortBy: z.enum(['created_at', 'due_date', 'priority', 'status', 'title']).default('created_at'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.findManyTasks({
        take: input.limit,
        skip: input.offset,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        filters: {
          status: input.status,
          priority: input.priority,
          department: input.department,
          search: input.search,
        },
      });
    }),

  // Get my tasks (assigned to current user)
  getMyTasks: publicProcedure
    .input(z.object({
      user_id: z.string().uuid(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
      includeWatching: z.boolean().default(false),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.getMyTasks(input.user_id, {
        limit: input.limit,
        offset: input.offset,
        status: input.status,
        includeWatching: input.includeWatching,
      });
    }),
  
  // Update task status
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      return await db.updateTask({
        id: input.id,
        status: input.status,
      });
    }),

  // Update task priority
  updatePriority: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      priority: z.enum(['low', 'medium', 'high']),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      return await db.updateTask({
        id: input.id,
        priority: input.priority,
      });
    }),

  // Update task department
  updateDepartment: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      department: z.enum(['admin', 'production', 'design', 'sales']),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      return await db.updateTask({
        id: input.id,
        department: input.department,
      });
    }),
  
  // Get tasks by project
  getByProject: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      includeCompleted: z.boolean().default(false),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.getTasksByProject(input.projectId, input.includeCompleted);
    }),

  // Get single task by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      const task = await db.findTask(input.id);
      if (!task) {
        throw new Error('Task not found');
      }
      return task;
    }),

  // Update task
  update: publicProcedure
    .input(updateTaskSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx: _ctx, input }) => {
      return await db.updateTask(input);
    }),

  // Delete task
  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      await db.deleteTask(input.id);
      return { success: true };
    }),

  // Archive task
  archive: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      archived_by: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      return await db.updateTask({
        id: input.id,
        archived_at: new Date().toISOString(),
        archived_by: input.archived_by,
      });
    }),

  // Get task with full details (including attachments, activities, links)
  getFullDetails: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      const task = await db.findTask(input.id, {
        include: {
          task_attachments: true,
          task_activities: {
            orderBy: { created_at: 'desc' },
            take: 20,
          },
          task_entity_links: true,
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }
      return task;
    }),

  // TASK ATTACHMENTS
  addAttachment: publicProcedure
    .input(taskAttachmentSchema)
    .mutation(async ({ ctx: _ctx, input }) => {
      const attachment = await db.createTaskAttachment(input);

      // Create activity log
      await db.createTaskActivity({
        task_id: input.task_id,
        user_id: input.uploaded_by,
        activity_type: 'attachment',
        content: `Uploaded file: ${input.file_name}`,
        new_value: { file_name: input.file_name, file_size: input.file_size },
      });

      // Update task last_activity_at
      await db.updateTask({
        id: input.task_id,
        last_activity_at: new Date().toISOString(),
      });

      return attachment;
    }),

  getAttachments: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.getTaskAttachments(input.task_id);
    }),

  deleteAttachment: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      user_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      const attachment = await db.findTaskAttachment(input.id);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      await db.deleteTaskAttachment(input.id);

      // Create activity log
      await db.createTaskActivity({
        task_id: attachment.task_id,
        user_id: input.user_id,
        activity_type: 'attachment',
        content: `Deleted file: ${attachment.file_name}`,
        old_value: { file_name: attachment.file_name },
      });

      return { success: true };
    }),

  // TASK ACTIVITIES
  addActivity: publicProcedure
    .input(taskActivitySchema)
    .mutation(async ({ ctx: _ctx, input }) => {
      const activity = await db.createTaskActivity(input);

      // Update task last_activity_at
      await db.updateTask({
        id: input.task_id,
        last_activity_at: new Date().toISOString(),
      });

      return activity;
    }),

  getActivities: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.getTaskActivities(input.task_id, {
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // TASK ENTITY LINKS
  addEntityLink: publicProcedure
    .input(taskEntityLinkSchema)
    .mutation(async ({ ctx: _ctx, input }) => {
      const link = await db.createTaskEntityLink(input);

      // Create activity log
      await db.createTaskActivity({
        task_id: input.task_id,
        user_id: input.created_by,
        activity_type: 'entity_linked',
        content: `Linked to ${input.entity_type}: ${input.entity_name || 'Unknown'}`,
        new_value: { entity_type: input.entity_type, entity_id: input.entity_id, entity_name: input.entity_name },
      });

      return link;
    }),

  getEntityLinks: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.getTaskEntityLinks(input.task_id);
    }),

  removeEntityLink: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      user_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      const link = await db.findTaskEntityLink(input.id);
      if (!link) {
        throw new Error('Entity link not found');
      }

      await db.deleteTaskEntityLink(input.id);

      // Create activity log
      await db.createTaskActivity({
        task_id: link.task_id,
        user_id: input.user_id,
        activity_type: 'entity_linked',
        content: `Removed link to ${link.entity_type}: ${link.entity_name || 'Unknown'}`,
        old_value: { entity_type: link.entity_type, entity_id: link.entity_id, entity_name: link.entity_name },
      });

      return { success: true };
    }),

  // BULK OPERATIONS
  bulkUpdateStatus: publicProcedure
    .input(z.object({
      task_ids: z.array(z.string().uuid()),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']),
      user_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      const results = await Promise.all(
        input.task_ids.map(async (taskId) => {
          await db.updateTask({ id: taskId, status: input.status });

          // Create activity log for each task
          await db.createTaskActivity({
            task_id: taskId,
            user_id: input.user_id,
            activity_type: 'status_change',
            content: `Status changed to ${input.status}`,
            new_value: { status: input.status },
          });

          return taskId;
        })
      );

      return { updated: results.length };
    }),

  bulkArchive: publicProcedure
    .input(z.object({
      task_ids: z.array(z.string().uuid()),
      user_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      const results = await Promise.all(
        input.task_ids.map(async (taskId) => {
          return await db.updateTask({
            id: taskId,
            archived_at: new Date().toISOString(),
            archived_by: input.user_id,
          });
        })
      );

      return { archived: results.length };
    }),

  // Get unique tags from all tasks
  getUniqueTags: publicProcedure
    .query(async ({ ctx: _ctx }) => {
      return await db.getUniqueTags();
    }),

  // TIME TRACKING
  getTimeEntries: publicProcedure
    .input(z.object({
      taskId: z.string().uuid(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.time_entries.findMany({
        where: { task_id: input.taskId },
        orderBy: { start_time: 'desc' },
      });
    }),

  addTimeEntry: publicProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      userId: z.string(),
      description: z.string().optional(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional(),
      duration: z.number().int().positive(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      const entry = await db.time_entries.create({
        data: {
          task_id: input.taskId,
          user_id: input.userId,
          description: input.description,
          start_time: input.startTime,
          end_time: input.endTime,
          duration: input.duration,
        },
      });

      // Update task last_activity_at
      await db.updateTask({
        id: input.taskId,
        last_activity_at: new Date().toISOString(),
      });

      return entry;
    }),

  updateTimeEntry: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      description: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      duration: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      const { id, ...data } = input;
      const updateData: any = {};

      if (data.description !== undefined) updateData.description = data.description;
      if (data.startTime) updateData.start_time = data.startTime;
      if (data.endTime) updateData.end_time = data.endTime;
      if (data.duration) updateData.duration = data.duration;

      return await db.time_entries.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date().toISOString(),
        },
      });
    }),

  deleteTimeEntry: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      await db.time_entries.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});
