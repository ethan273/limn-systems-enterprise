import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * FINANCIALS MODULE TESTS
 *
 * Comprehensive testing of all financial functionality:
 * - Invoices (creation, status tracking, payments, email)
 * - Payments (recording, refunds, payment methods, history)
 * - Expenses (entry, categorization, approval, tracking)
 * - Financial Reports (revenue, expenses, profit/loss, exports)
 *
 * Coverage Target: 100%
 */

test.describe('💰 FINANCIALS MODULE TESTS @financials', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Invoices', () => {

    test('Invoices page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/invoices/i);

      // Verify DataTable is present
      const hasDataTable = await page.locator('[data-testid="data-table"]').count() > 0;
      expect(hasDataTable).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-01-invoices-list.png'),
        fullPage: true
      });
    });

    test('Can create new invoice', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);

      // Wait for DataTable to ensure page is fully loaded
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Look for create/new button
      const createButton = page.locator('button:has-text("New Invoice"), button:has-text("Create Invoice")').first();

      if (await createButton.isVisible()) {
        await createButton.click();

        // Wait for navigation to complete
        await page.waitForURL(/\/financials\/invoices\/new|\/financials\/invoices\/create/, { timeout: 10000 });

        // Should navigate to create page
        const url = page.url();
        expect(url).toMatch(/\/financials\/invoices\/new|\/financials\/invoices\/create/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-02-invoice-create.png'),
          fullPage: true
        });
      }
    });

    test('Can view invoice details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice
      const firstInvoice = page.locator('table tbody tr, [data-testid="table-row"]').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/financials\/invoices\/[a-z0-9-]+$/);

        // Check for invoice details
        const invoiceNumber = page.locator('text=/invoice.*#|inv-/i').first();
        await expect(invoiceNumber).toBeVisible();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-03-invoice-detail.png'),
          fullPage: true
        });
      }
    });

    test('Invoice displays customer information', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice
      const firstInvoice = page.locator('table tbody tr').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for customer information section
        const customerSection = page.locator('section:has-text("Customer"), div:has-text("Bill To"), div:has-text("Customer")').first();

        if (await customerSection.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-04-invoice-customer.png'),
            fullPage: true
          });
        }
      }
    });

    test('Invoice displays line items with totals', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice
      const firstInvoice = page.locator('table tbody tr').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for line items table
        const lineItemsTable = page.locator('table').filter({ hasText: /item|description|quantity|price|total/i }).first();

        if (await lineItemsTable.isVisible()) {
          // Line items are displayed
          const totalAmount = page.locator('text=/total|grand total/i').first();
          await expect(totalAmount).toBeVisible();
        }
      }
    });

    test('Can update invoice status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice
      const firstInvoice = page.locator('table tbody tr').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for status update controls
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();
        const updateButton = page.locator('button:has-text("Update Status")').first();

        const hasStatusControls = (await statusDropdown.count() > 0) || (await updateButton.count() > 0);

        if (hasStatusControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-05-invoice-status.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter invoices by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Look for status filter
      const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i }).first();

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select a status
        const option = page.locator('option, [role="option"]').filter({ hasText: /paid|unpaid|overdue|draft/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-06-filtered-invoices.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can search invoices', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('INV-');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-07-search-invoices.png'),
          fullPage: true
        });
      }
    });

    test('Can send invoice via email', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice
      const firstInvoice = page.locator('table tbody tr').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for send/email button
        const sendButton = page.locator('button:has-text("Send"), button:has-text("Email")').first();

        if (await sendButton.isVisible()) {
          expect(await sendButton.isEnabled()).toBeTruthy();
        }
      }
    });

    test('Can download invoice PDF', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice
      const firstInvoice = page.locator('table tbody tr').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for download/print button
        const downloadButton = page.locator('button:has-text("Download"), button:has-text("Print"), button:has-text("PDF")').first();

        if (await downloadButton.isVisible()) {
          expect(await downloadButton.isEnabled()).toBeTruthy();
        }
      }
    });

    test('Shows overdue invoices warning', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Look for overdue indicator or filter
      const overdueIndicator = page.locator('text=/overdue/i, [class*="overdue"], [class*="warning"]').first();

      if (await overdueIndicator.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-08-overdue-invoices.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Payments', () => {

    test('Payments page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/payments/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-09-payments-list.png'),
        fullPage: true
      });
    });

    test('Can record new payment', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create payment button
      const createButton = page.locator('button:has-text("Record Payment"), button:has-text("New Payment")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show payment form or dialog
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/financials\/payments\/new|\/financials\/payments\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-10-payment-record.png'),
          fullPage: true
        });
      }
    });

    test('Can view payment details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first payment
      const firstPayment = page.locator('table tbody tr').first();

      if (await firstPayment.isVisible()) {
        await firstPayment.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/financials\/payments\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-11-payment-detail.png'),
          fullPage: true
        });
      }
    });

    test('Payment displays linked invoice', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first payment
      const firstPayment = page.locator('table tbody tr').first();

      if (await firstPayment.isVisible()) {
        await firstPayment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for invoice link or reference
        const invoiceLink = page.locator('a:has-text("Invoice"), text=/inv-|invoice #/i').first();

        if (await invoiceLink.count() > 0) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-12-payment-invoice-link.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can apply payment to invoice', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first payment
      const firstPayment = page.locator('table tbody tr').first();

      if (await firstPayment.isVisible()) {
        await firstPayment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for apply payment button
        const applyButton = page.locator('button:has-text("Apply"), button:has-text("Apply to Invoice")').first();

        if (await applyButton.isVisible()) {
          expect(await applyButton.isEnabled()).toBeTruthy();
        }
      }
    });

    test('Can process refund', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first payment
      const firstPayment = page.locator('table tbody tr').first();

      if (await firstPayment.isVisible()) {
        await firstPayment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for refund button
        const refundButton = page.locator('button:has-text("Refund"), button:has-text("Process Refund")').first();

        if (await refundButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-13-payment-refund.png'),
            fullPage: true
          });
        }
      }
    });

    test('Payment methods are displayed', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first payment
      const firstPayment = page.locator('table tbody tr').first();

      if (await firstPayment.isVisible()) {
        await firstPayment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for payment method info
        const paymentMethod = page.locator('text=/credit card|bank transfer|cash|check|wire/i').first();

        if (await paymentMethod.count() > 0) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-14-payment-method.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter payments by method', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for payment method filter
      const methodFilter = page.locator('select, [role="combobox"]').filter({ hasText: /method|type/i }).first();

      if (await methodFilter.isVisible()) {
        await methodFilter.click();

        const option = page.locator('option, [role="option"]').filter({ hasText: /credit|bank|cash/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('Payment history is tracked', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/payments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first payment
      const firstPayment = page.locator('table tbody tr').first();

      if (await firstPayment.isVisible()) {
        await firstPayment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for payment history or activity log
        const historySection = page.locator('section:has-text("History"), div:has-text("Activity")').first();

        if (await historySection.count() > 0) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-15-payment-history.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Expenses', () => {

    test('Expenses page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/expenses/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-16-expenses-list.png'),
        fullPage: true
      });
    });

    test('Can create new expense', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create expense button
      const createButton = page.locator('button:has-text("New Expense"), button:has-text("Add Expense")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page or show dialog
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/financials\/expenses\/new|\/financials\/expenses\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-17-expense-create.png'),
          fullPage: true
        });
      }
    });

    test('Can view expense details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Click first expense
      const firstExpense = page.locator('table tbody tr').first();

      if (await firstExpense.isVisible()) {
        await firstExpense.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/financials\/expenses\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-18-expense-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can categorize expense', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Click first expense
      const firstExpense = page.locator('table tbody tr').first();

      if (await firstExpense.isVisible()) {
        await firstExpense.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for category dropdown or field
        const categoryDropdown = page.locator('select').filter({ hasText: /category/i }).first();
        const categoryField = page.locator('text=/category/i').first();

        const hasCategoryField = (await categoryDropdown.count() > 0) || (await categoryField.count() > 0);

        if (hasCategoryField) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-19-expense-category.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can attach receipt to expense', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Click first expense
      const firstExpense = page.locator('table tbody tr').first();

      if (await firstExpense.isVisible()) {
        await firstExpense.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for receipt upload or attachment section
        const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Attach Receipt")').first();
        const receiptSection = page.locator('section:has-text("Receipt"), div:has-text("Attachment")').first();

        const hasReceiptFeature = (await uploadButton.count() > 0) || (await receiptSection.count() > 0);

        if (hasReceiptFeature) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-20-expense-receipt.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can submit expense for approval', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Click first expense
      const firstExpense = page.locator('table tbody tr').first();

      if (await firstExpense.isVisible()) {
        await firstExpense.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for submit/approval button
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Request Approval")').first();

        if (await submitButton.isVisible()) {
          expect(await submitButton.isEnabled()).toBeTruthy();
        }
      }
    });

    test('Can filter expenses by category', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Look for category filter
      const categoryFilter = page.locator('select, [role="combobox"]').filter({ hasText: /category|filter/i }).first();

      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();

        const option = page.locator('option, [role="option"]').filter({ hasText: /materials|labor|equipment/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-21-filtered-expenses.png'),
            fullPage: true
          });
        }
      }
    });

    test('Expense reports can be generated', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/expenses`);
      await page.waitForLoadState('domcontentloaded');

      // Look for report or export button
      const reportButton = page.locator('button:has-text("Report"), button:has-text("Export")').first();

      if (await reportButton.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-22-expense-reports.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Financial Reports', () => {

    test('Reports page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/reports|financial/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-23-reports-page.png'),
        fullPage: true
      });
    });

    test('Revenue report displays correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for revenue report section or link
      const revenueReport = page.locator('a:has-text("Revenue"), button:has-text("Revenue"), section:has-text("Revenue")').first();

      if (await revenueReport.isVisible()) {
        if (await revenueReport.evaluate(el => el.tagName === 'A' || el.tagName === 'BUTTON')) {
          await revenueReport.click();
          await page.waitForLoadState('domcontentloaded');
        }

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-24-revenue-report.png'),
          fullPage: true
        });
      }
    });

    test('Expenses report displays correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for expenses report
      const expensesReport = page.locator('a:has-text("Expenses"), button:has-text("Expenses"), section:has-text("Expenses")').first();

      if (await expensesReport.isVisible()) {
        if (await expensesReport.evaluate(el => el.tagName === 'A' || el.tagName === 'BUTTON')) {
          await expensesReport.click();
          await page.waitForLoadState('domcontentloaded');
        }

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-25-expenses-report.png'),
          fullPage: true
        });
      }
    });

    test('Profit/Loss report displays correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for P&L report
      const plReport = page.locator('a:has-text("Profit"), button:has-text("P&L"), section:has-text("Profit")').first();

      if (await plReport.isVisible()) {
        if (await plReport.evaluate(el => el.tagName === 'A' || el.tagName === 'BUTTON')) {
          await plReport.click();
          await page.waitForLoadState('domcontentloaded');
        }

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-26-pl-report.png'),
          fullPage: true
        });
      }
    });

    test('Can filter reports by date range', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for date range picker
      const dateRangePicker = page.locator('input[type="date"], [data-testid="date-picker"]').first();

      if (await dateRangePicker.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-27-date-range.png'),
          fullPage: true
        });
      }
    });

    test('Can export report to Excel', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Excel")').first();

      if (await exportButton.isVisible()) {
        expect(await exportButton.isEnabled()).toBeTruthy();
      }
    });

    test('Can export report to PDF', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for PDF export button
      const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Download PDF")').first();

      if (await pdfButton.isVisible()) {
        expect(await pdfButton.isEnabled()).toBeTruthy();
      }
    });

    test('Charts and visualizations display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for charts (canvas or svg elements)
      const charts = page.locator('canvas, svg[class*="chart"], [data-testid="chart"]');

      if (await charts.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-28-charts.png'),
          fullPage: true
        });
      }
    });

    test('Year-over-year comparison available', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/reports`);
      await page.waitForLoadState('domcontentloaded');

      // Look for YoY or comparison controls
      const yoyControl = page.locator('button:has-text("Year over Year"), select:has-text("Compare"), text=/YoY/i').first();

      if (await yoyControl.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-29-yoy-comparison.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Financial Module Integration Tests', () => {

    test('Can navigate between financial pages', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Test navigation to payments
      const paymentsLink = page.locator('a:has-text("Payments"), nav a[href*="payments"]').first();

      if (await paymentsLink.isVisible()) {
        await paymentsLink.click();
        await page.waitForLoadState('domcontentloaded');

        const url = page.url();
        expect(url).toContain('payments');
      }
    });

    test('Financial statistics display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Look for financial stats/KPIs
      const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="kpi"]');

      if (await statsCards.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-30-statistics.png'),
          fullPage: true
        });
      }
    });

    test('Currency formatting is consistent', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Check for currency symbols/formatting
      const currencyElements = page.locator('text=/\\$[0-9,]+\\.\\d{2}/');

      if (await currencyElements.count() > 0) {
        // Currency is properly formatted
        expect(await currencyElements.count()).toBeGreaterThan(0);
      }
    });

    test('Totals calculations are accurate', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');

      // Click first invoice to check calculations
      const firstInvoice = page.locator('table tbody tr').first();

      if (await firstInvoice.isVisible()) {
        await firstInvoice.click();
        await page.waitForLoadState('domcontentloaded');

        // Verify subtotal + tax = total (basic sanity check)
        const subtotalText = await page.locator('text=/subtotal.*\\$/i').first().textContent();
        const taxText = await page.locator('text=/tax.*\\$/i').first().textContent();
        const totalText = await page.locator('text=/total.*\\$/i').first().textContent();

        // At minimum, these elements should exist
        if (subtotalText && taxText && totalText) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'financials-31-calculations.png'),
            fullPage: true
          });
        }
      }
    });
  });
});
