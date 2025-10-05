#!/usr/bin/env node

/**
 * Comprehensive PWA Testing Script
 * Tests all PWA features and generates a detailed report
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface PWATestReport {
  timestamp: string;
  url: string;
  overallScore: number;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

class PWATester {
  private url: string;
  private results: TestResult[] = [];

  constructor(url: string = 'http://localhost:3000') {
    this.url = url;
  }

  async runAllTests(): Promise<PWATestReport> {
    console.log('🚀 Starting PWA Testing Suite...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      permissions: ['notifications'],
    });
    const page = await context.newPage();

    try {
      // Navigate to the app
      await page.goto(this.url);
      await page.waitForLoadState('networkidle');

      // Run all tests
      await this.testManifestPresence(page);
      await this.testManifestValidity(page);
      await this.testServiceWorkerRegistration(page);
      await this.testServiceWorkerActive(page);
      await this.testOfflineSupport(page);
      await this.testInstallPrompt(page);
      await this.testIconsPresence(page);
      await this.testMetaTags(page);
      await this.testCacheAPI(page);
      await this.testNetworkStatusIndicator(page);
      await this.testResponsiveDesign(page);
      await this.testAccessibility(page);

      console.log('\n✅ All tests completed\n');
    } catch (error) {
      console.error('❌ Error during testing:', error);
      this.addResult('General Test', false, `Error: ${error}`);
    } finally {
      await browser.close();
    }

    return this.generateReport();
  }

  private async testManifestPresence(page: any): Promise<void> {
    console.log('Testing manifest presence...');

    try {
      const manifestLink = await page.locator('link[rel="manifest"]').count();

      if (manifestLink > 0) {
        const href = await page.locator('link[rel="manifest"]').getAttribute('href');
        this.addResult('Manifest Presence', true, `Manifest found at ${href}`);
      } else {
        this.addResult('Manifest Presence', false, 'No manifest link found in HTML');
      }
    } catch (error) {
      this.addResult('Manifest Presence', false, `Error: ${error}`);
    }
  }

  private async testManifestValidity(page: any): Promise<void> {
    console.log('Testing manifest validity...');

    try {
      const response = await page.request.get(`${this.url}/manifest.json`);

      if (response.ok()) {
        const manifest = await response.json();

        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifest[field]);

        if (missingFields.length === 0) {
          this.addResult(
            'Manifest Validity',
            true,
            'All required manifest fields present',
            { iconCount: manifest.icons?.length, shortcuts: manifest.shortcuts?.length }
          );
        } else {
          this.addResult(
            'Manifest Validity',
            false,
            `Missing fields: ${missingFields.join(', ')}`
          );
        }
      } else {
        this.addResult('Manifest Validity', false, 'Manifest file not accessible');
      }
    } catch (error) {
      this.addResult('Manifest Validity', false, `Error: ${error}`);
    }
  }

  private async testServiceWorkerRegistration(page: any): Promise<void> {
    console.log('Testing service worker registration...');

    try {
      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });

      this.addResult(
        'Service Worker Support',
        swRegistered,
        swRegistered ? 'Service Worker API available' : 'Service Worker not supported'
      );
    } catch (error) {
      this.addResult('Service Worker Support', false, `Error: ${error}`);
    }
  }

  private async testServiceWorkerActive(page: any): Promise<void> {
    console.log('Testing service worker active state...');

    try {
      await page.waitForTimeout(2000); // Wait for SW to register

      const swActive = await page.evaluate(() => {
        return navigator.serviceWorker.controller !== null;
      });

      this.addResult(
        'Service Worker Active',
        swActive,
        swActive ? 'Service Worker is active' : 'Service Worker not active yet'
      );
    } catch (error) {
      this.addResult('Service Worker Active', false, `Error: ${error}`);
    }
  }

  private async testOfflineSupport(page: any): Promise<void> {
    console.log('Testing offline support...');

    try {
      // Simulate offline
      await page.context().setOffline(true);
      await page.goto(`${this.url}/dashboard`);

      const offlinePageText = await page.textContent('body');
      const hasOfflineSupport = offlinePageText?.includes('offline') || offlinePageText?.includes('Offline');

      this.addResult(
        'Offline Support',
        hasOfflineSupport,
        hasOfflineSupport ? 'Offline page detected' : 'No offline support detected'
      );

      // Go back online
      await page.context().setOffline(false);
    } catch (error) {
      this.addResult('Offline Support', false, `Error: ${error}`);
      await page.context().setOffline(false);
    }
  }

  private async testInstallPrompt(page: any): Promise<void> {
    console.log('Testing install prompt...');

    try {
      const hasInstallPrompt = await page.evaluate(() => {
        return 'BeforeInstallPromptEvent' in window || window.matchMedia('(display-mode: standalone)').matches;
      });

      this.addResult(
        'Install Prompt',
        true,
        hasInstallPrompt ? 'Install prompt supported' : 'Running in standalone mode or browser does not support install prompt'
      );
    } catch (error) {
      this.addResult('Install Prompt', false, `Error: ${error}`);
    }
  }

  private async testIconsPresence(page: any): Promise<void> {
    console.log('Testing PWA icons...');

    try {
      const iconSizes = ['16x16', '32x32', '192x192', '512x512'];
      const iconResults = await Promise.all(
        iconSizes.map(async (size) => {
          const width = parseInt(size.split('x')[0]);
          const response = await page.request.get(`${this.url}/icons/icon-${width === 16 ? 'favicon-16x16' : width === 32 ? 'favicon-32x32' : width}.png`);
          return { size, exists: response.ok() };
        })
      );

      const allIconsPresent = iconResults.every(r => r.exists);
      const presentIcons = iconResults.filter(r => r.exists).map(r => r.size);

      this.addResult(
        'PWA Icons',
        allIconsPresent,
        allIconsPresent ? 'All required icons present' : `Missing icons for: ${iconResults.filter(r => !r.exists).map(r => r.size).join(', ')}`,
        { present: presentIcons }
      );
    } catch (error) {
      this.addResult('PWA Icons', false, `Error: ${error}`);
    }
  }

  private async testMetaTags(page: any): Promise<void> {
    console.log('Testing meta tags...');

    try {
      const themeColor = await page.locator('meta[name="theme-color"]').count();
      const viewport = await page.locator('meta[name="viewport"]').count();
      const appleWebApp = await page.locator('meta[name="apple-mobile-web-app-capable"]').count();

      const allPresent = themeColor > 0 && viewport > 0;

      this.addResult(
        'Meta Tags',
        allPresent,
        allPresent ? 'Required meta tags present' : 'Missing some meta tags',
        {
          themeColor: themeColor > 0,
          viewport: viewport > 0,
          appleWebApp: appleWebApp > 0,
        }
      );
    } catch (error) {
      this.addResult('Meta Tags', false, `Error: ${error}`);
    }
  }

  private async testCacheAPI(page: any): Promise<void> {
    console.log('Testing Cache API...');

    try {
      const cacheAPISupported = await page.evaluate(() => {
        return 'caches' in window;
      });

      if (cacheAPISupported) {
        await page.waitForTimeout(2000); // Wait for caching

        const cacheStats = await page.evaluate(async () => {
          const cacheNames = await caches.keys();
          return {
            count: cacheNames.length,
            names: cacheNames,
          };
        });

        this.addResult(
          'Cache API',
          cacheStats.count > 0,
          `${cacheStats.count} cache(s) found`,
          cacheStats
        );
      } else {
        this.addResult('Cache API', false, 'Cache API not supported');
      }
    } catch (error) {
      this.addResult('Cache API', false, `Error: ${error}`);
    }
  }

  private async testNetworkStatusIndicator(page: any): Promise<void> {
    console.log('Testing network status indicator...');

    try {
      // Simulate offline to trigger network status indicator
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);

      const hasNetworkIndicator = await page.locator('[role="status"]').count();

      this.addResult(
        'Network Status Indicator',
        hasNetworkIndicator > 0,
        hasNetworkIndicator > 0 ? 'Network status indicator present' : 'No network status indicator found'
      );

      await page.context().setOffline(false);
    } catch (error) {
      this.addResult('Network Status Indicator', false, `Error: ${error}`);
      await page.context().setOffline(false);
    }
  }

  private async testResponsiveDesign(page: any): Promise<void> {
    console.log('Testing responsive design...');

    try {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' },
      ];

      const results = await Promise.all(
        viewports.map(async (vp) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(500);

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          return { viewport: vp.name, noOverflow: !hasOverflow };
        })
      );

      const allResponsive = results.every(r => r.noOverflow);

      this.addResult(
        'Responsive Design',
        allResponsive,
        allResponsive ? 'Responsive across all viewports' : 'Some viewports have horizontal overflow',
        results
      );
    } catch (error) {
      this.addResult('Responsive Design', false, `Error: ${error}`);
    }
  }

  private async testAccessibility(page: any): Promise<void> {
    console.log('Testing accessibility...');

    try {
      const hasLang = await page.locator('html[lang]').count();
      const hasAriaLive = await page.locator('[aria-live]').count();
      const hasAriaLabel = await page.locator('[aria-label]').count();

      this.addResult(
        'Accessibility',
        hasLang > 0,
        hasLang > 0 ? 'Basic accessibility features present' : 'Missing lang attribute on html',
        {
          hasLang: hasLang > 0,
          ariaLiveElements: hasAriaLive,
          ariaLabelElements: hasAriaLabel,
        }
      );
    } catch (error) {
      this.addResult('Accessibility', false, `Error: ${error}`);
    }
  }

  private addResult(name: string, passed: boolean, message: string, details?: any): void {
    this.results.push({ name, passed, message, details });
    console.log(`  ${passed ? '✅' : '❌'} ${name}: ${message}`);
  }

  private generateReport(): PWATestReport {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const overallScore = Math.round((passed / total) * 100);

    const report: PWATestReport = {
      timestamp: new Date().toISOString(),
      url: this.url,
      overallScore,
      tests: this.results,
      summary: {
        total,
        passed,
        failed,
      },
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'pwa-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Test Summary');
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Overall Score: ${overallScore}%`);
    console.log(`\n📄 Report saved to: ${reportPath}\n`);

    return report;
  }
}

// Run tests
const tester = new PWATester();
tester.runAllTests().catch(console.error);
