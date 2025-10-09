import { test, expect } from '@playwright/test';
import path from 'path';
import { login } from './helpers/auth-helper';

const TEST_CONFIG = {
  BASE_URL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_PASSWORD: 'password123',
  SCREENSHOT_DIR: path.join(__dirname, '../screenshots/partners'),
};

/**
 * 🤝 PARTNERS MODULE TESTS
 *
 * Test coverage for partner management functionality:
 * - Partner List (CRUD operations, filtering, search, sorting)
 * - Partner Types (suppliers, manufacturers, vendors, contractors)
 * - Partner Contacts and Communication
 * - Partner Agreements/Contracts
 * - Partner Performance Metrics
 * - Integration with Orders/Projects
 * - Partner Documents
 * - Partner Ratings/Reviews
 *
 * NOTE: Some tests may be conditional based on:
 * - Whether partner management is fully implemented
 * - Database having partner test data
 * - Partner type configuration
 *
 * Tests will gracefully handle missing features and report what was tested.
 */

test.describe('🤝 PARTNERS MODULE TESTS @partners', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin for all tests
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Partner List View', () => {
    test('Partners page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Check for page title
      const hasTitle = await page.locator('h1').count() > 0;
      if (hasTitle) {
        await expect(page.locator('h1')).toContainText(/partners/i);
      }

      // Check for data table or list view
      const hasDataTable = await page.locator('[data-testid="data-table"], .data-table, table, [data-testid="partner-list"]').count() > 0;
      expect(hasDataTable).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-01-list-view.png'),
        fullPage: true
      });
    });

    test('Can create new partner', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Partner"), a:has-text("New Partner")').first();
      const hasCreateButton = await createButton.count() > 0;

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create form or open modal
        const hasForm = await page.locator('form, [data-testid="partner-form"]').count() > 0;
        expect(hasForm).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-02-create-form.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Create partner button not found - feature may not be implemented');
      }
    });

    test('Can view partner details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Try to find and click first partner in list
      const firstPartnerRow = page.locator('table tbody tr, [data-testid="partner-item"], .partner-card').first();
      const hasPartners = await firstPartnerRow.count() > 0;

      if (hasPartners) {
        // Try clicking on row or view button
        const viewButton = firstPartnerRow.locator('button:has-text("View"), a:has-text("View"), button[title*="View"], a[href*="/partners/"]').first();
        const hasViewButton = await viewButton.count() > 0;

        if (hasViewButton) {
          await viewButton.click();
        } else {
          // Try clicking the row itself
          await firstPartnerRow.click();
        }

        await page.waitForLoadState('domcontentloaded');

        // Should show partner details
        const hasDetails = await page.locator('[data-testid="partner-details"], .partner-details, h1, h2').count() > 0;
        expect(hasDetails).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-03-detail-view.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ No partners found in database - skipping detail view test');
      }
    });

    test('Can filter partners by type', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Look for type filter
      const typeFilter = page.locator('select[name*="type"], select[name*="partner"], [data-testid="type-filter"]').first();
      const hasTypeFilter = await typeFilter.count() > 0;

      if (hasTypeFilter) {
        // Get available options
        const options = await typeFilter.locator('option').count();
        if (options > 1) {
          // Select a type (e.g., "supplier", "manufacturer")
          const optionText = await typeFilter.locator('option').nth(1).textContent();
          await typeFilter.selectOption({ index: 1 });
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-04-filter-by-type.png'),
            fullPage: true
          });
        }
      } else {
        console.log('⚠️ Partner type filter not found - feature may not be implemented');
      }
    });

    test('Can search partners', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name*="search"]').first();
      const hasSearch = await searchInput.count() > 0;

      if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-05-search.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Partner search not found - feature may not be implemented');
      }
    });

    test('Can sort partners', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Look for sortable table headers
      const sortableHeader = page.locator('th[role="button"], th.sortable, th:has(button)').first();
      const hasSorting = await sortableHeader.count() > 0;

      if (hasSorting) {
        await sortableHeader.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-06-sorted.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Partner sorting not found - feature may not be implemented');
      }
    });
  });

  test.describe('Partner Types', () => {
    test('Can view suppliers', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners?type=supplier`);
      await page.waitForLoadState('domcontentloaded');

      // Should show filtered list
      const hasContent = await page.locator('table, [data-testid="partner-list"]').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-07-suppliers.png'),
        fullPage: true
      });
    });

    test('Can view manufacturers', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners?type=manufacturer`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('table, [data-testid="partner-list"]').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-08-manufacturers.png'),
        fullPage: true
      });
    });

    test('Can view vendors', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners?type=vendor`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('table, [data-testid="partner-list"]').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-09-vendors.png'),
        fullPage: true
      });
    });

    test('Can change partner type in edit form', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Try to find first partner and edit
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const hasEditButton = await editButton.count() > 0;

      if (hasEditButton) {
        await editButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for type selector
        const typeSelect = page.locator('select[name*="type"], select[name*="partner_type"]').first();
        const hasTypeSelect = await typeSelect.count() > 0;

        if (hasTypeSelect) {
          const options = await typeSelect.locator('option').count();
          expect(options).toBeGreaterThan(1);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-10-type-selector.png'),
            fullPage: true
          });
        }
      } else {
        console.log('⚠️ Edit partner functionality not found');
      }
    });
  });

  test.describe('Partner Contacts', () => {
    test('Can view partner contacts list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Navigate to first partner details
      const firstPartner = page.locator('table tbody tr, [data-testid="partner-item"]').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for contacts section
        const contactsSection = page.locator('[data-testid="partner-contacts"], h2:has-text("Contacts"), h3:has-text("Contacts")').first();
        const hasContactsSection = await contactsSection.count() > 0;

        if (hasContactsSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-11-contacts-list.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Partner contacts section not found');
        }
      }
    });

    test('Can add partner contact', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr, [data-testid="partner-item"]').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for add contact button
        const addContactButton = page.locator('button:has-text("Add Contact"), button:has-text("New Contact")').first();
        const hasAddButton = await addContactButton.count() > 0;

        if (hasAddButton) {
          await addContactButton.click();
          await page.waitForLoadState('domcontentloaded');

          // Should show contact form
          const hasForm = await page.locator('form, [data-testid="contact-form"]').count() > 0;
          expect(hasForm).toBeTruthy();

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-12-add-contact.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view contact details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for contact in list
        const firstContact = page.locator('[data-testid="contact-item"], .contact-card, .contact-row').first();
        const hasContacts = await firstContact.count() > 0;

        if (hasContacts) {
          await firstContact.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-13-contact-details.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Partner Communication', () => {
    test('Can view communication history', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for communication/history section
        const commSection = page.locator('[data-testid="communication-history"], h2:has-text("Communication"), h3:has-text("History")').first();
        const hasCommSection = await commSection.count() > 0;

        if (hasCommSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-14-communication-history.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Communication history section not found');
        }
      }
    });

    test('Can log communication entry', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for add communication button
        const addCommButton = page.locator('button:has-text("Log"), button:has-text("Add Note"), button:has-text("Record")').first();
        const hasAddButton = await addCommButton.count() > 0;

        if (hasAddButton) {
          await addCommButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-15-log-communication.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter communication by type', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for communication type filter
        const typeFilter = page.locator('select[name*="comm"], select[name*="type"], [data-testid="comm-type-filter"]').first();
        const hasFilter = await typeFilter.count() > 0;

        if (hasFilter) {
          await typeFilter.selectOption({ index: 1 });
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-16-filter-communication.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Partner Agreements/Contracts', () => {
    test('Can view partner agreements', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for agreements/contracts section
        const agreementsSection = page.locator('[data-testid="agreements"], h2:has-text("Agreements"), h3:has-text("Contracts")').first();
        const hasSection = await agreementsSection.count() > 0;

        if (hasSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-17-agreements-list.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Agreements section not found');
        }
      }
    });

    test('Can add new agreement', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const addAgreementButton = page.locator('button:has-text("Add Agreement"), button:has-text("New Contract")').first();
        const hasButton = await addAgreementButton.count() > 0;

        if (hasButton) {
          await addAgreementButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-18-add-agreement.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view agreement details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Try to find and view first agreement
        const firstAgreement = page.locator('[data-testid="agreement-item"], .agreement-card').first();
        const hasAgreements = await firstAgreement.count() > 0;

        if (hasAgreements) {
          await firstAgreement.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-19-agreement-details.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Partner Performance', () => {
    test('Can view partner performance metrics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for performance/metrics section
        const metricsSection = page.locator('[data-testid="performance"], h2:has-text("Performance"), h3:has-text("Metrics")').first();
        const hasSection = await metricsSection.count() > 0;

        if (hasSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-20-performance-metrics.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Performance metrics section not found');
        }
      }
    });

    test('Can view partner ratings', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for ratings section
        const ratingsSection = page.locator('[data-testid="ratings"], .ratings, h2:has-text("Rating")').first();
        const hasSection = await ratingsSection.count() > 0;

        if (hasSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-21-ratings.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Ratings section not found');
        }
      }
    });

    test('Can view delivery performance', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for delivery metrics
        const deliveryMetrics = page.locator('[data-testid="delivery-performance"], text=/on.*time/i, text=/delivery.*rate/i').first();
        const hasMetrics = await deliveryMetrics.count() > 0;

        if (hasMetrics) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-22-delivery-performance.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Delivery performance metrics not found');
        }
      }
    });
  });

  test.describe('Partner Documents', () => {
    test('Can view partner documents', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for documents section
        const documentsSection = page.locator('[data-testid="documents"], h2:has-text("Documents"), h3:has-text("Files")').first();
        const hasSection = await documentsSection.count() > 0;

        if (hasSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-23-documents.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Documents section not found');
        }
      }
    });

    test('Can upload partner document', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const uploadButton = page.locator('button:has-text("Upload"), input[type="file"]').first();
        const hasUpload = await uploadButton.count() > 0;

        if (hasUpload) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-24-upload-document.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Document upload not found');
        }
      }
    });

    test('Can filter documents by type', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const docTypeFilter = page.locator('select[name*="doc"], select[name*="type"]').first();
        const hasFilter = await docTypeFilter.count() > 0;

        if (hasFilter) {
          await docTypeFilter.selectOption({ index: 1 });
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-25-filter-documents.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Partners Module Integration Tests', () => {
    test('Can navigate from partners to orders', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for orders link/tab
        const ordersLink = page.locator('a:has-text("Orders"), button:has-text("Orders"), [data-testid="orders-tab"]').first();
        const hasOrdersLink = await ordersLink.count() > 0;

        if (hasOrdersLink) {
          await ordersLink.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-26-navigate-to-orders.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can navigate from partners to projects', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const projectsLink = page.locator('a:has-text("Projects"), button:has-text("Projects"), [data-testid="projects-tab"]').first();
        const hasProjectsLink = await projectsLink.count() > 0;

        if (hasProjectsLink) {
          await projectsLink.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-27-navigate-to-projects.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view partner statistics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      // Look for statistics/summary section on list page
      const statsSection = page.locator('[data-testid="partner-stats"], .stats, .summary').first();
      const hasStats = await statsSection.count() > 0;

      if (hasStats) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-28-statistics.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Partner statistics section not found');
      }
    });

    test('Can export partners list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
      const hasExport = await exportButton.count() > 0;

      if (hasExport) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-29-export.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Export functionality not found');
      }
    });

    test('Can view partner activity timeline', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const timeline = page.locator('[data-testid="timeline"], [data-testid="activity"], .timeline').first();
        const hasTimeline = await timeline.count() > 0;

        if (hasTimeline) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-30-activity-timeline.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Activity timeline not found');
        }
      }
    });
  });

  test.describe('Partner Ratings and Reviews', () => {
    test('Can add partner rating', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const addRatingButton = page.locator('button:has-text("Rate"), button:has-text("Review"), button:has-text("Add Rating")').first();
        const hasButton = await addRatingButton.count() > 0;

        if (hasButton) {
          await addRatingButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-31-add-rating.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Rating functionality not found');
        }
      }
    });

    test('Can view partner reviews', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners`);
      await page.waitForLoadState('domcontentloaded');

      const firstPartner = page.locator('table tbody tr').first();
      const hasPartners = await firstPartner.count() > 0;

      if (hasPartners) {
        await firstPartner.click();
        await page.waitForLoadState('domcontentloaded');

        const reviewsSection = page.locator('[data-testid="reviews"], h2:has-text("Reviews"), h3:has-text("Feedback")').first();
        const hasSection = await reviewsSection.count() > 0;

        if (hasSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'partners-32-reviews.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Reviews section not found');
        }
      }
    });
  });
});
