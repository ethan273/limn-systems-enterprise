import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc/init';
import { db } from '@/lib/db';

// Schema for creating tasks - matches database schema
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
    // TODO: Add projects relationship when schema is available
    // project: true,
  },
  searchFields: ['title', 'description'],
});

// Extend with custom task-specific operations
export const tasksRouter = createTRPCRouter({
  ...baseCrud._def.procedures,

  // Create a new task
  create: publicProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
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
    .query(async ({ ctx, input }) => {
      return await db.findManyTasks({
        limit: input.limit,
        offset: input.offset,
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
  getMyTasks: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
      includeWatching: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return await db.getMyTasks(userId, {
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
    .mutation(async ({ ctx, input }) => {
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
    .mutation(async ({ ctx, input }) => {
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
    .mutation(async ({ ctx, input }) => {
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
    .query(async ({ ctx, input }) => {
      return await db.getTasksByProject(input.projectId, input.includeCompleted);
    }),

  // Get single task by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const task = await db.findTask(input.id);
      if (!task) {
        throw new Error('Task not found');
      }
      return task;
    }),

  // Update task
  update: publicProcedure
    .input(updateTaskSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await db.updateTask(input);
    }),

  // Delete task
  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteTask(input.id);
      return { success: true };
    }),
});
