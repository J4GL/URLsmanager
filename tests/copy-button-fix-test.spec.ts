import { test, expect } from '@playwright/test';

test.describe('Copy Button Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the application to initialize
    await page.waitForFunction(() => window.urlManagerInstance != null);
    
    // Wait for all components to be ready
    await page.waitForTimeout(500);
  });

  test('Copy button should be enabled after URL processing', async ({ page }) => {
    console.log('Starting copy button fix test...');
    
    // Get elements
    const inputTextarea = page.locator('#input-textarea');
    const cleanModifySelect = page.locator('#clean-modify-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    const copyButton = page.locator('#copy-results-btn');
    
    // Verify copy button starts disabled
    await expect(copyButton).toBeDisabled();
    console.log('✓ Copy button starts disabled');
    
    // Add test URLs to the input
    const testUrls = [
      'https://example.com/page?param=value&test=123',
      'https://test.org/path?utm_source=google',
      'https://sample.net/file?id=456'
    ].join('\n');
    
    await inputTextarea.fill(testUrls);
    console.log('✓ Added test URLs to input');
    
    // Select "Remove Parameters" operation
    await cleanModifySelect.selectOption('removeParams');
    console.log('✓ Selected removeParams operation');
    
    // Wait for process button to become enabled
    await expect(processButton).toBeEnabled({ timeout: 5000 });
    console.log('✓ Process button is enabled');
    
    // Click process button
    await processButton.click();
    console.log('✓ Clicked process button');
    
    // Wait for processing to complete by checking output content
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
      return output && output.value.length > 0;
    }, { timeout: 10000 });
    
    console.log('✓ Processing completed');
    
    // Verify output has content
    const outputValue = await outputTextarea.inputValue();
    expect(outputValue.length).toBeGreaterThan(0);
    console.log('✓ Output has content:', outputValue.length, 'characters');
    
    // The main test: Verify copy button is now enabled
    await expect(copyButton).toBeEnabled({ timeout: 2000 });
    console.log('✓ Copy button is enabled after processing');
    
    // Verify the processed URLs are correct (parameters removed)
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    expect(outputLines.length).toBe(3);
    expect(outputLines[0]).toBe('https://example.com/page');
    expect(outputLines[1]).toBe('https://test.org/path');
    expect(outputLines[2]).toBe('https://sample.net/file');
    console.log('✓ URLs processed correctly');
    
    // Test the copy button actually works
    await copyButton.click();
    console.log('✓ Copy button clicked successfully');
    
    // Wait for copy operation to complete and button to show success state
    await page.waitForTimeout(500);
    
    // Check if button shows success state (text should change)
    const buttonText = await copyButton.textContent();
    console.log('Copy button text after click:', buttonText);
  });

  test('Copy button should remain disabled when output is empty', async ({ page }) => {
    console.log('Testing copy button remains disabled with empty output...');
    
    const copyButton = page.locator('#copy-results-btn');
    const clearOutputButton = page.locator('#clear-output-btn');
    const inputTextarea = page.locator('#input-textarea');
    const cleanModifySelect = page.locator('#clean-modify-select');
    const processButton = page.locator('#process-btn');
    
    // Verify copy button starts disabled
    await expect(copyButton).toBeDisabled();
    console.log('✓ Copy button starts disabled');
    
    // Add some URLs and process them first
    await inputTextarea.fill('https://example.com\nhttps://test.org');
    await cleanModifySelect.selectOption('removeParams');
    await processButton.click();
    
    // Wait for processing and verify button becomes enabled
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
      return output && output.value.length > 0;
    });
    
    await expect(copyButton).toBeEnabled();
    console.log('✓ Copy button enabled after processing');
    
    // Now clear the output
    await clearOutputButton.click();
    await page.waitForTimeout(200);
    
    // Verify copy button is disabled again
    await expect(copyButton).toBeDisabled();
    console.log('✓ Copy button disabled after clearing output');
  });

  test('Copy button state updates with different processing operations', async ({ page }) => {
    console.log('Testing copy button with different operations...');
    
    const inputTextarea = page.locator('#input-textarea');
    const deduplicateSelect = page.locator('#deduplicate-select');
    const processButton = page.locator('#process-btn');
    const copyButton = page.locator('#copy-results-btn');
    
    // Test with deduplicate operation
    const testUrls = [
      'https://example.com',
      'https://example.com',  // Duplicate
      'https://test.org'
    ].join('\n');
    
    await inputTextarea.fill(testUrls);
    await deduplicateSelect.selectOption('deduplicateFull');
    
    await expect(processButton).toBeEnabled();
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
      return output && output.value.length > 0;
    });
    
    // Verify copy button is enabled
    await expect(copyButton).toBeEnabled();
    console.log('✓ Copy button enabled after deduplication');
    
    // Verify deduplication worked (should have 2 unique URLs)
    const outputValue = await page.locator('#output-textarea').inputValue();
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    expect(outputLines.length).toBe(2);
    console.log('✓ Deduplication worked correctly');
  });
});