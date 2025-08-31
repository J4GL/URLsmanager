/**
 * Unit tests for URLParser class
 * Tests URL parsing, validation, and edge cases
 */

// Simple test framework for browser environment
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Expected true, got false. ${message}`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`Expected false, got true. ${message}`);
        }
    }

    assertNull(value, message = '') {
        if (value !== null) {
            throw new Error(`Expected null, got ${JSON.stringify(value)}. ${message}`);
        }
    }

    run() {
        console.log('Running URLParser tests...\n');
        
        this.tests.forEach(({ name, fn }) => {
            try {
                fn.call(this);
                console.log(`✓ ${name}`);
                this.passed++;
            } catch (error) {
                console.error(`✗ ${name}: ${error.message}`);
                this.failed++;
            }
        });

        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// Test suite
const runner = new TestRunner();

// Basic URL parsing tests
runner.test('Parse basic HTTP URL', function() {
    const result = URLParser.parse('https://example.com');
    this.assertTrue(result.valid);
    this.assertEqual(result.protocol, 'https');
    this.assertEqual(result.hostname, 'example.com');
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.tld, 'com');
    this.assertEqual(result.subdomain, '');
});

runner.test('Parse URL with subdomain', function() {
    const result = URLParser.parse('https://www.example.com');
    this.assertTrue(result.valid);
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.subdomain, 'www');
    this.assertEqual(result.tld, 'com');
});

runner.test('Parse URL with multiple subdomains', function() {
    const result = URLParser.parse('https://api.v2.example.com');
    this.assertTrue(result.valid);
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.subdomain, 'api.v2');
    this.assertEqual(result.tld, 'com');
});

runner.test('Parse URL with path and parameters', function() {
    const result = URLParser.parse('https://example.com/path/to/resource?param1=value1&param2=value2');
    this.assertTrue(result.valid);
    this.assertEqual(result.path, '/path/to/resource');
    this.assertEqual(result.parameters.param1, 'value1');
    this.assertEqual(result.parameters.param2, 'value2');
});

runner.test('Parse URL with fragment', function() {
    const result = URLParser.parse('https://example.com/page#section');
    this.assertTrue(result.valid);
    this.assertEqual(result.fragment, 'section');
});

runner.test('Parse URL with port', function() {
    const result = URLParser.parse('https://example.com:8080/path');
    this.assertTrue(result.valid);
    this.assertEqual(result.port, '8080');
});

// URL without protocol tests
runner.test('Parse URL without protocol', function() {
    const result = URLParser.parse('example.com');
    this.assertTrue(result.valid);
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.tld, 'com');
});

runner.test('Parse URL without protocol with path', function() {
    const result = URLParser.parse('example.com/path?param=value');
    this.assertTrue(result.valid);
    this.assertEqual(result.path, '/path');
    this.assertEqual(result.parameters.param, 'value');
});

// Second-level TLD tests
runner.test('Parse UK domain (co.uk)', function() {
    const result = URLParser.parse('https://example.co.uk');
    this.assertTrue(result.valid);
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.tld, 'uk');
});

runner.test('Parse UK domain with subdomain (co.uk)', function() {
    const result = URLParser.parse('https://www.example.co.uk');
    this.assertTrue(result.valid);
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.subdomain, 'www');
    this.assertEqual(result.tld, 'uk');
});

runner.test('Parse Australian domain (com.au)', function() {
    const result = URLParser.parse('https://example.com.au');
    this.assertTrue(result.valid);
    this.assertEqual(result.domain, 'example');
    this.assertEqual(result.tld, 'au');
});

// Validation tests
runner.test('Validate valid URLs', function() {
    this.assertTrue(URLParser.isValid('https://example.com'));
    this.assertTrue(URLParser.isValid('http://subdomain.example.org'));
    this.assertTrue(URLParser.isValid('ftp://files.example.net'));
    this.assertTrue(URLParser.isValid('example.com'));
});

runner.test('Validate invalid URLs', function() {
    this.assertFalse(URLParser.isValid(''));
    this.assertFalse(URLParser.isValid(null));
    this.assertFalse(URLParser.isValid(undefined));
    this.assertFalse(URLParser.isValid('not-a-url'));
    this.assertFalse(URLParser.isValid('://invalid'));
});

// Domain extraction tests
runner.test('Extract domain from various URLs', function() {
    this.assertEqual(URLParser.getDomain('https://example.com'), 'example');
    this.assertEqual(URLParser.getDomain('https://www.example.com'), 'example');
    this.assertEqual(URLParser.getDomain('https://api.v2.example.com'), 'example');
    this.assertEqual(URLParser.getDomain('example.co.uk'), 'example');
});

runner.test('Extract TLD from various URLs', function() {
    this.assertEqual(URLParser.getTLD('https://example.com'), 'com');
    this.assertEqual(URLParser.getTLD('https://example.org'), 'org');
    this.assertEqual(URLParser.getTLD('https://example.co.uk'), 'uk');
    this.assertEqual(URLParser.getTLD('https://example.com.au'), 'au');
});

// Subdomain detection tests
runner.test('Detect subdomains correctly', function() {
    this.assertFalse(URLParser.hasSubdomain('https://example.com'));
    this.assertTrue(URLParser.hasSubdomain('https://www.example.com'));
    this.assertTrue(URLParser.hasSubdomain('https://api.example.com'));
    this.assertTrue(URLParser.hasSubdomain('https://api.v2.example.com'));
});

// Parameter removal tests
runner.test('Remove parameters from URLs', function() {
    this.assertEqual(
        URLParser.removeParameters('https://example.com/path?param1=value1&param2=value2'),
        'https://example.com/path'
    );
    this.assertEqual(
        URLParser.removeParameters('example.com/file.ext?v=1&v2=3'),
        'example.com/file.ext'
    );
    this.assertEqual(
        URLParser.removeParameters('https://example.com/path'),
        'https://example.com/path'
    );
});

runner.test('Remove parameters preserves fragments', function() {
    const result = URLParser.removeParameters('https://example.com/path?param=value#section');
    this.assertEqual(result, 'https://example.com/path#section');
});

// Edge cases and error handling
runner.test('Handle malformed URLs gracefully', function() {
    const result = URLParser.parse('ht!tp://invalid-url');
    this.assertFalse(result.valid);
});

runner.test('Handle URLs with special characters', function() {
    const result = URLParser.parse('https://example.com/path?param=hello%20world');
    this.assertTrue(result.valid);
    this.assertEqual(result.parameters.param, 'hello world');
});

runner.test('Handle URLs with empty parameters', function() {
    const result = URLParser.parse('https://example.com/path?param1=&param2=value');
    this.assertTrue(result.valid);
    this.assertEqual(result.parameters.param1, '');
    this.assertEqual(result.parameters.param2, 'value');
});

runner.test('Handle URLs with no parameters', function() {
    const result = URLParser.parse('https://example.com/path');
    this.assertTrue(result.valid);
    this.assertEqual(Object.keys(result.parameters).length, 0);
});

runner.test('Handle relative URLs', function() {
    const result = URLParser.parse('/relative/path');
    // Relative paths should be handled gracefully
    this.assertTrue(result !== null);
});

runner.test('Handle IP addresses', function() {
    const result = URLParser.parse('https://192.168.1.1:8080');
    this.assertTrue(result.valid);
    this.assertEqual(result.hostname, '192.168.1.1');
    this.assertEqual(result.port, '8080');
});

runner.test('Handle localhost', function() {
    const result = URLParser.parse('http://localhost:3000');
    this.assertTrue(result.valid);
    this.assertEqual(result.hostname, 'localhost');
    this.assertEqual(result.port, '3000');
});

// Comparison key tests for deduplication
runner.test('Get comparison keys for deduplication', function() {
    const url = 'https://www.example.com/path';
    
    this.assertEqual(URLParser.getComparisonKey(url, 'tld'), 'com');
    this.assertEqual(URLParser.getComparisonKey(url, 'domain'), 'www.example.com');
    this.assertEqual(URLParser.getComparisonKey(url, 'full'), url.toLowerCase());
});

runner.test('Get full domain', function() {
    this.assertEqual(URLParser.getFullDomain('https://www.example.com'), 'www.example.com');
    this.assertEqual(URLParser.getFullDomain('https://api.v2.example.com'), 'api.v2.example.com');
    this.assertEqual(URLParser.getFullDomain('https://example.com'), 'example.com');
});

// Whitespace and normalization tests
runner.test('Handle URLs with whitespace', function() {
    const result = URLParser.parse('  https://example.com/path  ');
    this.assertTrue(result.valid);
    this.assertEqual(result.hostname, 'example.com');
});

runner.test('Handle URLs with internal whitespace', function() {
    const result = URLParser.parse('https://example .com');
    // Should handle or reject URLs with internal whitespace
    this.assertTrue(result !== null);
});

// Protocol variations
runner.test('Handle different protocols', function() {
    this.assertTrue(URLParser.isValid('ftp://files.example.com'));
    this.assertTrue(URLParser.isValid('ftps://secure.example.com'));
    this.assertTrue(URLParser.isValid('file:///local/path'));
});

// Run all tests
if (typeof window !== 'undefined') {
    // Browser environment
    window.runURLParserTests = () => runner.run();
} else if (typeof module !== 'undefined') {
    // Node.js environment
    module.exports = { runner };
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    const URLParser = require('./url-parser.js');
    // Make URLParser available globally for tests
    global.URLParser = URLParser;
    runner.run();
}