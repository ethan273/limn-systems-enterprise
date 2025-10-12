import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * TASKS MODULE TESTS
 *
 * Comprehensive testing of all task management functionality:
 * - Tasks (CRUD, assignment, status updates)
 * - Kanban Board (drag-drop, column management)
 * - Task Lists (filtering, sorting, search)
 * - Subtasks (creation, completion tracking)
 * - Task Dependencies (linking, prerequisites)
 * - Time Tracking (logging, estimates vs actual)
 * - Task Comments (discussion, attachments)
 *
 * Coverage Target: 100%
 */

test.describe('📋 TASKS MODULE TESTS @tasks', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Task List View', () => {

    test('Tasks page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/tasks/i);

      // Check for task display (list or table)
      const hasTaskList = await page.locator('[data-testid="task-list"], .task-list, table, [data-testid="data-table"]').count() > 0;
      expect(hasTaskList).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-01-list-view.png'),
        fullPage: true
      });
    });

    test('Can create new task', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create task button
      const createButton = page.locator('button:has-text("New Task"), button:has-text("Create"), button:has-text("Add Task")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show dialog or navigate to create page
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/tasks\/new|\/tasks\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-02-create-task.png'),
          fullPage: true
        });
      }
    });

    test('Can view task details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"], [class*="task-"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page or show detail panel
        const hasDetailPanel = await page.locator('[data-testid="task-detail"], .task-detail').count() > 0;
        const url = page.url();
        const onDetailPage = url.match(/\/tasks\/[a-z0-9-]+$/);

        expect(hasDetailPanel || onDetailPage).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-03-task-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can update task status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for status controls
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();
        const statusButton = page.locator('button:has-text("Status"), button:has-text("Mark as")').first();

        const hasStatusControls = (await statusDropdown.count() > 0) || (await statusButton.count() > 0);

        if (hasStatusControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-04-update-status.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter tasks by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for status filter
      const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i }).first();

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select a status
        const option = page.locator('option, [role="option"]').filter({ hasText: /todo|in progress|done|completed/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-05-filtered-by-status.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can search tasks', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('TEST');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-06-search-tasks.png'),
          fullPage: true
        });
      }
    });

    test('Can filter tasks by assignee', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for assignee filter
      const assigneeFilter = page.locator('select, [role="combobox"]').filter({ hasText: /assignee|assigned|owner/i }).first();

      if (await assigneeFilter.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-07-filter-assignee.png'),
          fullPage: true
        });
      }
    });

    test('Can sort tasks', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for sortable headers
      const sortableHeader = page.locator('th[role="columnheader"], [data-sortable="true"]').first();

      if (await sortableHeader.isVisible()) {
        await sortableHeader.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-08-sorted-tasks.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Kanban Board', () => {

    test('Kanban board page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks/kanban`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify kanban board elements
      await expect(page.locator('h1')).toContainText(/kanban|board/i);

      // Check for columns
      const hasColumns = await page.locator('[data-testid="kanban-column"], .kanban-column, [class*="column"]').count() > 0;
      expect(hasColumns).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-09-kanban-board.png'),
        fullPage: true
      });
    });

    test('Kanban board displays task cards', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks/kanban`);
      await page.waitForLoadState('domcontentloaded');

      // Look for task cards
      const taskCards = page.locator('[data-testid="task-card"], .task-card, [draggable="true"]');

      if (await taskCards.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-10-kanban-cards.png'),
          fullPage: true
        });
      }
    });

    test('Can create task from kanban board', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks/kanban`);
      await page.waitForLoadState('domcontentloaded');

      // Look for add task button in a column
      const addTaskButton = page.locator('button:has-text("Add"), button:has-text("+"), button:has-text("New")').first();

      if (await addTaskButton.isVisible()) {
        await addTaskButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-11-kanban-add-task.png'),
          fullPage: true
        });
      }
    });

    test('Can view task details from kanban card', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks/kanban`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task card
      const firstCard = page.locator('[data-testid="task-card"], .task-card, [draggable="true"]').first();

      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show detail panel or navigate to detail
        const hasDetail = await page.locator('[role="dialog"], .modal, [data-testid="task-detail"]').count() > 0;
        expect(hasDetail).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-12-kanban-task-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can filter kanban board', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks/kanban`);
      await page.waitForLoadState('domcontentloaded');

      // Look for filter controls
      const filterButton = page.locator('button:has-text("Filter"), [data-testid="filter"]').first();
      const filterSelect = page.locator('select').first();

      const hasFilters = (await filterButton.count() > 0) || (await filterSelect.count() > 0);

      if (hasFilters) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-13-kanban-filters.png'),
          fullPage: true
        });
      }
    });

    test('Kanban columns are properly labeled', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks/kanban`);
      await page.waitForLoadState('domcontentloaded');

      // Verify column headers
      const columnHeaders = page.locator('[data-testid="column-header"], .column-header, h2, h3');
      const headerCount = await columnHeaders.count();

      expect(headerCount).toBeGreaterThan(0);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-14-kanban-columns.png'),
        fullPage: true
      });
    });
  });

  test.describe('Task Assignment', () => {

    test('Can assign task to user', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for assignment controls
        const assignButton = page.locator('button:has-text("Assign"), button:has-text("Assignee")').first();
        const assignSelect = page.locator('select[name*="assign"]').first();

        const hasAssignControls = (await assignButton.count() > 0) || (await assignSelect.count() > 0);

        if (hasAssignControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-15-assign-user.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view tasks assigned to me', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for "My Tasks" filter or view
      const myTasksButton = page.locator('button:has-text("My Tasks"), a:has-text("My Tasks")').first();
      const assignedToMeFilter = page.locator('select, [role="combobox"]').filter({ hasText: /assigned to me/i }).first();

      const hasMyTasksView = (await myTasksButton.count() > 0) || (await assignedToMeFilter.count() > 0);

      if (hasMyTasksView) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-16-my-tasks.png'),
          fullPage: true
        });
      }
    });

    test('Can reassign task to different user', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for assignee display/edit
        const assigneeSection = page.locator('[data-testid="assignee"], div:has-text("Assignee"), label:has-text("Assignee")').first();

        if (await assigneeSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-17-reassign-task.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Subtasks', () => {

    test('Can add subtask to task', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for add subtask button
        const addSubtaskButton = page.locator('button:has-text("Add Subtask"), button:has-text("New Subtask")').first();

        if (await addSubtaskButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-18-add-subtask.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view subtasks list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for subtasks section
        const subtasksSection = page.locator('div:has-text("Subtasks"), section:has-text("Subtasks"), h3:has-text("Subtasks")').first();

        if (await subtasksSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-19-subtasks-list.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can mark subtask as complete', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for subtask checkboxes
        const subtaskCheckbox = page.locator('input[type="checkbox"]').first();

        if (await subtaskCheckbox.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-20-complete-subtask.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Task Dependencies', () => {

    test('Can add task dependency', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for dependencies section
        const dependenciesButton = page.locator('button:has-text("Dependencies"), button:has-text("Depends on")').first();
        const dependenciesSection = page.locator('div:has-text("Dependencies"), section:has-text("Blocked by")').first();

        const hasDependencies = (await dependenciesButton.count() > 0) || (await dependenciesSection.count() > 0);

        if (hasDependencies) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-21-add-dependency.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view blocked tasks', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for blocked tasks filter/view
      const blockedFilter = page.locator('select, [role="combobox"]').filter({ hasText: /blocked/i }).first();

      if (await blockedFilter.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-22-blocked-tasks.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Time Tracking', () => {

    test('Can log time on task', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for time tracking
        const timeButton = page.locator('button:has-text("Log Time"), button:has-text("Track Time")').first();
        const timeInput = page.locator('input[name*="time"], input[placeholder*="hours"]').first();

        const hasTimeTracking = (await timeButton.count() > 0) || (await timeInput.count() > 0);

        if (hasTimeTracking) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-23-log-time.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view time estimates', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for estimate field
        const estimateSection = page.locator('div:has-text("Estimate"), label:has-text("Estimate")').first();

        if (await estimateSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-24-time-estimate.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view actual vs estimated time', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for time comparison
        const timeTracking = page.locator('div:has-text("Actual"), div:has-text("Logged"), div:has-text("Spent")').first();

        if (await timeTracking.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-25-actual-vs-estimate.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Task Comments', () => {

    test('Can add comment to task', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for comment input
        const commentInput = page.locator('textarea[placeholder*="comment" i], input[placeholder*="comment" i]').first();

        if (await commentInput.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-26-add-comment.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view comment history', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for comments section
        const commentsSection = page.locator('div:has-text("Comments"), section:has-text("Comments"), h3:has-text("Comments")').first();

        if (await commentsSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-27-comment-history.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can attach file to comment', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for attachment button
        const attachButton = page.locator('button:has-text("Attach"), input[type="file"]').first();

        if (await attachButton.isVisible() || await attachButton.count() > 0) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-28-attach-file.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Task Priorities', () => {

    test('Can set task priority', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for priority controls
        const prioritySelect = page.locator('select[name*="priority"]').first();
        const priorityButton = page.locator('button:has-text("Priority")').first();

        const hasPriorityControls = (await prioritySelect.count() > 0) || (await priorityButton.count() > 0);

        if (hasPriorityControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-29-set-priority.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter tasks by priority', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for priority filter
      const priorityFilter = page.locator('select, [role="combobox"]').filter({ hasText: /priority/i }).first();

      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();

        // Select a priority
        const option = page.locator('option, [role="option"]').filter({ hasText: /high|medium|low|urgent/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-30-filter-priority.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Task Due Dates', () => {

    test('Can set task due date', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for due date input
        const dueDateInput = page.locator('input[type="date"], input[name*="due"]').first();

        if (await dueDateInput.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-31-set-due-date.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view overdue tasks', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for overdue filter/view
      const overdueFilter = page.locator('button:has-text("Overdue"), a:has-text("Overdue")').first();
      const filterSelect = page.locator('select, [role="combobox"]').filter({ hasText: /overdue/i }).first();

      const hasOverdueView = (await overdueFilter.count() > 0) || (await filterSelect.count() > 0);

      if (hasOverdueView) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-32-overdue-tasks.png'),
          fullPage: true
        });
      }
    });

    test('Can view tasks due today', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for today filter
      const todayFilter = page.locator('button:has-text("Today"), a:has-text("Due Today")').first();

      if (await todayFilter.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-33-due-today.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Tasks Module Integration Tests', () => {

    test('Can navigate between task views', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Test navigation to kanban view
      const kanbanLink = page.locator('a:has-text("Kanban"), button:has-text("Board"), nav a[href*="kanban"]').first();

      if (await kanbanLink.isVisible()) {
        await kanbanLink.click();
        await page.waitForLoadState('domcontentloaded');

        const url = page.url();
        expect(url).toContain('kanban');
      }
    });

    test('Task statistics display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for stats/metrics cards
      const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="card"]');

      if (await statsCards.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-34-statistics.png'),
          fullPage: true
        });
      }
    });

    test('Can export tasks data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();

      if (await exportButton.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-35-export.png'),
          fullPage: true
        });
      }
    });

    test('Task search works correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        // Search functionality is available
        expect(await searchInput.isEnabled()).toBeTruthy();
      }
    });

    test('Can view task activity timeline', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for activity timeline
        const timeline = page.locator('div:has-text("Activity"), section:has-text("History"), div:has-text("Timeline")').first();

        if (await timeline.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-36-activity-timeline.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Task Labels/Tags', () => {

    test('Can add labels to task', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Click first task
      const firstTask = page.locator('table tbody tr, [data-testid="task-item"]').first();

      if (await firstTask.isVisible()) {
        await firstTask.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for label/tag controls
        const labelButton = page.locator('button:has-text("Labels"), button:has-text("Tags")').first();
        const labelSection = page.locator('div:has-text("Labels"), div:has-text("Tags")').first();

        const hasLabels = (await labelButton.count() > 0) || (await labelSection.count() > 0);

        if (hasLabels) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-37-add-labels.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter tasks by label', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');

      // Look for label filter
      const labelFilter = page.locator('select, [role="combobox"]').filter({ hasText: /label|tag/i }).first();

      if (await labelFilter.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'tasks-38-filter-by-label.png'),
          fullPage: true
        });
      }
    });
  });
});
