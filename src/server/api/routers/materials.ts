import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc/init";
import { TRPCError } from "@trpc/server";

// ========================================
// HIERARCHICAL MATERIALS ROUTER
// For cascading material management: Fabrics, Wood, Metal, Stone, Weaving, Carving
// ========================================

// Helper to handle Prisma errors with user-friendly messages
const handlePrismaError = (error: any, itemType: string) => {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new TRPCError({
      code: 'CONFLICT',
      message: `A ${itemType} with this name already exists. Please use a different name.`,
    });
  }
  if (error.code === 'P2025') {
    // Record not found
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${itemType} not found.`,
    });
  }
  // Generic error
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to process ${itemType}: ${error.message}`,
  });
};

