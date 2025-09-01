import { test, expect } from '@playwright/test';

test.describe('Final Verification - All Issues Fixed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Complete workflow: Clear button works correctly', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearButton = page.locator('#clear-input-btn');
    
    // Add URLs to input
    const testUrls = 'https://example.com/path?param=value\nhttps://test.org/page\nhttps://sample.net';
    await inputTextarea.fill(testUrls);
    
    // Verify input has content
    await expect(inputTextarea).toHaveValue(testUrls);
    
    // Click clear button
    await clearButton.click();
    
    // Verify input is cleared
    await expect(inputTextarea).toHaveValue('');
  });

  test('Complete workflow: All sorting operations work correctly', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    const clearOutputButton = page.locator('#clear-output-btn');
    
    // Test Sort by Domain
    const domainTestUrls = 'https://zebra.com/path\nhttps://apple.com/page\nhttps://microsoft.com/docs';
    await inputTextarea.fill(domainTestUrls);
    await sortSelect.selectOption('sortByDomain');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    let outputValue = await outputTextarea.inputValue();
    let outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify URLs are sorted by domain (apple, microsoft, zebra)
    expect(outputLines[0]).toContain('apple.com');
    expect(outputLines[1]).toContain('microsoft.com');
    expect(outputLines[2]).toContain('zebra.com');
    
    // Clear for next test
    await clearOutputButton.click();
    await expect(outputTextarea).toHaveValue('');
    
    // Test Sort by Length
    const lengthTestUrls = 'https://verylongdomainname.com/with/very/long/path/structure\nhttps://short.com\nhttps://medium.com/path';
    await inputTextarea.fill(lengthTestUrls);
    await sortSelect.selectOption('sortByLength');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    outputValue = await outputTextarea.inputValue();
    outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify URLs are sorted by length (shortest to longest)
    expect(outputLines[0].length).toBeLessThan(outputLines[1].length);
    expect(outputLines[1].length).toBeLessThan(outputLines[2].length);
    
    // Clear for next test
    await clearOutputButton.click();
    await expect(outputTextarea).toHaveValue('');
    
    // Test Sort by Filename
    const filenameTestUrls = 'https://example.com/zebra.html\nhttps://example.com/apple.html\nhttps://example.com/banana.html';
    await inputTextarea.fill(filenameTestUrls);
    await sortSelect.selectOption('sortByFilename');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    outputValue = await outputTextarea.inputValue();
    outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify URLs are sorted by filename (apple, banana, zebra)
    expect(outputLines[0]).toContain('apple.html');
    expect(outputLines[1]).toContain('banana.html');
    expect(outputLines[2]).toContain('zebra.html');
  });

  test('Integration test: Clear and sort workflow together', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearInputButton = page.locator('#clear-input-btn');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    
    // Add some URLs
    await inputTextarea.fill('https://z.com\nhttps://a.com\nhttps://m.com');
    
    // Clear input
    await clearInputButton.click();
    await expect(inputTextarea).toHaveValue('');
    
    // Add different URLs
    await inputTextarea.fill('https://github.com/repo\nhttps://stackoverflow.com/questions\nhttps://docs.google.com');
    
    // Sort by domain
    await sortSelect.selectOption('sortByDomain');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    const outputValue = await outputTextarea.inputValue();
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    
    // Verify correct sorting (docs.google.com should come first alphabetically)
    expect(outputLines[0]).toContain('docs.google.com');
    expect(outputLines[1]).toContain('github.com');
    expect(outputLines[2]).toContain('stackoverflow.com');
  });
});