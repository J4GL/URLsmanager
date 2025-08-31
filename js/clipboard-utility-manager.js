/**
 * ClipboardUtilityManager - Handles clipboard operations, visual feedback, and utility functions
 * Provides copy/paste functionality with keyboard shortcuts and user feedback
 */
class ClipboardUtilityManager {
    constructor(textAreaManager) {
        this.textAreaManager = textAreaManager;
        this.feedbackTimeout = null;
        
        // Initialize event listeners
        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
    }

    /**
     * Initialize button event listeners
     */
    initializeEventListeners() {
        // Copy results button
        const copyBtn = document.getElementById('copy-results-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.handleCopyResults());
        }

        // Paste button
        const pasteBtn = document.getElementById('paste-btn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.handlePaste());
        }

        // Clear input button
        const clearInputBtn = document.getElementById('clear-input-btn');
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => this.handleClearInput());
        }

        // Clear output button
        const clearOutputBtn = document.getElementById('clear-output-btn');
        if (clearOutputBtn) {
            clearOutputBtn.addEventListener('click', () => this.handleClearOutput());
        }
    }

    /**
     * Initialize keyboard shortcuts
     */
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+V or Cmd+V for paste (when input is focused)
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                const activeElement = document.activeElement;
                const inputTextarea = document.getElementById('input-textarea');
                
                if (activeElement === inputTextarea) {
                    // Let default paste behavior work, but show feedback
                    setTimeout(() => {
                        this.textAreaManager.updateStats();
                        this.showFeedback('Pasted from clipboard', 'success');
                    }, 10);
                }
            }

            // Ctrl+C or Cmd+C for copy (when output is focused)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const activeElement = document.activeElement;
                const outputTextarea = document.getElementById('output-textarea');
                
                if (activeElement === outputTextarea && outputTextarea.selectionStart !== outputTextarea.selectionEnd) {
                    // User is selecting text in output, show feedback
                    setTimeout(() => {
                        this.showFeedback('Copied selection to clipboard', 'success');
                    }, 10);
                }
            }

            // Ctrl+A or Cmd+A for select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                const activeElement = document.activeElement;
                const inputTextarea = document.getElementById('input-textarea');
                const outputTextarea = document.getElementById('output-textarea');
                
                if (activeElement === inputTextarea || activeElement === outputTextarea) {
                    setTimeout(() => {
                        this.showFeedback('Selected all text', 'info');
                    }, 10);
                }
            }
        });
    }

    /**
     * Handle copy results button click
     */
    async handleCopyResults() {
        const copyBtn = document.getElementById('copy-results-btn');
        
        if (!this.textAreaManager.hasOutputContent()) {
            this.showFeedback('No results to copy', 'error');
            return;
        }

        // Show processing state
        this.setButtonState(copyBtn, 'processing', 'Copying...');

        try {
            const success = await this.textAreaManager.copyToClipboard();
            
            if (success) {
                this.setButtonState(copyBtn, 'success', 'Copied!');
                this.showFeedback('Results copied to clipboard', 'success');
                
                // Reset button after delay
                setTimeout(() => {
                    this.resetButtonState(copyBtn, 'Copy Results');
                }, 2000);
            } else {
                throw new Error('Copy operation failed');
            }
        } catch (error) {
            console.error('Copy failed:', error);
            this.setButtonState(copyBtn, 'error', 'Copy Failed');
            this.showFeedback('Failed to copy results', 'error');
            
            // Reset button after delay
            setTimeout(() => {
                this.resetButtonState(copyBtn, 'Copy Results');
            }, 2000);
        }
    }

    /**
     * Handle paste button click
     */
    async handlePaste() {
        const pasteBtn = document.getElementById('paste-btn');
        
        // Show processing state
        this.setButtonState(pasteBtn, 'processing', 'Pasting...');

        try {
            const success = await this.textAreaManager.pasteFromClipboard();
            
            if (success) {
                this.setButtonState(pasteBtn, 'success', 'Pasted!');
                this.showFeedback('Content pasted from clipboard', 'success');
                
                // Reset button after delay
                setTimeout(() => {
                    this.resetButtonState(pasteBtn, 'Paste');
                }, 2000);
            } else {
                throw new Error('Paste operation failed');
            }
        } catch (error) {
            console.error('Paste failed:', error);
            this.setButtonState(pasteBtn, 'error', 'Paste Failed');
            this.showFeedback('Failed to paste from clipboard', 'error');
            
            // Reset button after delay
            setTimeout(() => {
                this.resetButtonState(pasteBtn, 'Paste');
            }, 2000);
        }
    }

    /**
     * Handle clear input button click
     */
    handleClearInput() {
        const clearBtn = document.getElementById('clear-input-btn');
        
        if (!this.textAreaManager.hasInputContent()) {
            this.showFeedback('Input is already empty', 'info');
            return;
        }

        // Show processing state briefly
        this.setButtonState(clearBtn, 'processing', 'Clearing...');
        
        setTimeout(() => {
            this.textAreaManager.clearInput();
            this.setButtonState(clearBtn, 'success', 'Cleared!');
            this.showFeedback('Input cleared', 'success');
            
            // Reset button after delay
            setTimeout(() => {
                this.resetButtonState(clearBtn, 'Clear');
            }, 1500);
        }, 100);
    }

    /**
     * Handle clear output button click
     */
    handleClearOutput() {
        const clearBtn = document.getElementById('clear-output-btn');
        
        if (!this.textAreaManager.hasOutputContent()) {
            this.showFeedback('Output is already empty', 'info');
            return;
        }

        // Show processing state briefly
        this.setButtonState(clearBtn, 'processing', 'Clearing...');
        
        setTimeout(() => {
            this.textAreaManager.clearOutput();
            this.setButtonState(clearBtn, 'success', 'Cleared!');
            this.showFeedback('Output cleared', 'success');
            
            // Reset button after delay
            setTimeout(() => {
                this.resetButtonState(clearBtn, 'Clear');
            }, 1500);
        }, 100);
    }

    /**
     * Set button visual state
     * @param {HTMLElement} button - Button element
     * @param {string} state - State: 'processing', 'success', 'error'
     * @param {string} text - Button text
     */
    setButtonState(button, state, text) {
        if (!button) return;
        
        // Remove existing state classes
        button.classList.remove('btn-processing', 'btn-success', 'btn-error');
        
        // Add new state class
        button.classList.add(`btn-${state}`);
        
        // Update button text
        button.textContent = text;
        
        // Disable button during processing
        if (state === 'processing') {
            button.disabled = true;
        }
    }

    /**
     * Reset button to default state
     * @param {HTMLElement} button - Button element
     * @param {string} defaultText - Default button text
     */
    resetButtonState(button, defaultText) {
        if (!button) return;
        
        // Remove state classes
        button.classList.remove('btn-processing', 'btn-success', 'btn-error');
        
        // Reset text and enable button
        button.textContent = defaultText;
        button.disabled = false;
        
        // Re-check if copy button should be disabled based on content
        if (button.id === 'copy-results-btn') {
            button.disabled = !this.textAreaManager.hasOutputContent();
        }
    }

    /**
     * Show feedback message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type: 'success', 'error', 'info'
     */
    showFeedback(message, type = 'info') {
        // Clear existing timeout
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }

        // Remove existing feedback message
        const existingFeedback = document.querySelector('.feedback-message');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${type}`;
        feedback.textContent = message;
        
        // Add to document
        document.body.appendChild(feedback);
        
        // Trigger animation
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        // Auto-remove after delay
        this.feedbackTimeout = setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Update copy button state based on output content
     */
    updateCopyButtonState() {
        const copyBtn = document.getElementById('copy-results-btn');
        if (copyBtn) {
            copyBtn.disabled = !this.textAreaManager.hasOutputContent();
        }
    }

    /**
     * Copy text to clipboard using modern API with fallback
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyTextToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback method
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
            console.error('Failed to copy text:', error);
            return false;
        }
    }

    /**
     * Read text from clipboard using modern API with fallback
     * @returns {Promise<string|null>} Clipboard text or null if failed
     */
    async readTextFromClipboard() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            } else {
                // For fallback, we can't read clipboard directly
                // User needs to use Ctrl+V manually
                return null;
            }
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            return null;
        }
    }

    /**
     * Get clipboard utility manager instance for external access
     * @returns {ClipboardUtilityManager} This instance
     */
    getInstance() {
        return this;
    }
}