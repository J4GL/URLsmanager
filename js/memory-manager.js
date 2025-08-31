/**
 * MemoryManager - Advanced memory management utilities
 * Provides memory monitoring, cleanup, and optimization strategies
 */

class MemoryManager {
    constructor() {
        this.memoryPools = new Map();
        this.cleanupCallbacks = new Set();
        this.monitoringInterval = null;
        this.isMonitoring = false;
        
        // Memory thresholds
        this.thresholds = {
            warning: 0.7,    // 70% memory usage warning
            critical: 0.85,  // 85% memory usage critical
            cleanup: 0.9     // 90% memory usage force cleanup
        };
        
        // Memory statistics
        this.stats = {
            totalAllocations: 0,
            totalDeallocations: 0,
            peakMemoryUsage: 0,
            cleanupOperations: 0,
            memoryLeaksDetected: 0
        };
        
        // Initialize memory monitoring
        this.initializeMonitoring();
    }

    /**
     * Initialize memory monitoring
     */
    initializeMonitoring() {
        this.memoryAPISupported = 'memory' in performance;
        
        if (!this.memoryAPISupported) {
            console.warn('Performance Memory API not supported, using fallback monitoring');
        }
        
        // Start monitoring
        this.startMonitoring();
    }

    /**
     * Start memory monitoring
     * @param {number} interval - Monitoring interval in milliseconds
     */
    startMonitoring(interval = 5000) {
        if (this.isMonitoring) {
            return;
        }
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, interval);
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
    }

    /**
     * Check current memory usage and trigger cleanup if needed
     */
    checkMemoryUsage() {
        const memoryInfo = this.getMemoryInfo();
        
        if (memoryInfo.usageRatio >= this.thresholds.cleanup) {
            console.warn('Critical memory usage detected, forcing cleanup');
            this.forceCleanup();
        } else if (memoryInfo.usageRatio >= this.thresholds.critical) {
            console.warn('High memory usage detected, performing cleanup');
            this.performCleanup();
        } else if (memoryInfo.usageRatio >= this.thresholds.warning) {
            console.info('Memory usage warning threshold reached');
        }
        
        // Update peak memory usage
        if (memoryInfo.used > this.stats.peakMemoryUsage) {
            this.stats.peakMemoryUsage = memoryInfo.used;
        }
    }

    /**
     * Get current memory information
     * @returns {Object} Memory information
     */
    getMemoryInfo() {
        if (this.memoryAPISupported) {
            const memInfo = performance.memory;
            return {
                used: memInfo.usedJSHeapSize,
                total: memInfo.totalJSHeapSize,
                limit: memInfo.jsHeapSizeLimit,
                usageRatio: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit,
                available: memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize
            };
        }
        
        // Fallback estimation
        return {
            used: 0,
            total: 0,
            limit: 0,
            usageRatio: 0,
            available: Infinity
        };
    }

    /**
     * Create a memory pool for efficient object reuse
     * @param {string} poolName - Name of the memory pool
     * @param {Function} createFunction - Function to create new objects
     * @param {Function} resetFunction - Function to reset objects for reuse
     * @param {number} maxSize - Maximum pool size
     * @returns {Object} Memory pool interface
     */
    createMemoryPool(poolName, createFunction, resetFunction, maxSize = 100) {
        const pool = {
            name: poolName,
            objects: [],
            createFn: createFunction,
            resetFn: resetFunction,
            maxSize: maxSize,
            allocated: 0,
            reused: 0
        };
        
        this.memoryPools.set(poolName, pool);
        
        return {
            acquire: () => this.acquireFromPool(poolName),
            release: (obj) => this.releaseToPool(poolName, obj),
            clear: () => this.clearPool(poolName),
            getStats: () => this.getPoolStats(poolName)
        };
    }

    /**
     * Acquire object from memory pool
     * @param {string} poolName - Pool name
     * @returns {*} Object from pool
     */
    acquireFromPool(poolName) {
        const pool = this.memoryPools.get(poolName);
        if (!pool) {
            throw new Error(`Memory pool '${poolName}' not found`);
        }
        
        let obj;
        if (pool.objects.length > 0) {
            obj = pool.objects.pop();
            pool.reused++;
        } else {
            obj = pool.createFn();
            pool.allocated++;
        }
        
        this.stats.totalAllocations++;
        return obj;
    }

    /**
     * Release object back to memory pool
     * @param {string} poolName - Pool name
     * @param {*} obj - Object to release
     */
    releaseToPool(poolName, obj) {
        const pool = this.memoryPools.get(poolName);
        if (!pool) {
            return;
        }
        
        // Reset object for reuse
        if (pool.resetFn) {
            pool.resetFn(obj);
        }
        
        // Add back to pool if not at capacity
        if (pool.objects.length < pool.maxSize) {
            pool.objects.push(obj);
        }
        
        this.stats.totalDeallocations++;
    }

    /**
     * Clear memory pool
     * @param {string} poolName - Pool name
     */
    clearPool(poolName) {
        const pool = this.memoryPools.get(poolName);
        if (pool) {
            pool.objects = [];
        }
    }

    /**
     * Get memory pool statistics
     * @param {string} poolName - Pool name
     * @returns {Object} Pool statistics
     */
    getPoolStats(poolName) {
        const pool = this.memoryPools.get(poolName);
        if (!pool) {
            return null;
        }
        
        return {
            name: pool.name,
            size: pool.objects.length,
            maxSize: pool.maxSize,
            allocated: pool.allocated,
            reused: pool.reused,
            reuseRatio: pool.allocated > 0 ? (pool.reused / pool.allocated) * 100 : 0
        };
    }

    /**
     * Register cleanup callback
     * @param {Function} callback - Cleanup function
     */
    registerCleanupCallback(callback) {
        this.cleanupCallbacks.add(callback);
    }

    /**
     * Unregister cleanup callback
     * @param {Function} callback - Cleanup function
     */
    unregisterCleanupCallback(callback) {
        this.cleanupCallbacks.delete(callback);
    }

    /**
     * Perform memory cleanup
     */
    performCleanup() {
        console.log('Performing memory cleanup...');
        
        // Execute all cleanup callbacks
        for (const callback of this.cleanupCallbacks) {
            try {
                callback();
            } catch (error) {
                console.error('Cleanup callback error:', error);
            }
        }
        
        // Clear memory pools partially
        for (const [name, pool] of this.memoryPools) {
            const keepCount = Math.floor(pool.maxSize * 0.25);
            if (pool.objects.length > keepCount) {
                pool.objects = pool.objects.slice(-keepCount);
            }
        }
        
        this.stats.cleanupOperations++;
        
        // Force garbage collection if available
        this.requestGarbageCollection();
    }

    /**
     * Force aggressive memory cleanup
     */
    forceCleanup() {
        console.log('Forcing aggressive memory cleanup...');
        
        // Execute cleanup callbacks
        this.performCleanup();
        
        // Clear all memory pools
        for (const [name, pool] of this.memoryPools) {
            pool.objects = [];
        }
        
        // Multiple garbage collection requests
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.requestGarbageCollection(), i * 100);
        }
    }

    /**
     * Request garbage collection
     */
    requestGarbageCollection() {
        if (window.gc) {
            window.gc();
        } else if ('scheduler' in window && 'postTask' in window.scheduler) {
            // Use scheduler to hint at cleanup opportunity
            window.scheduler.postTask(() => {
                // Create and immediately discard objects to trigger GC
                for (let i = 0; i < 1000; i++) {
                    const temp = new Array(100);
                }
            }, { priority: 'background' });
        }
    }

    /**
     * Create memory-efficient array processor
     * @param {number} chunkSize - Size of processing chunks
     * @returns {Function} Array processor function
     */
    createArrayProcessor(chunkSize = 1000) {
        return async (array, processingFunction, options = {}) => {
            const results = [];
            const totalItems = array.length;
            
            for (let i = 0; i < totalItems; i += chunkSize) {
                // Check memory before processing chunk
                const memInfo = this.getMemoryInfo();
                if (memInfo.usageRatio > this.thresholds.critical) {
                    await this.performCleanupAsync();
                }
                
                const chunk = array.slice(i, i + chunkSize);
                const chunkResults = await processingFunction(chunk, options);
                
                if (Array.isArray(chunkResults)) {
                    results.push(...chunkResults);
                } else {
                    results.push(chunkResults);
                }
                
                // Yield control periodically
                if (i % (chunkSize * 5) === 0) {
                    await this.yieldControl();
                }
            }
            
            return results;
        };
    }

    /**
     * Perform asynchronous cleanup
     * @returns {Promise<void>}
     */
    async performCleanupAsync() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.performCleanup();
                resolve();
            }, 0);
        });
    }

    /**
     * Yield control to event loop
     * @returns {Promise<void>}
     */
    async yieldControl() {
        return new Promise(resolve => {
            if ('scheduler' in window && 'postTask' in window.scheduler) {
                window.scheduler.postTask(resolve, { priority: 'background' });
            } else {
                setTimeout(resolve, 0);
            }
        });
    }

    /**
     * Detect potential memory leaks
     * @returns {Array} Array of potential leak indicators
     */
    detectMemoryLeaks() {
        const leaks = [];
        const memInfo = this.getMemoryInfo();
        
        // Check for continuously growing memory usage
        if (memInfo.usageRatio > 0.8 && this.stats.cleanupOperations > 5) {
            leaks.push({
                type: 'high_memory_after_cleanup',
                severity: 'high',
                description: 'Memory usage remains high after multiple cleanup operations'
            });
        }
        
        // Check memory pool efficiency
        for (const [name, pool] of this.memoryPools) {
            const reuseRatio = pool.allocated > 0 ? (pool.reused / pool.allocated) : 0;
            if (pool.allocated > 100 && reuseRatio < 0.1) {
                leaks.push({
                    type: 'low_pool_reuse',
                    severity: 'medium',
                    description: `Memory pool '${name}' has low reuse ratio: ${(reuseRatio * 100).toFixed(1)}%`
                });
            }
        }
        
        // Check allocation/deallocation balance
        const allocationBalance = this.stats.totalDeallocations / Math.max(1, this.stats.totalAllocations);
        if (this.stats.totalAllocations > 1000 && allocationBalance < 0.8) {
            leaks.push({
                type: 'allocation_imbalance',
                severity: 'medium',
                description: `Low deallocation ratio: ${(allocationBalance * 100).toFixed(1)}%`
            });
        }
        
        if (leaks.length > 0) {
            this.stats.memoryLeaksDetected += leaks.length;
        }
        
        return leaks;
    }

    /**
     * Get comprehensive memory statistics
     * @returns {Object} Memory statistics
     */
    getMemoryStats() {
        const memInfo = this.getMemoryInfo();
        const poolStats = {};
        
        for (const [name, pool] of this.memoryPools) {
            poolStats[name] = this.getPoolStats(name);
        }
        
        return {
            current: memInfo,
            stats: { ...this.stats },
            pools: poolStats,
            thresholds: { ...this.thresholds },
            monitoring: this.isMonitoring,
            apiSupported: this.memoryAPISupported
        };
    }

    /**
     * Configure memory thresholds
     * @param {Object} newThresholds - New threshold values
     */
    configureThresholds(newThresholds) {
        if (newThresholds.warning !== undefined) {
            this.thresholds.warning = Math.max(0.1, Math.min(0.95, newThresholds.warning));
        }
        if (newThresholds.critical !== undefined) {
            this.thresholds.critical = Math.max(0.1, Math.min(0.95, newThresholds.critical));
        }
        if (newThresholds.cleanup !== undefined) {
            this.thresholds.cleanup = Math.max(0.1, Math.min(0.95, newThresholds.cleanup));
        }
    }

    /**
     * Reset memory statistics
     */
    resetStats() {
        this.stats = {
            totalAllocations: 0,
            totalDeallocations: 0,
            peakMemoryUsage: 0,
            cleanupOperations: 0,
            memoryLeaksDetected: 0
        };
    }

    /**
     * Cleanup and destroy memory manager
     */
    destroy() {
        this.stopMonitoring();
        
        // Clear all memory pools
        for (const [name, pool] of this.memoryPools) {
            pool.objects = [];
        }
        this.memoryPools.clear();
        
        // Clear cleanup callbacks
        this.cleanupCallbacks.clear();
        
        // Final cleanup
        this.forceCleanup();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryManager;
} else if (typeof window !== 'undefined') {
    window.MemoryManager = MemoryManager;
}