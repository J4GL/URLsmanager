/**
 * URL Processing Web Worker
 * Handles CPU-intensive URL processing operations in a separate thread
 * to prevent blocking the main UI thread
 */

// Import URLParser and URLProcessor for worker environment
importScripts('./url-parser.js', './url-processor.js');

/**
 * Worker configuration
 */
const BATCH_SIZE = 1000; // Process URLs in batches of 1000
const PROGRESS_INTERVAL = 100; // Report progress every 100ms

/**
 * Main message handler for the web worker
 */
self.onmessage = function(event) {
    const { id, operation, urls, options } = event.data;
    
    try {
        // Validate input
        if (!operation || !Array.isArray(urls)) {
            throw new Error('Invalid input: operation and urls array are required');
        }

        // Process URLs based on operation type
        processURLsWithProgress(id, operation, urls, options || {});
        
    } catch (error) {
        // Send error response
        self.postMessage({
            id: id,
            type: 'error',
            error: error.message,
            timestamp: Date.now()
        });
    }
};

/**
 * Process URLs with progress reporting and batch processing
 * @param {string} id - Unique identifier for this processing request
 * @param {string} operation - Type of operation to perform
 * @param {string[]} urls - Array of URLs to process
 * @param {Object} options - Processing options
 */
function processURLsWithProgress(id, operation, urls, options) {
    const startTime = performance.now();
    const totalUrls = urls.length;
    
    // Send start message
    self.postMessage({
        id: id,
        type: 'start',
        totalUrls: totalUrls,
        timestamp: Date.now()
    });

    // Determine if we should use batch processing
    const useBatchProcessing = totalUrls > BATCH_SIZE;
    
    if (useBatchProcessing) {
        processBatches(id, operation, urls, options, startTime);
    } else {
        processSingleBatch(id, operation, urls, options, startTime);
    }
}

/**
 * Process URLs in batches for large datasets
 * @param {string} id - Request identifier
 * @param {string} operation - Operation type
 * @param {string[]} urls - URLs to process
 * @param {Object} options - Processing options
 * @param {number} startTime - Processing start time
 */
function processBatches(id, operation, urls, options, startTime) {
    const totalUrls = urls.length;
    const batches = Math.ceil(totalUrls / BATCH_SIZE);
    let processedUrls = 0;
    let allResults = [];
    let totalStats = {
        inputCount: totalUrls,
        outputCount: 0,
        removedCount: 0,
        invalidCount: 0
    };

    let lastProgressTime = performance.now();

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, totalUrls);
        const batchUrls = urls.slice(startIndex, endIndex);
        
        // Process this batch
        const processor = new URLProcessor();
        const batchResult = processor.process(batchUrls, operation, options);
        
        // Accumulate results
        if (batchResult.success) {
            allResults = allResults.concat(batchResult.results);
            totalStats.outputCount += batchResult.outputCount;
            totalStats.invalidCount += batchResult.invalidCount;
        }
        
        processedUrls += batchUrls.length;
        
        // Send progress update if enough time has passed
        const currentTime = performance.now();
        if (currentTime - lastProgressTime >= PROGRESS_INTERVAL) {
            self.postMessage({
                id: id,
                type: 'progress',
                processed: processedUrls,
                total: totalUrls,
                percentage: Math.round((processedUrls / totalUrls) * 100),
                batchIndex: batchIndex + 1,
                totalBatches: batches,
                timestamp: Date.now()
            });
            lastProgressTime = currentTime;
        }
        
        // Allow other operations to run (yield control)
        if (batchIndex < batches - 1) {
            // Use setTimeout to yield control back to the event loop
            setTimeout(() => {}, 0);
        }
    }

    // Calculate final statistics
    totalStats.removedCount = totalStats.inputCount - totalStats.outputCount;
    const processingTime = performance.now() - startTime;

    // Send completion message
    self.postMessage({
        id: id,
        type: 'complete',
        success: true,
        results: allResults,
        stats: {
            ...totalStats,
            processingTime: Math.round(processingTime * 100) / 100
        },
        timestamp: Date.now()
    });
}

/**
 * Process URLs in a single batch for smaller datasets
 * @param {string} id - Request identifier
 * @param {string} operation - Operation type
 * @param {string[]} urls - URLs to process
 * @param {Object} options - Processing options
 * @param {number} startTime - Processing start time
 */
function processSingleBatch(id, operation, urls, options, startTime) {
    const processor = new URLProcessor();
    const result = processor.process(urls, operation, options);
    
    const processingTime = performance.now() - startTime;
    
    // Send completion message
    self.postMessage({
        id: id,
        type: 'complete',
        success: result.success,
        results: result.results || [],
        stats: {
            ...result,
            processingTime: Math.round(processingTime * 100) / 100
        },
        errors: result.errors || [],
        timestamp: Date.now()
    });
}

/**
 * Handle worker errors
 */
self.onerror = function(error) {
    self.postMessage({
        type: 'error',
        error: `Worker error: ${error.message}`,
        filename: error.filename,
        lineno: error.lineno,
        timestamp: Date.now()
    });
};

/**
 * Handle unhandled promise rejections
 */
self.onunhandledrejection = function(event) {
    self.postMessage({
        type: 'error',
        error: `Unhandled promise rejection: ${event.reason}`,
        timestamp: Date.now()
    });
};

// Send ready message when worker is loaded
self.postMessage({
    type: 'ready',
    timestamp: Date.now()
});