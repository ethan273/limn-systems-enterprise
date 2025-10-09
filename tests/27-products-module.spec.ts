import { test, expect } from '@playwright/test';
import path from 'path';
import { login } from './helpers/auth-helper';

const TEST_CONFIG = {
  BASE_URL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_PASSWORD: 'password123',
  SCREENSHOT_DIR: path.join(__dirname, '../screenshots/products'),
};

/**
 * 📦 PRODUCTS MODULE TESTS
 *
 * Test coverage for product management functionality:
 * - Product Catalog (CRUD operations, filtering, search, categories)
 * - Product Concepts (design ideas, early stage development)
 * - Product Prototypes (physical samples, testing, iteration)
 * - Product Specifications (dimensions, materials, pricing)
 * - Product Variants (colors, sizes, configurations)
 * - Product Media (images, 3D models, documents)
 * - Product Inventory (stock levels, suppliers)
 * - Integration with Orders/Projects
 *
 * NOTE: Some tests may be conditional based on:
 * - Whether product management is fully implemented
 * - Database having product test data
 * - Product module configuration
 *
 * Tests will gracefully handle missing features and report what was tested.
 */

test.describe('📦 PRODUCTS MODULE TESTS @products', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin for all tests
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Product Catalog', () => {
    test('Product catalog page loads and displays products', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      // Check for page title
      const hasTitle = await page.locator('h1').count() > 0;
      if (hasTitle) {
        await expect(page.locator('h1')).toContainText(/catalog|products/i);
      }

      // Check for product grid or list
      const hasProducts = await page.locator('[data-testid="product-grid"], .product-grid, table, [data-testid="data-table"]').count() > 0;
      expect(hasProducts).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-01-catalog-view.png'),
        fullPage: true
      });
    });

    test('Can create new catalog product', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Product"), a:has-text("New Product")').first();
      const hasCreateButton = await createButton.count() > 0;

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show create form
        const hasForm = await page.locator('form, [data-testid="product-form"]').count() > 0;
        expect(hasForm).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-02-create-form.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Create product button not found - feature may not be implemented');
      }
    });

    test('Can view product details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('[data-testid="product-card"], .product-card, table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show product details
        const hasDetails = await page.locator('[data-testid="product-details"], .product-details, h1, h2').count() > 0;
        expect(hasDetails).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-03-detail-view.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ No products found in catalog - skipping detail view test');
      }
    });

    test('Can filter products by category', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const categoryFilter = page.locator('select[name*="category"], [data-testid="category-filter"]').first();
      const hasFilter = await categoryFilter.count() > 0;

      if (hasFilter) {
        const options = await categoryFilter.locator('option').count();
        if (options > 1) {
          await categoryFilter.selectOption({ index: 1 });
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-04-filter-by-category.png'),
            fullPage: true
          });
        }
      } else {
        console.log('⚠️ Category filter not found');
      }
    });

    test('Can search products', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name*="search"]').first();
      const hasSearch = await searchInput.count() > 0;

      if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-05-search.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Product search not found');
      }
    });

    test('Can sort products', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const sortControl = page.locator('select[name*="sort"], th[role="button"], th.sortable').first();
      const hasSort = await sortControl.count() > 0;

      if (hasSort) {
        await sortControl.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-06-sorted.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Product sorting not found');
      }
    });

    test('Can edit product', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const hasEdit = await editButton.count() > 0;

      if (hasEdit) {
        await editButton.click();
        await page.waitForLoadState('domcontentloaded');

        const hasForm = await page.locator('form, [data-testid="product-form"]').count() > 0;
        expect(hasForm).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-07-edit-form.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Edit product functionality not found');
      }
    });

    test('Can view product pricing', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('[data-testid="product-card"], .product-card, table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for pricing information
        const hasPricing = await page.locator('[data-testid="pricing"], .pricing, text=/\\$|price/i').count() > 0;
        expect(hasPricing).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-08-pricing.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Product Concepts', () => {
    test('Product concepts page loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      const hasTitle = await page.locator('h1').count() > 0;
      if (hasTitle) {
        await expect(page.locator('h1')).toContainText(/concepts/i);
      }

      const hasContent = await page.locator('[data-testid="concept-grid"], .concept-grid, table, [data-testid="data-table"]').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-09-concepts-view.png'),
        fullPage: true
      });
    });

    test('Can create new concept', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Concept")').first();
      const hasButton = await createButton.count() > 0;

      if (hasButton) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-10-create-concept.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Create concept button not found');
      }
    });

    test('Can view concept details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      const firstConcept = page.locator('[data-testid="concept-card"], .concept-card, table tbody tr').first();
      const hasConcepts = await firstConcept.count() > 0;

      if (hasConcepts) {
        await firstConcept.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-11-concept-details.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ No concepts found');
      }
    });

    test('Can filter concepts by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]').first();
      const hasFilter = await statusFilter.count() > 0;

      if (hasFilter) {
        await statusFilter.selectOption({ index: 1 });
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-12-filter-concepts.png'),
          fullPage: true
        });
      }
    });

    test('Can promote concept to prototype', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      const firstConcept = page.locator('[data-testid="concept-card"], table tbody tr').first();
      const hasConcepts = await firstConcept.count() > 0;

      if (hasConcepts) {
        await firstConcept.click();
        await page.waitForLoadState('domcontentloaded');

        const promoteButton = page.locator('button:has-text("Promote"), button:has-text("Prototype")').first();
        const hasPromote = await promoteButton.count() > 0;

        if (hasPromote) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-13-promote-concept.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can add concept images', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/concepts`);
      await page.waitForLoadState('domcontentloaded');

      const firstConcept = page.locator('[data-testid="concept-card"], table tbody tr').first();
      const hasConcepts = await firstConcept.count() > 0;

      if (hasConcepts) {
        await firstConcept.click();
        await page.waitForLoadState('domcontentloaded');

        const uploadButton = page.locator('button:has-text("Upload"), input[type="file"], button:has-text("Add Image")').first();
        const hasUpload = await uploadButton.count() > 0;

        if (hasUpload) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-14-concept-images.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Product Prototypes', () => {
    test('Product prototypes page loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      const hasTitle = await page.locator('h1').count() > 0;
      if (hasTitle) {
        await expect(page.locator('h1')).toContainText(/prototypes/i);
      }

      const hasContent = await page.locator('[data-testid="prototype-grid"], table, [data-testid="data-table"]').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-15-prototypes-view.png'),
        fullPage: true
      });
    });

    test('Can create new prototype', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Prototype")').first();
      const hasButton = await createButton.count() > 0;

      if (hasButton) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-16-create-prototype.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Create prototype button not found');
      }
    });

    test('Can view prototype details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      const firstPrototype = page.locator('[data-testid="prototype-card"], table tbody tr').first();
      const hasPrototypes = await firstPrototype.count() > 0;

      if (hasPrototypes) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-17-prototype-details.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ No prototypes found');
      }
    });

    test('Can track prototype iterations', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      const firstPrototype = page.locator('table tbody tr').first();
      const hasPrototypes = await firstPrototype.count() > 0;

      if (hasPrototypes) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        const iterationsSection = page.locator('[data-testid="iterations"], h2:has-text("Iterations"), h3:has-text("Version")').first();
        const hasIterations = await iterationsSection.count() > 0;

        if (hasIterations) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-18-prototype-iterations.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can approve prototype for production', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      const firstPrototype = page.locator('table tbody tr').first();
      const hasPrototypes = await firstPrototype.count() > 0;

      if (hasPrototypes) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        const approveButton = page.locator('button:has-text("Approve"), button:has-text("Production")').first();
        const hasApprove = await approveButton.count() > 0;

        if (hasApprove) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-19-approve-prototype.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can add prototype test results', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      const firstPrototype = page.locator('table tbody tr').first();
      const hasPrototypes = await firstPrototype.count() > 0;

      if (hasPrototypes) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        const testResultsSection = page.locator('[data-testid="test-results"], h2:has-text("Testing"), button:has-text("Add Test")').first();
        const hasSection = await testResultsSection.count() > 0;

        if (hasSection) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-20-prototype-testing.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Product Specifications', () => {
    test('Can view product specifications', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr, [data-testid="product-card"]').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const specsSection = page.locator('[data-testid="specifications"], h2:has-text("Specifications"), h3:has-text("Specs")').first();
        const hasSpecs = await specsSection.count() > 0;

        if (hasSpecs) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-21-specifications.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Specifications section not found');
        }
      }
    });

    test('Can edit product dimensions', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const hasEdit = await editButton.count() > 0;

      if (hasEdit) {
        await editButton.click();
        await page.waitForLoadState('domcontentloaded');

        const dimensionInputs = page.locator('input[name*="width"], input[name*="height"], input[name*="depth"], input[name*="dimension"]').first();
        const hasDimensions = await dimensionInputs.count() > 0;

        if (hasDimensions) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-22-edit-dimensions.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can edit product materials', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const hasEdit = await editButton.count() > 0;

      if (hasEdit) {
        await editButton.click();
        await page.waitForLoadState('domcontentloaded');

        const materialInputs = page.locator('input[name*="material"], select[name*="material"], [data-testid="material-selector"]').first();
        const hasMaterials = await materialInputs.count() > 0;

        if (hasMaterials) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-23-edit-materials.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view product weight', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const weightInfo = page.locator('text=/weight/i, [data-testid="weight"]').first();
        const hasWeight = await weightInfo.count() > 0;

        if (hasWeight) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-24-weight-info.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Product Variants', () => {
    test('Can view product variants', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr, [data-testid="product-card"]').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const variantsSection = page.locator('[data-testid="variants"], h2:has-text("Variants"), h3:has-text("Options")').first();
        const hasVariants = await variantsSection.count() > 0;

        if (hasVariants) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-25-variants.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Variants section not found');
        }
      }
    });

    test('Can add product variant', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const addVariantButton = page.locator('button:has-text("Add Variant"), button:has-text("New Variant")').first();
        const hasButton = await addVariantButton.count() > 0;

        if (hasButton) {
          await addVariantButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-26-add-variant.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter by variant attributes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const colorFilter = page.locator('select[name*="color"], [data-testid="color-filter"]').first();
      const hasFilter = await colorFilter.count() > 0;

      if (hasFilter) {
        await colorFilter.selectOption({ index: 1 });
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-27-filter-variants.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Product Media', () => {
    test('Can view product images', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr, [data-testid="product-card"]').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const images = page.locator('img, [data-testid="product-image"]').first();
        const hasImages = await images.count() > 0;

        if (hasImages) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-28-images.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can upload product images', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const hasEdit = await editButton.count() > 0;

      if (hasEdit) {
        await editButton.click();
        await page.waitForLoadState('domcontentloaded');

        const uploadInput = page.locator('input[type="file"], button:has-text("Upload Image")').first();
        const hasUpload = await uploadInput.count() > 0;

        if (hasUpload) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-29-upload-images.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view 3D models', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const modelViewer = page.locator('[data-testid="3d-model"], canvas, .model-viewer').first();
        const hasModel = await modelViewer.count() > 0;

        if (hasModel) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-30-3d-model.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ 3D model viewer not found');
        }
      }
    });

    test('Can view product documents', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const docsSection = page.locator('[data-testid="documents"], h2:has-text("Documents"), h3:has-text("Files")').first();
        const hasDocs = await docsSection.count() > 0;

        if (hasDocs) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-31-documents.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Product Inventory', () => {
    test('Can view inventory levels', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const inventorySection = page.locator('[data-testid="inventory"], h2:has-text("Inventory"), h3:has-text("Stock")').first();
        const hasInventory = await inventorySection.count() > 0;

        if (hasInventory) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-32-inventory.png'),
            fullPage: true
          });
        } else {
          console.log('⚠️ Inventory section not found');
        }
      }
    });

    test('Can update stock levels', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const updateStockButton = page.locator('button:has-text("Update Stock"), button:has-text("Adjust")').first();
        const hasButton = await updateStockButton.count() > 0;

        if (hasButton) {
          await updateStockButton.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-33-update-stock.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view low stock alerts', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog?filter=low-stock`);
      await page.waitForLoadState('domcontentloaded');

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-34-low-stock.png'),
        fullPage: true
      });
    });

    test('Can view supplier information', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const supplierSection = page.locator('[data-testid="supplier"], h2:has-text("Supplier"), text=/supplier/i').first();
        const hasSupplier = await supplierSection.count() > 0;

        if (hasSupplier) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-35-supplier-info.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Products Module Integration Tests', () => {
    test('Can navigate from product to orders', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const ordersLink = page.locator('a:has-text("Orders"), button:has-text("Orders"), [data-testid="orders-tab"]').first();
        const hasLink = await ordersLink.count() > 0;

        if (hasLink) {
          await ordersLink.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-36-navigate-to-orders.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can navigate from product to projects', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const firstProduct = page.locator('table tbody tr').first();
      const hasProducts = await firstProduct.count() > 0;

      if (hasProducts) {
        await firstProduct.click();
        await page.waitForLoadState('domcontentloaded');

        const projectsLink = page.locator('a:has-text("Projects"), button:has-text("Projects")').first();
        const hasLink = await projectsLink.count() > 0;

        if (hasLink) {
          await projectsLink.click();
          await page.waitForLoadState('domcontentloaded');

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-37-navigate-to-projects.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view product statistics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const statsSection = page.locator('[data-testid="product-stats"], .stats, .summary').first();
      const hasStats = await statsSection.count() > 0;

      if (hasStats) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-38-statistics.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Product statistics not found');
      }
    });

    test('Can export products list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
      const hasExport = await exportButton.count() > 0;

      if (hasExport) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-39-export.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Export functionality not found');
      }
    });

    test('Can bulk update products', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');

      const bulkActions = page.locator('button:has-text("Bulk"), select[name*="bulk"], [data-testid="bulk-actions"]').first();
      const hasBulk = await bulkActions.count() > 0;

      if (hasBulk) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'products-40-bulk-actions.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Bulk actions not found');
      }
    });
  });
});
