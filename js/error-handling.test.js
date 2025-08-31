/**
 * Error Handling and Validation Test Suite
 * Tests the comprehensive error handling and validation system
 */

class ErrorHandlingTestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
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

    assertContains(array, item, message = '') {
        if (!array.includes(item)) {
            throw new Error(`Expected array to contain ${item}. ${message}`);
        }
    }

    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async run() {
        console.log('Running Error Handling Tests...\n');
        
        for (const { name, testFunction } of this.tests) {
            try {
                await testFunction();
                console.log(`✓ ${name}`);
                this.passed++;
            } catch (error) {
                console.error(`✗ ${name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
        return { passed: this.passed, failed: this.failed };
    }
}

// Initialize test runner
const runner = new ErrorHandlingTestRunner();

// Test ErrorHandler class
runner.test('ErrorHandler - Initialize with default values', () => {
    const errorHandler = new ErrorHandler();
    runner.assertTrue(errorHandler.errorLog instanceof Array);
    runner.assertTrue(typeof errorHandler.errorCodes === 'object');
    runner.assertTrue(typeof errorHandler.browserCapabilities === 'object');
});

runner.test('ErrorHandler - Detect browser capabilities', () => {
    const errorHandler = new ErrorHandler();
    const capabilities = errorHandler.browserCapabilities;
    
    runner.assertTrue(typeof capabilities.webWorkers === 'boolean');
    runner.assertTrue(typeof capabilities.clipboard === 'boolean');
    runner.assertTrue(typeof capabilities.modernJS === 'boolean');
});

runner.test('ErrorHandler - Handle basic error', () => {
    const errorHandler = new ErrorHandler();
    const error = new Error('Test error');
    const result = errorHandler.handle(error, 'test_context');
    
    runner.assertTrue(typeof result.id === 'string');
    runner.assertEqual(result.context, 'test_context');
    runner.assertTrue(result.userMessage.length > 0);
    runner.assertTrue(result.timestamp.length > 0);
});

runner.test('ErrorHandler - Determine error codes correctly', () => {
    const errorHandler = new ErrorHandler();
    
    const clipboardError = errorHandler.handle(new Error('Clipboard permission denied'), 'clipboard');
    runner.assertEqual(clipboardError.errorCode, 'CLIPBOARD_PERMISSION_DENIED');
    
    const workerError = errorHandler.handle(new Error('Worker failed'), 'web_worker');
    runner.assertEqual(workerError.errorCode, 'WORKER_ERROR');
    
    const timeoutError = errorHandler.handle(new Error('Processing timed out'), 'processing');
    runner.assertEqual(timeoutError.errorCode, 'PROCESSING_TIMEOUT');
});

runner.test('ErrorHandler - Generate user-friendly messages', () => {
    const errorHandler = new ErrorHandler();
    
    const error = errorHandler.handle(new Error('Clipboard access denied'), 'clipboard');
    runner.assertTrue(error.userMessage.includes('clipboard'));
    runner.assertFalse(error.userMessage.includes('undefined'));
});

runner.test('ErrorHandler - Attempt error recovery', () => {
    const errorHandler = new ErrorHandler();
    
    const workerError = errorHandler.handle(new Error('Worker not supported'), 'web_worker');
    runner.assertTrue(workerError.recovery.attempted);
    runner.assertEqual(workerError.recovery.fallback, 'main_thread');
});

runner.test('ErrorHandler - Browser compatibility report', () => {
    const errorHandler = new ErrorHandler();
    const report = errorHandler.getBrowserCompatibilityReport();
    
    runner.assertTrue(typeof report.compatible === 'boolean');
    runner.assertTrue(Array.isArray(report.issues));
    runner.assertTrue(Array.isArray(report.warnings));
    runner.assertTrue(typeof report.capabilities === 'object');
});

// Test InputValidator class
runner.test('InputValidator - Initialize with default values', () => {
    const validator = new InputValidator();
    runner.assertTrue(typeof validator.validationRules === 'object');
    runner.assertTrue(validator.errorHandler instanceof ErrorHandler);
});

runner.test('InputValidator - Validate valid URLs', () => {
    const validator = new InputValidator();
    const urls = 'https://example.com\nhttp://test.org\nftp://files.example.net';
    const result = validator.validateURLs(urls);
    
    runner.assertTrue(result.isValid);
    runner.assertEqual(result.stats.valid, 3);
    runner.assertEqual(result.stats.invalid, 0);
    runner.assertEqual(result.sanitized.length, 3);
});

runner.test('InputValidator - Handle invalid URLs', () => {
    const validator = new InputValidator();
    const urls = 'https://example.com\ninvalid-url\n\nhttp://test.org';
    const result = validator.validateURLs(urls);
    
    runner.assertTrue(result.isValid); // Should be valid because we have some valid URLs
    runner.assertEqual(result.stats.valid, 2);
    runner.assertEqual(result.stats.invalid, 1);
    runner.assertTrue(result.warnings.length > 0);
});

runner.test('InputValidator - Reject empty URL input', () => {
    const validator = new InputValidator();
    const result = validator.validateURLs('');
    
    runner.assertFalse(result.isValid);
    runner.assertTrue(result.errors.length > 0);
    runner.assertEqual(result.stats.total, 0);
});

runner.test('InputValidator - Validate filter strings', () => {
    const validator = new InputValidator();
    
    // Valid filter string
    const validResult = validator.validateFilterString('example', { required: true });
    runner.assertTrue(validResult.isValid);
    runner.assertEqual(validResult.sanitized, 'example');
    
    // Empty required filter string
    const emptyResult = validator.validateFilterString('', { required: true });
    runner.assertFalse(emptyResult.isValid);
    runner.assertTrue(emptyResult.errors.length > 0);
    
    // Optional empty filter string
    const optionalResult = validator.validateFilterString('', { required: false });
    runner.assertTrue(optionalResult.isValid);
});

runner.test('InputValidator - Validate operations', () => {
    const validator = new InputValidator();
    
    // Valid operation
    const validResult = validator.validateOperation('removeParams');
    runner.assertTrue(validResult.isValid);
    runner.assertFalse(validResult.requiresFilter);
    
    // Filter operation
    const filterResult = validator.validateOperation('filterRemove');
    runner.assertTrue(filterResult.isValid);
    runner.assertTrue(filterResult.requiresFilter);
    
    // Invalid operation
    const invalidResult = validator.validateOperation('invalidOperation');
    runner.assertFalse(invalidResult.isValid);
    runner.assertTrue(invalidResult.errors.length > 0);
    
    // Empty operation
    const emptyResult = validator.validateOperation('');
    runner.assertFalse(emptyResult.isValid);
});

runner.test('InputValidator - Validate complete form', () => {
    const validator = new InputValidator();
    
    // Valid form data
    const validForm = {
        urls: 'https://example.com\nhttp://test.org',
        operation: 'removeParams',
        filterString: '',
        processAll: false
    };
    const validResult = validator.validateForm(validForm);
    runner.assertTrue(validResult.isValid);
    
    // Invalid form data (missing filter for filter operation)
    const invalidForm = {
        urls: 'https://example.com',
        operation: 'filterRemove',
        filterString: '',
        processAll: false
    };
    const invalidResult = validator.validateForm(invalidForm);
    runner.assertFalse(invalidResult.isValid);
});

runner.test('InputValidator - Handle URL format validation', () => {
    const validator = new InputValidator();
    
    const testCases = [
        { url: 'https://example.com', expected: true },
        { url: 'http://test.org/path', expected: true },
        { url: 'ftp://files.example.net', expected: true },
        { url: 'example.com', expected: true },
        { url: 'www.example.com', expected: true },
        { url: 'invalid url with spaces', expected: false },
        { url: 'not-a-url', expected: false },
        { url: '', expected: false }
    ];
    
    for (const testCase of testCases) {
        const isValid = validator.isValidURL(testCase.url);
        runner.assertEqual(isValid, testCase.expected, `URL: ${testCase.url}`);
    }
});

runner.test('InputValidator - Generate validation summaries', () => {
    const validator = new InputValidator();
    
    const validationResult = {
        isValid: false,
        errors: [
            { code: 'TEST_ERROR', message: 'Test error message', severity: 'error' }
        ],
        warnings: [
            { code: 'TEST_WARNING', message: 'Test warning message', severity: 'warning' }
        ]
    };
    
    const summary = validator.getValidationSummary(validationResult);
    runner.assertFalse(summary.isValid);
    runner.assertEqual(summary.errorCount, 1);
    runner.assertEqual(summary.warningCount, 1);
    runner.assertTrue(summary.messages.length > 0);
});

runner.test('ErrorHandler - Error statistics tracking', () => {
    const errorHandler = new ErrorHandler();
    
    // Generate some test errors
    errorHandler.handle(new Error('Test error 1'), 'test_context');
    errorHandler.handle(new Error('Test error 2'), 'test_context');
    errorHandler.handle(new Error('Critical error'), 'component_initialization');
    
    const stats = errorHandler.getErrorStatistics();
    runner.assertTrue(stats.total >= 3);
    runner.assertTrue(stats.byContext['test_context'] >= 2);
    runner.assertTrue(Array.isArray(stats.recent));
});

runner.test('ErrorHandler - Error log management', () => {
    const errorHandler = new ErrorHandler();
    
    // Add some errors
    errorHandler.handle(new Error('Test error 1'), 'test');
    errorHandler.handle(new Error('Test error 2'), 'test');
    
    const initialCount = errorHandler.errorLog.length;
    runner.assertTrue(initialCount >= 2);
    
    // Clear log
    errorHandler.clearErrorLog();
    runner.assertEqual(errorHandler.errorLog.length, 0);
});

runner.test('ErrorHandler - Export error log', () => {
    const errorHandler = new ErrorHandler();
    
    errorHandler.handle(new Error('Test error'), 'test');
    const exported = errorHandler.exportErrorLog();
    
    runner.assertTrue(typeof exported === 'string');
    runner.assertTrue(exported.includes('timestamp'));
    runner.assertTrue(exported.includes('browserCapabilities'));
    runner.assertTrue(exported.includes('errors'));
});

runner.test('InputValidator - Large dataset warnings', () => {
    const validator = new InputValidator();
    
    // Create a large URL list
    const largeUrlList = Array(60000).fill('https://example.com').join('\n');
    const result = validator.validateURLs(largeUrlList);
    
    runner.assertTrue(result.isValid);
    runner.assertTrue(result.warnings.some(w => w.code === 'LARGE_DATASET'));
});

runner.test('InputValidator - URL length validation', () => {
    const validator = new InputValidator();
    
    // Create a very long URL
    const longUrl = 'https://example.com/' + 'a'.repeat(3000);
    const result = validator.validateURLs(longUrl);
    
    runner.assertTrue(result.isValid);
    runner.assertTrue(result.warnings.some(w => w.message.includes('invalid')));
});

runner.test('ErrorHandler - Severity classification', () => {
    const errorHandler = new ErrorHandler();
    
    const criticalError = errorHandler.handle(new Error('Component failed'), 'component_initialization');
    runner.assertEqual(criticalError.severity, 'critical');
    
    const warningError = errorHandler.handle(new Error('Worker not supported'), 'web_worker');
    runner.assertEqual(warningError.severity, 'warning');
    
    const normalError = errorHandler.handle(new Error('Processing failed'), 'url_processing');
    runner.assertEqual(normalError.severity, 'error');
});

// Run all tests when this file is loaded
if (typeof window !== 'undefined') {
    // Browser environment
    window.runErrorHandlingTests = () => runner.run();
    
    // Auto-run tests if this is the main page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => runner.run());
    } else {
        runner.run();
    }
} else if (typeof module !== 'undefined') {
    // Node.js environment
    module.exports = { runner };
}

// Auto-run tests if in Node.js and this file is executed directly
if (typeof window === 'undefined' && typeof require !== 'undefined' && require.main === module) {
    // Load dependencies for Node.js testing
    const ErrorHandler = require('./error-handler.js');
    const InputValidator = require('./input-validator.js');
    
    // Make classes available globally for tests
    global.ErrorHandler = ErrorHandler;
    global.InputValidator = InputValidator;
    
    runner.run();
}