import { test, expect } from '@playwright/test';

test.describe('Debug URL Manager Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Debug clear button functionality', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearButton = page.locator('#clear-input-btn');
    
    // Add some test URLs to the input
    const testUrls = 'https://example.com\nhttps://test.org\nhttps://sample.net';
    await inputTextarea.fill(testUrls);
    
    console.log('Input filled with:', await inputTextarea.inputValue());
    
    // Check if clear button event is properly attached
    const buttonClickResult = await page.evaluate(() => {
      const clearBtn = document.getElementById('clear-input-btn');
      const textArea = document.getElementById('input-textarea');
      
      console.log('Before click - Text area value:', textArea.value);
      console.log('Clear button element:', clearBtn);
      console.log('Text area manager instance:', window.urlManagerInstance?.textAreaManager);
      
      // Trigger the click manually to debug
      clearBtn.click();
      
      return {
        buttonExists: !!clearBtn,
        textAreaExists: !!textArea,
        textAreaManagerExists: !!window.urlManagerInstance?.textAreaManager,
        clipboardManagerExists: !!window.urlManagerInstance?.clipboardUtilityManager
      };
    });
    
    console.log('Debug info:', buttonClickResult);
    
    // Wait a bit for the clear to process
    await page.waitForTimeout(500);
    
    const valueAfterClick = await inputTextarea.inputValue();
    console.log('Value after click:', valueAfterClick);
  });

  test('Debug sorting functionality - check process options', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    
    // Add test URLs
    const testUrls = 'https://zebra.com\nhttps://apple.com\nhttps://microsoft.com';
    await inputTextarea.fill(testUrls);
    
    // Select sort by domain
    await sortSelect.selectOption('sortByDomain');
    
    // Debug the processing options before clicking
    const debugInfo = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const controlPanel = urlManager?.controlPanel;
      
      if (!controlPanel) {
        return { error: 'Control panel not found' };
      }
      
      const options = controlPanel.getProcessingOptions();
      const operation = controlPanel.getOperation();
      
      return {
        options,
        operation,
        sortSelectValue: document.getElementById('sort-select')?.value,
        processButtonDisabled: document.getElementById('process-btn')?.disabled
      };
    });
    
    console.log('Processing options debug:', debugInfo);
    
    // Try to process
    await processButton.click();
    
    // Check if processing started
    const processingState = await page.evaluate(() => {
      return {
        isProcessing: window.urlManagerInstance?.isProcessing,
        outputValue: document.getElementById('output-textarea')?.value
      };
    });
    
    console.log('Processing state:', processingState);
    
    await page.waitForTimeout(2000);
    
    const finalOutput = await page.locator('#output-textarea').inputValue();
    console.log('Final output:', finalOutput);
  });
});