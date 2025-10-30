/**
 * Image Annotations tRPC Router - Phase 2B
 * Simplified MVP using Prisma methods (no raw SQL)
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

const AnnotationShapeSchema = z.enum(['rectangle', 'circle', 'arrow', 'line', 'freehand', 'marker', 'text']);

const AnnotationDataSchema = z.object({
  type: AnnotationShapeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  color: z.string().default('#FF0000'),
  strokeWidth: z.number().default(2),
});

export const imageAnnotationsRouter = createTRPCRouter({
  getByImageId: protectedProcedure
    .input(z.object({
      imageId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const photo = await ctx.db.qc_photos.findUnique({
        where: { id: input.imageId },
        select: { id: true, annotations: true },
      });
      return photo;
    }),

  saveAnnotations: protectedProcedure
    .input(z.object({
      imageId: z.string().uuid(),
      annotations: z.array(z.object({
        id: z.string(),
        shape: AnnotationDataSchema,
        comment: z.string().optional(),
        severity: z.enum(['info', 'minor', 'major', 'critical']).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.qc_photos.update({
        where: { id: input.imageId },
        data: { annotations: input.annotations as any },
      });
      return { success: true };
    }),

  getInspectionSummary: protectedProcedure
    .input(z.object({ inspectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const photos = await ctx.db.qc_photos.findMany({
        where: { qc_inspection_id: input.inspectionId },
        select: { id: true, photo_url: true, annotations: true },
      });
      
      const summary = {
        totalPhotos: photos.length,
        totalAnnotations: photos.reduce((acc, p) => acc + ((p.annotations as any)?.length || 0), 0),
      };

      return { photos, summary };
    }),
});
