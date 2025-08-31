/**
 * StatisticsManager Class
 * Manages statistics display and feedback system for URL processing
 * Handles real-time counter updates, processing feedback, and error messages
 */
class StatisticsManager {
    constructor() {
        // Statistics elements
        this.inputCountElement = document.getElementById('input-count');
        this.outputCountElement = document.getElementById('output-count');
        this.removedCountElement = document.getElementById('removed-count');
        this.statisticsBar = document.querySelector('.statistics-bar');
        
        // Progress elements
        this.progressContainer = document.querySelector('.progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        
        // Error message element
        this.errorMessage = document.getElementById('error-message');
        
        // Processing state
        this.isProcessing = false;
        this.lastProcessingResult = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the statistics manager
     */
    init() {
        this.resetStatistics();
        this.hideProgress();
        this.hideError();
    }
    
    /**
     * Update input URL count
     * @param {number} count - Number of input URLs
     */
    updateInputCount(count) {
        if (this.inputCountElement) {
            const formattedCount = this.formatNumber(count);
            this.inputCountElement.textContent = formattedCount;
            this.inputCountElement.setAttribute('aria-label', `${formattedCount} input URLs`);
        }
    }
    
    /**
     * Update output URL count
     * @param {number} count - Number of output URLs
     */
    updateOutputCount(count) {
        if (this.outputCountElement) {
            const formattedCount = this.formatNumber(count);
            this.outputCountElement.textContent = formattedCount;
            this.outputCountElement.setAttribute('aria-label', `${formattedCount} output URLs`);
        }
    }
    
    /**
     * Update removed/modified URL count
     * @param {number} count - Number of removed/modified URLs
     */
    updateRemovedCount(count) {
        if (this.removedCountElement) {
            const formattedCount = this.formatNumber(count);
            this.removedCountElement.textContent = formattedCount;
            this.removedCountElement.setAttribute('aria-label', `${formattedCount} URLs removed or modified`);
        }
    }
    
    /**
     * Update all statistics at once
     * @param {object} stats - Statistics object with inputCount, outputCount, removedCount
     */
    updateAllStatistics(stats) {
        if (stats.inputCount !== undefined) {
            this.updateInputCount(stats.inputCount);
        }
        if (stats.outputCount !== undefined) {
            this.updateOutputCount(stats.outputCount);
        }
        if (stats.removedCount !== undefined) {
            this.updateRemovedCount(stats.removedCount);
        }
    }
    
    /**
     * Update statistics from processing results
     * @param {object} results - Processing results object
     */
    updateFromProcessingResults(results) {
        if (!results) return;
        
        this.lastProcessingResult = results;
        
        const stats = {
            inputCount: results.inputCount || 0,
            outputCount: results.outputCount || 0,
            removedCount: results.removedCount || 0
        };
        
        this.updateAllStatistics(stats);
        
        // Show processing feedback
        this.showProcessingFeedback(results);
    }
    
    /**
     * Show processing feedback message
     * @param {object} results - Processing results
     */
    showProcessingFeedback(results) {
        if (!results) return;
        
        const messages = [];
        
        // Success message
        if (results.success) {
            if (results.outputCount > 0) {
                messages.push(`✓ Processing completed successfully`);
                
                if (results.removedCount > 0) {
                    messages.push(`${this.formatNumber(results.removedCount)} URLs removed or modified`);
                }
                
                if (results.invalidCount > 0) {
                    messages.push(`${this.formatNumber(results.invalidCount)} invalid URLs skipped`);
                }
                
                if (results.processingTime) {
                    messages.push(`Completed in ${this.formatTime(results.processingTime)}`);
                }
            } else {
                messages.push('No URLs to process or all URLs were filtered out');
            }
        }
        
        // Show feedback as a temporary success message
        if (messages.length > 0) {
            this.showSuccessMessage(messages.join(' • '));
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     * @param {object} options - Display options
     */
    showError(message, options = {}) {
        if (!this.errorMessage || !message) return;
        
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'error-message';
        this.errorMessage.setAttribute('role', 'alert');
        this.errorMessage.setAttribute('aria-live', 'assertive');
        
        // Auto-hide after specified time
        if (options.autoHide !== false) {
            const hideDelay = options.hideDelay || 5000;
            setTimeout(() => this.hideError(), hideDelay);
        }
        
        // Scroll error into view if needed
        if (options.scrollIntoView) {
            this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    /**
     * Show success message
     * @param {string} message - Success message to display
     * @param {object} options - Display options
     */
    showSuccessMessage(message, options = {}) {
        if (!this.errorMessage || !message) return;
        
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'success-message';
        this.errorMessage.setAttribute('role', 'status');
        this.errorMessage.setAttribute('aria-live', 'polite');
        
        // Auto-hide after specified time
        const hideDelay = options.hideDelay || 3000;
        setTimeout(() => this.hideError(), hideDelay);
    }
    
    /**
     * Show warning message
     * @param {string} message - Warning message to display
     * @param {object} options - Display options
     */
    showWarning(message, options = {}) {
        if (!this.errorMessage || !message) return;
        
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'warning-message';
        this.errorMessage.setAttribute('role', 'alert');
        this.errorMessage.setAttribute('aria-live', 'polite');
        
        // Auto-hide after specified time
        if (options.autoHide !== false) {
            const hideDelay = options.hideDelay || 4000;
            setTimeout(() => this.hideError(), hideDelay);
        }
    }
    
    /**
     * Hide error/success/warning message
     */
    hideError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
            this.errorMessage.textContent = '';
            this.errorMessage.removeAttribute('role');
            this.errorMessage.removeAttribute('aria-live');
        }
    }
    
    /**
     * Show processing progress
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Progress message
     * @param {Object} options - Progress options
     */
    showProgress(progress = 0, message = 'Processing...', options = {}) {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'flex';
        }
        
        if (this.progressFill) {
            const clampedProgress = Math.max(0, Math.min(100, progress));
            this.progressFill.style.width = `${clampedProgress}%`;
            
            // Add indeterminate state for unknown progress
            if (options.indeterminate) {
                this.progressFill.parentElement.classList.add('indeterminate');
            } else {
                this.progressFill.parentElement.classList.remove('indeterminate');
            }
        }
        
        if (this.progressText) {
            this.progressText.textContent = message;
            this.progressText.setAttribute('aria-live', 'polite');
        }
        
        this.isProcessing = true;
        
        // Add timeout warning if specified
        if (options.showTimeoutWarning && progress > 80) {
            this.showTimeoutWarning();
        }
    }
    
    /**
     * Update progress
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Optional progress message
     */
    updateProgress(progress, message) {
        if (this.progressFill) {
            this.progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
        
        if (message && this.progressText) {
            this.progressText.textContent = message;
        }
    }
    
    /**
     * Hide processing progress
     */
    hideProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
        
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
        }
        
        if (this.progressText) {
            this.progressText.textContent = '';
        }
        
        this.isProcessing = false;
    }
    
    /**
     * Show preview mode indicator
     * @param {object} previewInfo - Preview information
     */
    showPreviewIndicator(previewInfo) {
        if (!previewInfo || !previewInfo.isPreview) return;
        
        const message = `Showing first ${this.formatNumber(previewInfo.previewLines)} of ${this.formatNumber(previewInfo.totalLines)} lines. Check "Process All Text" to process all lines.`;
        this.showWarning(message, { autoHide: false });
    }
    
    /**
     * Hide preview mode indicator
     */
    hidePreviewIndicator() {
        this.hideError();
    }
    
    /**
     * Reset all statistics to zero
     */
    resetStatistics() {
        this.updateAllStatistics({
            inputCount: 0,
            outputCount: 0,
            removedCount: 0
        });
        this.lastProcessingResult = null;
    }
    
    /**
     * Get current statistics
     * @returns {object} Current statistics
     */
    getCurrentStatistics() {
        return {
            inputCount: this.parseNumber(this.inputCountElement?.textContent || '0'),
            outputCount: this.parseNumber(this.outputCountElement?.textContent || '0'),
            removedCount: this.parseNumber(this.removedCountElement?.textContent || '0'),
            isProcessing: this.isProcessing,
            lastResult: this.lastProcessingResult
        };
    }
    
    /**
     * Format number for display with locale-specific formatting
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toLocaleString();
    }
    
    /**
     * Parse formatted number string back to number
     * @param {string} str - Formatted number string
     * @returns {number} Parsed number
     */
    parseNumber(str) {
        if (!str || typeof str !== 'string') return 0;
        // Remove locale-specific formatting
        const cleaned = str.replace(/[^\d]/g, '');
        return parseInt(cleaned, 10) || 0;
    }
    
    /**
     * Format processing time for display
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(milliseconds) {
        if (typeof milliseconds !== 'number' || milliseconds < 0) return '0ms';
        
        if (milliseconds < 1000) {
            return `${Math.round(milliseconds)}ms`;
        } else if (milliseconds < 60000) {
            return `${(milliseconds / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(milliseconds / 60000);
            const seconds = Math.round((milliseconds % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    }
    
    /**
     * Show processing started feedback
     * @param {object} options - Processing options
     */
    showProcessingStarted(options = {}) {
        const operation = options.operation || 'Processing';
        const message = `${operation} started...`;
        
        this.showProgress(0, message);
        this.hideError();
    }
    
    /**
     * Show processing completed feedback
     * @param {object} results - Processing results
     */
    showProcessingCompleted(results) {
        this.hideProgress();
        this.updateFromProcessingResults(results);
    }
    
    /**
     * Show processing failed feedback
     * @param {Error} error - Error object
     * @param {object} context - Error context
     */
    showProcessingFailed(error, context = {}) {
        this.hideProgress();
        
        let message = 'Processing failed';
        
        if (error && error.message) {
            // Provide user-friendly error messages
            if (error.message.includes('memory') || error.message.includes('Memory')) {
                message = 'Processing failed: Dataset too large. Try processing in smaller batches.';
            } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                message = 'Processing failed: Operation timed out. Try processing fewer URLs at once.';
            } else if (error.message.includes('worker') || error.message.includes('Worker')) {
                message = 'Processing failed: Unable to process data. Please try again.';
            } else {
                message = `Processing failed: ${error.message}`;
            }
        }
        
        this.showError(message, { scrollIntoView: true });
        
        // Log detailed error for debugging
        console.error('Processing failed:', error, context);
    }
    
    /**
     * Animate statistics update
     * @param {object} fromStats - Starting statistics
     * @param {object} toStats - Target statistics
     * @param {number} duration - Animation duration in milliseconds
     */
    animateStatisticsUpdate(fromStats, toStats, duration = 500) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate values
            const currentStats = {
                inputCount: Math.round(fromStats.inputCount + (toStats.inputCount - fromStats.inputCount) * easeProgress),
                outputCount: Math.round(fromStats.outputCount + (toStats.outputCount - fromStats.outputCount) * easeProgress),
                removedCount: Math.round(fromStats.removedCount + (toStats.removedCount - fromStats.removedCount) * easeProgress)
            };
            
            this.updateAllStatistics(currentStats);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Get statistics summary for accessibility
     * @returns {string} Statistics summary
     */
    getStatisticsSummary() {
        const stats = this.getCurrentStatistics();
        return `Input: ${this.formatNumber(stats.inputCount)} URLs, Output: ${this.formatNumber(stats.outputCount)} URLs, Removed: ${this.formatNumber(stats.removedCount)} URLs`;
    }
    
    /**
     * Show timeout warning
     * @private
     */
    showTimeoutWarning() {
        this.showWarning('Processing is taking longer than expected. Large datasets may take several minutes to complete.', {
            autoHide: true,
            hideDelay: 5000
        });
    }
    
    /**
     * Show processing timeout error
     * @param {number} timeoutDuration - Timeout duration in milliseconds
     */
    showProcessingTimeout(timeoutDuration) {
        const timeoutMinutes = Math.round(timeoutDuration / 60000);
        const message = `Processing timed out after ${timeoutMinutes} minutes. Try processing fewer URLs at once or check "Process All Text" if you're only seeing a preview.`;
        this.showError(message, { autoHide: false });
    }
    
    /**
     * Show indeterminate progress for unknown duration operations
     * @param {string} message - Progress message
     */
    showIndeterminateProgress(message = 'Processing...') {
        this.showProgress(0, message, { indeterminate: true });
    }
    
    /**
     * Announce statistics change for screen readers
     */
    announceStatisticsChange() {
        const summary = this.getStatisticsSummary();
        
        // Create a temporary element for screen reader announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'visually-hidden';
        announcement.textContent = `Statistics updated: ${summary}`;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}