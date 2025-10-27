/**
 * Email Templates tRPC Router
 *
 * API endpoints for email template management
 *
 * @module emailTemplates
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import {
  EmailTemplateService,
  extractTemplateVariables,
  renderTemplate,
} from '@/lib/services/email-service';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createTemplateSchema = z.object({
  template_key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  html_content: z.string().min(1),
  text_content: z.string().optional(),
  variables: z.array(z.string()).optional(),
  language: z.string().max(10).default('en'),
  is_active: z.boolean().default(true),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  html_content: z.string().min(1).optional(),
  text_content: z.string().optional(),
  variables: z.array(z.string()).optional(),
  language: z.string().max(10).optional(),
  is_active: z.boolean().optional(),
});

const listTemplatesSchema = z.object({
  is_active: z.boolean().optional(),
  language: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const renderTemplateSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

// =====================================================
// ROUTER
// =====================================================

export const emailTemplatesRouter = createTRPCRouter({
  /**
   * Create a new email template
   */
  create: protectedProcedure
    .input(createTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      return await service.create(input);
    }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      const template = await service.getById(input.id);

      if (!template) {
        throw new Error('Template not found');
      }

      return template;
    }),

  /**
   * Get template by template_key
   */
  getByKey: protectedProcedure
    .input(z.object({ template_key: z.string() }))
    .query(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      const template = await service.getByKey(input.template_key);

      if (!template) {
        throw new Error('Template not found');
      }

      return template;
    }),

  /**
   * List all templates
   */
  list: protectedProcedure
    .input(listTemplatesSchema.optional())
    .query(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      return await service.list(input);
    }),

  /**
   * Update a template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateTemplateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      return await service.update(input.id, input.data);
    }),

  /**
   * Delete a template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      await service.delete(input.id);
      return { success: true };
    }),

  /**
   * Render a template with variables (preview)
   */
  render: protectedProcedure
    .input(renderTemplateSchema)
    .query(async ({ input, ctx }) => {
      const service = new EmailTemplateService(ctx.db);
      return await service.render(input.templateId, input.variables);
    }),

  /**
   * Extract variables from template content
   */
  extractVariables: protectedProcedure
    .input(z.object({ content: z.string() }))
    .query(({ input }) => {
      return extractTemplateVariables(input.content);
    }),

  /**
   * Test template rendering
   */
  testRender: protectedProcedure
    .input(
      z.object({
        template: z.string(),
        variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
      })
    )
    .query(({ input }) => {
      try {
        const rendered = renderTemplate({
          template: input.template,
          variables: input.variables,
          strict: false,
        });
        return {
          success: true,
          result: rendered,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
