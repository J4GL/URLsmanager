import { test, expect } from '@playwright/test';

test.describe('URL Manager Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the application to initialize
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Clear input button should clear the input textarea', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearButton = page.locator('#clear-input-btn');
    
    // Add some test URLs to the input
    const testUrls = 'https://example.com\nhttps://test.org\nhttps://sample.net';
    await inputTextarea.fill(testUrls);
    
    // Verify text is in the input
    await expect(inputTextarea).toHaveValue(testUrls);
    
    // Click clear button
    await clearButton.click();
    
    // Verify input is cleared
    await expect(inputTextarea).toHaveValue('');
  });

  test('Sort by Domain should work correctly', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    
    // Add test URLs in unsorted order
    const testUrls = [
      'https://zebra.com/path',
      'https://apple.com/page',
      'https://microsoft.com/docs'
    ].join('\n');
    
    await inputTextarea.fill(testUrls);
    
    // Select sort by domain
    await sortSelect.selectOption('sortByDomain');
    
    // Process URLs
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    const outputValue = await outputTextarea.inputValue();
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify URLs are sorted by domain (apple, microsoft, zebra)
    expect(outputLines[0]).toContain('apple.com');
    expect(outputLines[1]).toContain('microsoft.com');
    expect(outputLines[2]).toContain('zebra.com');
  });

  test('Sort by Length should work correctly', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    
    // Add test URLs with different lengths
    const testUrls = [
      'https://verylongdomainname.com/with/very/long/path/structure',
      'https://short.com',
      'https://medium.com/path'
    ].join('\n');
    
    await inputTextarea.fill(testUrls);
    
    // Select sort by length
    await sortSelect.selectOption('sortByLength');
    
    // Process URLs
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    const outputValue = await outputTextarea.inputValue();
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify URLs are sorted by length (shortest to longest)
    expect(outputLines[0].length).toBeLessThan(outputLines[1].length);
    expect(outputLines[1].length).toBeLessThan(outputLines[2].length);
  });

  test('Sort by Filename should work correctly', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    
    // Add test URLs with different filenames
    const testUrls = [
      'https://example.com/zebra.html',
      'https://example.com/apple.html',
      'https://example.com/banana.html'
    ].join('\n');
    
    await inputTextarea.fill(testUrls);
    
    // Select sort by filename
    await sortSelect.selectOption('sortByFilename');
    
    // Process URLs
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    const outputValue = await outputTextarea.inputValue();
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify URLs are sorted by filename (apple, banana, zebra)
    expect(outputLines[0]).toContain('apple.html');
    expect(outputLines[1]).toContain('banana.html');
    expect(outputLines[2]).toContain('zebra.html');
  });

  test('Check if sort operations are implemented in URLProcessor', async ({ page }) => {
    // Check if the sorting methods exist in the URLProcessor
    const hasSortMethods = await page.evaluate(() => {
      const processor = new URLProcessor();
      return {
        hasSortByDomain: typeof processor.sortByDomain === 'function',
        hasSortByLength: typeof processor.sortByLength === 'function',
        hasSortByFilename: typeof processor.sortByFilename === 'function'
      };
    });
    
    console.log('Sort methods availability:', hasSortMethods);
  });

  test('Check clear button event listener', async ({ page }) => {
    // Check if the clear button has event listeners
    const hasEventListener = await page.evaluate(() => {
      const clearBtn = document.querySelector('#clear-input-btn');
      return getEventListeners ? getEventListeners(clearBtn) : 'getEventListeners not available';
    });
    
    console.log('Clear button event listeners:', hasEventListener);
  });
});