/**
 * ErrorHandler - Comprehensive error handling and validation system
 * Provides centralized error management, user-friendly messages, and graceful fallbacks
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.errorCodes = this.initializeErrorCodes();
        this.browserCapabilities = this.detectBrowserCapabilities();
    }

    /**
     * Initialize error codes and their user-friendly messages
     * @returns {Object} Error codes mapping
     * @private
     */
    initializeErrorCodes() {
        return {
            // Input validation errors
            'EMPTY_INPUT': 'Please enter some URLs to process',
            'INVALID_URL_FORMAT': 'Some URLs have invalid format and will be skipped',
            'FILTER_STRING_REQUIRED': 'Filter string is required for this operation',
            'FILTER_STRING_EMPTY': 'Filter string cannot be empty',
            'OPERATION_NOT_SELECTED': 'Please select an operation to perform',
            
            // Processing errors
            'PROCESSING_TIMEOUT': 'Processing took too long and was cancelled. Try processing fewer URLs at once',
            'PROCESSING_CANCELLED': 'Processing was cancelled by user',
            'PROCESSING_FAILED': 'Processing failed due to an unexpected error',
            'MEMORY_ERROR': 'Not enough memory to process this many URLs. Try processing in smaller batches',
            'WORKER_ERROR': 'Background processing failed. Falling back to main thread processing',
            
            // Browser compatibility errors
            'CLIPBOARD_NOT_SUPPORTED': 'Clipboard operations are not supported in this browser',
            'CLIPBOARD_PERMISSION_DENIED': 'Clipboard access was denied. Please allow clipboard permissions',
            'WORKER_NOT_SUPPORTED': 'Web Workers are not supported in this browser. Processing may be slower',
            'MODERN_JS_NOT_SUPPORTED': 'This browser does not support modern JavaScript features required by the application',
            
            // Network and file errors
            'WORKER_LOAD_FAILED': 'Failed to load background processing worker',
            'SCRIPT_LOAD_FAILED': 'Failed to load required application scripts',
            
            // Generic errors
            'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again',
            'COMPONENT_INITIALIZATION_FAILED': 'Failed to initialize application components',
            'INVALID_CONFIGURATION': 'Invalid application configuration detected'
        };
    }

    /**
     * Detect browser capabilities for graceful fallbacks
     * @returns {Object} Browser capabilities
     * @private
     */
    detectBrowserCapabilities() {
        return {
            webWorkers: typeof Worker !== 'undefined',
            clipboard: navigator.clipboard && typeof navigator.clipboard.writeText === 'function',
            clipboardRead: navigator.clipboard && typeof navigator.clipboard.readText === 'function',
            modernJS: this.checkModernJSSupport(),
            localStorage: this.checkLocalStorageSupport(),
            performance: typeof performance !== 'undefined' && typeof performance.now === 'function'
        };
    }

    /**
     * Check if browser supports modern JavaScript features
     * @returns {boolean} True if modern JS is supported
     * @private
     */
    checkModernJSSupport() {
        try {
            // Test for ES6+ features without eval
            // Check for arrow functions, classes, destructuring, const/let
            const testArrow = () => true;
            class TestClass {}
            const {testProp = true} = {testProp: true};
            let testLet = true;
            const testConst = true;
            
            // Check for other modern features
            const testPromise = typeof Promise !== 'undefined';
            const testMap = typeof Map !== 'undefined';
            const testSet = typeof Set !== 'undefined';
            const testSymbol = typeof Symbol !== 'undefined';
            
            return testArrow() && TestClass && testProp && testLet && testConst && 
                   testPromise && testMap && testSet && testSymbol;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is supported
     * @private
     */
    checkLocalStorageSupport() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Main error handling method
     * @param {Error|string} error - Error object or message
     * @param {string} context - Error context for categorization
     * @param {Object} additionalInfo - Additional error information
     * @returns {Object} Processed error information
     */
    handle(error, context = 'unknown', additionalInfo = {}) {
        const errorInfo = this.processError(error, context, additionalInfo);
        
        // Log error
        this.logError(errorInfo);
        
        // Attempt recovery
        const recoveryResult = this.attemptRecovery(errorInfo);
        
        // Return processed error info for UI handling
        return {
            ...errorInfo,
            recovery: recoveryResult
        };
    }

    /**
     * Process error into standardized format
     * @param {Error|string} error - Error object or message
     * @param {string} context - Error context
     * @param {Object} additionalInfo - Additional information
     * @returns {Object} Processed error information
     * @private
     */
    processError(error, context, additionalInfo) {
        const timestamp = new Date().toISOString();
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = this.determineErrorCode(error, context);
        
        return {
            id: this.generateErrorId(),
            timestamp,
            context,
            originalMessage: errorMessage,
            userMessage: this.getUserFriendlyMessage(errorCode, errorMessage),
            errorCode,
            severity: this.determineSeverity(errorCode, context),
            stack: error instanceof Error ? error.stack : null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            browserCapabilities: this.browserCapabilities,
            ...additionalInfo
        };
    }

    /**
     * Determine error code from error and context
     * @param {Error|string} error - Error object or message
     * @param {string} context - Error context
     * @returns {string} Error code
     * @private
     */
    determineErrorCode(error, context) {
        const message = error instanceof Error ? error.message : String(error);
        const lowerMessage = message.toLowerCase();
        
        // Check for specific error patterns
        if (lowerMessage.includes('clipboard')) {
            if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
                return 'CLIPBOARD_PERMISSION_DENIED';
            }
            return 'CLIPBOARD_NOT_SUPPORTED';
        }
        
        if (lowerMessage.includes('worker')) {
            return 'WORKER_ERROR';
        }
        
        if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
            return 'PROCESSING_TIMEOUT';
        }
        
        if (lowerMessage.includes('memory') || lowerMessage.includes('out of memory')) {
            return 'MEMORY_ERROR';
        }
        
        if (lowerMessage.includes('filter string')) {
            return 'FILTER_STRING_REQUIRED';
        }
        
        if (lowerMessage.includes('empty') && context.includes('input')) {
            return 'EMPTY_INPUT';
        }
        
        // Context-based error codes
        switch (context) {
            case 'component_initialization':
                return 'COMPONENT_INITIALIZATION_FAILED';
            case 'url_processing':
                return 'PROCESSING_FAILED';
            case 'web_worker':
                return 'WORKER_ERROR';
            case 'clipboard':
                return 'CLIPBOARD_NOT_SUPPORTED';
            case 'validation':
                return 'INVALID_URL_FORMAT';
            default:
                return 'UNKNOWN_ERROR';
        }
    }

    /**
     * Get user-friendly error message
     * @param {string} errorCode - Error code
     * @param {string} originalMessage - Original error message
     * @returns {string} User-friendly message
     * @private
     */
    getUserFriendlyMessage(errorCode, originalMessage) {
        const baseMessage = this.errorCodes[errorCode] || this.errorCodes['UNKNOWN_ERROR'];
        
        // Add specific details for certain error types
        switch (errorCode) {
            case 'PROCESSING_TIMEOUT':
                return `${baseMessage}. The operation took longer than expected.`;
            case 'MEMORY_ERROR':
                return `${baseMessage}. Consider processing fewer URLs at once.`;
            case 'WORKER_ERROR':
                return `${baseMessage}. Processing will continue but may be slower.`;
            case 'INVALID_URL_FORMAT':
                return `${baseMessage}. Invalid URLs will be skipped automatically.`;
            default:
                return baseMessage;
        }
    }

    /**
     * Determine error severity level
     * @param {string} errorCode - Error code
     * @param {string} context - Error context
     * @returns {string} Severity level
     * @private
     */
    determineSeverity(errorCode, context) {
        const criticalErrors = [
            'COMPONENT_INITIALIZATION_FAILED',
            'MODERN_JS_NOT_SUPPORTED',
            'SCRIPT_LOAD_FAILED'
        ];
        
        const warningErrors = [
            'WORKER_NOT_SUPPORTED',
            'CLIPBOARD_NOT_SUPPORTED',
            'WORKER_ERROR',
            'PROCESSING_TIMEOUT'
        ];
        
        if (criticalErrors.includes(errorCode)) {
            return 'critical';
        } else if (warningErrors.includes(errorCode)) {
            return 'warning';
        } else {
            return 'error';
        }
    }

    /**
     * Attempt error recovery based on error type
     * @param {Object} errorInfo - Processed error information
     * @returns {Object} Recovery result
     * @private
     */
    attemptRecovery(errorInfo) {
        const { errorCode, context } = errorInfo;
        
        switch (errorCode) {
            case 'WORKER_ERROR':
            case 'WORKER_NOT_SUPPORTED':
                return this.recoverFromWorkerError();
                
            case 'CLIPBOARD_NOT_SUPPORTED':
            case 'CLIPBOARD_PERMISSION_DENIED':
                return this.recoverFromClipboardError();
                
            case 'PROCESSING_TIMEOUT':
                return this.recoverFromTimeout();
                
            case 'MEMORY_ERROR':
                return this.recoverFromMemoryError();
                
            case 'COMPONENT_INITIALIZATION_FAILED':
                return this.recoverFromInitializationError();
                
            default:
                return { attempted: false, success: false, message: 'No recovery action available' };
        }
    }

    /**
     * Recover from web worker errors
     * @returns {Object} Recovery result
     * @private
     */
    recoverFromWorkerError() {
        try {
            // Disable worker usage and fall back to main thread
            if (window.urlManager) {
                window.urlManager.useWorker = false;
            }
            
            return {
                attempted: true,
                success: true,
                message: 'Switched to main thread processing',
                fallback: 'main_thread'
            };
        } catch (error) {
            return {
                attempted: true,
                success: false,
                message: 'Failed to switch to main thread processing'
            };
        }
    }

    /**
     * Recover from clipboard errors
     * @returns {Object} Recovery result
     * @private
     */
    recoverFromClipboardError() {
        return {
            attempted: true,
            success: true,
            message: 'Use manual copy/paste or keyboard shortcuts',
            fallback: 'manual_clipboard'
        };
    }

    /**
     * Recover from processing timeout
     * @returns {Object} Recovery result
     * @private
     */
    recoverFromTimeout() {
        try {
            // Stop any ongoing processing
            if (window.urlManager && window.urlManager.isProcessing) {
                window.urlManager.finishProcessing();
            }
            
            return {
                attempted: true,
                success: true,
                message: 'Processing stopped. Try with fewer URLs',
                suggestion: 'reduce_batch_size'
            };
        } catch (error) {
            return {
                attempted: true,
                success: false,
                message: 'Failed to stop processing cleanly'
            };
        }
    }

    /**
     * Recover from memory errors
     * @returns {Object} Recovery result
     * @private
     */
    recoverFromMemoryError() {
        return {
            attempted: true,
            success: true,
            message: 'Try processing in smaller batches (1000-5000 URLs)',
            suggestion: 'batch_processing'
        };
    }

    /**
     * Recover from component initialization errors
     * @returns {Object} Recovery result
     * @private
     */
    recoverFromInitializationError() {
        try {
            // Attempt to reload the page
            return {
                attempted: true,
                success: true,
                message: 'Try refreshing the page',
                suggestion: 'page_reload'
            };
        } catch (error) {
            return {
                attempted: true,
                success: false,
                message: 'Manual page refresh required'
            };
        }
    }

    /**
     * Log error to internal log
     * @param {Object} errorInfo - Error information
     * @private
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Maintain log size limit
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
        
        // Console logging based on severity
        switch (errorInfo.severity) {
            case 'critical':
                console.error('CRITICAL ERROR:', errorInfo);
                break;
            case 'warning':
                console.warn('WARNING:', errorInfo);
                break;
            default:
                console.error('ERROR:', errorInfo);
        }
    }

    /**
     * Generate unique error ID
     * @returns {string} Unique error ID
     * @private
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate input data
     * @param {*} input - Input to validate
     * @param {string} type - Expected input type
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateInput(input, type, options = {}) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: input
        };

        switch (type) {
            case 'urls':
                return this.validateURLs(input, options);
            case 'filterString':
                return this.validateFilterString(input, options);
            case 'operation':
                return this.validateOperation(input, options);
            default:
                result.isValid = false;
                result.errors.push('Unknown validation type');
                return result;
        }
    }

    /**
     * Validate URLs input
     * @param {string|Array} input - URLs to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateURLs(input, options = {}) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: [],
            stats: {
                total: 0,
                valid: 0,
                invalid: 0,
                empty: 0
            }
        };

        try {
            // Convert input to array of lines
            let urls = [];
            if (typeof input === 'string') {
                urls = input.split(/\r\n|\r|\n/).map(line => line.trim()).filter(line => line.length > 0);
            } else if (Array.isArray(input)) {
                urls = input.map(url => String(url).trim()).filter(url => url.length > 0);
            } else {
                result.isValid = false;
                result.errors.push('Input must be a string or array');
                return result;
            }

            result.stats.total = urls.length;

            if (urls.length === 0) {
                result.isValid = false;
                result.errors.push('No URLs provided');
                return result;
            }

            // Validate each URL
            for (const url of urls) {
                if (!url || url.trim() === '') {
                    result.stats.empty++;
                    continue;
                }

                const trimmedUrl = url.trim();
                if (this.isValidURL(trimmedUrl)) {
                    result.sanitized.push(trimmedUrl);
                    result.stats.valid++;
                } else {
                    result.stats.invalid++;
                    if (options.includeInvalid) {
                        result.warnings.push(`Invalid URL format: ${trimmedUrl}`);
                    }
                }
            }

            // Check if we have any valid URLs
            if (result.stats.valid === 0) {
                result.isValid = false;
                result.errors.push('No valid URLs found');
            } else if (result.stats.invalid > 0) {
                result.warnings.push(`${result.stats.invalid} invalid URLs will be skipped`);
            }

            return result;

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Validation error: ${error.message}`);
            return result;
        }
    }

    /**
     * Validate filter string input
     * @param {string} input - Filter string to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateFilterString(input, options = {}) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: input
        };

        if (options.required && (!input || typeof input !== 'string' || input.trim() === '')) {
            result.isValid = false;
            result.errors.push('Filter string is required');
            return result;
        }

        if (input && typeof input === 'string') {
            const trimmed = input.trim();
            
            if (trimmed.length === 0 && options.required) {
                result.isValid = false;
                result.errors.push('Filter string cannot be empty');
            } else if (trimmed.length > 1000) {
                result.warnings.push('Very long filter string may affect performance');
                result.sanitized = trimmed.substring(0, 1000);
            } else {
                result.sanitized = trimmed;
            }
        }

        return result;
    }

    /**
     * Validate operation selection
     * @param {string} input - Operation to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateOperation(input, options = {}) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: input
        };

        const validOperations = [
            'removeParams',
            'deduplicateTLD',
            'deduplicateDomain', 
            'deduplicateFull',
            'filterRemove',
            'filterKeep',
            'keepTLD',
            'trimLastPath',
            'extractTLD',
            'sortByDomain',
            'sortByLength',
            'sortByFilename'
        ];

        if (!input || typeof input !== 'string') {
            result.isValid = false;
            result.errors.push('Operation must be selected');
            return result;
        }

        if (!validOperations.includes(input)) {
            result.isValid = false;
            result.errors.push(`Invalid operation: ${input}`);
            return result;
        }

        return result;
    }

    /**
     * Check if a URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     * @private
     */
    isValidURL(url) {
        try {
            // Basic URL validation
            if (!url || typeof url !== 'string') return false;
            
            // Check for basic URL patterns
            const urlPattern = /^(https?:\/\/|ftp:\/\/|\/\/)?[^\s/$.?#].[^\s]*$/i;
            if (!urlPattern.test(url)) return false;
            
            // Try to create URL object for more thorough validation
            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://')) {
                new URL(url);
            } else if (url.startsWith('//')) {
                new URL('http:' + url);
            } else {
                // For relative URLs or domain-only URLs, do basic validation
                const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/;
                if (!domainPattern.test(url.split('/')[0])) return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get browser compatibility report
     * @returns {Object} Compatibility report
     */
    getBrowserCompatibilityReport() {
        const issues = [];
        const warnings = [];
        
        if (!this.browserCapabilities.modernJS) {
            issues.push({
                type: 'critical',
                message: 'Browser does not support modern JavaScript features',
                suggestion: 'Please update your browser or use a modern browser'
            });
        }
        
        if (!this.browserCapabilities.webWorkers) {
            warnings.push({
                type: 'warning',
                message: 'Web Workers not supported',
                suggestion: 'Processing large datasets may be slower'
            });
        }
        
        if (!this.browserCapabilities.clipboard) {
            warnings.push({
                type: 'warning',
                message: 'Clipboard API not supported',
                suggestion: 'Use manual copy/paste or keyboard shortcuts'
            });
        }
        
        return {
            compatible: issues.length === 0,
            capabilities: this.browserCapabilities,
            issues,
            warnings
        };
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        const stats = {
            total: this.errorLog.length,
            bySeverity: { critical: 0, warning: 0, error: 0 },
            byContext: {},
            byErrorCode: {},
            recent: this.errorLog.slice(-10)
        };

        for (const error of this.errorLog) {
            stats.bySeverity[error.severity]++;
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
            stats.byErrorCode[error.errorCode] = (stats.byErrorCode[error.errorCode] || 0) + 1;
        }

        return stats;
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Export error log for debugging
     * @returns {string} JSON string of error log
     */
    exportErrorLog() {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            browserCapabilities: this.browserCapabilities,
            errors: this.errorLog
        }, null, 2);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}