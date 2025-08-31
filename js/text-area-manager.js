/**
 * TextAreaManager - Manages input and output text areas for URL processing
 * Handles text content, line counting, preview mode, and user interactions
 */
class TextAreaManager {
    constructor(inputElementId, outputElementId, statisticsManager = null) {
        this.inputElement = document.getElementById(inputElementId);
        this.outputElement = document.getElementById(outputElementId);
        this.statisticsManager = statisticsManager;
        
        // Preview mode settings
        this.previewLineLimit = 1000;
        this.isPreviewMode = true;
        
        // Initialize DOM optimizer if available
        this.domOptimizer = null;
        this.optimizedInputUpdater = null;
        this.optimizedOutputUpdater = null;
        
        if (typeof DOMOptimizer !== 'undefined') {
            this.domOptimizer = new DOMOptimizer();
            
            // Create optimized updaters for text areas
            this.optimizedInputUpdater = this.domOptimizer.createTextAreaUpdater(this.inputElement, {
                debounceDelay: 50,
                preserveScroll: true
            });
            
            this.optimizedOutputUpdater = this.domOptimizer.createTextAreaUpdater(this.outputElement, {
                debounceDelay: 100,
                preserveScroll: true,
                maxLength: 2000000 // 2MB limit for output
            });
        }
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initial stats update
        this.updateStats();
    }

    /**
     * Initialize event listeners for text areas
     */
    initializeEventListeners() {
        if (this.inputElement) {
            // Update stats when input changes
            this.inputElement.addEventListener('input', () => {
                this.updateStats();
            });
            
            // Handle paste events
            this.inputElement.addEventListener('paste', (e) => {
                // Allow default paste, then update stats after a brief delay
                setTimeout(() => this.updateStats(), 10);
            });
        }
    }

    /**
     * Set text content in the input text area
     * @param {string} text - Text to set
     */
    async setInputText(text) {
        if (this.inputElement) {
            const textToSet = text || '';
            
            // Use optimized updater if available
            if (this.optimizedInputUpdater) {
                await this.optimizedInputUpdater(textToSet);
            } else {
                this.inputElement.value = textToSet;
            }
            
            this.updateStats();
        }
    }

    /**
     * Get text content from the input text area
     * @param {boolean} processAll - Whether to get all text or preview only
     * @returns {string} Text content
     */
    getInputText(processAll = false) {
        if (!this.inputElement) return '';
        
        const fullText = this.inputElement.value;
        
        if (processAll || !this.isPreviewMode) {
            return fullText;
        }
        
        // Return preview (first 1000 lines)
        const lines = this.splitIntoLines(fullText);
        if (lines.length <= this.previewLineLimit) {
            return fullText;
        }
        
        return lines.slice(0, this.previewLineLimit).join('\n');
    }

    /**
     * Set text content in the output text area
     * @param {string} text - Text to set
     */
    async setOutputText(text) {
        if (this.outputElement) {
            const textToSet = text || '';
            
            // Use optimized updater if available
            if (this.optimizedOutputUpdater) {
                await this.optimizedOutputUpdater(textToSet);
            } else {
                this.outputElement.value = textToSet;
            }
            
            this.updateOutputStats();
        }
    }

    /**
     * Get text content from the output text area
     * @returns {string} Text content
     */
    getOutputText() {
        return this.outputElement ? this.outputElement.value : '';
    }

    /**
     * Copy output text to clipboard
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard() {
        try {
            const text = this.getOutputText();
            if (!text.trim()) {
                throw new Error('No content to copy');
            }
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                
                // Announce to accessibility manager if available
                if (window.AccessibilityManager) {
                    const lineCount = this.countLines(text);
                    const message = `Copied ${lineCount} URLs to clipboard`;
                    // Find accessibility manager instance
                    const urlManager = window.urlManagerInstance;
                    if (urlManager && urlManager.accessibilityManager) {
                        urlManager.accessibilityManager.announce(message, 'polite');
                    }
                }
                
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Clear input text area
     */
    clearInput() {
        this.setInputText('');
    }

    /**
     * Clear output text area
     */
    clearOutput() {
        this.setOutputText('');
        this.updateRemovedCount(0);
    }

    /**
     * Clear both text areas
     */
    clearAll() {
        this.clearInput();
        this.clearOutput();
    }

    /**
     * Get array of lines from input text
     * @param {boolean} processAll - Whether to get all lines or preview only
     * @returns {string[]} Array of lines
     */
    getInputLines(processAll = false) {
        const text = this.getInputText(processAll);
        return this.splitIntoLines(text);
    }

    /**
     * Set output from array of lines
     * @param {string[]} lines - Array of lines to set
     */
    setOutputLines(lines) {
        const text = Array.isArray(lines) ? lines.join('\n') : '';
        this.setOutputText(text);
    }

    /**
     * Split text into lines, handling different line endings
     * @param {string} text - Text to split
     * @returns {string[]} Array of lines
     */
    splitIntoLines(text) {
        if (!text || typeof text !== 'string') return [];
        
        // Split on various line endings and filter out empty lines
        return text
            .split(/\r\n|\r|\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    /**
     * Count lines in text
     * @param {string} text - Text to count
     * @returns {number} Number of lines
     */
    countLines(text) {
        return this.splitIntoLines(text).length;
    }

    /**
     * Get input line count
     * @param {boolean} processAll - Whether to count all lines or preview only
     * @returns {number} Number of input lines
     */
    getInputLineCount(processAll = false) {
        const text = this.getInputText(processAll);
        return this.countLines(text);
    }

    /**
     * Get output line count
     * @returns {number} Number of output lines
     */
    getOutputLineCount() {
        const text = this.getOutputText();
        return this.countLines(text);
    }

    /**
     * Check if preview mode is active (input has more than limit lines)
     * @returns {boolean} True if in preview mode
     */
    isInPreviewMode() {
        if (!this.inputElement) return false;
        
        const fullText = this.inputElement.value;
        const totalLines = this.countLines(fullText);
        return totalLines > this.previewLineLimit;
    }

    /**
     * Get preview status information
     * @returns {object} Preview status with total and preview line counts
     */
    getPreviewStatus() {
        const fullText = this.inputElement ? this.inputElement.value : '';
        const totalLines = this.countLines(fullText);
        const isPreview = totalLines > this.previewLineLimit;
        
        return {
            isPreview,
            totalLines,
            previewLines: isPreview ? this.previewLineLimit : totalLines,
            hiddenLines: isPreview ? totalLines - this.previewLineLimit : 0
        };
    }

    /**
     * Set statistics manager instance
     * @param {StatisticsManager} statisticsManager - Statistics manager instance
     */
    setStatisticsManager(statisticsManager) {
        this.statisticsManager = statisticsManager;
        this.updateStats();
    }

    /**
     * Update statistics display
     */
    updateStats() {
        this.updateInputStats();
        this.updateOutputStats();
    }

    /**
     * Update input statistics
     */
    updateInputStats() {
        const count = this.getInputLineCount(false); // Always show preview count in stats
        if (this.statisticsManager) {
            this.statisticsManager.updateInputCount(count);
        }
    }

    /**
     * Update output statistics
     */
    updateOutputStats() {
        const count = this.getOutputLineCount();
        if (this.statisticsManager) {
            this.statisticsManager.updateOutputCount(count);
        }
    }

    /**
     * Update removed count display
     * @param {number} removedCount - Number of removed items
     */
    updateRemovedCount(removedCount) {
        if (this.statisticsManager) {
            this.statisticsManager.updateRemovedCount(removedCount || 0);
        }
    }

    /**
     * Update all statistics with processing results
     * @param {object} results - Processing results object
     */
    updateProcessingStats(results) {
        if (this.statisticsManager && results) {
            this.statisticsManager.updateFromProcessingResults(results);
        } else {
            this.updateInputStats();
        }
    }

    /**
     * Paste text from clipboard to input
     * @returns {Promise<boolean>} Success status
     */
    async pasteFromClipboard() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                this.setInputText(text);
                
                // Announce to accessibility manager if available
                if (window.AccessibilityManager) {
                    const lineCount = this.countLines(text);
                    const message = `Pasted ${lineCount} URLs to input`;
                    // Find accessibility manager instance
                    const urlManager = window.urlManagerInstance;
                    if (urlManager && urlManager.accessibilityManager) {
                        urlManager.accessibilityManager.announce(message, 'polite');
                    }
                }
                
                return true;
            } else {
                // Focus input and trigger paste
                if (this.inputElement) {
                    this.inputElement.focus();
                    document.execCommand('paste');
                    // Update stats after paste
                    setTimeout(() => this.updateStats(), 10);
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to paste from clipboard:', error);
            return false;
        }
        return false;
    }

    /**
     * Get text area elements for external access
     * @returns {object} Object containing input and output elements
     */
    getElements() {
        return {
            input: this.inputElement,
            output: this.outputElement
        };
    }

    /**
     * Focus on input text area
     */
    focusInput() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    /**
     * Focus on output text area
     */
    focusOutput() {
        if (this.outputElement) {
            this.outputElement.focus();
        }
    }

    /**
     * Check if input has content
     * @returns {boolean} True if input has content
     */
    hasInputContent() {
        return this.getInputLineCount() > 0;
    }

    /**
     * Check if output has content
     * @returns {boolean} True if output has content
     */
    hasOutputContent() {
        return this.getOutputLineCount() > 0;
    }

    /**
     * Get processing summary for user feedback
     * @param {boolean} processAll - Whether processing all or preview
     * @returns {string} Summary message
     */
    getProcessingSummary(processAll = false) {
        const previewStatus = this.getPreviewStatus();
        
        if (!processAll && previewStatus.isPreview) {
            return `Processing first ${previewStatus.previewLines.toLocaleString()} lines (${previewStatus.hiddenLines.toLocaleString()} lines hidden). Check "Process All Text" to process all ${previewStatus.totalLines.toLocaleString()} lines.`;
        }
        
        return `Processing ${previewStatus.totalLines.toLocaleString()} lines.`;
    }
}