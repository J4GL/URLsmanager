/**
 * URLProcessor - Core URL processing engine
 * Handles URL manipulation operations like parameter removal, deduplication, and filtering
 */

// URLParser is available globally in browser environment
// In Node.js environment, it would be imported via require()
// For browser, URLParser class is loaded via script tag

class URLProcessor {
    constructor() {
        this.stats = {
            inputCount: 0,
            outputCount: 0,
            removedCount: 0,
            invalidCount: 0,
            processingTime: 0
        };
        
        // Initialize performance optimizer if available
        this.performanceOptimizer = null;
        if (typeof PerformanceOptimizer !== 'undefined') {
            this.performanceOptimizer = new PerformanceOptimizer();
        }
    }

    /**
     * Main processing method that coordinates different URL operations
     * @param {string[]} urls - Array of URL strings to process
     * @param {string} operation - Type of operation to perform
     * @param {Object} options - Additional options for the operation
     * @returns {ProcessingResult} Result object with processed URLs and statistics
     */
    async process(urls, operation, options = {}) {
        const startTime = performance.now();
        
        try {
            // Reset statistics
            this.resetStats();
            this.stats.inputCount = urls.length;

            // Validate input
            if (!Array.isArray(urls)) {
                throw new Error('URLs must be provided as an array');
            }

            if (!operation || typeof operation !== 'string') {
                throw new Error('Operation type must be specified');
            }

            let results = [];

            // Use performance optimizer for large datasets
            if (this.performanceOptimizer && urls.length > 1000) {
                const processingFunction = (batchUrls, batchOptions) => {
                    return this.processSync(batchUrls, operation, batchOptions);
                };
                
                const optimizedResult = await this.performanceOptimizer.processBatches(
                    urls, 
                    processingFunction, 
                    {
                        ...options,
                        showProgress: true,
                        progressCallback: options.progressCallback
                    }
                );
                
                if (optimizedResult.success) {
                    results = optimizedResult.results;
                    this.stats.outputCount = optimizedResult.stats.outputCount;
                    this.stats.invalidCount = optimizedResult.stats.invalidCount;
                    this.stats.processingTime = optimizedResult.stats.processingTime;
                    this.stats.removedCount = this.stats.inputCount - this.stats.outputCount;
                    
                    const finalResult = this.createProcessingResult(true, results, []);
                    finalResult.performanceMetrics = optimizedResult.performanceMetrics;
                    return finalResult;
                }
            }
            
            // Fallback to synchronous processing
            results = this.processSync(urls, operation, options);

            // Update final statistics
            this.stats.outputCount = results.length;
            this.stats.removedCount = this.stats.inputCount - this.stats.outputCount;
            this.stats.processingTime = performance.now() - startTime;

            return this.createProcessingResult(true, results, []);

        } catch (error) {
            this.stats.processingTime = performance.now() - startTime;
            return this.createProcessingResult(false, [], [error.message]);
        }
    }

    /**
     * Synchronous processing method for backward compatibility
     * @param {string[]} urls - Array of URL strings to process
     * @param {string} operation - Type of operation to perform
     * @param {Object} options - Additional options for the operation
     * @returns {string[]} Processed URLs
     */
    processSync(urls, operation, options = {}) {
        // Route to appropriate processing method
        switch (operation) {
            case 'removeParameters':
                return this.removeParameters(urls);
            case 'deduplicate':
                return this.deduplicate(urls, options.type || 'full');
            case 'filter':
                return this.filter(urls, options.type, options.filterString);
            case 'keepTLDOnly':
                return this.keepTLDOnly(urls);
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }

    /**
     * Remove query parameters from URLs
     * @param {string[]} urls - Array of URL strings
     * @returns {string[]} Array of URLs without parameters
     */
    removeParameters(urls) {
        const results = [];
        
        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            // Use URLParser to remove parameters
            const cleanedUrl = URLParser.removeParameters(url.trim());
            
            if (cleanedUrl !== null) {
                results.push(cleanedUrl);
            } else {
                this.stats.invalidCount++;
            }
        }

        return results;
    }

    /**
     * Deduplicate URLs based on specified criteria
     * @param {string[]} urls - Array of URL strings
     * @param {string} type - Deduplication type: 'tld', 'domain', or 'full'
     * @returns {string[]} Array of deduplicated URLs
     */
    deduplicate(urls, type = 'full') {
        const results = [];
        const seen = new Set();

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const comparisonKey = this.getDeduplicationKey(trimmedUrl, type);

            if (comparisonKey === null) {
                this.stats.invalidCount++;
                continue;
            }

            // Only add if we haven't seen this key before (preserves first occurrence)
            if (!seen.has(comparisonKey)) {
                seen.add(comparisonKey);
                results.push(trimmedUrl);
            }
        }

        return results;
    }

    /**
     * Get the appropriate comparison key for deduplication based on type
     * @param {string} url - The URL string
     * @param {string} type - Deduplication type: 'tld', 'domain', or 'full'
     * @returns {string|null} Comparison key or null if invalid
     * @private
     */
    getDeduplicationKey(url, type) {
        switch (type) {
            case 'tld':
                return this.getTLDKey(url);
            case 'domain':
                return this.getDomainKey(url);
            case 'full':
            default:
                return this.getFullURLKey(url);
        }
    }

    /**
     * Extract TLD for deduplication (keeps one URL per TLD like .com, .org)
     * @param {string} url - The URL string
     * @returns {string|null} TLD key or null if invalid
     * @private
     */
    getTLDKey(url) {
        const tld = URLParser.getTLD(url);
        return tld ? tld.toLowerCase() : null;
    }

    /**
     * Extract full domain including subdomain for deduplication
     * @param {string} url - The URL string
     * @returns {string|null} Domain key or null if invalid
     * @private
     */
    getDomainKey(url) {
        const fullDomain = URLParser.getFullDomain(url);
        return fullDomain ? fullDomain.toLowerCase() : null;
    }

    /**
     * Extract full URL for exact deduplication
     * @param {string} url - The URL string
     * @returns {string|null} Full URL key or null if invalid
     * @private
     */
    getFullURLKey(url) {
        // Validate URL first
        if (!URLParser.isValid(url)) {
            return null;
        }
        return url.toLowerCase();
    }

    /**
     * Filter URLs based on include/exclude criteria
     * @param {string[]} urls - Array of URL strings
     * @param {string} filterType - 'include' or 'exclude'
     * @param {string} filterString - String to match against
     * @returns {string[]} Array of filtered URLs
     */
    filter(urls, filterType, filterString) {
        if (!filterString || typeof filterString !== 'string' || filterString.trim() === '') {
            throw new Error('Filter string is required for filter operations');
        }

        const results = [];
        const searchString = filterString.toLowerCase();

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            const urlLower = trimmedUrl.toLowerCase();
            const containsString = urlLower.includes(searchString);

            // Include or exclude based on filter type
            if (filterType === 'include' && containsString) {
                results.push(trimmedUrl);
            } else if (filterType === 'exclude' && !containsString) {
                results.push(trimmedUrl);
            }
        }

        return results;
    }

    /**
     * Keep only URLs with top-level domains (no subdomains)
     * @param {string[]} urls - Array of URL strings
     * @returns {string[]} Array of URLs without subdomains
     */
    keepTLDOnly(urls) {
        const results = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                this.stats.invalidCount++;
                continue;
            }

            const trimmedUrl = url.trim();
            
            // Check if URL has subdomain
            if (!URLParser.hasSubdomain(trimmedUrl)) {
                // Validate that it's a proper URL before including
                if (URLParser.isValid(trimmedUrl)) {
                    results.push(trimmedUrl);
                } else {
                    this.stats.invalidCount++;
                }
            }
        }

        return results;
    }

    /**
     * Create a standardized processing result object
     * @param {boolean} success - Whether the operation was successful
     * @param {string[]} results - Array of processed URLs
     * @param {string[]} errors - Array of error messages
     * @returns {ProcessingResult} Standardized result object
     */
    createProcessingResult(success, results, errors) {
        return {
            success: success,
            inputCount: this.stats.inputCount,
            outputCount: this.stats.outputCount,
            removedCount: this.stats.removedCount,
            invalidCount: this.stats.invalidCount,
            results: results || [],
            errors: errors || [],
            processingTime: Math.round(this.stats.processingTime * 100) / 100 // Round to 2 decimal places
        };
    }

    /**
     * Reset internal statistics
     * @private
     */
    resetStats() {
        this.stats = {
            inputCount: 0,
            outputCount: 0,
            removedCount: 0,
            invalidCount: 0,
            processingTime: 0
        };
    }

    /**
     * Get current processing statistics
     * @returns {Object} Current statistics object
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Validate URLs and return validation results
     * @param {string[]} urls - Array of URL strings to validate
     * @returns {Object} Validation results with valid and invalid URLs
     */
    validateURLs(urls) {
        const valid = [];
        const invalid = [];

        for (const url of urls) {
            if (!url || typeof url !== 'string' || url.trim() === '') {
                invalid.push({ url: url, reason: 'Empty or invalid input' });
                continue;
            }

            const trimmedUrl = url.trim();
            if (URLParser.isValid(trimmedUrl)) {
                valid.push(trimmedUrl);
            } else {
                invalid.push({ url: trimmedUrl, reason: 'Invalid URL format' });
            }
        }

        return {
            valid: valid,
            invalid: invalid,
            validCount: valid.length,
            invalidCount: invalid.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLProcessor;
} else if (typeof self !== 'undefined') {
    // Make available in web worker environment
    self.URLProcessor = URLProcessor;
} else if (typeof window !== 'undefined') {
    // Make available in browser environment
    window.URLProcessor = URLProcessor;
}