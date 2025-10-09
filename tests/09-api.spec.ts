import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config/test-config';

test.describe('🔌 API TESTS @api', () => {
  test('API health endpoint returns correct status', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.BASE_URL}/api/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeTruthy();
  });

  test('API responds with correct content type', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.BASE_URL}/api/health`);
    const contentType = response.headers()['content-type'];

    expect(contentType).toContain('application/json');
  });

  test('API handles 404 errors gracefully', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.BASE_URL}/api/nonexistent-endpoint`);

    expect(response.status()).toBe(404);
  });
});