import { test, expect } from '@playwright/test';

test.describe('Detailed Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[${msg.type().toUpperCase()}]`, msg.text());
    });

    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Test exact processing flow for sorting', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    
    // Add test URLs
    const testUrls = 'https://zebra.com\nhttps://apple.com\nhttps://microsoft.com';
    await inputTextarea.fill(testUrls);
    
    // Select sort by domain
    await sortSelect.selectOption('sortByDomain');
    
    // Debug every step of the processing flow
    const flowDebug = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const controlPanel = urlManager?.controlPanel;
      
      // Step 1: Get processing options
      const controlPanelOptions = controlPanel.getProcessingOptions();
      console.log('1. Control Panel Options:', controlPanelOptions);
      
      // Step 2: Map operation options
      const mappedOptions = urlManager.mapOperationOptions(controlPanelOptions);
      console.log('2. Mapped Options:', mappedOptions);
      
      // Step 3: Test URL processor directly
      const urls = ['https://zebra.com', 'https://apple.com', 'https://microsoft.com'];
      console.log('3. About to test URLProcessor directly');
      
      try {
        const directResult = urlManager.urlProcessor.processSync(urls, 'sortByDomain', {});
        console.log('4. Direct URLProcessor result:', directResult);
      } catch (error) {
        console.log('4. Direct URLProcessor error:', error.message);
      }
      
      return {
        controlPanelOptions,
        mappedOptions,
        hasURLProcessor: !!urlManager.urlProcessor,
        hasMapFunction: typeof urlManager.mapOperationOptions === 'function'
      };
    });
    
    console.log('Flow debug result:', flowDebug);
    
    // Now try the actual process button
    console.log('Clicking process button...');
    await processButton.click();
    
    await page.waitForTimeout(2000);
    
    const finalResult = await page.evaluate(() => {
      return {
        outputValue: document.getElementById('output-textarea')?.value,
        errorMessage: document.getElementById('error-message')?.textContent
      };
    });
    
    console.log('Final result:', finalResult);
  });

  test('Test clear button with step-by-step debugging', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearButton = page.locator('#clear-input-btn');
    
    const testUrls = 'https://example.com\nhttps://test.org';
    await inputTextarea.fill(testUrls);
    
    const clearDebug = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const textAreaManager = urlManager?.textAreaManager;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      const textArea = document.getElementById('input-textarea');
      
      console.log('Before clear operation:');
      console.log('- TextArea value:', textArea.value);
      console.log('- TextAreaManager exists:', !!textAreaManager);
      console.log('- ClipboardManager exists:', !!clipboardManager);
      
      // Test the setInputText function directly
      console.log('Testing setInputText directly...');
      if (textAreaManager && typeof textAreaManager.setInputText === 'function') {
        textAreaManager.setInputText('TEST_CLEAR');
        console.log('After setInputText("TEST_CLEAR"):', textArea.value);
        
        textAreaManager.setInputText('');
        console.log('After setInputText(""):', textArea.value);
        
        // Reset for the actual test
        textAreaManager.setInputText('https://example.com\nhttps://test.org');
      }
      
      // Test clearInput directly
      if (textAreaManager && typeof textAreaManager.clearInput === 'function') {
        console.log('Testing clearInput directly...');
        textAreaManager.clearInput();
        console.log('After clearInput():', textArea.value);
      }
      
      return {
        textAreaExists: !!textArea,
        textAreaManagerExists: !!textAreaManager,
        setInputTextWorks: textArea.value === ''
      };
    });
    
    console.log('Clear debug result:', clearDebug);
  });
});