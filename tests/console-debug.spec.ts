import { test, expect } from '@playwright/test';

test.describe('Console Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      } else if (msg.type() === 'warn') {
        console.log('CONSOLE WARN:', msg.text());
      } else {
        console.log('CONSOLE LOG:', msg.text());
      }
    });

    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Test sorting with detailed error capture', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    
    // Add test URLs
    const testUrls = 'https://zebra.com\nhttps://apple.com\nhttps://microsoft.com';
    await inputTextarea.fill(testUrls);
    
    // Select sort by domain
    await sortSelect.selectOption('sortByDomain');
    
    console.log('About to click process button...');
    await processButton.click();
    
    // Wait longer and check for any error messages
    await page.waitForTimeout(3000);
    
    const finalState = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const errorElement = document.getElementById('error-message');
      
      return {
        isProcessing: urlManager?.isProcessing,
        outputValue: document.getElementById('output-textarea')?.value,
        errorDisplay: errorElement?.style.display,
        errorText: errorElement?.textContent,
        hasErrorHandler: !!urlManager?.errorHandler
      };
    });
    
    console.log('Final state:', finalState);
  });

  test('Test clear button with detailed debugging', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearButton = page.locator('#clear-input-btn');
    
    const testUrls = 'https://example.com\nhttps://test.org';
    await inputTextarea.fill(testUrls);
    
    console.log('About to click clear button...');
    
    // Monitor the clear operation in detail
    const clearResult = await page.evaluate(() => {
      const textArea = document.getElementById('input-textarea');
      const clearBtn = document.getElementById('clear-input-btn');
      const urlManager = window.urlManagerInstance;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      const textAreaManager = urlManager?.textAreaManager;
      
      console.log('Before clear - textarea value:', textArea.value);
      console.log('TextAreaManager setInputText method:', typeof textAreaManager?.setInputText);
      console.log('TextAreaManager clearInput method:', typeof textAreaManager?.clearInput);
      
      // Manually trigger the clear
      if (clipboardManager && typeof clipboardManager.handleClearInput === 'function') {
        clipboardManager.handleClearInput();
      }
      
      return {
        textAreaManagerExists: !!textAreaManager,
        clearInputExists: typeof textAreaManager?.clearInput === 'function',
        setInputTextExists: typeof textAreaManager?.setInputText === 'function',
        clipboardManagerExists: !!clipboardManager,
        handleClearInputExists: typeof clipboardManager?.handleClearInput === 'function'
      };
    });
    
    console.log('Clear operation details:', clearResult);
    
    await page.waitForTimeout(1000);
    
    const finalValue = await inputTextarea.inputValue();
    console.log('Final textarea value:', finalValue);
  });
});