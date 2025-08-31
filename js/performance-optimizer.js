/**
 * PerformanceOptimizer - Core performance optimization utilities
 * Provides batch processing, caching, memory management, and DOM optimization
 */

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 1000;
        this.batchSize = 1000;
        this.memoryThreshold = 0.8; // 80% of available memory
        this.domUpdateQueue = [];
        this.domUpdateScheduled = false;
        
        // Performance monitoring
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            batchesProcessed: 0,
            memoryOptimizations: 0,
            domOptimizations: 0
        };
        
        // Initialize memory monitoring
        this.initializeMemoryMonitoring();
    }

    /**
     * Process URLs in optimized batches for memory efficiency
     * @param {string[]} urls - Array of URLs to process
     * @param {Function} processingFunction - Function to process each batch
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processing results
     */
    async processBatches(urls, processingFunction, options = {}) {
        const batchSize = options.batchSize || this.batchSize;
        const showProgress = options.showProgress || false;
        const progressCallback = options.progressCallback;
        
        const totalUrls = urls.length;
        const batches = Math.ceil(totalUrls / batchSize);
        let allResults = [];
        let totalStats = {
            inputCount: totalUrls,
            outputCount: 0,
            removedCount: 0,
            invalidCount: 0,
            processingTime: 0
        };

        const startTime = performance.now();

        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
            // Check memory usage before processing each batch
            if (await this.isMemoryPressureHigh()) {
                await this.performMemoryOptimization();
            }

            const startIdx = batchIndex * batchSize;
            const endIdx = Math.min(startIdx + batchSize, totalUrls);
            const batchUrls = urls.slice(startIdx, endIdx);
            
            // Process batch with caching
            const batchResult = await this.processWithCache(
                batchUrls, 
                processingFunction, 
                options
            );
            
            // Accumulate results
            if (batchResult.success) {
                allResults = allResults.concat(batchResult.results);
                totalStats.outputCount += batchResult.outputCount;
                totalStats.invalidCount += batchResult.invalidCount;
                totalStats.processingTime += batchResult.processingTime;
            }
            
            this.performanceMetrics.batchesProcessed++;
            
            // Report progress
            if (showProgress && progressCallback) {
                const progress = {
                    batchIndex: batchIndex + 1,
                    totalBatches: batches,
                    processed: endIdx,
                    total: totalUrls,
                    percentage: Math.round((endIdx / totalUrls) * 100)
                };
                progressCallback(progress);
            }
            
            // Yield control to prevent UI blocking
            await this.yieldControl();
        }

        totalStats.removedCount = totalStats.inputCount - totalStats.outputCount;
        totalStats.processingTime = performance.now() - startTime;

        return {
            success: true,
            results: allResults,
            stats: totalStats,
            performanceMetrics: { ...this.performanceMetrics }
        };
    }

    /**
     * Process with intelligent caching
     * @param {string[]} urls - URLs to process
     * @param {Function} processingFunction - Processing function
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processing results
     */
    async processWithCache(urls, processingFunction, options) {
        const cacheKey = this.generateCacheKey(options);
        const cachedResults = new Map();
        const uncachedUrls = [];
        
        // Check cache for each URL
        for (const url of urls) {
            const urlCacheKey = `${cacheKey}:${url}`;
            if (this.cache.has(urlCacheKey)) {
                cachedResults.set(url, this.cache.get(urlCacheKey));
                this.performanceMetrics.cacheHits++;
            } else {
                uncachedUrls.push(url);
                this.performanceMetrics.cacheMisses++;
            }
        }
        
        // Process uncached URLs
        let processedResults = { results: [], success: true };
        if (uncachedUrls.length > 0) {
            processedResults = await processingFunction(uncachedUrls, options);
            
            // Cache new results
            if (processedResults.success) {
                for (let i = 0; i < uncachedUrls.length; i++) {
                    const url = uncachedUrls[i];
                    const result = processedResults.results[i];
                    if (result !== undefined) {
                        const urlCacheKey = `${cacheKey}:${url}`;
                        this.setCache(urlCacheKey, result);
                    }
                }
            }
        }
        
        // Combine cached and processed results
        const combinedResults = [];
        for (const url of urls) {
            const urlCacheKey = `${cacheKey}:${url}`;
            if (cachedResults.has(url)) {
                combinedResults.push(cachedResults.get(url));
            } else {
                const index = uncachedUrls.indexOf(url);
                if (index >= 0 && processedResults.results[index] !== undefined) {
                    combinedResults.push(processedResults.results[index]);
                }
            }
        }
        
        return {
            success: processedResults.success,
            results: combinedResults,
            outputCount: combinedResults.length,
            invalidCount: urls.length - combinedResults.length,
            processingTime: processedResults.processingTime || 0
        };
    }

    /**
     * Generate cache key for operation
     * @param {Object} options - Processing options
     * @returns {string} Cache key
     */
    generateCacheKey(options) {
        const keyParts = [
            options.operation || 'unknown',
            options.type || '',
            options.filterString || '',
            JSON.stringify(options.caseSensitive || false)
        ];
        return keyParts.join('|');
    }

    /**
     * Set cache with LRU eviction
     * @param {string} key - Cache key
     * @param {*} value - Cache value
     */
    setCache(key, value) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        // Remove existing entry to update position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        
        this.cache.set(key, value);
    }

    /**
     * Get cache value
     * @param {string} key - Cache key
     * @returns {*} Cache value or undefined
     */
    getCache(key) {
        if (this.cache.has(key)) {
            // Move to end (LRU)
            const value = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return undefined;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.performanceMetrics.cacheHits = 0;
        this.performanceMetrics.cacheMisses = 0;
    }

    /**
     * Initialize memory monitoring
     */
    initializeMemoryMonitoring() {
        // Check if memory API is available
        this.memoryAPIAvailable = 'memory' in performance;
        
        if (!this.memoryAPIAvailable) {
            console.warn('Performance memory API not available, using fallback memory management');
        }
    }

    /**
     * Check if memory pressure is high
     * @returns {Promise<boolean>} True if memory pressure is high
     */
    async isMemoryPressureHigh() {
        if (this.memoryAPIAvailable) {
            const memInfo = performance.memory;
            const usedRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
            return usedRatio > this.memoryThreshold;
        }
        
        // Fallback: check cache size and processing metrics
        return this.cache.size > this.maxCacheSize * 0.8 || 
               this.performanceMetrics.batchesProcessed > 100;
    }

    /**
     * Perform memory optimization
     * @returns {Promise<void>}
     */
    async performMemoryOptimization() {
        // Clear cache if memory pressure is high
        if (this.cache.size > this.maxCacheSize * 0.5) {
            const oldSize = this.cache.size;
            
            // Keep only the most recent 25% of cache entries
            const keepCount = Math.floor(this.maxCacheSize * 0.25);
            const entries = Array.from(this.cache.entries());
            this.cache.clear();
            
            // Re-add most recent entries
            for (let i = Math.max(0, entries.length - keepCount); i < entries.length; i++) {
                this.cache.set(entries[i][0], entries[i][1]);
            }
            
            console.log(`Memory optimization: Reduced cache from ${oldSize} to ${this.cache.size} entries`);
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        this.performanceMetrics.memoryOptimizations++;
        
        // Yield control to allow garbage collection
        await this.yieldControl(10);
    }

    /**
     * Yield control to prevent UI blocking
     * @param {number} delay - Optional delay in milliseconds
     * @returns {Promise<void>}
     */
    async yieldControl(delay = 0) {
        return new Promise(resolve => {
            if (delay > 0) {
                setTimeout(resolve, delay);
            } else {
                // Use scheduler API if available, otherwise setTimeout
                if ('scheduler' in window && 'postTask' in window.scheduler) {
                    window.scheduler.postTask(resolve, { priority: 'background' });
                } else {
                    setTimeout(resolve, 0);
                }
            }
        });
    }

    /**
     * Optimize DOM updates by batching them
     * @param {Function} updateFunction - Function that performs DOM updates
     * @param {*} data - Data for the update
     * @returns {Promise<void>}
     */
    async optimizeDOMUpdate(updateFunction, data) {
        this.domUpdateQueue.push({ updateFunction, data });
        
        if (!this.domUpdateScheduled) {
            this.domUpdateScheduled = true;
            
            // Use requestAnimationFrame for smooth updates
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    this.processDOMUpdateQueue();
                    resolve();
                });
            });
        }
    }

    /**
     * Process queued DOM updates
     */
    processDOMUpdateQueue() {
        const updates = [...this.domUpdateQueue];
        this.domUpdateQueue = [];
        this.domUpdateScheduled = false;
        
        // Batch DOM updates to minimize reflows
        for (const { updateFunction, data } of updates) {
            try {
                updateFunction(data);
            } catch (error) {
                console.error('DOM update error:', error);
            }
        }
        
        this.performanceMetrics.domOptimizations++;
    }

    /**
     * Create optimized text area update function
     * @param {HTMLTextAreaElement} textArea - Text area element
     * @returns {Function} Optimized update function
     */
    createOptimizedTextAreaUpdater(textArea) {
        let lastValue = '';
        let updatePending = false;
        
        return async (newValue) => {
            // Skip if value hasn't changed
            if (newValue === lastValue) {
                return;
            }
            
            lastValue = newValue;
            
            // Batch updates for large content
            if (newValue.length > 10000 && !updatePending) {
                updatePending = true;
                
                await this.optimizeDOMUpdate(() => {
                    textArea.value = newValue;
                    updatePending = false;
                }, null);
            } else {
                textArea.value = newValue;
            }
        };
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const cacheEfficiency = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
            ? (this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)) * 100
            : 0;
            
        return {
            ...this.performanceMetrics,
            cacheSize: this.cache.size,
            cacheEfficiency: Math.round(cacheEfficiency * 100) / 100,
            memoryAPIAvailable: this.memoryAPIAvailable
        };
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            batchesProcessed: 0,
            memoryOptimizations: 0,
            domOptimizations: 0
        };
    }

    /**
     * Auto-configure optimizer based on system capabilities
     */
    autoConfigureForSystem() {
        const memoryInfo = this.memoryAPIAvailable ? performance.memory : null;
        const cores = navigator.hardwareConcurrency || 4;
        
        if (memoryInfo) {
            const availableMemoryMB = (memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize) / 1024 / 1024;
            
            // Adjust settings based on available memory
            if (availableMemoryMB > 500) {
                this.maxCacheSize = 2000;
                this.batchSize = 2000;
                this.memoryThreshold = 0.8;
            } else if (availableMemoryMB > 200) {
                this.maxCacheSize = 1000;
                this.batchSize = 1000;
                this.memoryThreshold = 0.7;
            } else {
                this.maxCacheSize = 500;
                this.batchSize = 500;
                this.memoryThreshold = 0.6;
            }
        }
        
        // Adjust batch size based on CPU cores
        this.batchSize = Math.min(this.batchSize, cores * 500);
        
        console.log('Performance optimizer auto-configured:', {
            maxCacheSize: this.maxCacheSize,
            batchSize: this.batchSize,
            memoryThreshold: this.memoryThreshold,
            detectedCores: cores,
            availableMemory: memoryInfo ? Math.round((memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize) / 1024 / 1024) + 'MB' : 'unknown'
        });
    }
    
    /**
     * Get optimization recommendations for dataset
     * @param {number} datasetSize - Size of dataset
     * @returns {Object} Optimization recommendations
     */
    getOptimizationRecommendations(datasetSize) {
        const memoryInfo = this.memoryAPIAvailable ? performance.memory : null;
        const recommendations = {
            useWorker: datasetSize > 1000,
            batchSize: this.batchSize,
            enableCaching: datasetSize > 500,
            memoryOptimization: datasetSize > 10000,
            progressReporting: datasetSize > 1000
        };
        
        // Adjust recommendations based on memory
        if (memoryInfo) {
            const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
            
            if (memoryUsageRatio > 0.7) {
                recommendations.batchSize = Math.min(recommendations.batchSize, 500);
                recommendations.memoryOptimization = true;
            }
            
            if (memoryUsageRatio > 0.8) {
                recommendations.useWorker = false; // Main thread might be more memory efficient
                recommendations.batchSize = Math.min(recommendations.batchSize, 250);
            }
        }
        
        // Adjust for very large datasets
        if (datasetSize > 50000) {
            recommendations.batchSize = Math.min(recommendations.batchSize, 1000);
            recommendations.memoryOptimization = true;
            recommendations.progressReporting = true;
        }
        
        return recommendations;
    }
    
    /**
     * Configure optimizer settings
     * @param {Object} settings - Configuration settings
     */
    configure(settings) {
        if (settings.maxCacheSize !== undefined) {
            this.maxCacheSize = Math.max(100, settings.maxCacheSize);
        }
        
        if (settings.batchSize !== undefined) {
            this.batchSize = Math.max(100, settings.batchSize);
        }
        
        if (settings.memoryThreshold !== undefined) {
            this.memoryThreshold = Math.max(0.1, Math.min(0.95, settings.memoryThreshold));
        }
        
        // Auto-configure if no specific settings provided
        if (Object.keys(settings).length === 0) {
            this.autoConfigureForSystem();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
} else if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}