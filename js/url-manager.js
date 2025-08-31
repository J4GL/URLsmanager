/**
 * URLManager - Main application controller
 * Coordinates all components and manages application state
 * Handles operation routing, processing coordination, and error handling
 */
class URLManager {
    constructor() {
        // Component instances
        this.statisticsManager = null;
        this.textAreaManager = null;
        this.controlPanel = null;
        this.urlProcessor = null;
        this.workerManager = null;
        this.accessibilityManager = null;
        this.clipboardUtilityManager = null;
        
        // Application state
        this.isProcessing = false;
        this.isWorkerSupported = false;
        this.useWorker = false;
        
        // Processing state and timeouts
        this.processingTimeout = null;
        this.processingStartTime = null;
        this.maxProcessingTime = 300000; // 5 minutes default timeout
        this.progressUpdateInterval = null;
        
        // Error handling and validation
        this.errorHandler = new ErrorHandler();
        this.inputValidator = new InputValidator(this.errorHandler);
        
        // Initialize components
        this.initializeComponents();
    }
    
    /**
     * Initialize all application components
     */
    initializeComponents() {
        try {
            // Check browser compatibility first
            const compatibilityReport = this.errorHandler.getBrowserCompatibilityReport();
            if (!compatibilityReport.compatible) {
                for (const issue of compatibilityReport.issues) {
                    this.errorHandler.handle(new Error(issue.message), 'browser_compatibility', issue);
                }
                throw new Error('Browser compatibility issues detected');
            }
            
            // Initialize accessibility manager first
            this.accessibilityManager = new AccessibilityManager();
            
            // Initialize statistics manager (other components depend on it)
            this.statisticsManager = new StatisticsManager();
            
            // Initialize text area manager
            this.textAreaManager = new TextAreaManager(
                'input-textarea', 
                'output-textarea', 
                this.statisticsManager
            );
            
            // Initialize clipboard utility manager
            this.clipboardUtilityManager = new ClipboardUtilityManager(this.textAreaManager);
            
            // Initialize control panel
            this.controlPanel = new ControlPanel(
                document.querySelector('.control-panel'),
                this.statisticsManager
            );
            
            // Initialize URL processor
            this.urlProcessor = new URLProcessor();
            
            // Initialize performance optimizations
            this.performanceOptimizer = new PerformanceOptimizer();
            this.performanceOptimizer.autoConfigureForSystem(); // Auto-configure based on system capabilities
            this.memoryManager = new MemoryManager();
            this.domOptimizer = new DOMOptimizer();
            
            // Register memory cleanup callbacks
            this.memoryManager.registerCleanupCallback(() => {
                this.performanceOptimizer.clearCache();
            });
            
            this.memoryManager.registerCleanupCallback(() => {
                // Clear any cached DOM elements
                this.domOptimizer.resetMetrics();
            });
            
            // Check for web worker support
            this.isWorkerSupported = typeof Worker !== 'undefined';
            this.useWorker = this.isWorkerSupported;
            
            // Initialize worker manager if supported
            if (this.isWorkerSupported) {
                this.workerManager = new WorkerManager();
            } else {
                // Show warning about missing web worker support
                const warningInfo = this.errorHandler.handle(
                    new Error('Web Workers not supported'), 
                    'browser_compatibility'
                );
                if (this.statisticsManager) {
                    this.statisticsManager.showWarning(warningInfo.userMessage);
                }
            }
            
        } catch (error) {
            const errorInfo = this.errorHandler.handle(error, 'component_initialization');
            if (this.statisticsManager) {
                this.statisticsManager.showError(errorInfo.userMessage);
            } else {
                // Fallback error display
                console.error('Critical initialization error:', errorInfo);
                alert(`Application failed to initialize: ${errorInfo.userMessage}`);
            }
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Set up event bindings
            this.bindEvents();
            
            // Initialize web worker if supported
            if (this.useWorker && this.workerManager) {
                try {
                    await this.workerManager.initialize();
                    this.setupWorkerCallbacks();
                } catch (error) {
                    console.warn('Failed to initialize web worker, falling back to main thread:', error);
                    this.useWorker = false;
                }
            }
            
            // Keyboard shortcuts are now handled by AccessibilityManager
            // Set up accessibility integration
            this.setupAccessibilityIntegration();
            
            // Initial UI update
            this.updateUI();
            
            // Ensure control panel button state is properly initialized
            // This fixes the issue where the button remains disabled after selecting an operation
            setTimeout(() => {
                if (this.controlPanel) {
                    this.controlPanel.updateProcessButtonState();
                    // Additional aggressive fix - force check multiple times
                    setTimeout(() => this.controlPanel.updateProcessButtonState(), 200);
                    setTimeout(() => this.controlPanel.updateProcessButtonState(), 500);
                }
            }, 100);
            
            console.log('URL Manager application initialized successfully');
            
        } catch (error) {
            this.errorHandler.handle(error, 'application_initialization');
        }
    }
    
    /**
     * Bind event listeners for all components
     */
    bindEvents() {
        // Control panel process button
        this.controlPanel.onProcessClick((options) => {
            this.processURLs(options);
        });
        
        // Ensure button state is updated when operation changes
        // This fixes the issue where the button doesn't become enabled after selecting an operation
        const operationSelect = document.getElementById('operation-select');
        if (operationSelect) {
            // Use multiple event types to catch all changes
            ['change', 'input', 'click'].forEach(eventType => {
                operationSelect.addEventListener(eventType, () => {
                    // Multiple timeouts to ensure it works
                    setTimeout(() => {
                        if (this.controlPanel) {
                            this.controlPanel.updateProcessButtonState();
                        }
                    }, 10);
                    setTimeout(() => {
                        if (this.controlPanel) {
                            this.controlPanel.updateProcessButtonState();
                        }
                    }, 100);
                });
            });
        }
        
        // Also handle filter input changes with multiple event types
        const filterInput = document.getElementById('filter-input');
        if (filterInput) {
            ['input', 'change', 'keyup', 'paste'].forEach(eventType => {
                filterInput.addEventListener(eventType, () => {
                    setTimeout(() => {
                        if (this.controlPanel) {
                            this.controlPanel.updateProcessButtonState();
                        }
                    }, 10);
                    setTimeout(() => {
                        if (this.controlPanel) {
                            this.controlPanel.updateProcessButtonState();
                        }
                    }, 100);
                });
            });
        }
        
        // Add a global interval to periodically check button state (as a last resort)
        setInterval(() => {
            if (this.controlPanel && !this.isProcessing) {
                this.controlPanel.updateProcessButtonState();
            }
        }, 1000);
        
        // Utility buttons
        this.bindUtilityButtons();
        
        // Text area events
        this.bindTextAreaEvents();
    }
    
    /**
     * Bind utility button events
     */
    bindUtilityButtons() {
        // Clipboard utility manager handles all button events and visual feedback
        // No additional binding needed as it's initialized in initializeComponents()
        
        // The ClipboardUtilityManager automatically handles:
        // - Clear input button with visual feedback
        // - Clear output button with visual feedback  
        // - Paste button with visual feedback and keyboard shortcuts
        // - Copy results button with visual feedback and keyboard shortcuts
        // - Keyboard shortcuts (Ctrl+V, Ctrl+C, Ctrl+A)
        // - Toast notifications for all operations
    }
    
    /**
     * Bind text area events
     */
    bindTextAreaEvents() {
        // Copy button state is now managed by ClipboardUtilityManager
        // Set up integration between text area manager and clipboard utility manager
        if (this.textAreaManager && this.clipboardUtilityManager) {
            // Override setOutputText to update copy button state
            const originalSetOutputText = this.textAreaManager.setOutputText.bind(this.textAreaManager);
            this.textAreaManager.setOutputText = (text) => {
                originalSetOutputText(text);
                this.clipboardUtilityManager.updateCopyButtonState();
            };
            
            // Initial copy button state update
            this.clipboardUtilityManager.updateCopyButtonState();
        }
    }
    
    /**
     * Set up accessibility integration
     */
    setupAccessibilityIntegration() {
        // Accessibility manager handles keyboard shortcuts automatically
        // Set up custom announcements for processing events
        if (this.accessibilityManager) {
            // Announce when processing starts
            this.accessibilityManager.announce('URL Manager ready. Use Tab to navigate, F6 to jump between sections.');
        }
    }
    
    /**
     * Set up web worker callbacks
     */
    setupWorkerCallbacks() {
        if (!this.workerManager) return;
        
        this.workerManager.setProgressCallback((progress) => {
            this.handleWorkerProgress(progress);
        });
        
        this.workerManager.setCompleteCallback((result) => {
            this.handleWorkerComplete(result);
        });
        
        this.workerManager.setErrorCallback((error) => {
            this.handleWorkerError(error);
        });
    }
    
    /**
     * Main URL processing method
     * @param {Object} options - Processing options from control panel
     */
    async processURLs(options) {
        if (this.isProcessing) {
            this.statisticsManager.showWarning('Processing already in progress');
            return;
        }
        
        try {
            // Comprehensive input validation
            const inputText = this.textAreaManager.getInputText(options.processAll);
            const formData = {
                urls: inputText,
                operation: options.operation,
                filterString: options.filterString,
                processAll: options.processAll
            };
            
            const validationResult = this.inputValidator.validateForm(formData);
            
            // Handle validation errors
            if (!validationResult.isValid) {
                this.handleValidationErrors(validationResult);
                return;
            }
            
            // Show validation warnings if any
            if (validationResult.warnings.length > 0) {
                this.handleValidationWarnings(validationResult);
            }
            
            // Get validated URLs
            const urls = validationResult.fieldResults.urls.sanitized;
            
            if (urls.length === 0) {
                this.statisticsManager.showError('No valid URLs found in input');
                return;
            }
            
            // Show preview indicator if needed
            const previewStatus = this.textAreaManager.getPreviewStatus();
            if (!options.processAll && previewStatus.isPreview) {
                this.statisticsManager.showPreviewIndicator(previewStatus);
            } else {
                this.statisticsManager.hidePreviewIndicator();
            }
            
            // Start processing
            this.startProcessing(options);
            
            // Route to appropriate processing method
            const processingOptions = this.mapOperationOptions(options);
            let results;
            
            if (this.useWorker && this.workerManager && urls.length > 1000) {
                // Use web worker for large datasets
                results = await this.processWithWorker(urls, processingOptions);
            } else {
                // Use main thread for smaller datasets
                results = await this.processWithMainThread(urls, processingOptions);
            }
            
            // Handle results
            this.handleProcessingResults(results);
            
        } catch (error) {
            this.handleProcessingError(error, options);
        } finally {
            this.finishProcessing();
        }
    }
    
    /**
     * Map control panel options to processing options
     * @param {Object} options - Control panel options
     * @returns {Object} Processing options
     */
    mapOperationOptions(options) {
        const { operation, filterString } = options;
        
        switch (operation) {
            case 'removeParams':
                return { operation: 'removeParameters' };
                
            case 'deduplicateTLD':
                return { operation: 'deduplicate', type: 'tld' };
                
            case 'deduplicateDomain':
                return { operation: 'deduplicate', type: 'domain' };
                
            case 'deduplicateFull':
                return { operation: 'deduplicate', type: 'full' };
                
            case 'filterRemove':
                return { operation: 'filter', type: 'exclude', filterString };
                
            case 'filterKeep':
                return { operation: 'filter', type: 'include', filterString };
                
            case 'keepTLD':
                return { operation: 'keepTLDOnly' };
                
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }
    
    /**
     * Process URLs using web worker
     * @param {string[]} urls - URLs to process
     * @param {Object} options - Processing options
     * @returns {Promise} Processing results
     */
    async processWithWorker(urls, options) {
        return await this.workerManager.processURLs(urls, options.operation, options);
    }
    
    /**
     * Process URLs using main thread
     * @param {string[]} urls - URLs to process
     * @param {Object} options - Processing options
     * @returns {Promise} Processing results
     */
    async processWithMainThread(urls, options) {
        // Show progress for datasets larger than 500 URLs
        const showProgress = urls.length > 500;
        
        if (showProgress) {
            this.statisticsManager.showProgress(0, 'Initializing processing...');
            this.controlPanel.updateLoadingMessage('Processing URLs...');
        }
        
        // Process in chunks to prevent UI blocking
        const results = await this.processInChunks(urls, options);
        
        return results;
    }
    
    /**
     * Process URLs in chunks to prevent UI blocking
     * @param {string[]} urls - URLs to process
     * @param {Object} options - Processing options
     * @returns {Promise} Processing results
     */
    async processInChunks(urls, options) {
        // Optimize chunk size based on dataset size and available memory
        const memoryInfo = this.memoryManager.getMemoryInfo();
        const baseChunkSize = memoryInfo.usageRatio > 0.7 ? 500 : 1000;
        const chunkSize = Math.min(baseChunkSize, Math.max(100, Math.floor(urls.length / 10)));
        
        // Use performance optimizer for batch processing
        const processingFunction = async (chunk, opts) => {
            return await this.urlProcessor.process(chunk, opts.operation, opts);
        };
        
        const optimizedResult = await this.performanceOptimizer.processBatches(
            urls, 
            processingFunction, 
            {
                batchSize: chunkSize,
                showProgress: true,
                progressCallback: (progress) => {
                    this.handleOptimizedProgress(progress, urls.length);
                },
                ...options
            }
        );
        
        if (optimizedResult.success) {
            return {
                success: true,
                results: optimizedResult.results,
                inputCount: optimizedResult.stats.inputCount,
                outputCount: optimizedResult.stats.outputCount,
                removedCount: optimizedResult.stats.removedCount,
                invalidCount: optimizedResult.stats.invalidCount,
                processingTime: optimizedResult.stats.processingTime,
                performanceMetrics: optimizedResult.performanceMetrics
            };
        } else {
            throw new Error('Optimized batch processing failed');
        }
    }
    
    /**
     * Handle progress updates from performance optimizer
     * @param {Object} progress - Progress information
     * @param {number} totalUrls - Total number of URLs
     * @private
     */
    handleOptimizedProgress(progress, totalUrls) {
        const elapsedTime = performance.now() - this.processingStartTime;
        const avgTimePerBatch = elapsedTime / progress.batchIndex;
        const estimatedTimeRemaining = avgTimePerBatch * (progress.totalBatches - progress.batchIndex);
        
        let progressMessage = `Processing ${progress.processed} of ${totalUrls} URLs...`;
        
        // Add performance information for large datasets
        if (totalUrls > 5000) {
            const urlsPerSecond = Math.round(progress.processed / (elapsedTime / 1000));
            progressMessage += ` (${urlsPerSecond} URLs/s)`;
        }
        
        // Add time estimate for longer operations
        if (progress.totalBatches > 5 && estimatedTimeRemaining > 1000) {
            const remainingSeconds = Math.ceil(estimatedTimeRemaining / 1000);
            progressMessage += ` (~${remainingSeconds}s remaining)`;
        }
        
        this.statisticsManager.updateProgress(progress.percentage, progressMessage);
        
        // Update control panel loading message with performance hints
        if (progress.percentage < 25) {
            this.controlPanel.updateLoadingMessage('Optimizing processing...');
        } else if (progress.percentage < 50) {
            this.controlPanel.updateLoadingMessage('Processing in batches...');
        } else if (progress.percentage < 75) {
            this.controlPanel.updateLoadingMessage('Halfway through...');
        } else if (progress.percentage < 95) {
            this.controlPanel.updateLoadingMessage('Almost finished...');
        } else {
            this.controlPanel.updateLoadingMessage('Finalizing results...');
        }
    }
    
    /**
     * Yield control to prevent UI blocking
     * @param {number} delay - Optional delay in milliseconds
     * @returns {Promise} Promise that resolves after yielding
     */
    yield(delay = 0) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    /**
     * Start processing state
     * @param {Object} options - Processing options
     */
    startProcessing(options) {
        this.isProcessing = true;
        this.processingStartTime = Date.now();
        
        // Set up timeout for processing
        this.setupProcessingTimeout(options);
        
        // Start progress updates for long operations
        this.startProgressUpdates();
        
        this.controlPanel.showLoading('Starting...');
        this.controlPanel.setEnabled(false);
        this.statisticsManager.showProcessingStarted(options);
        
        // Accessibility announcement
        if (this.accessibilityManager) {
            this.accessibilityManager.announce(`Started processing URLs with ${options.operation} operation`, 'polite');
        }
    }
    
    /**
     * Finish processing state
     */
    finishProcessing() {
        this.isProcessing = false;
        this.processingStartTime = null;
        
        // Clear timeout and progress updates
        this.clearProcessingTimeout();
        this.stopProgressUpdates();
        
        this.controlPanel.hideLoading();
        this.controlPanel.setEnabled(true);
        this.statisticsManager.hideProgress();
        this.updateUI();
    }
    
    /**
     * Handle processing results
     * @param {Object} results - Processing results
     */
    handleProcessingResults(results) {
        if (results.success) {
            // Performance monitoring for large datasets
            const processingTime = results.processingTime || 0;
            const urlsPerSecond = results.inputCount > 0 ? Math.round(results.inputCount / (processingTime / 1000)) : 0;
            
            // Log performance metrics for large datasets
            if (results.inputCount > 10000) {
                console.log('Large Dataset Performance:', {
                    inputCount: results.inputCount,
                    outputCount: results.outputCount,
                    processingTime: processingTime,
                    urlsPerSecond: urlsPerSecond,
                    memoryUsage: this.memoryManager.getMemoryInfo(),
                    performanceMetrics: results.performanceMetrics
                });
            }
            
            // Optimize output rendering for large results
            if (results.results.length > 5000) {
                this.renderLargeResultsOptimized(results.results);
            } else {
                this.textAreaManager.setOutputLines(results.results);
            }
            
            // Update statistics with performance information
            this.statisticsManager.showProcessingCompleted(results);
            
            // Show performance summary for large datasets
            if (results.inputCount > 10000) {
                setTimeout(() => {
                    this.statisticsManager.showInfo(`Performance: ${urlsPerSecond} URLs/second`);
                }, 1500);
            }
            
            // Update UI
            this.updateUI();
            
            // Accessibility announcement
            if (this.accessibilityManager) {
                const message = `Processing completed. ${results.outputCount} URLs in results, ${results.removedCount} URLs removed.`;
                this.accessibilityManager.announce(message, 'polite');
            }
            
            // Trigger memory cleanup for large datasets
            if (results.inputCount > 20000) {
                setTimeout(() => {
                    this.memoryManager.performCleanup();
                }, 3000);
            }
        } else {
            throw new Error(results.errors ? results.errors.join(', ') : 'Processing failed');
        }
    }
    
    /**
     * Render large results with optimization
     * @param {string[]} results - Results to render
     * @private
     */
    renderLargeResultsOptimized(results) {
        const maxDisplayLines = 10000; // Limit display for performance
        
        if (results.length > maxDisplayLines) {
            const truncatedResults = results.slice(0, maxDisplayLines);
            const truncationMessage = `\n... (showing first ${maxDisplayLines} of ${results.length} results)`;
            
            this.textAreaManager.setOutputLines(truncatedResults);
            
            // Add truncation notice
            setTimeout(() => {
                const currentOutput = this.textAreaManager.getOutputText();
                this.textAreaManager.setOutputText(currentOutput + truncationMessage);
            }, 100);
            
            // Show info about truncation
            setTimeout(() => {
                this.statisticsManager.showInfo(`Display limited to ${maxDisplayLines} URLs for performance. Use "Copy Results" to get all results.`);
            }, 2000);
        } else {
            // Use DOM optimizer for smooth rendering
            this.domOptimizer.scheduleUpdate(() => {
                this.textAreaManager.setOutputLines(results);
            }, results, 1);
        }
    }
    
    /**
     * Handle processing errors
     * @param {Error} error - Processing error
     * @param {Object} context - Error context
     */
    handleProcessingError(error, context) {
        const errorInfo = this.errorHandler.handle(error, 'url_processing', context);
        this.statisticsManager.showProcessingFailed(error, context);
        
        // Enhanced error categorization and handling
        const errorCategory = this.categorizeProcessingError(error, context);
        
        // Show appropriate error message based on category
        switch (errorCategory) {
            case 'memory':
                this.handleMemoryError(errorInfo, context);
                break;
            case 'timeout':
                this.handleTimeoutError(errorInfo, context);
                break;
            case 'data':
                this.handleDataError(errorInfo, context);
                break;
            case 'browser':
                this.handleBrowserError(errorInfo, context);
                break;
            default:
                this.handleGenericError(errorInfo, context);
        }
        
        // Accessibility announcement
        if (this.accessibilityManager) {
            this.accessibilityManager.announce(`Processing failed: ${errorInfo.userMessage}`, 'assertive');
        }
        
        // Apply recovery if available
        if (errorInfo.recovery && errorInfo.recovery.attempted && errorInfo.recovery.success) {
            setTimeout(() => {
                this.statisticsManager.showInfo(`Recovery: ${errorInfo.recovery.message}`);
                if (this.accessibilityManager) {
                    this.accessibilityManager.announce(`Recovery applied: ${errorInfo.recovery.message}`, 'polite');
                }
            }, 2000);
        }
        
        // Log detailed error information for debugging
        console.error('Processing Error Details:', {
            error: errorInfo,
            context,
            category: errorCategory,
            memoryInfo: this.memoryManager.getMemoryInfo(),
            performanceMetrics: this.performanceOptimizer.getPerformanceMetrics()
        });
    }
    
    /**
     * Categorize processing error for appropriate handling
     * @param {Error} error - Processing error
     * @param {Object} context - Error context
     * @returns {string} Error category
     * @private
     */
    categorizeProcessingError(error, context) {
        const message = error.message.toLowerCase();
        
        if (message.includes('memory') || message.includes('heap')) {
            return 'memory';
        } else if (message.includes('timeout') || message.includes('timed out')) {
            return 'timeout';
        } else if (message.includes('invalid') || message.includes('malformed') || message.includes('parse')) {
            return 'data';
        } else if (message.includes('worker') || message.includes('browser') || message.includes('support')) {
            return 'browser';
        } else {
            return 'generic';
        }
    }
    
    /**
     * Handle memory-related errors
     * @param {Object} errorInfo - Error information
     * @param {Object} context - Error context
     * @private
     */
    handleMemoryError(errorInfo, context) {
        this.statisticsManager.showError('Memory limit reached. Try processing fewer URLs at once.');
        
        // Suggest optimal batch size
        const memoryInfo = this.memoryManager.getMemoryInfo();
        const suggestedBatchSize = Math.max(1000, Math.floor(5000 * (1 - memoryInfo.usageRatio)));
        
        setTimeout(() => {
            this.statisticsManager.showInfo(`Suggestion: Try processing ${suggestedBatchSize} URLs at a time.`);
        }, 2000);
        
        // Force memory cleanup
        this.memoryManager.forceCleanup();
    }
    
    /**
     * Handle timeout-related errors
     * @param {Object} errorInfo - Error information
     * @param {Object} context - Error context
     * @private
     */
    handleTimeoutError(errorInfo, context) {
        this.statisticsManager.showError('Processing timed out. The dataset may be too large.');
        
        setTimeout(() => {
            this.statisticsManager.showInfo('Try enabling "Process All Text" or use smaller batches.');
        }, 2000);
    }
    
    /**
     * Handle data-related errors
     * @param {Object} errorInfo - Error information
     * @param {Object} context - Error context
     * @private
     */
    handleDataError(errorInfo, context) {
        this.statisticsManager.showError('Some URLs have invalid format and cannot be processed.');
        
        setTimeout(() => {
            this.statisticsManager.showInfo('Invalid URLs will be automatically skipped.');
        }, 2000);
    }
    
    /**
     * Handle browser compatibility errors
     * @param {Object} errorInfo - Error information
     * @param {Object} context - Error context
     * @private
     */
    handleBrowserError(errorInfo, context) {
        this.statisticsManager.showError('Browser compatibility issue detected.');
        
        setTimeout(() => {
            this.statisticsManager.showInfo('Some features may be limited. Consider updating your browser.');
        }, 2000);
    }
    
    /**
     * Handle generic errors
     * @param {Object} errorInfo - Error information
     * @param {Object} context - Error context
     * @private
     */
    handleGenericError(errorInfo, context) {
        this.statisticsManager.showError(errorInfo.userMessage);
    }

    /**
     * Handle validation errors
     * @param {Object} validationResult - Validation result with errors
     */
    handleValidationErrors(validationResult) {
        const summary = this.inputValidator.getValidationSummary(validationResult);
        
        // Show the first (most important) error
        if (summary.messages.length > 0) {
            const firstError = summary.messages.find(m => m.type === 'error');
            if (firstError) {
                this.statisticsManager.showError(firstError.message);
            }
        }
        
        // Log detailed validation results for debugging
        console.warn('Validation failed:', validationResult);
    }

    /**
     * Handle validation warnings
     * @param {Object} validationResult - Validation result with warnings
     */
    handleValidationWarnings(validationResult) {
        const summary = this.inputValidator.getValidationSummary(validationResult);
        
        // Show important warnings
        const warnings = summary.messages.filter(m => m.type === 'warning');
        if (warnings.length > 0) {
            // Show the first warning
            this.statisticsManager.showWarning(warnings[0].message);
        }
        
        // Log all warnings for user awareness
        console.info('Validation warnings:', validationResult.warnings);
    }
    
    /**
     * Handle web worker progress updates
     * @param {Object} progress - Progress information
     */
    handleWorkerProgress(progress) {
        if (progress.type === 'start') {
            this.statisticsManager.showProgress(0, 'Starting worker processing...');
            this.controlPanel.updateLoadingMessage('Worker processing...');
        } else if (progress.type === 'progress') {
            const progressMessage = `Processing batch ${progress.batchIndex} of ${progress.totalBatches} (${progress.processed}/${progress.total} URLs)`;
            
            this.statisticsManager.updateProgress(progress.percentage, progressMessage, {
                showTimeoutWarning: progress.percentage > 80
            });
            
            // Update control panel message based on progress
            if (progress.percentage < 25) {
                this.controlPanel.updateLoadingMessage('Worker processing...');
            } else if (progress.percentage < 75) {
                this.controlPanel.updateLoadingMessage('Processing in background...');
            } else {
                this.controlPanel.updateLoadingMessage('Finalizing results...');
            }
        }
    }
    
    /**
     * Handle web worker completion
     * @param {Object} result - Worker result
     */
    handleWorkerComplete(result) {
        this.statisticsManager.hideProgress();
        this.handleProcessingResults(result);
    }
    
    /**
     * Handle web worker errors
     * @param {Object} error - Worker error
     */
    handleWorkerError(error) {
        this.statisticsManager.hideProgress();
        
        const errorInfo = this.errorHandler.handle(
            new Error(error.message), 
            'web_worker', 
            { source: 'web_worker', originalError: error }
        );
        
        this.statisticsManager.showError(errorInfo.userMessage);
        
        // Apply recovery (fall back to main thread)
        if (errorInfo.recovery && errorInfo.recovery.success) {
            this.useWorker = false;
            setTimeout(() => {
                this.statisticsManager.showInfo(errorInfo.recovery.message);
            }, 1500);
        }
    }
    
    /**
     * Update UI state
     */
    updateUI() {
        // Update copy button state
        const copyResultsBtn = document.getElementById('copy-results-btn');
        if (copyResultsBtn) {
            copyResultsBtn.disabled = !this.textAreaManager.hasOutputContent();
        }
        
        // Update control panel state
        this.controlPanel.updateUI();
    }
    
    /**
     * Get application status
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            isWorkerSupported: this.isWorkerSupported,
            useWorker: this.useWorker,
            statistics: this.statisticsManager.getCurrentStatistics(),
            hasInput: this.textAreaManager.hasInputContent(),
            hasOutput: this.textAreaManager.hasOutputContent()
        };
    }
    
    /**
     * Set up processing timeout
     * @param {Object} options - Processing options
     * @private
     */
    setupProcessingTimeout(options) {
        // Calculate timeout based on operation complexity and data size
        const baseTimeout = 30000; // 30 seconds base
        const perUrlTimeout = 10; // 10ms per URL
        const urls = this.textAreaManager.getInputLines(options.processAll);
        
        const calculatedTimeout = Math.min(
            baseTimeout + (urls.length * perUrlTimeout),
            this.maxProcessingTime
        );
        
        this.processingTimeout = setTimeout(() => {
            this.handleProcessingTimeout();
        }, calculatedTimeout);
    }
    
    /**
     * Clear processing timeout
     * @private
     */
    clearProcessingTimeout() {
        if (this.processingTimeout) {
            clearTimeout(this.processingTimeout);
            this.processingTimeout = null;
        }
    }
    
    /**
     * Handle processing timeout
     * @private
     */
    handleProcessingTimeout() {
        if (this.isProcessing) {
            console.warn('Processing timeout reached');
            
            const timeoutDuration = Date.now() - this.processingStartTime;
            
            // Terminate worker if using one
            if (this.useWorker && this.workerManager) {
                this.workerManager.terminate();
            }
            
            // Create timeout error with proper error code
            const error = new Error(`Processing timed out after ${Math.round(timeoutDuration / 1000)} seconds`);
            error.code = 'PROCESSING_TIMEOUT';
            
            const errorInfo = this.errorHandler.handle(
                error, 
                'processing_timeout', 
                { reason: 'timeout', duration: timeoutDuration }
            );
            
            // Show timeout error through statistics manager
            this.statisticsManager.showProcessingTimeout(timeoutDuration);
            this.statisticsManager.showError(errorInfo.userMessage);
            
            // Apply recovery suggestions
            if (errorInfo.recovery && errorInfo.recovery.suggestion) {
                setTimeout(() => {
                    this.statisticsManager.showInfo(`Suggestion: ${errorInfo.recovery.message}`);
                }, 2000);
            }
            
            // Force finish processing
            this.finishProcessing();
        }
    }
    
    /**
     * Start progress updates for long operations
     * @private
     */
    startProgressUpdates() {
        // Update progress indicator every 500ms for visual feedback
        this.progressUpdateInterval = setInterval(() => {
            if (this.isProcessing && this.processingStartTime) {
                const elapsed = Date.now() - this.processingStartTime;
                
                // Update loading message based on elapsed time
                if (elapsed > 5000) { // After 5 seconds
                    this.controlPanel.updateLoadingMessage('Processing large dataset...');
                } else if (elapsed > 10000) { // After 10 seconds
                    this.controlPanel.updateLoadingMessage('Still processing...');
                } else if (elapsed > 20000) { // After 20 seconds
                    this.controlPanel.updateLoadingMessage('Almost done...');
                }
                
                // Show progress bar for operations taking longer than 3 seconds
                if (elapsed > 3000 && !this.statisticsManager.isProcessing) {
                    // Estimate progress based on time (rough approximation)
                    const estimatedProgress = Math.min(90, (elapsed / 30000) * 100);
                    this.statisticsManager.showProgress(estimatedProgress, 'Processing...');
                }
            }
        }, 500);
    }
    
    /**
     * Stop progress updates
     * @private
     */
    stopProgressUpdates() {
        if (this.progressUpdateInterval) {
            clearInterval(this.progressUpdateInterval);
            this.progressUpdateInterval = null;
        }
    }
    
    /**
     * Reset application to initial state
     */
    reset() {
        // Stop any ongoing processing
        if (this.isProcessing) {
            this.clearProcessingTimeout();
            this.stopProgressUpdates();
            
            if (this.useWorker && this.workerManager) {
                this.workerManager.terminate();
            }
        }
        
        this.textAreaManager.clearAll();
        this.controlPanel.reset();
        this.statisticsManager.resetStatistics();
        this.statisticsManager.hideError();
        this.statisticsManager.hideProgress();
        this.updateUI();
        
        this.isProcessing = false;
        this.processingStartTime = null;
    }
}

