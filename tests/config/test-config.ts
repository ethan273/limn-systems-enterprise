import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@test.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  USER_EMAIL: process.env.USER_EMAIL || 'user@test.com',
  USER_PASSWORD: process.env.USER_PASSWORD || 'user123',
  TIMEOUT: 30000,
  // Screenshots are saved to test-results folder (cross-platform compatible)
  SCREENSHOT_DIR: path.resolve(process.cwd(), 'test-results', 'screenshots')
};

export default TEST_CONFIG;
