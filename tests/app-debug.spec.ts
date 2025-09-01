import { test } from '@playwright/test';

test('Debug application initialization', async ({ page }) => {
  // Capture all console messages
  page.on('console', (msg) => {
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });
  
  // Capture page errors
  page.on('pageerror', (error) => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait a bit to see what happens
  await page.waitForTimeout(5000);
  
  // Check what's available
  const debugInfo = await page.evaluate(() => {
    return {
      urlManagerInstance: typeof window.urlManagerInstance,
      URLManager: typeof URLManager,
      DOMContentLoaded: document.readyState,
      errors: window.errors || 'No errors stored'
    };
  });
  
  console.log('Debug info:', debugInfo);
});