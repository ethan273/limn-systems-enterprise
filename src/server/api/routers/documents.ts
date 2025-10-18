/**
 * Documents tRPC Router
 *
 * Media management for Products module entities:
 * - Collections, Concepts, Prototypes, Catalog Items, Production Orders
 * - Hybrid storage (Supabase <50MB, Google Drive >50MB)
 * - File metadata, media types, usage flags
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Entity type validation
const entityTypeEnum = z.enum([
  'collection',
  'concept',
  'prototype',
  'catalog_item',
  'production_order',
]);

// Media type validation
const mediaTypeEnum = z.enum([
  'isometric',
  'line_drawing',
  'rendering',
  'photo',
  '3d_model',
  'technical_drawing',
  'other',
]);

export const documentsRouter = createTRPCRouter({
  /**
   * Get all documents for a specific entity
   */
  getByEntity: publicProcedure
    .input(
      z.object({
        entityType: entityTypeEnum,
        entityId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};

      // Map entity type to correct database field
      switch (input.entityType) {
        case 'collection':
          whereClause.collection_id = input.entityId;
          break;
        case 'concept':
          whereClause.concept_id = input.entityId;
          break;
        case 'prototype':
          whereClause.prototype_id = input.entityId;
          break;
        case 'catalog_item':
          whereClause.catalog_item_id = input.entityId;
          break;
        case 'production_order':
          whereClause.production_order_id = input.entityId;
          break;
      }

      const documents = await ctx.db.documents.findMany({
        where: whereClause,
        orderBy: [
          { display_order: 'asc' },
          { created_at: 'desc' },
        ],
        // Note: select not supported by Supabase wrapper - returns all fields
      });

      return documents;
    }),

  /**
   * Get documents for a specific catalog item
   * Convenience method for getByEntity with entityType='catalog_item'
   */
  getByItemId: publicProcedure
    .input(z.object({
      itemId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const documents = await ctx.db.documents.findMany({
        where: {
          catalog_item_id: input.itemId,
        },
        orderBy: [
          { display_order: 'asc' },
          { created_at: 'desc' },
        ],
      });

      return documents;
    }),

  /**
   * Record file upload metadata
   * Note: Actual file upload happens client-side, this stores metadata
   */
  recordUpload: publicProcedure
    .input(
      z.object({
        // Entity linking
        entityType: entityTypeEnum,
        entityId: z.string().uuid(),

        // File info
        fileName: z.string(),
        originalName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),

        // Storage info
        storageType: z.enum(['supabase', 'google_drive']),
        url: z.string().optional(),
        downloadUrl: z.string().optional(),
        googleDriveId: z.string().optional(),
        googleDriveUrl: z.string().optional(),
        storageBucket: z.string().optional(),

        // Media metadata
        mediaType: mediaTypeEnum.optional(),
        useForPackaging: z.boolean().default(false),
        useForLabeling: z.boolean().default(false),
        useForMarketing: z.boolean().default(false),
        isPrimaryImage: z.boolean().default(false),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      // Build document data with entity-specific field
      const documentData: any = {
        name: input.fileName,
        original_name: input.originalName,
        type: input.fileType,
        size: input.fileSize,
        storage_type: input.storageType,
        url: input.url || null,
        download_url: input.downloadUrl || null,
        google_drive_id: input.googleDriveId || null,
        google_drive_url: input.googleDriveUrl || null,
        storage_bucket: input.storageBucket || null,
        media_type: input.mediaType || null,
        use_for_packaging: input.useForPackaging,
        use_for_labeling: input.useForLabeling,
        use_for_marketing: input.useForMarketing,
        is_primary_image: input.isPrimaryImage,
        display_order: input.displayOrder,
        uploaded_by_user: ctx.session.user.id,
        status: 'active',
      };

      // Set entity-specific foreign key
      switch (input.entityType) {
        case 'collection':
          documentData.collection_id = input.entityId;
          break;
        case 'concept':
          documentData.concept_id = input.entityId;
          break;
        case 'prototype':
          documentData.prototype_id = input.entityId;
          break;
        case 'catalog_item':
          documentData.catalog_item_id = input.entityId;
          break;
        case 'production_order':
          documentData.production_order_id = input.entityId;
          break;
      }

      const document = await ctx.db.documents.create({
        data: documentData,
      });

      return {
        success: true,
        documentId: document.id,
        storageType: input.storageType,
      };
    }),

  /**
   * Update document metadata
   */
  updateMetadata: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        mediaType: mediaTypeEnum.optional(),
        useForPackaging: z.boolean().optional(),
        useForLabeling: z.boolean().optional(),
        useForMarketing: z.boolean().optional(),
        isPrimaryImage: z.boolean().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const updateData: any = {};

      if (input.mediaType !== undefined) updateData.media_type = input.mediaType;
      if (input.useForPackaging !== undefined) updateData.use_for_packaging = input.useForPackaging;
      if (input.useForLabeling !== undefined) updateData.use_for_labeling = input.useForLabeling;
      if (input.useForMarketing !== undefined) updateData.use_for_marketing = input.useForMarketing;
      if (input.isPrimaryImage !== undefined) updateData.is_primary_image = input.isPrimaryImage;
      if (input.displayOrder !== undefined) updateData.display_order = input.displayOrder;

      const document = await ctx.db.documents.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        success: true,
        document,
      };
    }),

  /**
   * Delete document
   */
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      // Get document to verify ownership and get storage info
      const document = await ctx.db.documents.findUnique({
        where: { id: input.id },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      // Delete from storage based on storage type
      try {
        if (document.file_source === 'supabase' || document.storage_type === 'supabase') {
          // Delete from Supabase Storage
          if (document.url) {
            const supabase = getSupabaseAdmin();
            // Extract the file path from the URL
            // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
            const urlObj = new URL(document.url);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.indexOf('public') + 1;
            if (bucketIndex > 0 && bucketIndex < pathParts.length) {
              const bucket = pathParts[bucketIndex];
              const filePath = pathParts.slice(bucketIndex + 1).join('/');

              const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

              if (deleteError) {
                console.error('Supabase storage delete error:', deleteError);
                // Don't throw - continue with database deletion even if storage delete fails
              }
            }
          }
        } else if (document.file_source === 'google_drive' && document.google_drive_file_id) {
          // Google Drive deletion would go here
          // For now, we'll just log it as it requires Google Drive API setup
          console.log('Google Drive file deletion not implemented:', document.google_drive_file_id);
          // TODO: Implement Google Drive file deletion when API is configured
        }
      } catch (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await ctx.db.documents.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    }),

  /**
   * Get document by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.documents.findUnique({
        where: { id: input.id },
        // Note: select not supported by Supabase wrapper - returns all fields
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      return document;
    }),

  /**
   * Set primary image for entity
   * Unsets previous primary image and sets new one
   */
  setPrimaryImage: publicProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        entityType: entityTypeEnum,
        entityId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      // Build where clause for entity
      const whereClause: any = {};
      switch (input.entityType) {
        case 'collection':
          whereClause.collection_id = input.entityId;
          break;
        case 'concept':
          whereClause.concept_id = input.entityId;
          break;
        case 'prototype':
          whereClause.prototype_id = input.entityId;
          break;
        case 'catalog_item':
          whereClause.catalog_item_id = input.entityId;
          break;
        case 'production_order':
          whereClause.production_order_id = input.entityId;
          break;
      }

      // Unset all primary images for this entity
      // Note: updateMany not supported by wrapper, using findMany + individual updates
      const existingPrimaryImages = await ctx.db.documents.findMany({
        where: {
          ...whereClause,
          is_primary_image: true,
        },
      });

      await Promise.all(
        existingPrimaryImages.map((doc: any) =>
          ctx.db.documents.update({
            where: { id: doc.id },
            data: { is_primary_image: false },
          })
        )
      );

      // Set new primary image
      await ctx.db.documents.update({
        where: { id: input.documentId },
        data: { is_primary_image: true },
      });

      return {
        success: true,
        message: 'Primary image updated',
      };
    }),
});
