/**
 * Storage tRPC Router
 *
 * Unified API for hybrid file storage (Supabase + Google Drive).
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc/init';
import { TRPCError } from '@trpc/server';
import {
  getFileCategory,
} from '@/lib/storage/hybrid-storage';
import { deleteFromSupabase } from '@/lib/storage/supabase-storage';
import {
  deleteFromGoogleDrive,
  getGoogleDriveFileMetadata,
} from '@/lib/storage/google-drive-storage';
import { decryptToken } from '@/lib/oauth/token-encryption';
import { isTokenExpired, refreshAccessToken } from '@/lib/oauth/google-drive-client';
import { encryptToken } from '@/lib/oauth/token-encryption';

export const storageRouter = createTRPCRouter({
  /**
   * Upload file with hybrid routing
   * Note: File upload is handled via client-side upload then metadata storage
   */
  recordUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        storageType: z.enum(['supabase', 'google_drive']),
        storagePath: z.string().optional(),
        googleDriveId: z.string().optional(),
        publicUrl: z.string().optional(),
        projectId: z.string().optional(),
        briefId: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Store file metadata in database
      const fileRecord = await ctx.db.design_files.create({
        data: {
          file_name: input.fileName,
          file_size: input.fileSize,
          file_type: input.fileType,
          storage_type: input.storageType,
          storage_path: input.storagePath || null,
          google_drive_id: input.googleDriveId || null,
          google_drive_url: input.publicUrl || null,
          uploaded_by: ctx.session.user.id,
          project_id: input.projectId || null,
          design_brief_id: input.briefId || null,
          category: input.category || getFileCategory(input.fileType),
        },
      });

      return {
        success: true,
        fileId: fileRecord.id,
        storageType: input.storageType,
      };
    }),

  /**
   * Get valid Google Drive access token (refresh if needed)
   */
  getAccessToken: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get OAuth token from database
    const token = await ctx.db.oauth_tokens.findFirst({
      where: {
        user_id: userId,
        provider: 'google_drive',
      },
    });

    if (!token) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Google Drive connection found. Please connect your account.',
      });
    }

    // Check if token is expired
    const expiryDate = token.expires_at ? token.expires_at.getTime() : null;
    const expired = isTokenExpired(expiryDate);

    // Refresh if expired
    if (expired && token.refresh_token) {
      const decryptedRefreshToken = decryptToken(token.refresh_token);
      const newTokens = await refreshAccessToken(decryptedRefreshToken);
      const encryptedAccessToken = encryptToken(newTokens.access_token);

      await ctx.db.oauth_tokens.update({
        where: { id: token.id },
        data: {
          access_token: encryptedAccessToken,
          expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
          updated_at: new Date(),
        },
      });

      return { accessToken: newTokens.access_token };
    }

    // Return existing token
    const decryptedAccessToken = decryptToken(token.access_token);
    return { accessToken: decryptedAccessToken };
  }),

  /**
   * List all files for current user
   */
  listFiles: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        briefId: z.string().optional(),
        category: z.string().optional(),
        storageType: z.enum(['supabase', 'google_drive']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.projectId) {
        where.project_id = input.projectId;
      }

      if (input.briefId) {
        where.design_brief_id = input.briefId;
      }

      if (input.category) {
        where.category = input.category;
      }

      if (input.storageType) {
        where.storage_type = input.storageType;
      }

      const [files, total] = await Promise.all([
        ctx.db.design_files.findMany({
          where,
          orderBy: { created_at: 'desc' },
          take: input.limit,
          skip: input.offset,
          include: {
            users_design_files_uploaded_byTousers: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
          },
        }),
        ctx.db.design_files.count({ where }),
      ]);

      return {
        files,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get file by ID
   */
  getFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.design_files.findUnique({
        where: { id: input.fileId },
        include: {
          users_design_files_uploaded_byTousers: {
            select: {
              id: true,
              email: true,
              full_name: true,
            },
          },
        },
      });

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      return file;
    }),

  /**
   * Delete file
   */
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get file record
      const file = await ctx.db.design_files.findUnique({
        where: { id: input.fileId },
      });

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      // Check if user owns the file
      if (file.uploaded_by !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this file',
        });
      }

      // Delete from storage
      if (file.storage_type === 'supabase' && file.storage_path) {
        await deleteFromSupabase(file.storage_path);
      } else if (file.storage_type === 'google_drive' && file.google_drive_id) {
        // Get access token
        const { accessToken } = await ctx.caller.storage.getAccessToken();
        await deleteFromGoogleDrive(file.google_drive_id, accessToken);
      }

      // Delete from database
      await ctx.db.design_files.delete({
        where: { id: input.fileId },
      });

      return {
        success: true,
        message: 'File deleted successfully',
      };
    }),

  /**
   * Get file download URL
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.design_files.findUnique({
        where: { id: input.fileId },
      });

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      if (file.storage_type === 'supabase') {
        // Supabase URLs are already public
        return {
          url: file.google_drive_url, // Using google_drive_url field for generic public URL
          type: 'supabase' as const,
        };
      } else {
        // Get Google Drive metadata for latest URL
        const { accessToken } = await ctx.caller.storage.getAccessToken();
        const metadata = await getGoogleDriveFileMetadata(file.google_drive_id!, accessToken);

        return {
          url: metadata?.webViewLink || metadata?.webContentLink || file.google_drive_url || null,
          type: 'google_drive' as const,
        };
      }
    }),

  /**
   * Get storage statistics
   */
  getStorageStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const stats = await ctx.db.design_files.groupBy({
      by: ['storage_type'],
      where: {
        uploaded_by: userId,
      },
      _count: true,
      _sum: {
        file_size: true,
      },
    });

    const totalFiles = stats.reduce((sum: number, s) => sum + s._count, 0);
    const totalSize = stats.reduce((sum: number, s) => sum + (s._sum.file_size || 0), 0);

    const supabaseStats = stats.find((s) => s.storage_type === 'supabase');
    const googleDriveStats = stats.find((s) => s.storage_type === 'google_drive');

    return {
      total: {
        files: totalFiles,
        size: totalSize,
      },
      supabase: {
        files: supabaseStats?._count || 0,
        size: supabaseStats?._sum.file_size || 0,
      },
      googleDrive: {
        files: googleDriveStats?._count || 0,
        size: googleDriveStats?._sum.file_size || 0,
      },
    };
  }),
});
