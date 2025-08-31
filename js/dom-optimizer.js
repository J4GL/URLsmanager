/**
 * DOMOptimizer - DOM update and rendering performance optimization
 * Provides batched updates, virtual scrolling, and efficient DOM manipulation
 */

class DOMOptimizer {
    constructor() {
        this.updateQueue = [];
        this.isUpdateScheduled = false;
        this.observers = new Map();
        this.virtualScrollers = new Map();
        
        // Performance tracking
        this.metrics = {
            batchedUpdates: 0,
            individualUpdates: 0,
            reflows: 0,
            repaints: 0
        };
        
        // Configuration
        this.config = {
            batchDelay: 16, // ~60fps
            maxBatchSize: 100,
            virtualScrollThreshold: 1000
        };
    }

    /**
     * Schedule a DOM update to be batched
     * @param {Function} updateFunction - Function that performs DOM updates
     * @param {*} data - Data for the update
     * @param {number} priority - Update priority (0 = highest, 10 = lowest)
     * @returns {Promise<void>} Promise that resolves when update is complete
     */
    scheduleUpdate(updateFunction, data, priority = 5) {
        return new Promise((resolve, reject) => {
            this.updateQueue.push({
                updateFunction,
                data,
                priority,
                resolve,
                reject,
                timestamp: performance.now()
            });
            
            this.scheduleFlush();
        });
    }

    /**
     * Schedule immediate DOM update (bypasses batching)
     * @param {Function} updateFunction - Function that performs DOM updates
     * @param {*} data - Data for the update
     * @returns {Promise<void>} Promise that resolves when update is complete
     */
    immediateUpdate(updateFunction, data) {
        return new Promise((resolve, reject) => {
            try {
                const result = updateFunction(data);
                this.metrics.individualUpdates++;
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Schedule flush of update queue
     * @private
     */
    scheduleFlush() {
        if (this.isUpdateScheduled) {
            return;
        }
        
        this.isUpdateScheduled = true;
        
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            this.flushUpdates();
        });
    }

    /**
     * Flush all pending updates
     * @private
     */
    flushUpdates() {
        if (this.updateQueue.length === 0) {
            this.isUpdateScheduled = false;
            return;
        }
        
        // Sort by priority (lower number = higher priority)
        this.updateQueue.sort((a, b) => a.priority - b.priority);
        
        // Process updates in batches
        const batchSize = Math.min(this.config.maxBatchSize, this.updateQueue.length);
        const batch = this.updateQueue.splice(0, batchSize);
        
        // Measure performance
        const startTime = performance.now();
        
        // Execute updates
        for (const update of batch) {
            try {
                const result = update.updateFunction(update.data);
                update.resolve(result);
            } catch (error) {
                update.reject(error);
            }
        }
        
        const endTime = performance.now();
        this.metrics.batchedUpdates++;
        
        // Log performance if batch took too long
        if (endTime - startTime > 16) {
            console.warn(`DOM batch update took ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        // Schedule next batch if more updates pending
        if (this.updateQueue.length > 0) {
            setTimeout(() => {
                this.isUpdateScheduled = false;
                this.scheduleFlush();
            }, this.config.batchDelay);
        } else {
            this.isUpdateScheduled = false;
        }
    }

    /**
     * Create optimized text area updater
     * @param {HTMLTextAreaElement} textArea - Text area element
     * @param {Object} options - Configuration options
     * @returns {Function} Optimized update function
     */
    createTextAreaUpdater(textArea, options = {}) {
        let lastValue = textArea.value;
        let lastScrollTop = textArea.scrollTop;
        let updatePending = false;
        
        const config = {
            debounceDelay: options.debounceDelay || 100,
            preserveScroll: options.preserveScroll !== false,
            maxLength: options.maxLength || 1000000
        };
        
        let debounceTimer = null;
        
        return (newValue, immediate = false) => {
            // Skip if value hasn't changed
            if (newValue === lastValue) {
                return Promise.resolve();
            }
            
            // Truncate if too long
            if (newValue.length > config.maxLength) {
                newValue = newValue.substring(0, config.maxLength) + '\n... (content truncated)';
            }
            
            lastValue = newValue;
            
            const updateFunction = (value) => {
                const scrollTop = textArea.scrollTop;
                textArea.value = value;
                
                // Preserve scroll position if requested
                if (config.preserveScroll && scrollTop > 0) {
                    textArea.scrollTop = scrollTop;
                }
                
                updatePending = false;
            };
            
            if (immediate || newValue.length < 1000) {
                return this.immediateUpdate(updateFunction, newValue);
            } else {
                // Debounce large updates
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                
                return new Promise((resolve) => {
                    debounceTimer = setTimeout(() => {
                        this.scheduleUpdate(updateFunction, newValue, 3).then(resolve);
                    }, config.debounceDelay);
                });
            }
        };
    }

    /**
     * Create virtual scroller for large lists
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Virtual scroll options
     * @returns {Object} Virtual scroller interface
     */
    createVirtualScroller(container, options = {}) {
        const config = {
            itemHeight: options.itemHeight || 25,
            bufferSize: options.bufferSize || 10,
            renderFunction: options.renderFunction || ((item, index) => `<div>${item}</div>`),
            containerHeight: options.containerHeight || container.clientHeight
        };
        
        const scroller = {
            container,
            config,
            data: [],
            visibleStart: 0,
            visibleEnd: 0,
            scrollTop: 0,
            renderedItems: new Map()
        };
        
        this.virtualScrollers.set(container, scroller);
        this.setupVirtualScrolling(scroller);
        
        return {
            setData: (data) => this.setVirtualScrollData(scroller, data),
            refresh: () => this.refreshVirtualScroll(scroller),
            scrollToIndex: (index) => this.scrollToIndex(scroller, index),
            destroy: () => this.destroyVirtualScroller(scroller)
        };
    }

    /**
     * Setup virtual scrolling for a container
     * @param {Object} scroller - Virtual scroller object
     * @private
     */
    setupVirtualScrolling(scroller) {
        const { container, config } = scroller;
        
        // Create scroll container
        container.style.overflow = 'auto';
        container.style.position = 'relative';
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.position = 'relative';
        container.appendChild(contentContainer);
        scroller.contentContainer = contentContainer;
        
        // Add scroll listener
        const scrollHandler = () => {
            scroller.scrollTop = container.scrollTop;
            this.updateVirtualScroll(scroller);
        };
        
        container.addEventListener('scroll', scrollHandler, { passive: true });
        scroller.scrollHandler = scrollHandler;
    }

    /**
     * Set data for virtual scroller
     * @param {Object} scroller - Virtual scroller object
     * @param {Array} data - Data array
     */
    setVirtualScrollData(scroller, data) {
        scroller.data = data;
        
        // Update total height
        const totalHeight = data.length * scroller.config.itemHeight;
        scroller.contentContainer.style.height = `${totalHeight}px`;
        
        this.updateVirtualScroll(scroller);
    }

    /**
     * Update virtual scroll rendering
     * @param {Object} scroller - Virtual scroller object
     * @private
     */
    updateVirtualScroll(scroller) {
        const { container, config, data, contentContainer } = scroller;
        
        if (!data || data.length === 0) {
            return;
        }
        
        const containerHeight = container.clientHeight;
        const itemsPerPage = Math.ceil(containerHeight / config.itemHeight);
        
        // Calculate visible range
        const startIndex = Math.floor(scroller.scrollTop / config.itemHeight);
        const endIndex = Math.min(
            startIndex + itemsPerPage + config.bufferSize,
            data.length
        );
        
        const visibleStart = Math.max(0, startIndex - config.bufferSize);
        const visibleEnd = endIndex;
        
        // Only update if range changed
        if (visibleStart === scroller.visibleStart && visibleEnd === scroller.visibleEnd) {
            return;
        }
        
        scroller.visibleStart = visibleStart;
        scroller.visibleEnd = visibleEnd;
        
        // Schedule render update
        this.scheduleUpdate(() => {
            this.renderVirtualScrollItems(scroller, visibleStart, visibleEnd);
        }, null, 2);
    }

    /**
     * Render virtual scroll items
     * @param {Object} scroller - Virtual scroller object
     * @param {number} startIndex - Start index
     * @param {number} endIndex - End index
     * @private
     */
    renderVirtualScrollItems(scroller, startIndex, endIndex) {
        const { config, data, contentContainer, renderedItems } = scroller;
        
        // Remove items outside visible range
        for (const [index, element] of renderedItems) {
            if (index < startIndex || index >= endIndex) {
                element.remove();
                renderedItems.delete(index);
            }
        }
        
        // Add new items in visible range
        for (let i = startIndex; i < endIndex; i++) {
            if (!renderedItems.has(i) && i < data.length) {
                const item = data[i];
                const element = document.createElement('div');
                element.style.position = 'absolute';
                element.style.top = `${i * config.itemHeight}px`;
                element.style.height = `${config.itemHeight}px`;
                element.style.width = '100%';
                element.innerHTML = config.renderFunction(item, i);
                
                contentContainer.appendChild(element);
                renderedItems.set(i, element);
            }
        }
    }

    /**
     * Scroll to specific index in virtual scroller
     * @param {Object} scroller - Virtual scroller object
     * @param {number} index - Index to scroll to
     */
    scrollToIndex(scroller, index) {
        const scrollTop = index * scroller.config.itemHeight;
        scroller.container.scrollTop = scrollTop;
    }

    /**
     * Refresh virtual scroller
     * @param {Object} scroller - Virtual scroller object
     */
    refreshVirtualScroll(scroller) {
        // Clear rendered items
        for (const element of scroller.renderedItems.values()) {
            element.remove();
        }
        scroller.renderedItems.clear();
        
        // Re-render
        this.updateVirtualScroll(scroller);
    }

    /**
     * Destroy virtual scroller
     * @param {Object} scroller - Virtual scroller object
     */
    destroyVirtualScroller(scroller) {
        // Remove scroll listener
        if (scroller.scrollHandler) {
            scroller.container.removeEventListener('scroll', scroller.scrollHandler);
        }
        
        // Clear rendered items
        for (const element of scroller.renderedItems.values()) {
            element.remove();
        }
        
        // Remove from map
        this.virtualScrollers.delete(scroller.container);
    }

    /**
     * Measure DOM operation performance
     * @param {Function} operation - DOM operation to measure
     * @param {string} operationName - Name for logging
     * @returns {*} Operation result
     */
    measurePerformance(operation, operationName = 'DOM Operation') {
        const startTime = performance.now();
        
        const result = operation();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 16) {
            console.warn(`${operationName} took ${duration.toFixed(2)}ms (>16ms threshold)`);
        }
        
        return result;
    }

    /**
     * Create intersection observer for lazy loading
     * @param {Function} callback - Callback when elements intersect
     * @param {Object} options - Intersection observer options
     * @returns {IntersectionObserver} Observer instance
     */
    createIntersectionObserver(callback, options = {}) {
        const config = {
            root: options.root || null,
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    callback(entry.target, entry);
                }
            }
        }, config);
        
        return observer;
    }

    /**
     * Optimize element for performance
     * @param {HTMLElement} element - Element to optimize
     * @param {Object} options - Optimization options
     */
    optimizeElement(element, options = {}) {
        // Enable hardware acceleration for animations
        if (options.enableHardwareAcceleration) {
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform, opacity';
        }
        
        // Optimize for frequent updates
        if (options.frequentUpdates) {
            element.style.contain = 'layout style paint';
        }
        
        // Optimize for scrolling
        if (options.optimizeScrolling) {
            element.style.overflowAnchor = 'none';
            element.style.scrollBehavior = 'auto';
        }
    }

    /**
     * Get DOM optimization metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            queueLength: this.updateQueue.length,
            isUpdateScheduled: this.isUpdateScheduled,
            virtualScrollers: this.virtualScrollers.size
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            batchedUpdates: 0,
            individualUpdates: 0,
            reflows: 0,
            repaints: 0
        };
    }

    /**
     * Configure DOM optimizer
     * @param {Object} newConfig - New configuration
     */
    configure(newConfig) {
        Object.assign(this.config, newConfig);
    }

    /**
     * Cleanup and destroy DOM optimizer
     */
    destroy() {
        // Clear update queue
        this.updateQueue = [];
        this.isUpdateScheduled = false;
        
        // Destroy all virtual scrollers
        for (const scroller of this.virtualScrollers.values()) {
            this.destroyVirtualScroller(scroller);
        }
        
        // Clear observers
        this.observers.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMOptimizer;
} else if (typeof window !== 'undefined') {
    window.DOMOptimizer = DOMOptimizer;
}