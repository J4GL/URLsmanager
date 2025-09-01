import { test, expect } from '@playwright/test';

test.describe('Copy Button - All Operations Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the application to initialize
    await page.waitForFunction(() => window.urlManagerInstance != null);
    
    // Wait for all components to be ready
    await page.waitForTimeout(500);
  });

  const testUrls = [
    'https://example.com/page?param=value&test=123',
    'https://test.org/path?utm_source=google',
    'https://sample.net/file?id=456',
    'https://duplicate.com',
    'https://duplicate.com', // Duplicate for testing
    'https://www.subdomain.example.com/deep/path/file.html'
  ];

  // Test all Clean & Modify operations
  const cleanModifyOperations = [
    { value: 'removeParams', name: 'Remove Parameters', expectedCount: 6 },
    { value: 'trimLastPath', name: 'Trim Last Path Segment', expectedCount: 6 },
    { value: 'extractTLD', name: 'Extract Domain Only', expectedCount: 4 }, // Unique domains
    { value: 'keepTLD', name: 'Keep URLs Without Subdomains', expectedCount: 5 } // Without subdomains
  ];

  cleanModifyOperations.forEach(operation => {
    test(`Copy button works with ${operation.name}`, async ({ page }) => {
      console.log(`Testing ${operation.name}...`);
      
      const inputTextarea = page.locator('#input-textarea');
      const cleanModifySelect = page.locator('#clean-modify-select');
      const processButton = page.locator('#process-btn');
      const outputTextarea = page.locator('#output-textarea');
      const copyButton = page.locator('#copy-results-btn');
      
      // Clear any existing content
      await inputTextarea.clear();
      await page.waitForTimeout(100);
      
      // Verify copy button starts disabled
      await expect(copyButton).toBeDisabled();
      console.log(`✓ Copy button starts disabled for ${operation.name}`);
      
      // Add test URLs
      await inputTextarea.fill(testUrls.join('\n'));
      console.log(`✓ Added ${testUrls.length} test URLs`);
      
      // Select operation
      await cleanModifySelect.selectOption(operation.value);
      console.log(`✓ Selected ${operation.name} operation`);
      
      // Wait for process button to become enabled
      await expect(processButton).toBeEnabled({ timeout: 5000 });
      console.log(`✓ Process button enabled for ${operation.name}`);
      
      // Click process button
      await processButton.click();
      console.log(`✓ Clicked process button for ${operation.name}`);
      
      // Wait for processing to complete
      await page.waitForFunction(() => {
        const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
        return output && output.value.length > 0;
      }, { timeout: 10000 });
      
      console.log(`✓ Processing completed for ${operation.name}`);
      
      // Verify output has content
      const outputValue = await outputTextarea.inputValue();
      expect(outputValue.length).toBeGreaterThan(0);
      console.log(`✓ Output has content for ${operation.name}: ${outputValue.length} characters`);
      
      // THE CRITICAL TEST: Verify copy button is enabled
      await expect(copyButton).toBeEnabled({ timeout: 3000 });
      console.log(`✅ Copy button ENABLED after ${operation.name}`);
      
      // Test the copy functionality
      await copyButton.click();
      await page.waitForTimeout(500);
      console.log(`✓ Copy button clicked successfully for ${operation.name}`);
      
      // Reset for next test
      await cleanModifySelect.selectOption('');
      await page.waitForTimeout(200);
    });
  });

  // Test all Deduplication operations
  const deduplicateOperations = [
    { value: 'deduplicateTLD', name: 'Deduplicate by TLD', expectedCount: 4 },
    { value: 'deduplicateDomain', name: 'Deduplicate by Domain', expectedCount: 5 },
    { value: 'deduplicateFull', name: 'Deduplicate by Full URL', expectedCount: 5 }
  ];

  deduplicateOperations.forEach(operation => {
    test(`Copy button works with ${operation.name}`, async ({ page }) => {
      console.log(`Testing ${operation.name}...`);
      
      const inputTextarea = page.locator('#input-textarea');
      const deduplicateSelect = page.locator('#deduplicate-select');
      const processButton = page.locator('#process-btn');
      const outputTextarea = page.locator('#output-textarea');
      const copyButton = page.locator('#copy-results-btn');
      
      // Clear any existing content
      await inputTextarea.clear();
      await page.waitForTimeout(100);
      
      // Verify copy button starts disabled
      await expect(copyButton).toBeDisabled();
      
      // Add test URLs with duplicates
      await inputTextarea.fill(testUrls.join('\n'));
      
      // Select deduplication operation
      await deduplicateSelect.selectOption(operation.value);
      
      // Wait for process button to become enabled
      await expect(processButton).toBeEnabled({ timeout: 5000 });
      
      // Process URLs
      await processButton.click();
      
      // Wait for processing to complete
      await page.waitForFunction(() => {
        const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
        return output && output.value.length > 0;
      }, { timeout: 10000 });
      
      // Verify output has content
      const outputValue = await outputTextarea.inputValue();
      expect(outputValue.length).toBeGreaterThan(0);
      
      // THE CRITICAL TEST: Verify copy button is enabled
      await expect(copyButton).toBeEnabled({ timeout: 3000 });
      console.log(`✅ Copy button ENABLED after ${operation.name}`);
      
      // Test copy functionality
      await copyButton.click();
      await page.waitForTimeout(500);
      
      // Reset for next test
      await deduplicateSelect.selectOption('');
      await page.waitForTimeout(200);
    });
  });

  // Test Filter operations
  const filterOperations = [
    { value: 'filterKeep', name: 'Keep URLs Containing', filterText: 'example', expectedGreaterThan: 0 },
    { value: 'filterRemove', name: 'Remove URLs Containing', filterText: 'test', expectedGreaterThan: 0 }
  ];

  filterOperations.forEach(operation => {
    test(`Copy button works with ${operation.name}`, async ({ page }) => {
      console.log(`Testing ${operation.name}...`);
      
      const inputTextarea = page.locator('#input-textarea');
      const filterSelect = page.locator('#filter-select');
      const filterInput = page.locator('#filter-input');
      const processButton = page.locator('#process-btn');
      const outputTextarea = page.locator('#output-textarea');
      const copyButton = page.locator('#copy-results-btn');
      
      // Clear any existing content
      await inputTextarea.clear();
      await page.waitForTimeout(100);
      
      // Verify copy button starts disabled
      await expect(copyButton).toBeDisabled();
      
      // Add test URLs
      await inputTextarea.fill(testUrls.join('\n'));
      
      // Select filter operation
      await filterSelect.selectOption(operation.value);
      
      // Wait for filter input to appear and enter filter text
      await expect(filterInput).toBeVisible();
      await filterInput.fill(operation.filterText);
      
      // Wait for process button to become enabled
      await expect(processButton).toBeEnabled({ timeout: 5000 });
      
      // Process URLs
      await processButton.click();
      
      // Wait for processing to complete
      await page.waitForFunction(() => {
        const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
        return output && output.value.length > 0;
      }, { timeout: 10000 });
      
      // Verify output has content
      const outputValue = await outputTextarea.inputValue();
      expect(outputValue.length).toBeGreaterThan(0);
      
      // THE CRITICAL TEST: Verify copy button is enabled
      await expect(copyButton).toBeEnabled({ timeout: 3000 });
      console.log(`✅ Copy button ENABLED after ${operation.name}`);
      
      // Test copy functionality
      await copyButton.click();
      await page.waitForTimeout(500);
      
      // Reset for next test
      await filterSelect.selectOption('');
      await page.waitForTimeout(200);
    });
  });

  // Test Sort operations
  const sortOperations = [
    { value: 'sortByDomain', name: 'Sort by Domain' },
    { value: 'sortByLength', name: 'Sort by Length' },
    { value: 'sortByFilename', name: 'Sort by Filename' }
  ];

  sortOperations.forEach(operation => {
    test(`Copy button works with ${operation.name}`, async ({ page }) => {
      console.log(`Testing ${operation.name}...`);
      
      const inputTextarea = page.locator('#input-textarea');
      const sortSelect = page.locator('#sort-select');
      const processButton = page.locator('#process-btn');
      const outputTextarea = page.locator('#output-textarea');
      const copyButton = page.locator('#copy-results-btn');
      
      // Clear any existing content
      await inputTextarea.clear();
      await page.waitForTimeout(100);
      
      // Verify copy button starts disabled
      await expect(copyButton).toBeDisabled();
      
      // Add test URLs
      await inputTextarea.fill(testUrls.join('\n'));
      
      // Select sort operation
      await sortSelect.selectOption(operation.value);
      
      // Wait for process button to become enabled
      await expect(processButton).toBeEnabled({ timeout: 5000 });
      
      // Process URLs
      await processButton.click();
      
      // Wait for processing to complete
      await page.waitForFunction(() => {
        const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
        return output && output.value.length > 0;
      }, { timeout: 10000 });
      
      // Verify output has content
      const outputValue = await outputTextarea.inputValue();
      expect(outputValue.length).toBeGreaterThan(0);
      
      // THE CRITICAL TEST: Verify copy button is enabled
      await expect(copyButton).toBeEnabled({ timeout: 3000 });
      console.log(`✅ Copy button ENABLED after ${operation.name}`);
      
      // Test copy functionality
      await copyButton.click();
      await page.waitForTimeout(500);
      
      // Reset for next test
      await sortSelect.selectOption('');
      await page.waitForTimeout(200);
    });
  });

  // Comprehensive test with all operation types in sequence
  test('Copy button works with mixed operations in sequence', async ({ page }) => {
    console.log('Testing mixed operations sequence...');
    
    const inputTextarea = page.locator('#input-textarea');
    const copyButton = page.locator('#copy-results-btn');
    
    // Test sequence: Remove Params -> Sort by Domain -> Deduplicate
    const operations = [
      { select: '#clean-modify-select', value: 'removeParams', name: 'Remove Parameters' },
      { select: '#sort-select', value: 'sortByDomain', name: 'Sort by Domain' },
      { select: '#deduplicate-select', value: 'deduplicateFull', name: 'Deduplicate Full' }
    ];
    
    for (const op of operations) {
      console.log(`Testing ${op.name} in sequence...`);
      
      // Add fresh URLs for each operation
      await inputTextarea.clear();
      await inputTextarea.fill(testUrls.join('\n'));
      
      // Select operation
      await page.locator(op.select).selectOption(op.value);
      
      // Process
      await page.locator('#process-btn').click();
      
      // Wait for completion
      await page.waitForFunction(() => {
        const output = document.querySelector('#output-textarea') as HTMLTextAreaElement;
        return output && output.value.length > 0;
      }, { timeout: 10000 });
      
      // Verify copy button enabled
      await expect(copyButton).toBeEnabled({ timeout: 3000 });
      console.log(`✅ Copy button ENABLED after ${op.name} in sequence`);
      
      // Reset operation selection
      await page.locator(op.select).selectOption('');
      await page.waitForTimeout(200);
    }
  });
});