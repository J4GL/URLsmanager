import { test, expect } from '@playwright/test';

test.describe('Clear Button Fix Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      } else if (msg.type() === 'warn') {
        console.log('CONSOLE WARN:', msg.text());
      } else if (msg.text().includes('clear') || msg.text().includes('Clear')) {
        console.log('CLEAR LOG:', msg.text());
      }
    });

    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Debugging clear button step by step', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const clearButton = page.locator('#clear-input-btn');
    
    const testUrls = 'https://example.com\nhttps://test.org';
    await inputTextarea.fill(testUrls);
    
    console.log('Input filled. Current value:', await inputTextarea.inputValue());
    
    // Check the flow step by step
    const stepByStepDebug = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const textAreaManager = urlManager?.textAreaManager;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      const textArea = document.getElementById('input-textarea');
      
      console.log('=== STEP BY STEP DEBUG ===');
      console.log('1. Current textarea value:', textArea.value);
      console.log('2. TextAreaManager getInputText(true):', textAreaManager?.getInputText(true));
      console.log('3. TextAreaManager hasInputContent():', textAreaManager?.hasInputContent());
      
      // Test the condition in handleClearInput
      const currentText = textAreaManager?.getInputText(true);
      const isEmpty = !currentText || currentText.trim() === '';
      console.log('4. Clear condition check - isEmpty:', isEmpty, 'currentText:', currentText?.substring(0, 50));
      
      return {
        textAreaValue: textArea.value,
        getInputTextResult: currentText,
        hasInputContentResult: textAreaManager?.hasInputContent(),
        isEmptyCondition: isEmpty,
        textAreaManagerExists: !!textAreaManager,
        clipboardManagerExists: !!clipboardManager
      };
    });
    
    console.log('Step by step debug result:', stepByStepDebug);
    
    // Now manually trigger the clear through the clipboard manager
    const manualClearResult = await page.evaluate(() => {
      const urlManager = window.urlManagerInstance;
      const clipboardManager = urlManager?.clipboardUtilityManager;
      
      console.log('Manually calling handleClearInput...');
      if (clipboardManager && typeof clipboardManager.handleClearInput === 'function') {
        clipboardManager.handleClearInput();
        return { called: true };
      }
      return { called: false };
    });
    
    console.log('Manual clear result:', manualClearResult);
    
    // Wait for the clear operation to complete (has 100ms timeout)
    await page.waitForTimeout(500);
    
    const finalValue = await inputTextarea.inputValue();
    console.log('Final value after manual clear:', finalValue);
    
    // Try clicking the actual button
    console.log('Now clicking the actual button...');
    await clearButton.click();
    await page.waitForTimeout(500);
    
    const finalButtonValue = await inputTextarea.inputValue();
    console.log('Final value after button click:', finalButtonValue);
  });
});