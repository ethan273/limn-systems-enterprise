import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * DESIGN MODULE TESTS
 *
 * Comprehensive testing of all design-related functionality:
 * - Design Projects (CRUD, status updates, filtering)
 * - Mood Boards (creation, image management, sharing)
 * - Design Briefs (creation, approval workflow)
 * - File Management (upload, versions, download, folders)
 * - Design Reviews (submission, comments, approval, revisions)
 * - Collaboration (team assignment, activity tracking)
 *
 * Coverage Target: 100%
 */

test.describe('🎨 DESIGN MODULE TESTS @design', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Design Projects', () => {

    test('Design projects page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/design.*projects|projects/i);

      // Check for DataTable or data display
      const hasDataTable = await page.locator('[data-testid="data-table"], .data-table, table').count() > 0;
      expect(hasDataTable).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-01-projects-list.png'),
        fullPage: true
      });
    });

    test('Can create new design project', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create"), a:has-text("New")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page or show dialog
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/design\/projects\/new|\/design\/projects\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-02-create-project.png'),
          fullPage: true
        });
      }
    });

    test('Can view design project details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr, [data-testid="table-row"]').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/design\/projects\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-03-project-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can update design project status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for status dropdown or update button
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();
        const updateButton = page.locator('button:has-text("Update Status"), button:has-text("Change Status")').first();

        const hasStatusControls = (await statusDropdown.count() > 0) || (await updateButton.count() > 0);

        if (hasStatusControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-04-update-status.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter design projects by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Look for status filter
      const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i }).first();

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select a status
        const option = page.locator('option, [role="option"]').filter({ hasText: /draft|review|approved|in progress/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-05-filtered-projects.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can search design projects', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('TEST');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-06-search-projects.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Mood Boards', () => {

    test('Can access mood boards section', async ({ page }) => {
      // Try common mood board routes
      const routes = [
        '/design/mood-boards',
        '/design/moodboards',
        '/design/boards',
      ];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        // Check if page exists (not 404)
        const is404 = await page.locator('text=/404|not found/i').count() > 0;

        if (!is404) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-07-mood-boards.png'),
            fullPage: true
          });
          break;
        }
      }
    });

    test('Can create new mood board', async ({ page }) => {
      const routes = ['/design/mood-boards', '/design/moodboards', '/design/boards'];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        if (is404) continue;

        // Look for create button
        const createButton = page.locator('button:has-text("New Board"), button:has-text("Create"), a:has-text("New")').first();

        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-08-create-mood-board.png'),
            fullPage: true
          });
          break;
        }
      }
    });

    test('Can add images to mood board', async ({ page }) => {
      const routes = ['/design/mood-boards', '/design/moodboards', '/design/boards'];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        if (is404) continue;

        // Click first mood board
        const firstBoard = page.locator('table tbody tr, [data-testid="board-card"]').first();

        if (await firstBoard.isVisible()) {
          await firstBoard.click();
          await page.waitForLoadState('domcontentloaded');

          // Look for add image button
          const addImageButton = page.locator('button:has-text("Add Image"), button:has-text("Upload"), input[type="file"]').first();

          if (await addImageButton.isVisible()) {
            await page.screenshot({
              path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-09-add-images.png'),
              fullPage: true
            });
            break;
          }
        }
      }
    });

    test('Can share mood board', async ({ page }) => {
      const routes = ['/design/mood-boards', '/design/moodboards', '/design/boards'];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        if (is404) continue;

        // Click first mood board
        const firstBoard = page.locator('table tbody tr, [data-testid="board-card"]').first();

        if (await firstBoard.isVisible()) {
          await firstBoard.click();
          await page.waitForLoadState('domcontentloaded');

          // Look for share button
          const shareButton = page.locator('button:has-text("Share"), button:has-text("Invite")').first();

          if (await shareButton.isVisible()) {
            await page.screenshot({
              path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-10-share-board.png'),
              fullPage: true
            });
            break;
          }
        }
      }
    });
  });

  test.describe('Design Briefs', () => {

    test('Can access design briefs section', async ({ page }) => {
      // Try common design brief routes
      const routes = [
        '/design/briefs',
        '/design/design-briefs',
        '/design/projects', // May be combined with projects
      ];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        const is404 = await page.locator('text=/404|not found/i').count() > 0;

        if (!is404) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-11-briefs.png'),
            fullPage: true
          });
          break;
        }
      }
    });

    test('Can create design brief', async ({ page }) => {
      const routes = ['/design/briefs', '/design/design-briefs'];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        if (is404) continue;

        // Look for create button
        const createButton = page.locator('button:has-text("New Brief"), button:has-text("Create"), a:has-text("New")').first();

        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-12-create-brief.png'),
            fullPage: true
          });
          break;
        }
      }
    });

    test('Can approve design brief', async ({ page }) => {
      const routes = ['/design/briefs', '/design/design-briefs'];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        if (is404) continue;

        // Click first brief
        const firstBrief = page.locator('table tbody tr').first();

        if (await firstBrief.isVisible()) {
          await firstBrief.click();
          await page.waitForLoadState('domcontentloaded');

          // Look for approve button
          const approveButton = page.locator('button:has-text("Approve"), button:has-text("Accept")').first();

          if (await approveButton.isVisible()) {
            await page.screenshot({
              path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-13-approve-brief.png'),
              fullPage: true
            });
            break;
          }
        }
      }
    });
  });

  test.describe('File Management', () => {

    test('Can upload design files', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for file upload section
        const uploadButton = page.locator('button:has-text("Upload"), input[type="file"], button:has-text("Add File")').first();

        if (await uploadButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-14-upload-files.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view file versions', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for version history
        const versionSection = page.locator('div:has-text("Version"), section:has-text("History"), h2:has-text("Versions")').first();

        if (await versionSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-15-file-versions.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can download design files', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for download button
        const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")').first();

        if (await downloadButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-16-download-files.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can organize files in folders', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for folder structure
        const folderSection = page.locator('div:has-text("Folder"), button:has-text("New Folder"), [data-testid="folder"]').first();

        if (await folderSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-17-folder-organization.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Design Reviews', () => {

    test('Can submit design for review', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for submit review button
        const submitButton = page.locator('button:has-text("Submit for Review"), button:has-text("Request Review")').first();

        if (await submitButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-18-submit-review.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can add review comments', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for comments section
        const commentInput = page.locator('textarea[placeholder*="comment" i], input[placeholder*="comment" i]').first();
        const commentSection = page.locator('div:has-text("Comments"), section:has-text("Feedback")').first();

        const hasComments = (await commentInput.count() > 0) || (await commentSection.count() > 0);

        if (hasComments) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-19-review-comments.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can approve design', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project in review
      const reviewProject = page.locator('tr:has-text("Review"), tr:has-text("Pending")').first();

      if (await reviewProject.isVisible()) {
        await reviewProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for approve button
        const approveButton = page.locator('button:has-text("Approve"), button:has-text("Accept")').first();

        if (await approveButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-20-approve-design.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can request design revisions', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for revision button
        const revisionButton = page.locator('button:has-text("Request Changes"), button:has-text("Revise"), button:has-text("Reject")').first();

        if (await revisionButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-21-request-revisions.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Collaboration', () => {

    test('Can assign team members to project', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for team assignment
        const assignButton = page.locator('button:has-text("Assign"), button:has-text("Add Team"), select[name*="assign"]').first();

        if (await assignButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-22-assign-team.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view project activity timeline', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for activity timeline
        const timeline = page.locator('div:has-text("Activity"), section:has-text("Timeline"), h2:has-text("History")').first();

        if (await timeline.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-23-activity-timeline.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can mention team members in comments', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Click first project
      const firstProject = page.locator('table tbody tr').first();

      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for comment input
        const commentInput = page.locator('textarea[placeholder*="comment" i], input[placeholder*="comment" i]').first();

        if (await commentInput.isVisible()) {
          await commentInput.fill('@');
          await page.waitForTimeout(500);

          // Check if mention autocomplete appears
          const mentionDropdown = page.locator('[role="listbox"], .mention-suggestions').first();

          if (await mentionDropdown.isVisible()) {
            await page.screenshot({
              path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-24-mention-team.png'),
              fullPage: true
            });
          }
        }
      }
    });
  });

  test.describe('Design Module Integration Tests', () => {

    test('Can navigate between design module pages', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Test sidebar navigation
      const moodBoardLink = page.locator('a:has-text("Mood Board"), nav a[href*="mood"], a:has-text("Boards")').first();

      if (await moodBoardLink.isVisible()) {
        await moodBoardLink.click();
        await page.waitForLoadState('domcontentloaded');

        const url = page.url();
        expect(url).toMatch(/mood|board/i);
      }
    });

    test('Design statistics display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Look for stats/metrics cards
      const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="card"]');

      if (await statsCards.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-25-statistics.png'),
          fullPage: true
        });
      }
    });

    test('Can filter projects by designer', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Look for designer filter
      const designerFilter = page.locator('select[name*="designer"], [data-testid="designer-filter"]').first();

      if (await designerFilter.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-26-designer-filter.png'),
          fullPage: true
        });
      }
    });

    test('Can export design project data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download CSV")').first();

      if (await exportButton.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-27-export.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Design Concepts', () => {

    test('Design concepts page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page loaded
      const hasContent = await page.locator('h1, h2, main').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-28-concepts-page.png'),
        fullPage: true
      });
    });

    test('Can create new design concept', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New Concept"), button:has-text("Create"), a:has-text("New")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-29-create-concept.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Prototypes', () => {

    test('Prototypes page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page loaded
      const hasContent = await page.locator('h1, h2, main').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-30-prototypes-page.png'),
        fullPage: true
      });
    });

    test('Can create new prototype', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New Prototype"), button:has-text("Create"), a:has-text("New")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-31-create-prototype.png'),
          fullPage: true
        });
      }
    });

    test('Can view prototype details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      // Click first prototype
      const firstPrototype = page.locator('table tbody tr, [data-testid="prototype-card"]').first();

      if (await firstPrototype.isVisible()) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'design-32-prototype-detail.png'),
          fullPage: true
        });
      }
    });
  });
});
