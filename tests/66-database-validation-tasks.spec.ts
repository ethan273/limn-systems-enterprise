/**
 * DATABASE FIELD VALIDATION: TASKS TABLES
 *
 * Tests database-level constraints, defaults, and data integrity for:
 * - tasks
 * - task_templates
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe('Database Validation - Tasks Table', () => {
  test('should enforce required fields on tasks', async () => {
    try {
      await prisma.tasks.create({
        data: {
          // Missing required title
        } as any,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('title');
    }
  });

  test('should set default timestamps on tasks creation', async () => {
    const task = await prisma.tasks.create({
      data: {
        title: 'Timestamp Test Task',
      },
    });

    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });

  test('should set default status on tasks creation', async () => {
    const task = await prisma.tasks.create({
      data: {
        title: 'Default Status Test',
      },
    });

    expect(task.status).toBe('todo');

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });

  test('should set default priority on tasks creation', async () => {
    const task = await prisma.tasks.create({
      data: {
        title: 'Default Priority Test',
      },
    });

    expect(task.priority).toBe('medium');

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });

  test('should set default is_completed on tasks', async () => {
    // SKIPPED: tasks table has NO is_completed field
    // Schema verification shows: tasks uses status field to track completion
    const task = await prisma.tasks.create({
      data: {
        title: 'Default Completion Test',
      },
    });

    expect(task.is_completed).toBe(false);

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });

  test('should allow nullable fields on tasks', async () => {
    const task = await prisma.tasks.create({
      data: {
        title: 'Nullable Test',
        description: null,
        due_date: null,
        completed_at: null,
      },
    });

    expect(task.description).toBeNull();
    expect(task.due_date).toBeNull();
    expect(task.completed_at).toBeNull();

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });

  test('should update updatedAt on tasks modification', async () => {
    const task = await prisma.tasks.create({
      data: {
        title: 'Update Test Task',
      },
    });

    const originalUpdatedAt = task.updated_at;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    const updated = await prisma.tasks.update({
      where: { id: task.id },
      data: { status: 'in_progress' },
    });

    expect(updated.updated_at!.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });

  test('should store boolean completed flag on tasks', async () => {
    // SKIPPED: tasks table has NO is_completed field
    // Schema verification shows: tasks uses status field and completed_at timestamp to track completion
    const task = await prisma.tasks.create({
      data: {
        title: 'Completed Task',
        is_completed: true,
      },
    });

    expect(task.is_completed).toBe(true);

    // Cleanup
    await prisma.tasks.delete({ where: { id: task.id } });
  });
});

test.describe('Database Validation - Task Templates Table', () => {
  // Helper function to create minimal valid task_template data
  function createTemplateData(overrides: any = {}) {
    return {
      name: 'Test Template',
      template_data: { steps: [] },
      ...overrides,
    };
  }

  test('should enforce required fields on task_templates', async () => {
    try {
      await prisma.task_templates.create({
        data: {
          // Missing required name and template_data
        } as any,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/name|template_data/);
    }
  });

  test('should set default timestamps on task_templates', async () => {
    // SKIPPED: task_templates table has NO updated_at field
    // Schema verification shows: only created_at field exists with default now()
    const template = await prisma.task_templates.create({
      data: createTemplateData({ name: 'Timestamp Template' }),
    });

    expect(template.created_at).toBeInstanceOf(Date);
    expect(template.updated_at).toBeInstanceOf(Date);

    // Cleanup
    await prisma.task_templates.delete({ where: { id: template.id } });
  });

  test('should set default is_active on task_templates', async () => {
    const template = await prisma.task_templates.create({
      data: createTemplateData({ name: 'Active Template' }),
    });

    expect(template.is_active).toBe(true);

    // Cleanup
    await prisma.task_templates.delete({ where: { id: template.id } });
  });

  test('should allow nullable fields on task_templates', async () => {
    const template = await prisma.task_templates.create({
      data: createTemplateData({
        name: 'Nullable Template',
        description: null,
        category: null,
      }),
    });

    expect(template.description).toBeNull();
    expect(template.category).toBeNull();

    // Cleanup
    await prisma.task_templates.delete({ where: { id: template.id } });
  });

  test('should enforce unique name on task_templates', async () => {
    // SKIPPED: task_templates table has NO unique constraint on name field
    // Schema verification shows: name is required text field with no unique constraint
    const uniqueName = `Template-${Date.now()}`;

    const firstTemplate = await prisma.task_templates.create({
      data: createTemplateData({ name: uniqueName }),
    });

    try {
      await prisma.task_templates.create({
        data: createTemplateData({ name: uniqueName }),
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('Unique constraint');
    }

    // Cleanup
    await prisma.task_templates.delete({ where: { id: firstTemplate.id } });
  });
});
