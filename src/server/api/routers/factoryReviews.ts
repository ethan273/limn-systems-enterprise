/**
 * Factory Reviews tRPC Router
 *
 * API for factory review sessions, photo documentation, comments, and action items
 * for prototype on-site inspections.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const factoryReviewsRouter = createTRPCRouter({
  // ============================================================================
  // FACTORY REVIEW SESSIONS
  // ============================================================================

  /**
   * Get all factory review sessions with filters
   */
  getAllSessions: publicProcedure
    .input(
      z.object({
        prototypeProductionId: z.string().uuid().optional(),
        status: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.prototypeProductionId) {
        where.prototype_production_id = input.prototypeProductionId;
      }

      if (input.status) {
        where.status = input.status;
      }

      const [sessions, total] = await Promise.all([
        ctx.db.factory_review_sessions.findMany({
          where,
          include: {
            prototype_production: {
              include: {
                prototype: {
                  select: {
                    name: true,
                    prototype_number: true,
                  },
                },
              },
            },
            creator: {
              select: {
                email: true,
              },
            },
            _count: {
              select: {
                photos: true,
                comments: true,
                documents: true,
              },
            },
          },
          orderBy: {
            review_date: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.factory_review_sessions.count({ where }),
      ]);

      return {
        sessions,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single factory review session by ID
   */
  getSessionById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.factory_review_sessions.findUnique({
        where: { id: input.id },
        include: {
          prototype_production: {
            include: {
              prototype: {
                select: {
                  id: true,
                  name: true,
                  prototype_number: true,
                },
              },
              factory: {
                select: {
                  company_name: true,
                },
              },
            },
          },
          creator: {
            select: {
              email: true,
            },
          },
          photos: {
            include: {
              uploader: {
                select: {
                  email: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
          comments: {
            where: {
              parent_comment_id: null,
            },
            include: {
              author: {
                select: {
                  email: true,
                },
              },
              resolver: {
                select: {
                  email: true,
                },
              },
              replies: {
                include: {
                  author: {
                    select: {
                      email: true,
                    },
                  },
                },
                orderBy: {
                  created_at: 'asc',
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
          documents: {
            include: {
              uploader: {
                select: {
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Factory review session not found',
        });
      }

      return session;
    }),

  /**
   * Create factory review session
   */
  createSession: publicProcedure
    .input(
      z.object({
        prototypeProductionId: z.string().uuid(),
        sessionNumber: z.number().int().positive(),
        sessionName: z.string(),
        reviewDate: z.date(),
        location: z.string().optional(),
        limnTeamMembers: z.array(z.string().uuid()).default([]),
        designerIds: z.array(z.string().uuid()).default([]),
        factoryRepresentatives: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const session = await ctx.db.factory_review_sessions.create({
        data: {
          prototype_production_id: input.prototypeProductionId,
          session_number: input.sessionNumber,
          session_name: input.sessionName,
          review_date: input.reviewDate,
          location: input.location,
          limn_team_members: input.limnTeamMembers,
          designer_ids: input.designerIds,
          factory_representatives: input.factoryRepresentatives,
          created_by: userId,
        },
        include: {
          prototype_production: {
            include: {
              prototype: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Factory review session created successfully',
        session,
      };
    }),

  /**
   * Update factory review session
   */
  updateSession: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        sessionName: z.string().optional(),
        reviewDate: z.date().optional(),
        location: z.string().optional(),
        status: z.string().optional(),
        completionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: any = {};

      if (data.sessionName) updateData.session_name = data.sessionName;
      if (data.reviewDate) updateData.review_date = data.reviewDate;
      if (data.location) updateData.location = data.location;
      if (data.status) {
        updateData.status = data.status;
        if (data.status === 'completed') {
          updateData.completed_at = new Date();
        }
      }
      if (data.completionNotes !== undefined) updateData.completion_notes = data.completionNotes;

      const session = await ctx.db.factory_review_sessions.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: 'Session updated successfully',
        session,
      };
    }),

  // ============================================================================
  // FACTORY REVIEW PHOTOS
  // ============================================================================

  /**
   * Get photos for a session
   */
  getPhotos: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        issueSeverity: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        session_id: input.sessionId,
      };

      if (input.issueSeverity) {
        where.issue_severity = input.issueSeverity;
      }

      const photos = await ctx.db.factory_review_photos.findMany({
        where,
        include: {
          uploader: {
            select: {
              email: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return photos;
    }),

  /**
   * Upload photo to review session
   */
  uploadPhoto: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        fileUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        fileName: z.string(),
        fileSize: z.bigint(),
        mimeType: z.string().optional(),
        componentArea: z.string().optional(),
        issueSeverity: z.string().default('observation'),
        uploadedByRole: z.string(), // "limn_team" | "designer"
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const photo = await ctx.db.factory_review_photos.create({
        data: {
          session_id: input.sessionId,
          file_url: input.fileUrl,
          thumbnail_url: input.thumbnailUrl,
          file_name: input.fileName,
          file_size: input.fileSize,
          mime_type: input.mimeType,
          component_area: input.componentArea,
          issue_severity: input.issueSeverity,
          uploaded_by: userId,
          uploaded_by_role: input.uploadedByRole,
        },
      });

      return {
        success: true,
        message: 'Photo uploaded successfully',
        photo,
      };
    }),

  /**
   * Delete photo
   */
  deletePhoto: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.factory_review_photos.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Photo deleted successfully',
      };
    }),

  // ============================================================================
  // FACTORY REVIEW COMMENTS
  // ============================================================================

  /**
   * Get comments for a session or photo
   */
  getComments: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid().optional(),
        photoId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.sessionId && !input.photoId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either sessionId or photoId must be provided',
        });
      }

      const where: any = {
        parent_comment_id: null,
      };

      if (input.sessionId) where.session_id = input.sessionId;
      if (input.photoId) where.photo_id = input.photoId;

      const comments = await ctx.db.factory_review_comments.findMany({
        where,
        include: {
          author: {
            select: {
              email: true,
            },
          },
          resolver: {
            select: {
              email: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return comments;
    }),

  /**
   * Add comment to photo or session
   */
  addComment: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        photoId: z.string().uuid().optional(),
        commentText: z.string(),
        commentType: z.string().default('issue'),
        authorRole: z.string(), // "limn_team" | "designer" | "factory"
        isActionItem: z.boolean().default(false),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
        parentCommentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const comment = await ctx.db.factory_review_comments.create({
        data: {
          session_id: input.sessionId,
          photo_id: input.photoId,
          comment_text: input.commentText,
          comment_type: input.commentType,
          author_id: userId,
          author_role: input.authorRole,
          is_action_item: input.isActionItem,
          assigned_to: input.assignedTo,
          due_date: input.dueDate,
          parent_comment_id: input.parentCommentId,
        },
        include: {
          author: {
            select: {
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Comment added successfully',
        comment,
      };
    }),

  /**
   * Resolve action item
   */
  resolveActionItem: publicProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const comment = await ctx.db.factory_review_comments.update({
        where: { id: input.commentId },
        data: {
          resolved_at: new Date(),
          resolved_by: userId,
        },
      });

      return {
        success: true,
        message: 'Action item resolved',
        comment,
      };
    }),

  /**
   * Get action items for a session
   */
  getActionItems: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        resolved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        session_id: input.sessionId,
        is_action_item: true,
      };

      if (input.resolved !== undefined) {
        if (input.resolved) {
          where.resolved_at = { not: null };
        } else {
          where.resolved_at = null;
        }
      }

      const actionItems = await ctx.db.factory_review_comments.findMany({
        where,
        include: {
          author: {
            select: {
              email: true,
            },
          },
          resolver: {
            select: {
              email: true,
            },
          },
          photo: {
            select: {
              file_url: true,
              component_area: true,
            },
          },
        },
        orderBy: [
          { resolved_at: 'asc' },
          { due_date: 'asc' },
          { created_at: 'desc' },
        ],
      });

      return actionItems;
    }),

  // ============================================================================
  // FACTORY REVIEW DOCUMENTS
  // ============================================================================

  /**
   * Upload document to review session
   */
  uploadDocument: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.bigint().optional(),
        documentType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const document = await ctx.db.factory_review_documents.create({
        data: {
          session_id: input.sessionId,
          file_url: input.fileUrl,
          file_name: input.fileName,
          file_size: input.fileSize,
          document_type: input.documentType,
          uploaded_by: userId,
        },
      });

      return {
        success: true,
        message: 'Document uploaded successfully',
        document,
      };
    }),
});
