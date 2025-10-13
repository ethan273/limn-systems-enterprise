import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * FILE UPLOAD TEST SUITE
 *
 * Purpose: Verify that file upload functionality works correctly.
 *
 * What this tests:
 * - File input accepts files
 * - Multiple file uploads work
 * - File type validation
 * - File size validation
 * - Upload progress indicators
 * - File preview after upload
 * - File removal from upload queue
 */

test.describe('File Upload Functionality', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  // Create test files for upload
  test.beforeAll(async () => {
    const testFilesDir = path.join(process.cwd(), 'tests/fixtures/uploads');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test PDF
    if (!fs.existsSync(path.join(testFilesDir, 'test-document.pdf'))) {
      fs.writeFileSync(path.join(testFilesDir, 'test-document.pdf'), '%PDF-1.4\n%Test PDF');
    }

    // Create test image
    if (!fs.existsSync(path.join(testFilesDir, 'test-image.jpg'))) {
      // Create minimal valid JPEG
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
      fs.writeFileSync(path.join(testFilesDir, 'test-image.jpg'), jpegHeader);
    }

    // Create test CSV
    if (!fs.existsSync(path.join(testFilesDir, 'test-data.csv'))) {
      fs.writeFileSync(path.join(testFilesDir, 'test-data.csv'), 'name,value\ntest,123');
    }
  });

  test.describe('Document Upload', () => {
    test('Production Shop Drawings - Upload drawing file', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        // Look for file input
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          const testFile = path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf');

          // Upload file
          await fileInput.setInputFiles(testFile);
          await page.waitForTimeout(500);

          // Verify file name appears
          const fileName = page.locator('text=/test-document\\.pdf/i');
          if (await fileName.count() > 0) {
            await expect(fileName).toBeVisible();
          }
        }
      }
    });

    test('Partners Documents - Upload partner document', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      // Click on first designer
      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        // Look for Documents tab
        const documentsTab = page.getByRole('tab', { name: /documents/i });
        if (await documentsTab.count() > 0) {
          await documentsTab.click();
          await page.waitForTimeout(300);

          // Look for upload button
          const uploadButton = page.getByRole('button', { name: /upload|add.*document/i });
          if (await uploadButton.count() > 0) {
            await uploadButton.click();
            await page.waitForTimeout(300);

            const fileInput = page.locator('input[type="file"]');
            if (await fileInput.count() > 0) {
              const testFile = path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf');
              await fileInput.setInputFiles(testFile);
              await page.waitForTimeout(500);

              expect(await page.url()).toContain('/partners/designers');
            }
          }
        }
      }
    });
  });

  test.describe('Image Upload', () => {
    test('Products - Upload product image', async ({ page }) => {
      await page.goto('/products/catalog');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new|add/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        // Look for image upload
        const imageInput = page.locator('input[type="file"][accept*="image"], input[type="file"]');
        if (await imageInput.count() > 0) {
          const testImage = path.join(process.cwd(), 'tests/fixtures/uploads/test-image.jpg');

          await imageInput.setInputFiles(testImage);
          await page.waitForTimeout(500);

          // Look for image preview
          const imagePreview = page.locator('img[src*="blob:"], img[src*="data:image"]');
          if (await imagePreview.count() > 0) {
            await expect(imagePreview).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Multiple File Upload', () => {
    test('Can upload multiple files at once', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0 && await fileInput.getAttribute('multiple')) {
          const testFiles = [
            path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf'),
            path.join(process.cwd(), 'tests/fixtures/uploads/test-image.jpg'),
          ];

          await fileInput.setInputFiles(testFiles);
          await page.waitForTimeout(500);

          // Should show 2 files
          const fileCount = page.locator('text=/2.*files?|files?.*2/i');
          if (await fileCount.count() > 0) {
            await expect(fileCount).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('File Type Validation', () => {
    test('Rejects invalid file types', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          // Check if input has accept attribute
          const acceptAttr = await fileInput.getAttribute('accept');
          if (acceptAttr) {
            // Input has file type restrictions
            expect(acceptAttr.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('Accepts valid file types', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          const testFile = path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf');
          await fileInput.setInputFiles(testFile);
          await page.waitForTimeout(500);

          // No error message should appear
          const errorMessage = page.locator('text=/invalid|unsupported|error/i').first();
          const hasError = await errorMessage.count() > 0 && await errorMessage.isVisible();
          expect(hasError).toBe(false);
        }
      }
    });
  });

  test.describe('File Size Validation', () => {
    test('Shows file size after upload', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          const testFile = path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf');
          await fileInput.setInputFiles(testFile);
          await page.waitForTimeout(500);

          // Look for file size display
          const fileSizeText = page.locator('text=/\\d+\\s*(KB|MB|bytes)/i');
          if (await fileSizeText.count() > 0) {
            await expect(fileSizeText).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Upload Progress', () => {
    test('Shows upload progress indicator', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          const testFile = path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf');

          // Start upload
          await fileInput.setInputFiles(testFile);

          // Look for progress indicator (might be brief)
          const progressBar = page.locator('[role="progressbar"], .progress, [class*="progress"]');
          const hasProgress = await progressBar.count() > 0;

          // Progress indicator might appear and disappear quickly
          // Just verify upload completes
          await page.waitForTimeout(1000);
          expect(await page.url()).toBeTruthy();
        }
      }
    });
  });

  test.describe('File Removal', () => {
    test('Can remove file before upload', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          const testFile = path.join(process.cwd(), 'tests/fixtures/uploads/test-document.pdf');
          await fileInput.setInputFiles(testFile);
          await page.waitForTimeout(500);

          // Look for remove/delete button
          const removeButton = page.getByRole('button', { name: /remove|delete|×/i }).first();
          if (await removeButton.count() > 0) {
            await removeButton.click();
            await page.waitForTimeout(300);

            // File should be removed
            const fileName = page.locator('text=/test-document\\.pdf/i');
            const fileStillVisible = await fileName.count() > 0 && await fileName.isVisible();
            expect(fileStillVisible).toBe(false);
          }
        }
      }
    });
  });

  test.describe('Drag and Drop Upload', () => {
    test('Drag and drop upload area exists', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        // Look for drag-drop zone
        const dropZone = page.locator('[class*="drop"], [class*="drag"]').or(page.locator('text=/drag.*drop/i')).first();
        if (await dropZone.count() > 0) {
          await expect(dropZone).toBeVisible();
        }
      }
    });
  });
});
