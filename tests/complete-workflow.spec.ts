import { test, expect } from '@playwright/test';

test.describe('Complete Workflow - All Fixed Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Complete workflow: Sort, Copy, and Clear all work correctly', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearInputButton = page.locator('#clear-input-btn');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    const copyResultsButton = page.locator('#copy-results-btn');
    const clearOutputButton = page.locator('#clear-output-btn');
    
    console.log('=== STEP 1: ADD URLS AND SORT ===');
    
    // Add URLs to input
    const testUrls = 'https://zebra.com/path\nhttps://apple.com/page\nhttps://microsoft.com/docs';
    await inputTextarea.fill(testUrls);
    
    // Sort by domain
    await sortSelect.selectOption('sortByDomain');
    await processButton.click();
    
    // Wait for sorting to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    // Verify sorting worked
    const sortedOutput = await outputTextarea.inputValue();
    const sortedLines = sortedOutput.split('\n').filter(line => line.trim());
    expect(sortedLines[0]).toContain('apple.com');
    expect(sortedLines[1]).toContain('microsoft.com');
    expect(sortedLines[2]).toContain('zebra.com');
    
    console.log('✓ Sorting works correctly');
    
    console.log('=== STEP 2: COPY RESULTS ===');
    
    // Verify copy button is enabled
    await expect(copyResultsButton).not.toBeDisabled();
    
    // Click copy button
    await copyResultsButton.click();
    
    // Wait for copy operation to complete and reset
    await page.waitForTimeout(3000);
    
    // Verify copy button is still enabled after reset
    await expect(copyResultsButton).not.toBeDisabled();
    
    console.log('✓ Copy Results button works correctly');
    
    console.log('=== STEP 3: CLEAR OUTPUT ===');
    
    // Clear output
    await clearOutputButton.click();
    await expect(outputTextarea).toHaveValue('');
    
    // Verify copy button is now disabled (no output)
    await expect(copyResultsButton).toBeDisabled();
    
    console.log('✓ Clear Output works correctly');
    
    console.log('=== STEP 4: CLEAR INPUT ===');
    
    // Clear input
    await clearInputButton.click();
    await expect(inputTextarea).toHaveValue('');
    
    console.log('✓ Clear Input button works correctly');
    
    console.log('=== STEP 5: NEW WORKFLOW TEST ===');
    
    // Test another complete workflow
    await inputTextarea.fill('https://short.com\nhttps://verylongdomainname.com/with/path');
    await sortSelect.selectOption('sortByLength');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    const lengthSortedOutput = await outputTextarea.inputValue();
    const lengthSortedLines = lengthSortedOutput.split('\n').filter(line => line.trim());
    
    // Verify length sorting (shorter URL should come first)
    expect(lengthSortedLines[0].length).toBeLessThan(lengthSortedLines[1].length);
    expect(lengthSortedLines[0]).toContain('short.com');
    
    // Test copy button again
    await expect(copyResultsButton).not.toBeDisabled();
    await copyResultsButton.click();
    await page.waitForTimeout(3000);
    await expect(copyResultsButton).not.toBeDisabled();
    
    console.log('✓ Second workflow cycle works correctly');
    
    console.log('🎉 ALL FUNCTIONALITY WORKING PERFECTLY!');
  });

  test('Edge case: Copy button behavior with empty output', async ({ page }) => {
    const copyResultsButton = page.locator('#copy-results-btn');
    
    // Initially, copy button should be disabled (no output)
    await expect(copyResultsButton).toBeDisabled();
    
    // Try clicking it (should do nothing)
    await copyResultsButton.click({ force: true });
    
    // Should still be disabled
    await expect(copyResultsButton).toBeDisabled();
  });
});