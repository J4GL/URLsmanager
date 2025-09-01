import { test, expect } from '@playwright/test';

test.describe('Copy Bug Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Grant clipboard permissions for testing
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ CONSOLE ERROR:', msg.text());
      } else if (msg.text().includes('copy') || msg.text().includes('Copy')) {
        console.log('📋 COPY LOG:', msg.text());
      }
    });

    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.urlManagerInstance != null);
  });

  test('Complete workflow: Paste URLs → Sort by Domain → Copy Results to Clipboard', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const outputTextarea = page.locator('#output-textarea');
    const copyResultsButton = page.locator('#copy-results-btn');
    
    console.log('🔍 Testing the exact workflow: Paste → Sort → Copy');
    
    // Step 1: Paste URLs into input
    console.log('📝 Step 1: Pasting URLs into input textarea...');
    const testUrls = [
      'https://zebra.com/api/users',
      'https://apple.com/store/iphone', 
      'https://microsoft.com/products/windows',
      'https://google.com/search',
      'https://amazon.com/electronics'
    ].join('\n');
    
    await inputTextarea.fill(testUrls);
    
    // Verify input has content
    const inputValue = await inputTextarea.inputValue();
    expect(inputValue).toBe(testUrls);
    console.log('✅ URLs pasted successfully');
    
    // Step 2: Select "Sort by Domain" operation
    console.log('🔧 Step 2: Selecting sort by domain operation...');
    await sortSelect.selectOption('sortByDomain');
    
    // Verify selection
    const selectedValue = await sortSelect.inputValue();
    expect(selectedValue).toBe('sortByDomain');
    console.log('✅ Sort by domain selected');
    
    // Step 3: Process the URLs
    console.log('⚡ Step 3: Processing URLs...');
    
    // Check button is enabled before processing
    await expect(processButton).not.toBeDisabled();
    
    await processButton.click();
    
    // Wait for processing to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    }, { timeout: 10000 });
    
    console.log('✅ Processing completed');
    
    // Step 4: Verify sorting worked correctly
    console.log('🔍 Step 4: Verifying sort results...');
    const outputValue = await outputTextarea.inputValue();
    const outputLines = outputValue.split('\n').filter(line => line.trim());
    
    console.log('Sorted URLs:');
    outputLines.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });
    
    // Verify domains are sorted alphabetically (amazon, apple, google, microsoft, zebra)
    expect(outputLines[0]).toContain('amazon.com');
    expect(outputLines[1]).toContain('apple.com');  
    expect(outputLines[2]).toContain('google.com');
    expect(outputLines[3]).toContain('microsoft.com');
    expect(outputLines[4]).toContain('zebra.com');
    
    console.log('✅ URLs are correctly sorted by domain');
    
    // Step 5: Check copy button state  
    console.log('📋 Step 5: Checking copy button state...');
    
    // The bug fix should ensure the copy button is enabled now
    const buttonState = await page.evaluate(() => {
      const copyBtn = document.getElementById('copy-results-btn');
      const outputTextarea = document.getElementById('output-textarea');
      
      return {
        buttonExists: !!copyBtn,
        buttonDisabled: copyBtn?.disabled,
        buttonText: copyBtn?.textContent?.trim(),
        outputLength: outputTextarea?.value?.length || 0,
        outputHasContent: outputTextarea?.value?.length > 0
      };
    });
    
    console.log('Copy button state:', buttonState);
    
    // Verify copy button is enabled
    expect(buttonState.buttonExists).toBe(true);
    expect(buttonState.outputHasContent).toBe(true);
    expect(buttonState.buttonDisabled).toBe(false);
    
    await expect(copyResultsButton).not.toBeDisabled();
    console.log('✅ Copy Results button is properly enabled');
    
    // Step 6: Copy results to clipboard
    console.log('📋 Step 6: Copying results to clipboard...');
    
    await copyResultsButton.click();
    
    // Wait for copy operation to complete
    await page.waitForTimeout(1000);
    
    // Verify copy was successful by checking clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        return `Error reading clipboard: ${error.message}`;
      }
    });
    
    console.log('Clipboard content preview:', clipboardContent.substring(0, 100) + '...');
    
    // Verify clipboard contains the sorted URLs
    expect(clipboardContent).toContain('amazon.com');
    expect(clipboardContent).toContain('apple.com');
    expect(clipboardContent).toContain('google.com'); 
    expect(clipboardContent).toContain('microsoft.com');
    expect(clipboardContent).toContain('zebra.com');
    
    console.log('✅ Results successfully copied to clipboard');
    
    // Step 7: Verify button returns to normal state
    console.log('🔄 Step 7: Verifying button state after copy...');
    
    // Wait for the button to reset (should take about 2 seconds)
    await page.waitForTimeout(3000);
    
    const finalButtonState = await page.evaluate(() => {
      const copyBtn = document.getElementById('copy-results-btn');
      return {
        buttonDisabled: copyBtn?.disabled,
        buttonText: copyBtn?.textContent?.trim(),
        buttonClasses: copyBtn?.className
      };
    });
    
    console.log('Final button state:', finalButtonState);
    
    // Button should be enabled and ready for another copy
    expect(finalButtonState.buttonDisabled).toBe(false);
    expect(finalButtonState.buttonText).toBe('Copy Results');
    
    console.log('✅ Copy button properly reset and ready for reuse');
    
    console.log('🎉 COMPLETE WORKFLOW VERIFICATION PASSED!');
    console.log('   ✅ Paste URLs');
    console.log('   ✅ Sort by Domain'); 
    console.log('   ✅ Copy Results to Clipboard');
    console.log('   ✅ All functionality working correctly');
  });

  test('Edge case: Copy button behavior with different operations', async ({ page }) => {
    const inputTextarea = page.locator('#input-textarea');
    const sortSelect = page.locator('#sort-select');
    const processButton = page.locator('#process-btn');
    const copyResultsButton = page.locator('#copy-results-btn');
    const clearOutputButton = page.locator('#clear-output-btn');
    
    console.log('🔍 Testing copy button with multiple operations...');
    
    // Test with sort by length
    await inputTextarea.fill('https://a.com\nhttps://verylongdomainname.com');
    await sortSelect.selectOption('sortByLength');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    // Should be enabled after sort by length
    await expect(copyResultsButton).not.toBeDisabled();
    console.log('✅ Copy button enabled after sort by length');
    
    // Clear output and verify button disables
    await clearOutputButton.click();
    await expect(copyResultsButton).toBeDisabled();
    console.log('✅ Copy button disabled after clearing output');
    
    // Test with sort by filename
    await inputTextarea.fill('https://example.com/zebra.html\nhttps://example.com/apple.html');
    await sortSelect.selectOption('sortByFilename');
    await processButton.click();
    
    await page.waitForFunction(() => {
      const output = document.querySelector('#output-textarea').value;
      return output.length > 0;
    });
    
    await expect(copyResultsButton).not.toBeDisabled();
    console.log('✅ Copy button enabled after sort by filename');
    
    console.log('🎉 All edge cases passed!');
  });
});