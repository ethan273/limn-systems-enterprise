/**
 * Shop Drawings tRPC Router
 *
 * Comprehensive API for shop drawings with version control, PDF annotations,
 * and multi-party approval workflow.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const shopDrawingsRouter = createTRPCRouter({
  /**
   * Get all shop drawings with filters and pagination
   */
  getAll: publicProcedure
    .input(
      z.object({
        productionOrderId: z.string().optional(),
        factoryId: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(), // Search by drawing number or name
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.productionOrderId) {
        where.production_order_id = input.productionOrderId;
      }

      if (input.factoryId) {
        where.factory_id = input.factoryId;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.search) {
        where.OR = [
          { drawing_number: { contains: input.search, mode: 'insensitive' } },
          { drawing_name: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [drawings, total] = await Promise.all([
        ctx.db.shop_drawings.findMany({
          where,
          include: {
            production_orders: {
              select: {
                order_number: true,
                item_name: true,
              },
            },
            partners: {
              select: {
                company_name: true,
              },
            },
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
            versions: {
              orderBy: {
                version_number: 'desc',
              },
              take: 1, // Get latest version
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.shop_drawings.count({ where }),
      ]);

      return {
        drawings,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get single shop drawing with all versions, comments, and approvals
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const drawing = await ctx.db.shop_drawings.findUnique({
        where: { id: input.id },
        include: {
          production_orders: {
            select: {
              order_number: true,
              item_name: true,
              item_description: true,
            },
          },
          partners: {
            select: {
              company_name: true,
              primary_contact: true,
              primary_email: true,
            },
          },
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
          limn_approver: {
            select: {
              name: true,
              email: true,
            },
          },
          designer_approver: {
            select: {
              name: true,
              email: true,
            },
          },
          versions: {
            include: {
              uploader: {
                select: {
                  name: true,
                  email: true,
                },
              },
              comments: {
                include: {
                  author: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                  resolver: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  created_at: 'desc',
                },
              },
              approvals: {
                include: {
                  approver: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  approved_at: 'desc',
                },
              },
            },
            orderBy: {
              version_number: 'desc',
            },
          },
        },
      });

      if (!drawing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shop drawing not found',
        });
      }

      return drawing;
    }),

  /**
   * Create new shop drawing
   */
  create: publicProcedure
    .input(
      z.object({
        productionOrderId: z.string(),
        factoryId: z.string().optional(),
        drawingName: z.string(),
        drawingType: z.string().optional(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Generate drawing number: SD-2025-0001
      const year = new Date().getFullYear();
      const lastDrawing = await ctx.db.shop_drawings.findFirst({
        where: {
          drawing_number: {
            startsWith: `SD-${year}-`,
          },
        },
        orderBy: {
          drawing_number: 'desc',
        },
      });

      let nextNumber = 1;
      if (lastDrawing) {
        const lastNumber = parseInt(lastDrawing.drawing_number.split('-')[2] || '0');
        nextNumber = lastNumber + 1;
      }

      const drawingNumber = `SD-${year}-${nextNumber.toString().padStart(4, '0')}`;

      // Create drawing and first version in transaction
      const drawing = await ctx.db.$transaction(async (tx) => {
        // Create drawing
        const newDrawing = await tx.shop_drawings.create({
          data: {
            production_order_id: input.productionOrderId,
            factory_id: input.factoryId,
            drawing_number: drawingNumber,
            drawing_name: input.drawingName,
            drawing_type: input.drawingType,
            current_version: 1,
            status: 'in_review',
            notes: input.notes,
            tags: input.tags || [],
            created_by: userId,
          },
        });

        // Create first version
        await tx.shop_drawing_versions.create({
          data: {
            shop_drawing_id: newDrawing.id,
            version_number: 1,
            file_name: input.fileName,
            file_url: input.fileUrl,
            file_size: BigInt(input.fileSize),
            mime_type: 'application/pdf',
            uploaded_by: userId,
            uploaded_by_role: 'factory', // TODO: Determine role from user
            upload_notes: 'Initial submission',
            status: 'current',
          },
        });

        return newDrawing;
      });

      return {
        success: true,
        drawing,
        message: `Shop drawing ${drawingNumber} created successfully`,
      };
    }),

  /**
   * Upload new version
   */
  uploadVersion: publicProcedure
    .input(
      z.object({
        shopDrawingId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        uploadNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get current drawing
      const drawing = await ctx.db.shop_drawings.findUnique({
        where: { id: input.shopDrawingId },
        include: {
          versions: {
            orderBy: {
              version_number: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!drawing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shop drawing not found',
        });
      }

      const nextVersionNumber = drawing.current_version + 1;

      // Create new version and update drawing
      const result = await ctx.db.$transaction(async (tx) => {
        // Mark previous version as superseded
        if (drawing.versions[0]) {
          await tx.shop_drawing_versions.update({
            where: { id: drawing.versions[0].id },
            data: { status: 'superseded' },
          });
        }

        // Create new version
        const newVersion = await tx.shop_drawing_versions.create({
          data: {
            shop_drawing_id: input.shopDrawingId,
            version_number: nextVersionNumber,
            file_name: input.fileName,
            file_url: input.fileUrl,
            file_size: BigInt(input.fileSize),
            mime_type: 'application/pdf',
            uploaded_by: userId,
            uploaded_by_role: 'factory', // TODO: Determine role from user
            upload_notes: input.uploadNotes,
            status: 'current',
          },
        });

        // Update drawing
        await tx.shop_drawings.update({
          where: { id: input.shopDrawingId },
          data: {
            current_version: nextVersionNumber,
            status: 'in_review', // Reset to in_review when new version uploaded
            updated_at: new Date(),
          },
        });

        return newVersion;
      });

      return {
        success: true,
        version: result,
        message: `Version ${nextVersionNumber} uploaded successfully`,
      };
    }),

  /**
   * Add comment/annotation
   */
  addComment: publicProcedure
    .input(
      z.object({
        drawingVersionId: z.string(),
        commentText: z.string(),
        commentType: z.enum(['review', 'question', 'change_request', 'approval', 'general']),
        pdfPageNumber: z.number().optional(),
        pdfXCoordinate: z.number().optional(),
        pdfYCoordinate: z.number().optional(),
        annotationData: z.any().optional(),
        parentCommentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const comment = await ctx.db.shop_drawing_comments.create({
        data: {
          drawing_version_id: input.drawingVersionId,
          comment_text: input.commentText,
          comment_type: input.commentType,
          pdf_page_number: input.pdfPageNumber,
          pdf_x_coordinate: input.pdfXCoordinate,
          pdf_y_coordinate: input.pdfYCoordinate,
          annotation_data: input.annotationData,
          author_id: userId,
          author_role: 'limn_team', // TODO: Determine role from user
          status: 'open',
          parent_comment_id: input.parentCommentId,
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        comment,
        message: 'Comment added successfully',
      };
    }),

  /**
   * Resolve comment
   */
  resolveComment: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        resolutionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const comment = await ctx.db.shop_drawing_comments.update({
        where: { id: input.commentId },
        data: {
          status: 'resolved',
          resolved_by: userId,
          resolved_at: new Date(),
          resolution_notes: input.resolutionNotes,
        },
      });

      return {
        success: true,
        comment,
        message: 'Comment resolved successfully',
      };
    }),

  /**
   * Approve or reject version
   */
  approveVersion: publicProcedure
    .input(
      z.object({
        drawingVersionId: z.string(),
        decision: z.enum(['approved', 'rejected', 'changes_requested']),
        comments: z.string().optional(),
        isConditional: z.boolean().default(false),
        conditions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get version and drawing
      const version = await ctx.db.shop_drawing_versions.findUnique({
        where: { id: input.drawingVersionId },
        include: {
          shop_drawings: true,
        },
      });

      if (!version) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Drawing version not found',
        });
      }

      // Determine approver role (TODO: from user role/permissions)
      const approverRole = 'limn_team'; // or 'designer'

      // Create approval record
      const approval = await ctx.db.shop_drawing_approvals.create({
        data: {
          drawing_version_id: input.drawingVersionId,
          approver_id: userId,
          approver_role: approverRole,
          decision: input.decision,
          comments: input.comments,
          is_conditional: input.isConditional,
          conditions: input.conditions,
        },
      });

      // Update drawing status based on approval
      const drawing = version.shop_drawings;
      let newStatus = drawing.status;

      if (input.decision === 'approved') {
        // Check if both limn and designer have approved
        const allApprovals = await ctx.db.shop_drawing_approvals.findMany({
          where: {
            drawing_version_id: input.drawingVersionId,
            decision: 'approved',
          },
        });

        const hasLimnApproval = allApprovals.some((a) => a.approver_role === 'limn_team');
        const hasDesignerApproval = allApprovals.some((a) => a.approver_role === 'designer');

        if (hasLimnApproval && hasDesignerApproval) {
          newStatus = 'approved';
          await ctx.db.shop_drawings.update({
            where: { id: drawing.id },
            data: {
              status: newStatus,
              final_approved_at: new Date(),
              limn_approved_by: allApprovals.find((a) => a.approver_role === 'limn_team')
                ?.approver_id,
              limn_approved_at: new Date(),
              designer_approved_by: allApprovals.find((a) => a.approver_role === 'designer')
                ?.approver_id,
              designer_approved_at: new Date(),
            },
          });
        } else if (hasDesignerApproval) {
          newStatus = 'designer_approved';
          await ctx.db.shop_drawings.update({
            where: { id: drawing.id },
            data: {
              status: newStatus,
              designer_approved_by: userId,
              designer_approved_at: new Date(),
            },
          });
        } else if (hasLimnApproval) {
          await ctx.db.shop_drawings.update({
            where: { id: drawing.id },
            data: {
              limn_approved_by: userId,
              limn_approved_at: new Date(),
            },
          });
        }
      } else if (input.decision === 'rejected') {
        newStatus = 'rejected';
        await ctx.db.shop_drawings.update({
          where: { id: drawing.id },
          data: {
            status: newStatus,
            rejected_by: userId,
            rejected_at: new Date(),
            rejection_reason: input.comments,
          },
        });
      } else if (input.decision === 'changes_requested') {
        newStatus = 'revision_requested';
        await ctx.db.shop_drawings.update({
          where: { id: drawing.id },
          data: {
            status: newStatus,
          },
        });
      }

      return {
        success: true,
        approval,
        newStatus,
        message: `Drawing ${input.decision === 'approved' ? 'approved' : input.decision === 'rejected' ? 'rejected' : 'revision requested'}`,
      };
    }),

  /**
   * Get version history
   */
  getVersionHistory: publicProcedure
    .input(z.object({ shopDrawingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const versions = await ctx.db.shop_drawing_versions.findMany({
        where: { shop_drawing_id: input.shopDrawingId },
        include: {
          uploader: {
            select: {
              name: true,
              email: true,
            },
          },
          comments: {
            select: {
              id: true,
              status: true,
            },
          },
          approvals: {
            select: {
              id: true,
              decision: true,
              approver_role: true,
            },
          },
        },
        orderBy: {
          version_number: 'desc',
        },
      });

      return versions.map((v) => ({
        ...v,
        commentCount: v.comments.length,
        openCommentCount: v.comments.filter((c) => c.status === 'open').length,
        approvalCount: v.approvals.length,
      }));
    }),

  /**
   * Get comments for version
   */
  getComments: publicProcedure
    .input(
      z.object({
        drawingVersionId: z.string(),
        status: z.string().optional(),
        authorRole: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        drawing_version_id: input.drawingVersionId,
      };

      if (input.status) {
        where.status = input.status;
      }

      if (input.authorRole) {
        where.author_role = input.authorRole;
      }

      const comments = await ctx.db.shop_drawing_comments.findMany({
        where: {
          ...where,
          parent_comment_id: null, // Only get top-level comments
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          resolver: {
            select: {
              name: true,
              email: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  name: true,
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
   * Get approval status
   */
  getApprovalStatus: publicProcedure
    .input(z.object({ shopDrawingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const drawing = await ctx.db.shop_drawings.findUnique({
        where: { id: input.shopDrawingId },
        include: {
          limn_approver: {
            select: {
              name: true,
              email: true,
            },
          },
          designer_approver: {
            select: {
              name: true,
              email: true,
            },
          },
          versions: {
            include: {
              approvals: {
                include: {
                  approver: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  approved_at: 'desc',
                },
              },
            },
            orderBy: {
              version_number: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!drawing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shop drawing not found',
        });
      }

      const currentVersion = drawing.versions[0];
      const approvals = currentVersion?.approvals || [];

      return {
        status: drawing.status,
        limnApproved: !!drawing.limn_approved_at,
        limnApprovedBy: drawing.limn_approver,
        limnApprovedAt: drawing.limn_approved_at,
        designerApproved: !!drawing.designer_approved_at,
        designerApprovedBy: drawing.designer_approver,
        designerApprovedAt: drawing.designer_approved_at,
        finalApproved: !!drawing.final_approved_at,
        finalApprovedAt: drawing.final_approved_at,
        currentVersionApprovals: approvals,
        requiresBothApprovals: true, // Always require both
      };
    }),

  /**
   * Get activity log
   */
  getActivityLog: publicProcedure
    .input(z.object({ shopDrawingId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get all versions, comments, and approvals for this drawing
      const drawing = await ctx.db.shop_drawings.findUnique({
        where: { id: input.shopDrawingId },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          versions: {
            include: {
              uploader: {
                select: {
                  name: true,
                },
              },
              comments: {
                include: {
                  author: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              approvals: {
                include: {
                  approver: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!drawing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shop drawing not found',
        });
      }

      // Build activity log
      const activities: any[] = [];

      // Drawing created
      activities.push({
        type: 'drawing_created',
        timestamp: drawing.created_at,
        user: drawing.creator.name,
        description: `Created drawing ${drawing.drawing_number}`,
      });

      // Version uploads
      drawing.versions.forEach((version) => {
        activities.push({
          type: 'version_uploaded',
          timestamp: version.uploaded_at,
          user: version.uploader.name,
          description: `Uploaded version ${version.version_number}`,
          versionNumber: version.version_number,
        });

        // Comments on this version
        version.comments.forEach((comment) => {
          activities.push({
            type: 'comment_added',
            timestamp: comment.created_at,
            user: comment.author.name,
            description: `Added ${comment.comment_type} comment`,
            versionNumber: version.version_number,
          });
        });

        // Approvals on this version
        version.approvals.forEach((approval) => {
          activities.push({
            type: 'approval_given',
            timestamp: approval.approved_at,
            user: approval.approver.name,
            description: `${approval.decision === 'approved' ? 'Approved' : approval.decision === 'rejected' ? 'Rejected' : 'Requested changes for'} version ${version.version_number}`,
            versionNumber: version.version_number,
            decision: approval.decision,
          });
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return activities;
    }),
});
