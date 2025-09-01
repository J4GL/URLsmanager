import { test, expect } from '@playwright/test';

test.describe('Copy Button Detailed Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.text().includes('copy') || msg.text().includes('Copy') || msg.text().includes('reset')) {
        console.log(`[${msg.type()}]`, msg.text());
      }
    });

    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Monitor copy button state through entire copy cycle', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const copyResultsButton = page.locator('#copy-results-btn');
    
    // Setup and process URLs
    await inputTextarea.fill('https://test.com\nhttps://example.com');
    await sortSelect.selectOption('sortByDomain');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    console.log('=== BEFORE COPY CLICK ===');
    let buttonState = await page.evaluate(() => {
      const copyBtn = document.getElementById('copy-results-btn');
      const outputTextarea = document.getElementById('output-textarea');
      const urlManager = window.urlManagerInstance;
      const textAreaManager = urlManager?.textAreaManager;
      
      return {
        buttonDisabled: copyBtn?.disabled,
        buttonText: copyBtn?.textContent,
        outputValue: outputTextarea?.value,
        outputLength: outputTextarea?.value?.length,
        getOutputTextResult: textAreaManager?.getOutputText(),
        hasOutputContentResult: textAreaManager?.hasOutputContent()
      };
    });
    console.log('Before copy:', buttonState);
    
    // Click copy button
    await copyResultsButton.click();
    
    console.log('=== IMMEDIATELY AFTER CLICK ===');
    buttonState = await page.evaluate(() => {
      const copyBtn = document.getElementById('copy-results-btn');
      return {
        buttonDisabled: copyBtn?.disabled,
        buttonText: copyBtn?.textContent,
        buttonClasses: copyBtn?.className
      };
    });
    console.log('Immediately after click:', buttonState);
    
    // Wait for the success state (should show "Copied!")
    await page.waitForTimeout(500);
    
    console.log('=== AFTER SUCCESS STATE ===');
    buttonState = await page.evaluate(() => {
      const copyBtn = document.getElementById('copy-results-btn');
      const outputTextarea = document.getElementById('output-textarea');
      const urlManager = window.urlManagerInstance;
      const textAreaManager = urlManager?.textAreaManager;
      
      return {
        buttonDisabled: copyBtn?.disabled,
        buttonText: copyBtn?.textContent,
        buttonClasses: copyBtn?.className,
        outputValue: outputTextarea?.value,
        getOutputTextResult: textAreaManager?.getOutputText(),
        outputCheck: {
          raw: textAreaManager?.getOutputText(),
          isEmpty: !textAreaManager?.getOutputText() || textAreaManager?.getOutputText().trim() === ''
        }
      };
    });
    console.log('After success state:', buttonState);
    
    // Wait for the reset (2 seconds after copy)
    await page.waitForTimeout(2500);
    
    console.log('=== AFTER RESET ===');
    buttonState = await page.evaluate(() => {
      const copyBtn = document.getElementById('copy-results-btn');
      const outputTextarea = document.getElementById('output-textarea');
      const urlManager = window.urlManagerInstance;
      const textAreaManager = urlManager?.textAreaManager;
      
      return {
        buttonDisabled: copyBtn?.disabled,
        buttonText: copyBtn?.textContent,
        buttonClasses: copyBtn?.className,
        outputValue: outputTextarea?.value,
        getOutputTextResult: textAreaManager?.getOutputText(),
        outputCheck: {
          raw: textAreaManager?.getOutputText(),
          isEmpty: !textAreaManager?.getOutputText() || textAreaManager?.getOutputText().trim() === ''
        }
      };
    });
    console.log('After reset:', buttonState);
    
    // Verify the button should be enabled since we have output
    const finalOutputValue = await page.locator('#output-textarea').inputValue();
    console.log('Final output value length:', finalOutputValue.length);
    
    if (finalOutputValue && finalOutputValue.trim()) {
      console.log('Button should be ENABLED because we have output');
      await expect(copyResultsButton).not.toBeDisabled();
    } else {
      console.log('Button should be DISABLED because no output');
    }
  });
});