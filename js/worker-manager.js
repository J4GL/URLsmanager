/**
 * WorkerManager - Manages web worker communication and lifecycle
 * Provides a clean interface for processing URLs in web workers
 */

class WorkerManager {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.pendingRequests = new Map();
        this.requestIdCounter = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.onErrorCallback = null;
    }

    /**
     * Initialize the web worker
     * @returns {Promise} Promise that resolves when worker is ready
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                // Create new worker - try standalone version first, fallback to modular version
                try {
                    this.worker = new Worker('./js/url-worker-standalone.js');
                } catch (error) {
                    console.warn('Failed to load standalone worker, trying modular version:', error);
                    this.worker = new Worker('./js/url-worker.js');
                }
                
                // Set up message handler
                this.worker.onmessage = (event) => {
                    this.handleWorkerMessage(event.data);
                };
                
                // Set up error handler
                this.worker.onerror = (error) => {
                    console.error('Worker error:', error);
                    this.handleWorkerError(error);
                    reject(error);
                };
                
                // Wait for ready message
                const readyHandler = (event) => {
                    if (event.data.type === 'ready') {
                        this.isReady = true;
                        this.worker.removeEventListener('message', readyHandler);
                        resolve();
                    }
                };
                
                this.worker.addEventListener('message', readyHandler);
                
                // Set timeout for worker initialization
                setTimeout(() => {
                    if (!this.isReady) {
                        reject(new Error('Worker initialization timeout'));
                    }
                }, 5000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Process URLs using the web worker
     * @param {string[]} urls - Array of URLs to process
     * @param {string} operation - Operation type
     * @param {Object} options - Processing options
     * @returns {Promise} Promise that resolves with processing results
     */
    async processURLs(urls, operation, options = {}) {
        if (!this.isReady || !this.worker) {
            throw new Error('Worker not initialized. Call initialize() first.');
        }

        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();
            
            // Store request callbacks
            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                startTime: Date.now()
            });

            // Send processing request to worker
            this.worker.postMessage({
                id: requestId,
                operation: operation,
                urls: urls,
                options: options
            });
        });
    }

    /**
     * Set callback for progress updates
     * @param {Function} callback - Progress callback function
     */
    setProgressCallback(callback) {
        this.onProgressCallback = callback;
    }

    /**
     * Set callback for completion
     * @param {Function} callback - Completion callback function
     */
    setCompleteCallback(callback) {
        this.onCompleteCallback = callback;
    }

    /**
     * Set callback for errors
     * @param {Function} callback - Error callback function
     */
    setErrorCallback(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Handle messages from the web worker
     * @param {Object} data - Message data from worker
     * @private
     */
    handleWorkerMessage(data) {
        const { id, type } = data;

        switch (type) {
            case 'start':
                this.handleStartMessage(data);
                break;
                
            case 'progress':
                this.handleProgressMessage(data);
                break;
                
            case 'complete':
                this.handleCompleteMessage(data);
                break;
                
            case 'error':
                this.handleErrorMessage(data);
                break;
                
            case 'ready':
                // Already handled in initialize()
                break;
                
            default:
                console.warn('Unknown message type from worker:', type);
        }
    }

    /**
     * Handle start message from worker
     * @param {Object} data - Start message data
     * @private
     */
    handleStartMessage(data) {
        if (this.onProgressCallback) {
            this.onProgressCallback({
                type: 'start',
                totalUrls: data.totalUrls,
                processed: 0,
                percentage: 0
            });
        }
    }

    /**
     * Handle progress message from worker
     * @param {Object} data - Progress message data
     * @private
     */
    handleProgressMessage(data) {
        if (this.onProgressCallback) {
            this.onProgressCallback({
                type: 'progress',
                processed: data.processed,
                total: data.total,
                percentage: data.percentage,
                batchIndex: data.batchIndex,
                totalBatches: data.totalBatches
            });
        }
    }

    /**
     * Handle completion message from worker
     * @param {Object} data - Completion message data
     * @private
     */
    handleCompleteMessage(data) {
        const request = this.pendingRequests.get(data.id);
        if (!request) {
            console.warn('Received completion for unknown request:', data.id);
            return;
        }

        // Remove from pending requests
        this.pendingRequests.delete(data.id);

        // Call completion callback if set
        if (this.onCompleteCallback) {
            this.onCompleteCallback({
                type: 'complete',
                success: data.success,
                results: data.results,
                stats: data.stats
            });
        }

        // Resolve the promise
        if (data.success) {
            request.resolve({
                success: true,
                results: data.results,
                stats: data.stats,
                errors: data.errors || []
            });
        } else {
            request.reject(new Error(data.errors ? data.errors.join(', ') : 'Processing failed'));
        }
    }

    /**
     * Handle error message from worker
     * @param {Object} data - Error message data
     * @private
     */
    handleErrorMessage(data) {
        const error = new Error(data.error);
        
        // Call error callback if set
        if (this.onErrorCallback) {
            this.onErrorCallback({
                type: 'error',
                error: error,
                message: data.error
            });
        }

        // Reject pending request if it has an ID
        if (data.id) {
            const request = this.pendingRequests.get(data.id);
            if (request) {
                this.pendingRequests.delete(data.id);
                request.reject(error);
            }
        }
    }

    /**
     * Handle worker errors
     * @param {Error} error - Worker error
     * @private
     */
    handleWorkerError(error) {
        // Reject all pending requests
        for (const [id, request] of this.pendingRequests) {
            request.reject(new Error(`Worker error: ${error.message}`));
        }
        this.pendingRequests.clear();

        // Call error callback
        if (this.onErrorCallback) {
            this.onErrorCallback({
                type: 'worker-error',
                error: error,
                message: error.message
            });
        }
    }

    /**
     * Generate unique request ID
     * @returns {string} Unique request identifier
     * @private
     */
    generateRequestId() {
        return `req_${++this.requestIdCounter}_${Date.now()}`;
    }

    /**
     * Terminate the web worker
     */
    terminate() {
        if (this.worker) {
            // Reject all pending requests
            for (const [id, request] of this.pendingRequests) {
                request.reject(new Error('Worker terminated'));
            }
            this.pendingRequests.clear();

            // Terminate worker
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }
    }

    /**
     * Check if worker is available and ready
     * @returns {boolean} True if worker is ready
     */
    isWorkerReady() {
        return this.isReady && this.worker !== null;
    }

    /**
     * Get number of pending requests
     * @returns {number} Number of pending requests
     */
    getPendingRequestCount() {
        return this.pendingRequests.size;
    }

    /**
     * Check if web workers are supported in this browser
     * @returns {boolean} True if web workers are supported
     */
    static isSupported() {
        return typeof Worker !== 'undefined';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkerManager;
}