import { test, expect } from '@playwright/test';

test.describe('Copy Results Button Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      } else if (msg.text().includes('copy') || msg.text().includes('Copy')) {
        console.log('COPY LOG:', msg.text());
      }
    });

    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Copy results button functionality test', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    const copyResultsButton = page.locator('#copy-results-btn');
    
    // Add test URLs and process them
    const testUrls = 'https://zebra.com\nhttps://apple.com\nhttps://microsoft.com';
    await inputTextarea.fill(testUrls);
    await sortSelect.selectOption('sortByDomain');
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    console.log('Processing completed. Testing copy button...');
    
    // Check if copy button is enabled
    const isDisabled = await copyResultsButton.isDisabled();
    console.log('Copy button disabled status:', isDisabled);
    
    if (!isDisabled) {
      // Test the copy functionality
      console.log('Clicking copy results button...');
      await copyResultsButton.click();
      
      // Wait a bit for the copy operation
      await page.waitForTimeout(1000);
      
      // Check if there are any error messages
      const errorMessage = await page.locator('#error-message').textContent();
      console.log('Error message after copy:', errorMessage);
    }
    
    // Debug the copy process
    const copyDebugInfo = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      const textAreaManager = urlManager?.textAreaManager;
      const outputTextarea = document.getElementById('output-textarea');
      const copyBtn = document.getElementById('copy-results-btn');
      
      return {
        outputHasContent: outputTextarea?.value?.length > 0,
        outputValue: outputTextarea?.value?.substring(0, 100), // First 100 chars
        copyButtonExists: !!copyBtn,
        copyButtonDisabled: copyBtn?.disabled,
        clipboardManagerExists: !!clipboardManager,
        textAreaManagerExists: !!textAreaManager,
        hasCopyToClipboardMethod: typeof textAreaManager?.copyToClipboard === 'function',
        clipboardAPIAvailable: !!navigator.clipboard,
        hasHandleCopyMethod: typeof clipboardManager?.handleCopyResults === 'function'
      };
    });
    
    console.log('Copy debug info:', copyDebugInfo);
  });

  test('Test copy button with manual trigger', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    
    // Add test URLs and process them
    await inputTextarea.fill('https://test.com\nhttps://example.com');
    await sortSelect.selectOption('sortByDomain');
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    // Manually trigger the copy operation to debug
    const manualCopyResult = await page.evaluate(async () => {
      const urlManager = window.urlManagerInstance;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      const textAreaManager = urlManager?.textAreaManager;
      
      console.log('=== MANUAL COPY TEST ===');
      
      // Check if we can get output text
      const outputText = textAreaManager?.getOutputText();
      console.log('Output text available:', !!outputText, 'Length:', outputText?.length);
      
      // Try calling copyToClipboard directly
      if (textAreaManager && typeof textAreaManager.copyToClipboard === 'function') {
        try {
          const result = await textAreaManager.copyToClipboard();
          console.log('Direct copyToClipboard result:', result);
          return { directCopy: result, outputAvailable: !!outputText };
        } catch (error) {
          console.log('Direct copyToClipboard error:', error.message);
          return { directCopy: false, error: error.message, outputAvailable: !!outputText };
        }
      }
      
      return { directCopy: 'method not available', outputAvailable: !!outputText };
    });
    
    console.log('Manual copy result:', manualCopyResult);
    
    // Try the clipboard manager method
    const clipboardManagerResult = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      
      if (clipboardManager && typeof clipboardManager.handleCopyResults === 'function') {
        console.log('Calling clipboardManager.handleCopyResults...');
        clipboardManager.handleCopyResults();
        return { called: true };
      }
      
      return { called: false, reason: 'method not available' };
    });
    
    console.log('Clipboard manager result:', clipboardManagerResult);
  });
});