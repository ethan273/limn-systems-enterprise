import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

// =============================================================================
// SCHEMAS
// =============================================================================

// Design Board Schema
const createDesignBoardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  board_type: z.string().default('freeform'),
  template_id: z.string().uuid().optional(),
  status: z.string().default('active'),
  project_id: z.string().uuid().optional(),
  created_by: z.string().uuid(),
  thumbnail_url: z.string().optional(),
  is_shared: z.boolean().default(false),
  is_public: z.boolean().default(false),

  // Canvas settings
  canvas_width: z.number().default(4000),
  canvas_height: z.number().default(3000),
  background_color: z.string().default('#ffffff'),
  background_image_url: z.string().optional(),
  grid_enabled: z.boolean().default(true),
  snap_to_grid: z.boolean().default(false),
  grid_size: z.number().default(20),

  // Metadata
  metadata: z.record(z.any()).default({}),
});

// Board Object Schema
const createBoardObjectSchema = z.object({
  board_id: z.string().uuid(),
  object_type: z.string(),
  object_data: z.record(z.any()),
  position_x: z.number(),
  position_y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().default(0),
  scale_x: z.number().default(1),
  scale_y: z.number().default(1),
  z_index: z.number().default(0),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
});

// Board Collaborator Schema
const createBoardCollaboratorSchema = z.object({
  board_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'commenter', 'viewer']).default('editor'),
  invited_by: z.string().uuid().optional(),
});

// Board Comment Schema
const createBoardCommentSchema = z.object({
  board_id: z.string().uuid(),
  object_id: z.string().uuid().optional(),
  parent_comment_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  comment_text: z.string().min(1),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  resolved: z.boolean().default(false),
  resolved_by: z.string().uuid().optional(),
  resolved_at: z.date().optional(),
});

// Board Vote Schema
const createBoardVoteSchema = z.object({
  board_id: z.string().uuid(),
  object_id: z.string().uuid(),
  user_id: z.string().uuid(),
  vote_count: z.number().default(1),
  vote_type: z.enum(['dot', 'upvote', 'priority']).default('dot'),
});

// Board Template Schema
const createBoardTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'brainstorming',
    'client_collaboration',
    'team_building',
    'strategic_planning',
    'product_development',
    'furniture_design',
  ]),
  thumbnail_url: z.string().optional(),
  template_data: z.record(z.any()),
  is_public: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  created_by: z.string().uuid().optional(),
  use_count: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

// =============================================================================
// BASE CRUD ROUTERS
// =============================================================================

const baseBoardsRouter = createCrudRouter({
  name: 'DesignBoard',
  model: 'design_boards' as any,
  createSchema: createDesignBoardSchema,
  updateSchema: createDesignBoardSchema.partial(),
  searchFields: ['name', 'description'],
  defaultOrderBy: { created_at: 'desc' },
});

const baseBoardObjectsRouter = createCrudRouter({
  name: 'BoardObject',
  model: 'board_objects' as any,
  createSchema: createBoardObjectSchema,
  updateSchema: createBoardObjectSchema.partial(),
  searchFields: ['object_type'],
  defaultOrderBy: { z_index: 'asc' },
});

const baseBoardCollaboratorsRouter = createCrudRouter({
  name: 'BoardCollaborator',
  model: 'board_collaborators' as any,
  createSchema: createBoardCollaboratorSchema,
  updateSchema: createBoardCollaboratorSchema.partial(),
  searchFields: [],
  defaultOrderBy: { created_at: 'desc' },
});

const baseBoardCommentsRouter = createCrudRouter({
  name: 'BoardComment',
  model: 'board_comments' as any,
  createSchema: createBoardCommentSchema,
  updateSchema: createBoardCommentSchema.partial(),
  searchFields: ['comment_text'],
  defaultOrderBy: { created_at: 'desc' },
});

const baseBoardVotesRouter = createCrudRouter({
  name: 'BoardVote',
  model: 'board_votes' as any,
  createSchema: createBoardVoteSchema,
  updateSchema: createBoardVoteSchema.partial(),
  searchFields: [],
  defaultOrderBy: { created_at: 'desc' },
});

const baseBoardTemplatesRouter = createCrudRouter({
  name: 'BoardTemplate',
  model: 'board_templates' as any,
  createSchema: createBoardTemplateSchema,
  updateSchema: createBoardTemplateSchema.partial(),
  searchFields: ['name', 'description'],
  defaultOrderBy: { created_at: 'desc' },
});

// =============================================================================
// EXTENDED ROUTERS WITH CUSTOM LOGIC
// =============================================================================

// Boards Router with custom methods
export const boardsRouter = createTRPCRouter({
  ...baseBoardsRouter._def.procedures,

  // Override create to inject created_by from context
  create: publicProcedure
    .input(createDesignBoardSchema.omit({ created_by: true }))
    .mutation(async ({ ctx, input }) => {
      const user_id = ctx.user?.id;

      if (!user_id) {
        throw new Error('Unauthorized - user not authenticated');
      }

      const board = await ctx.db.design_boards.create({
        data: {
          ...input,
          created_by: user_id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return board;
    }),

  // Get board by ID with all related data
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const board = await ctx.db.design_boards.findUnique({
        where: { id: input.id },
        include: {
          board_objects: {
            orderBy: { z_index: 'asc' },
          },
          board_collaborators: {
            include: {
              user_profiles_board_collaborators_user_idTouser_profiles: true,
            },
          },
          board_comments: {
            where: { resolved: false },
            orderBy: { created_at: 'desc' },
            take: 50,
          },
          design_projects: true,
          board_templates: true,
        },
      });

      if (!board) {
        throw new Error('Board not found');
      }

      // Get vote counts per object
      const votes = await ctx.db.board_votes.groupBy({
        by: ['object_id', 'vote_type'],
        where: { board_id: input.id },
        _sum: {
          vote_count: true,
        },
      });

      // Get activity log
      const activities = await ctx.db.board_activity_log.findMany({
        where: { board_id: input.id },
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
          user_profiles: true,
        },
      });

      return {
        board,
        votes,
        activities,
        analytics: {
          totalObjects: board.board_objects.length,
          totalCollaborators: board.board_collaborators.length,
          totalComments: board.board_comments.length,
          lastActivity: board.last_activity_at,
        },
      };
    }),

  // Get boards for a user (created or collaborating)
  getMyBoards: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, offset, status } = input;
      const user_id = ctx.user?.id;

      if (!user_id) {
        throw new Error('Unauthorized - user not authenticated');
      }

      const whereClause: any = {
        OR: [
          { created_by: user_id },
          {
            board_collaborators: {
              some: {
                user_id,
              },
            },
          },
        ],
      };

      if (status) {
        whereClause.status = status;
      }

      const [items, total] = await Promise.all([
        ctx.db.design_boards.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: { last_activity_at: 'desc' },
          include: {
            board_objects: {
              take: 1, // Just get count
            },
            board_collaborators: {
              take: 1,
            },
          },
        }),
        ctx.db.design_boards.count({
          where: whereClause,
        }),
      ]);

      return {
        items,
        total,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      };
    }),

  // Update board thumbnail
  updateThumbnail: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      thumbnail_url: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.db.design_boards.update({
        where: { id: input.id },
        data: {
          thumbnail_url: input.thumbnail_url,
          updated_at: new Date(),
        },
      });

      return board;
    }),
});

// Board Objects Router
export const boardObjectsRouter = createTRPCRouter({
  ...baseBoardObjectsRouter._def.procedures,

  // Get objects for a specific board
  getByBoardId: publicProcedure
    .input(z.object({
      board_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const objects = await ctx.db.board_objects.findMany({
        where: { board_id: input.board_id },
        orderBy: { z_index: 'asc' },
      });

      return objects;
    }),

  // Bulk create objects (for paste/import)
  bulkCreate: publicProcedure
    .input(z.object({
      objects: z.array(createBoardObjectSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.board_objects.createMany({
        data: input.objects,
      });

      // Update board last_activity_at
      if (input.objects.length > 0) {
        await ctx.db.design_boards.update({
          where: { id: input.objects[0]?.board_id },
          data: { last_activity_at: new Date() },
        });
      }

      return result;
    }),

  // Bulk update objects (for moving multiple objects)
  bulkUpdate: publicProcedure
    .input(z.object({
      updates: z.array(z.object({
        id: z.string().uuid(),
        data: createBoardObjectSchema.partial(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.updates.map((update) =>
          ctx.db.board_objects.update({
            where: { id: update.id },
            data: {
              ...update.data,
              updated_at: new Date(),
            },
          })
        )
      );

      return results;
    }),

  // Bulk delete objects
  bulkDelete: publicProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.board_objects.deleteMany({
        where: {
          id: { in: input.ids },
        },
      });

      return result;
    }),
});

// Board Collaborators Router
export const boardCollaboratorsRouter = createTRPCRouter({
  ...baseBoardCollaboratorsRouter._def.procedures,

  // Get collaborators for a specific board
  getByBoardId: publicProcedure
    .input(z.object({
      board_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const collaborators = await ctx.db.board_collaborators.findMany({
        where: { board_id: input.board_id },
        include: {
          user_profiles_board_collaborators_user_idTouser_profiles: true,
          user_profiles_board_collaborators_invited_byTouser_profiles: true,
        },
        orderBy: { created_at: 'desc' },
      });

      return collaborators;
    }),

  // Update collaborator role
  updateRole: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      role: z.enum(['owner', 'editor', 'commenter', 'viewer']),
    }))
    .mutation(async ({ ctx, input }) => {
      const collaborator = await ctx.db.board_collaborators.update({
        where: { id: input.id },
        data: { role: input.role },
      });

      return collaborator;
    }),
});

// Board Comments Router
export const boardCommentsRouter = createTRPCRouter({
  ...baseBoardCommentsRouter._def.procedures,

  // Get comments for a specific board or object
  getByBoardId: publicProcedure
    .input(z.object({
      board_id: z.string().uuid(),
      object_id: z.string().uuid().optional(),
      include_resolved: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        board_id: input.board_id,
      };

      if (input.object_id) {
        whereClause.object_id = input.object_id;
      }

      if (!input.include_resolved) {
        whereClause.resolved = false;
      }

      const comments = await ctx.db.board_comments.findMany({
        where: whereClause,
        include: {
          user_profiles_board_comments_user_idTouser_profiles: true,
          user_profiles_board_comments_resolved_byTouser_profiles: true,
          other_board_comments: {
            include: {
              user_profiles_board_comments_user_idTouser_profiles: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return comments;
    }),

  // Resolve a comment
  resolve: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      resolved_by: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.board_comments.update({
        where: { id: input.id },
        data: {
          resolved: true,
          resolved_by: input.resolved_by,
          resolved_at: new Date(),
          updated_at: new Date(),
        },
      });

      return comment;
    }),
});

// Board Votes Router
export const boardVotesRouter = createTRPCRouter({
  ...baseBoardVotesRouter._def.procedures,

  // Get votes for a specific board
  getByBoardId: publicProcedure
    .input(z.object({
      board_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db.board_votes.findMany({
        where: { board_id: input.board_id },
        include: {
          user_profiles: true,
          board_objects: true,
        },
      });

      // Group by object
      const votesByObject = votes.reduce((acc: any, vote) => {
        if (!acc[vote.object_id]) {
          acc[vote.object_id] = {
            object_id: vote.object_id,
            total_votes: 0,
            votes_by_type: {},
            voters: [],
          };
        }

        acc[vote.object_id].total_votes += vote.vote_count || 1;

        if (!acc[vote.object_id].votes_by_type[vote.vote_type || 'dot']) {
          acc[vote.object_id].votes_by_type[vote.vote_type || 'dot'] = 0;
        }
        acc[vote.object_id].votes_by_type[vote.vote_type || 'dot'] += vote.vote_count || 1;

        acc[vote.object_id].voters.push({
          user_id: vote.user_id,
          vote_count: vote.vote_count,
          vote_type: vote.vote_type,
        });

        return acc;
      }, {});

      return {
        votes,
        votesByObject: Object.values(votesByObject),
      };
    }),

  // Toggle vote (add or remove)
  toggleVote: publicProcedure
    .input(z.object({
      board_id: z.string().uuid(),
      object_id: z.string().uuid(),
      user_id: z.string().uuid(),
      vote_type: z.enum(['dot', 'upvote', 'priority']).default('dot'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if vote exists
      const existingVote = await ctx.db.board_votes.findFirst({
        where: {
          board_id: input.board_id,
          object_id: input.object_id,
          user_id: input.user_id,
          vote_type: input.vote_type,
        },
      });

      if (existingVote) {
        // Remove vote
        await ctx.db.board_votes.delete({
          where: { id: existingVote.id },
        });

        return { action: 'removed', vote: null };
      } else {
        // Add vote
        const newVote = await ctx.db.board_votes.create({
          data: {
            board_id: input.board_id,
            object_id: input.object_id,
            user_id: input.user_id,
            vote_type: input.vote_type,
            vote_count: 1,
          },
        });

        return { action: 'added', vote: newVote };
      }
    }),
});

// Board Templates Router
export const boardTemplatesRouter = createTRPCRouter({
  ...baseBoardTemplatesRouter._def.procedures,

  // Get public templates by category
  getByCategory: publicProcedure
    .input(z.object({
      category: z.enum([
        'brainstorming',
        'client_collaboration',
        'team_building',
        'strategic_planning',
        'product_development',
        'furniture_design',
      ]).optional(),
      is_featured: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        is_public: true,
      };

      if (input.category) {
        whereClause.category = input.category;
      }

      if (input.is_featured !== undefined) {
        whereClause.is_featured = input.is_featured;
      }

      const templates = await ctx.db.board_templates.findMany({
        where: whereClause,
        orderBy: [
          { is_featured: 'desc' },
          { use_count: 'desc' },
          { created_at: 'desc' },
        ],
      });

      return templates;
    }),

  // Create board from template
  createBoardFromTemplate: publicProcedure
    .input(z.object({
      template_id: z.string().uuid(),
      board_name: z.string().min(1),
      created_by: z.string().uuid(),
      project_id: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get template
      const template = await ctx.db.board_templates.findUnique({
        where: { id: input.template_id },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Create board with template data
      const templateSettings = (template.template_data as any)?.settings || {};

      const board = await ctx.db.design_boards.create({
        data: {
          name: input.board_name,
          description: `Created from template: ${template.name}`,
          board_type: template.category,
          template_id: input.template_id,
          status: 'active',
          created_by: input.created_by,
          project_id: input.project_id,
          // Map camelCase template settings to snake_case database fields
          background_color: templateSettings.backgroundColor || '#ffffff',
          grid_enabled: templateSettings.gridEnabled !== undefined ? templateSettings.gridEnabled : true,
        },
      });

      // Create objects from template
      const templateObjects = (template.template_data as any).objects || [];
      if (templateObjects.length > 0) {
        await ctx.db.board_objects.createMany({
          data: templateObjects.map((obj: any) => ({
            board_id: board.id,
            created_by: input.created_by,
            ...obj,
          })),
        });
      }

      // Increment use count
      await ctx.db.board_templates.update({
        where: { id: input.template_id },
        data: {
          use_count: { increment: 1 },
        },
      });

      return board;
    }),
});

// =============================================================================
// MAIN DESIGN BOARDS ROUTER
// =============================================================================

export const designBoardsRouter = createTRPCRouter({
  boards: boardsRouter,
  objects: boardObjectsRouter,
  collaborators: boardCollaboratorsRouter,
  comments: boardCommentsRouter,
  votes: boardVotesRouter,
  templates: boardTemplatesRouter,
});
