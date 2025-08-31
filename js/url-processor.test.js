/**
 * Basic tests for URLProcessor functionality
 * Tests the core methods and error handling
 */

// Simple test runner for browser environment
function runTests() {
    console.log('Running URLProcessor tests...');
    
    const processor = new URLProcessor();
    let testsPassed = 0;
    let testsTotal = 0;

    function test(name, testFn) {
        testsTotal++;
        try {
            testFn();
            console.log(`✓ ${name}`);
            testsPassed++;
        } catch (error) {
            console.error(`✗ ${name}: ${error.message}`);
        }
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    function assertArrayEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    }

    // Test removeParameters functionality
    test('removeParameters - basic functionality', () => {
        const urls = [
            'https://example.com/path?param=value',
            'http://test.org/file.html?v=1&v2=3',
            'example.com/page?query=test'
        ];
        
        const result = processor.process(urls, 'removeParameters');
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.inputCount, 3, 'Input count should be 3');
        assertEqual(result.outputCount, 3, 'Output count should be 3');
        assertEqual(result.results[0], 'https://example.com/path', 'First URL should have parameters removed');
    });

    test('removeParameters - handles invalid URLs', () => {
        const urls = ['valid-url.com', '', 'invalid-url', null];
        
        const result = processor.process(urls, 'removeParameters');
        
        assertEqual(result.success, true, 'Process should succeed even with invalid URLs');
        assertEqual(result.invalidCount > 0, true, 'Should track invalid URLs');
    });

    // Test deduplication functionality
    test('deduplicate - full URL deduplication', () => {
        const urls = [
            'https://example.com',
            'https://example.com',
            'https://different.com',
            'https://example.com'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'full' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 2, 'Should have 2 unique URLs');
        assertArrayEqual(result.results, ['https://example.com', 'https://different.com'], 'Should preserve first occurrence');
    });

    test('deduplicate - full URL case insensitive', () => {
        const urls = [
            'https://Example.com',
            'https://EXAMPLE.COM',
            'https://example.com',
            'https://different.org'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'full' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 2, 'Should have 2 unique URLs (case insensitive)');
        assertEqual(result.results[0], 'https://Example.com', 'Should preserve first occurrence with original case');
    });

    test('deduplicate - TLD deduplication', () => {
        const urls = [
            'https://example.com',
            'https://different.com',
            'https://another.org',
            'https://test.com'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'tld' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 2, 'Should have 2 unique TLDs');
        assertArrayEqual(result.results, ['https://example.com', 'https://another.org'], 'Should keep first .com and first .org');
    });

    test('deduplicate - TLD with various formats', () => {
        const urls = [
            'example.com',
            'https://test.com',
            'http://another.org',
            'different.net',
            'final.com'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'tld' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 3, 'Should have 3 unique TLDs (.com, .org, .net)');
    });

    test('deduplicate - domain and subdomain deduplication', () => {
        const urls = [
            'https://example.com',
            'https://example.com/path',
            'https://www.example.com',
            'https://api.example.com',
            'https://different.org',
            'https://www.different.org'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'domain' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 5, 'Should have 5 unique domains');
        // Should keep: example.com, www.example.com, api.example.com, different.org, www.different.org
        assertEqual(result.results.includes('https://example.com'), true, 'Should include example.com');
        assertEqual(result.results.includes('https://www.example.com'), true, 'Should include www.example.com');
        assertEqual(result.results.includes('https://api.example.com'), true, 'Should include api.example.com');
        assertEqual(result.results.includes('https://different.org'), true, 'Should include different.org');
        assertEqual(result.results.includes('https://www.different.org'), true, 'Should include www.different.org');
    });

    test('deduplicate - domain preserves first occurrence and order', () => {
        const urls = [
            'https://first.example.com',
            'https://second.example.com',
            'https://first.example.com/different-path',
            'https://third.example.com'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'domain' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 3, 'Should have 3 unique domains');
        assertEqual(result.results[0], 'https://first.example.com', 'Should preserve first occurrence');
        assertEqual(result.results[1], 'https://second.example.com', 'Should maintain order');
        assertEqual(result.results[2], 'https://third.example.com', 'Should maintain order');
    });

    test('deduplicate - handles invalid URLs', () => {
        const urls = [
            'https://valid.com',
            'not-a-url',
            'https://another.org',
            '',
            'https://valid.com'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'full' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 2, 'Should have 2 valid unique URLs');
        assertEqual(result.invalidCount, 2, 'Should track 2 invalid URLs');
        assertArrayEqual(result.results, ['https://valid.com', 'https://another.org'], 'Should keep valid unique URLs');
    });

    test('deduplicate - empty input', () => {
        const urls = [];
        
        const result = processor.process(urls, 'deduplicate', { type: 'full' });
        
        assertEqual(result.success, true, 'Process should succeed with empty input');
        assertEqual(result.outputCount, 0, 'Should have 0 URLs');
        assertEqual(result.results.length, 0, 'Results should be empty');
    });

    test('deduplicate - mixed protocols same domain', () => {
        const urls = [
            'http://example.com',
            'https://example.com',
            'ftp://example.com'
        ];
        
        const result = processor.process(urls, 'deduplicate', { type: 'domain' });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 1, 'Should have 1 unique domain (protocols ignored)');
        assertEqual(result.results[0], 'http://example.com', 'Should preserve first occurrence');
    });

    // Test filtering functionality
    test('filter - include URLs containing string', () => {
        const urls = [
            'https://example.com',
            'https://test.example.com',
            'https://different.org'
        ];
        
        const result = processor.process(urls, 'filter', { 
            type: 'include', 
            filterString: 'example' 
        });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 2, 'Should have 2 URLs containing "example"');
    });

    test('filter - exclude URLs containing string', () => {
        const urls = [
            'https://example.com',
            'https://test.example.com',
            'https://different.org'
        ];
        
        const result = processor.process(urls, 'filter', { 
            type: 'exclude', 
            filterString: 'example' 
        });
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 1, 'Should have 1 URL not containing "example"');
        assertEqual(result.results[0], 'https://different.org', 'Should keep the different.org URL');
    });

    test('filter - requires filter string', () => {
        const urls = ['https://example.com'];
        
        const result = processor.process(urls, 'filter', { type: 'include' });
        
        assertEqual(result.success, false, 'Process should fail without filter string');
        assertEqual(result.errors.length > 0, true, 'Should have error message');
    });

    // Test keepTLDOnly functionality
    test('keepTLDOnly - removes subdomains', () => {
        const urls = [
            'https://example.com',
            'https://www.example.com',
            'https://api.example.com',
            'https://different.org'
        ];
        
        const result = processor.process(urls, 'keepTLDOnly');
        
        assertEqual(result.success, true, 'Process should succeed');
        assertEqual(result.outputCount, 2, 'Should have 2 URLs without subdomains');
    });

    // Test error handling
    test('process - handles invalid operation', () => {
        const urls = ['https://example.com'];
        
        const result = processor.process(urls, 'invalidOperation');
        
        assertEqual(result.success, false, 'Process should fail with invalid operation');
        assertEqual(result.errors.length > 0, true, 'Should have error message');
    });

    test('process - handles invalid input', () => {
        const result = processor.process('not-an-array', 'removeParameters');
        
        assertEqual(result.success, false, 'Process should fail with invalid input');
        assertEqual(result.errors.length > 0, true, 'Should have error message');
    });

    // Test processing result structure
    test('createProcessingResult - creates proper structure', () => {
        const result = processor.createProcessingResult(true, ['url1', 'url2'], []);
        
        assertEqual(typeof result.success, 'boolean', 'Should have success boolean');
        assertEqual(typeof result.inputCount, 'number', 'Should have inputCount number');
        assertEqual(typeof result.outputCount, 'number', 'Should have outputCount number');
        assertEqual(typeof result.removedCount, 'number', 'Should have removedCount number');
        assertEqual(typeof result.invalidCount, 'number', 'Should have invalidCount number');
        assertEqual(Array.isArray(result.results), true, 'Should have results array');
        assertEqual(Array.isArray(result.errors), true, 'Should have errors array');
        assertEqual(typeof result.processingTime, 'number', 'Should have processingTime number');
    });

    // Test URL validation
    test('validateURLs - separates valid and invalid URLs', () => {
        const urls = [
            'https://example.com',
            '://invalid',
            'https://test.org',
            ''
        ];
        
        const result = processor.validateURLs(urls);
        
        assertEqual(result.validCount, 2, 'Should have 2 valid URLs');
        assertEqual(result.invalidCount, 2, 'Should have 2 invalid URLs');
        assertEqual(Array.isArray(result.valid), true, 'Should have valid array');
        assertEqual(Array.isArray(result.invalid), true, 'Should have invalid array');
    });

    console.log(`\nTest Results: ${testsPassed}/${testsTotal} tests passed`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('❌ Some tests failed');
    }
    
    return testsPassed === testsTotal;
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runTests);
    } else {
        runTests();
    }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}