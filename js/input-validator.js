/**
 * InputValidator - Comprehensive input validation system
 * Validates all user inputs and provides detailed feedback
 */
class InputValidator {
    constructor(errorHandler = null) {
        this.errorHandler = errorHandler || new ErrorHandler();
        this.validationRules = this.initializeValidationRules();
    }

    /**
     * Initialize validation rules for different input types
     * @returns {Object} Validation rules
     * @private
     */
    initializeValidationRules() {
        return {
            urls: {
                minLength: 1,
                maxLength: 100000,
                maxLineLength: 2048,
                allowedProtocols: ['http:', 'https:', 'ftp:', ''],
                requiredPattern: /^[^\s]+$/
            },
            filterString: {
                minLength: 1,
                maxLength: 1000,
                forbiddenChars: [],
                trimWhitespace: true
            },
            operation: {
                allowedValues: [
                    'removeParams',
                    'deduplicateTLD',
                    'deduplicateDomain',
                    'deduplicateFull',
                    'filterRemove',
                    'filterKeep',
                    'keepTLD'
                ]
            }
        };
    }

    /**
     * Validate URLs input with comprehensive checks
     * @param {string|Array} input - URLs to validate
     * @param {Object} options - Validation options
     * @returns {Object} Detailed validation result
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
                empty: 0,
                tooLong: 0,
                malformed: 0
            },
            details: []
        };

        try {
            // Convert input to array of lines
            const urls = this.parseURLInput(input);
            result.stats.total = urls.length;

            // Check if input is empty
            if (urls.length === 0) {
                result.isValid = false;
                result.errors.push({
                    code: 'EMPTY_INPUT',
                    message: 'No URLs provided',
                    severity: 'error'
                });
                return result;
            }

            // Check input size limits
            if (urls.length > this.validationRules.urls.maxLength) {
                result.warnings.push({
                    code: 'INPUT_TOO_LARGE',
                    message: `Input contains ${urls.length.toLocaleString()} URLs. Consider processing in smaller batches for better performance.`,
                    severity: 'warning'
                });
            }

            // Validate each URL
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                const lineNumber = i + 1;
                const urlValidation = this.validateSingleURL(url, lineNumber);
                
                if (urlValidation.isValid) {
                    result.sanitized.push(urlValidation.sanitized);
                    result.stats.valid++;
                } else {
                    result.stats.invalid++;
                    result.details.push(urlValidation);
                    
                    // Categorize the type of invalid URL
                    if (urlValidation.isEmpty) {
                        result.stats.empty++;
                    } else if (urlValidation.isTooLong) {
                        result.stats.tooLong++;
                    } else {
                        result.stats.malformed++;
                    }
                }
            }

            // Generate summary messages
            this.generateURLValidationSummary(result);

            return result;

        } catch (error) {
            result.isValid = false;
            result.errors.push({
                code: 'VALIDATION_ERROR',
                message: `Validation failed: ${error.message}`,
                severity: 'error'
            });
            return result;
        }
    }

    /**
     * Parse URL input into array of strings
     * @param {string|Array} input - Input to parse
     * @returns {Array} Array of URL strings
     * @private
     */
    parseURLInput(input) {
        if (typeof input === 'string') {
            return input
                .split(/\r\n|\r|\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);
        } else if (Array.isArray(input)) {
            return input
                .map(url => String(url).trim())
                .filter(url => url.length > 0);
        } else {
            throw new Error('Input must be a string or array');
        }
    }

    /**
     * Validate a single URL
     * @param {string} url - URL to validate
     * @param {number} lineNumber - Line number for error reporting
     * @returns {Object} Validation result for single URL
     * @private
     */
    validateSingleURL(url, lineNumber) {
        const result = {
            isValid: false,
            sanitized: url,
            lineNumber,
            isEmpty: false,
            isTooLong: false,
            errors: []
        };

        // Check if empty
        if (!url || url.trim() === '') {
            result.isEmpty = true;
            result.errors.push({
                code: 'EMPTY_URL',
                message: `Line ${lineNumber}: Empty URL`,
                severity: 'info'
            });
            return result;
        }

        const trimmedUrl = url.trim();
        result.sanitized = trimmedUrl;

        // Check length
        if (trimmedUrl.length > this.validationRules.urls.maxLineLength) {
            result.isTooLong = true;
            result.errors.push({
                code: 'URL_TOO_LONG',
                message: `Line ${lineNumber}: URL exceeds maximum length (${this.validationRules.urls.maxLineLength} characters)`,
                severity: 'warning'
            });
            // Truncate for processing
            result.sanitized = trimmedUrl.substring(0, this.validationRules.urls.maxLineLength);
        }

        // Validate URL format
        const formatValidation = this.validateURLFormat(trimmedUrl);
        if (!formatValidation.isValid) {
            result.errors.push({
                code: 'INVALID_URL_FORMAT',
                message: `Line ${lineNumber}: ${formatValidation.reason}`,
                severity: 'warning'
            });
            return result;
        }

        result.isValid = true;
        return result;
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {Object} Format validation result
     * @private
     */
    validateURLFormat(url) {
        try {
            // Basic pattern check
            if (!/^[^\s]+$/.test(url)) {
                return { isValid: false, reason: 'URL contains whitespace' };
            }

            // Check for obviously invalid characters
            if (/[<>"`{}|\\^]/.test(url)) {
                return { isValid: false, reason: 'URL contains invalid characters' };
            }

            // Try different URL validation approaches
            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://')) {
                // Full URL validation
                new URL(url);
            } else if (url.startsWith('//')) {
                // Protocol-relative URL
                new URL('http:' + url);
            } else if (url.includes('.')) {
                // Domain-based URL validation
                const domain = url.split('/')[0];
                if (!this.isValidDomain(domain)) {
                    return { isValid: false, reason: 'Invalid domain format' };
                }
            } else {
                return { isValid: false, reason: 'Unrecognized URL format' };
            }

            return { isValid: true };

        } catch (error) {
            return { isValid: false, reason: 'Malformed URL structure' };
        }
    }

    /**
     * Validate domain format
     * @param {string} domain - Domain to validate
     * @returns {boolean} True if valid domain
     * @private
     */
    isValidDomain(domain) {
        // Basic domain pattern
        const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/;
        
        if (!domainPattern.test(domain)) {
            return false;
        }

        // Check for valid TLD
        const parts = domain.split('.');
        if (parts.length < 2) {
            return false;
        }

        const tld = parts[parts.length - 1];
        return /^[a-zA-Z]{2,}$/.test(tld);
    }

    /**
     * Generate validation summary messages
     * @param {Object} result - Validation result to update
     * @private
     */
    generateURLValidationSummary(result) {
        const { stats } = result;

        // Check if we have any valid URLs
        if (stats.valid === 0) {
            result.isValid = false;
            result.errors.push({
                code: 'NO_VALID_URLS',
                message: 'No valid URLs found in input',
                severity: 'error'
            });
        }

        // Add warnings for invalid URLs
        if (stats.invalid > 0) {
            const invalidPercent = Math.round((stats.invalid / stats.total) * 100);
            
            if (invalidPercent > 50) {
                result.warnings.push({
                    code: 'HIGH_INVALID_RATE',
                    message: `${invalidPercent}% of URLs are invalid (${stats.invalid} out of ${stats.total}). Please check your input format.`,
                    severity: 'warning'
                });
            } else {
                result.warnings.push({
                    code: 'SOME_INVALID_URLS',
                    message: `${stats.invalid} invalid URLs will be skipped (${stats.valid} valid URLs will be processed)`,
                    severity: 'info'
                });
            }
        }

        // Add performance warnings
        if (stats.valid > 50000) {
            result.warnings.push({
                code: 'LARGE_DATASET',
                message: `Processing ${stats.valid.toLocaleString()} URLs may take some time. Consider using smaller batches for better performance.`,
                severity: 'info'
            });
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

        const rules = this.validationRules.filterString;
        const isRequired = options.required || false;

        // Check if required
        if (isRequired && (!input || typeof input !== 'string' || input.trim() === '')) {
            result.isValid = false;
            result.errors.push({
                code: 'FILTER_STRING_REQUIRED',
                message: 'Filter string is required for this operation',
                severity: 'error'
            });
            return result;
        }

        // If not required and empty, that's okay
        if (!input || typeof input !== 'string') {
            if (!isRequired) {
                result.sanitized = '';
                return result;
            }
        }

        const trimmed = input.trim();

        // Check length constraints
        if (trimmed.length === 0 && isRequired) {
            result.isValid = false;
            result.errors.push({
                code: 'FILTER_STRING_EMPTY',
                message: 'Filter string cannot be empty',
                severity: 'error'
            });
            return result;
        }

        if (trimmed.length > rules.maxLength) {
            result.warnings.push({
                code: 'FILTER_STRING_TOO_LONG',
                message: `Filter string is very long (${trimmed.length} characters). This may affect performance.`,
                severity: 'warning'
            });
            result.sanitized = trimmed.substring(0, rules.maxLength);
        } else {
            result.sanitized = trimmed;
        }

        // Check for potentially problematic patterns
        if (trimmed.length > 0) {
            this.validateFilterStringContent(trimmed, result);
        }

        return result;
    }

    /**
     * Validate filter string content for potential issues
     * @param {string} filterString - Filter string to validate
     * @param {Object} result - Result object to update
     * @private
     */
    validateFilterStringContent(filterString, result) {
        // Check for regex special characters that might cause confusion
        const regexChars = /[.*+?^${}()|[\]\\]/;
        if (regexChars.test(filterString)) {
            result.warnings.push({
                code: 'FILTER_CONTAINS_SPECIAL_CHARS',
                message: 'Filter string contains special characters. Filtering uses simple text matching, not regular expressions.',
                severity: 'info'
            });
        }

        // Check for very short filter strings that might match too much
        if (filterString.length === 1) {
            result.warnings.push({
                code: 'FILTER_VERY_SHORT',
                message: 'Single character filter may match many URLs. Consider using a more specific filter.',
                severity: 'info'
            });
        }

        // Check for common TLDs that might be too broad
        const commonTlds = ['.com', '.org', '.net', '.edu', '.gov'];
        if (commonTlds.includes(filterString.toLowerCase())) {
            result.warnings.push({
                code: 'FILTER_VERY_BROAD',
                message: `Filtering by "${filterString}" may match a large number of URLs.`,
                severity: 'info'
            });
        }
    }

    /**
     * Validate operation selection
     * @param {string} operation - Operation to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateOperation(operation, options = {}) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: operation,
            requiresFilter: false
        };

        const rules = this.validationRules.operation;

        // Check if operation is provided
        if (!operation || typeof operation !== 'string') {
            result.isValid = false;
            result.errors.push({
                code: 'OPERATION_NOT_SELECTED',
                message: 'Please select an operation to perform',
                severity: 'error'
            });
            return result;
        }

        // Check if operation is valid
        if (!rules.allowedValues.includes(operation)) {
            result.isValid = false;
            result.errors.push({
                code: 'INVALID_OPERATION',
                message: `Invalid operation: ${operation}`,
                severity: 'error'
            });
            return result;
        }

        // Check if operation requires filter string
        const filterOperations = ['filterRemove', 'filterKeep'];
        result.requiresFilter = filterOperations.includes(operation);

        // Add operation-specific warnings
        this.addOperationSpecificWarnings(operation, result);

        return result;
    }

    /**
     * Add operation-specific warnings
     * @param {string} operation - Operation type
     * @param {Object} result - Result object to update
     * @private
     */
    addOperationSpecificWarnings(operation, result) {
        switch (operation) {
            case 'deduplicateTLD':
                result.warnings.push({
                    code: 'AGGRESSIVE_DEDUPLICATION',
                    message: 'TLD deduplication will keep only one URL per top-level domain (.com, .org, etc.). This may remove many URLs.',
                    severity: 'info'
                });
                break;
                
            case 'keepTLD':
                result.warnings.push({
                    code: 'RESTRICTIVE_FILTER',
                    message: 'This operation will remove all URLs with subdomains (including www). Only main domain URLs will remain.',
                    severity: 'info'
                });
                break;
        }
    }

    /**
     * Validate complete form input
     * @param {Object} formData - Complete form data
     * @returns {Object} Complete validation result
     */
    validateForm(formData) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            fieldResults: {}
        };

        // Validate operation first
        const operationResult = this.validateOperation(formData.operation);
        result.fieldResults.operation = operationResult;
        
        if (!operationResult.isValid) {
            result.isValid = false;
            result.errors.push(...operationResult.errors);
        }
        result.warnings.push(...operationResult.warnings);

        // Validate filter string if required
        if (operationResult.requiresFilter) {
            const filterResult = this.validateFilterString(formData.filterString, { required: true });
            result.fieldResults.filterString = filterResult;
            
            if (!filterResult.isValid) {
                result.isValid = false;
                result.errors.push(...filterResult.errors);
            }
            result.warnings.push(...filterResult.warnings);
        }

        // Validate URLs
        const urlsResult = this.validateURLs(formData.urls);
        result.fieldResults.urls = urlsResult;
        
        if (!urlsResult.isValid) {
            result.isValid = false;
            result.errors.push(...urlsResult.errors);
        }
        result.warnings.push(...urlsResult.warnings);

        // Add form-level validations
        this.addFormLevelValidations(formData, result);

        return result;
    }

    /**
     * Add form-level validations
     * @param {Object} formData - Form data
     * @param {Object} result - Result object to update
     * @private
     */
    addFormLevelValidations(formData, result) {
        // Check for potentially time-consuming operations
        const urlCount = result.fieldResults.urls?.stats?.valid || 0;
        const operation = formData.operation;

        if (urlCount > 10000 && ['deduplicateFull', 'filterRemove', 'filterKeep'].includes(operation)) {
            result.warnings.push({
                code: 'SLOW_OPERATION_WARNING',
                message: `Processing ${urlCount.toLocaleString()} URLs with ${operation} operation may take some time. Consider processing in smaller batches.`,
                severity: 'info'
            });
        }

        // Check for operations that might remove most URLs
        if (operation === 'deduplicateTLD' && urlCount > 1000) {
            result.warnings.push({
                code: 'AGGRESSIVE_DEDUPLICATION_WARNING',
                message: 'TLD deduplication on a large dataset may remove most URLs, leaving only one per domain extension.',
                severity: 'warning'
            });
        }
    }

    /**
     * Get validation summary for display
     * @param {Object} validationResult - Validation result
     * @returns {Object} Display-friendly summary
     */
    getValidationSummary(validationResult) {
        const summary = {
            isValid: validationResult.isValid,
            errorCount: validationResult.errors.length,
            warningCount: validationResult.warnings.length,
            messages: []
        };

        // Add error messages
        for (const error of validationResult.errors) {
            summary.messages.push({
                type: 'error',
                message: error.message,
                code: error.code
            });
        }

        // Add warning messages (limit to most important ones)
        const importantWarnings = validationResult.warnings
            .filter(w => w.severity === 'warning')
            .slice(0, 3);
            
        for (const warning of importantWarnings) {
            summary.messages.push({
                type: 'warning',
                message: warning.message,
                code: warning.code
            });
        }

        return summary;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputValidator;
} else if (typeof window !== 'undefined') {
    window.InputValidator = InputValidator;
}