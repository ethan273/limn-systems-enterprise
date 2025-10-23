/**
 * Storage tRPC Router
 *
 * Unified API for hybrid file storage (Supabase + Google Drive).
 * Uses Google Drive Service Account for always-connected corporate folder access.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';
import {
  getFileCategory as _getFileCategory,
} from '@/lib/storage/hybrid-storage';
import { deleteFromSupabase } from '@/lib/storage/supabase-storage';
import {
  deleteFileFromDrive,
  getFileMetadata as getDriveFileMetadata,
  validateServiceAccountConfig,
  testConnection,
} from '@/lib/google-drive/service-account-client';

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
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

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
          file_url: input.publicUrl || '',
          uploaded_by: ctx.session.user.id,
        },
      });

      return {
        success: true,
        fileId: fileRecord.id,
        storageType: input.storageType,
      };
    }),

  /**
   * Test Google Drive service account connection
   */
  testDriveConnection: protectedProcedure.query(async () => {
    return await testConnection();
  }),

  /**
   * Get Google Drive configuration status
   */
  getDriveStatus: protectedProcedure.query(async () => {
    const validation = validateServiceAccountConfig();

    if (!validation.valid) {
      return {
        connected: false,
        configured: false,
        errors: validation.errors,
      };
    }

    // Test actual connection
    const connectionTest = await testConnection();

    return {
      connected: connectionTest.success,
      configured: true,
      message: connectionTest.message,
    };
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
        storageType: z.string().optional(),
        search: z.string().optional(),
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

      if (input.search && input.search.trim()) {
        where.file_name = {
          contains: input.search,
          mode: 'insensitive',
        };
      }

      const [files, total] = await Promise.all([
        ctx.db.design_files.findMany({
          where,
          orderBy: { created_at: 'desc' },
          take: input.limit,
          skip: input.offset,
          include: {
            users: {
              select: {
                id: true,
                email: true,
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
          users: {
            select: {
              id: true,
              email: true,
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
   * Update file metadata
   */
  updateFile: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        fileName: z.string().optional(),
        category: z.string().optional(),
        projectId: z.string().optional(),
        briefId: z.string().optional(),
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
          message: 'You do not have permission to update this file',
        });
      }

      // Build update data
      const updateData: any = {};
      if (input.fileName !== undefined) updateData.file_name = input.fileName;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.projectId !== undefined) updateData.project_id = input.projectId;
      if (input.briefId !== undefined) updateData.design_brief_id = input.briefId;

      // Update database
      const updatedFile = await ctx.db.design_files.update({
        where: { id: input.fileId },
        data: updateData,
      });

      return {
        success: true,
        message: 'File updated successfully',
        file: updatedFile,
      };
    }),

  /**
   * Delete file
   */
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

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
        // Use service account to delete
        await deleteFileFromDrive(file.google_drive_id);
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
        // Get Google Drive metadata for latest URL using service account
        const metadata = await getDriveFileMetadata(file.google_drive_id!);

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
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

    const userId = ctx.session.user.id;

    // Note: groupBy not supported by wrapper, using findMany + manual grouping
    const allFiles = await ctx.db.design_files.findMany({
      where: {
        uploaded_by: userId,
      },
      select: {
        storage_type: true,
        file_size: true,
      },
    });

    // Group by storage_type and calculate _count and _sum manually
    const groupedStats = allFiles.reduce((acc: Record<string, { _count: number; _sum: { file_size: number } }>, file) => {
      const storageType = file.storage_type;
      // eslint-disable-next-line security/detect-object-injection
      if (!acc[storageType]) {
        // eslint-disable-next-line security/detect-object-injection
        acc[storageType] = { _count: 0, _sum: { file_size: 0 } };
      }
      // eslint-disable-next-line security/detect-object-injection
      acc[storageType]._count += 1;
      // eslint-disable-next-line security/detect-object-injection
      acc[storageType]._sum.file_size += file.file_size || 0;
      return acc;
    }, {});

    const stats = Object.entries(groupedStats).map(([storage_type, data]) => ({
      storage_type,
      _count: data._count,
      _sum: { file_size: data._sum.file_size },
    }));

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

  /**
   * Upload QC Photo to Supabase Storage
   * QC PWA Enhancement - Phase 3
   */
  uploadQcPhoto: protectedProcedure
    .input(
      z.object({
        inspection_id: z.string().uuid(),
        checkpoint_id: z.string().uuid(),
        filename: z.string(),
        file_data: z.string(), // Base64 encoded image data
        file_size: z.number(),
        content_type: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      try {
        // Convert base64 to buffer
        const base64Data = input.file_data.split(',')[1] || input.file_data;
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate storage path: qc-photos/inspection_id/checkpoint_id/filename
        const storagePath = `qc-photos/${input.inspection_id}/${input.checkpoint_id}/${input.filename}`;

        // Upload to Supabase Storage using service role client
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Supabase configuration missing',
          });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase.storage
          .from('qc-photos')
          .upload(storagePath, buffer, {
            contentType: input.content_type,
            upsert: false,
          });

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Storage upload failed: ${error.message}`,
          });
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('qc-photos').getPublicUrl(storagePath);

        return {
          success: true,
          url: publicUrl,
          path: data.path,
        };
      } catch (error) {
        console.error('QC Photo upload error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }),
});
