/**
 * ControlPanel Class
 * Manages the control panel UI components including operation selection,
 * filter inputs, and process button functionality
 */
class ControlPanel {
    constructor(containerElement, statisticsManager = null) {
        this.container = containerElement || document.querySelector('.control-panel');
        this.statisticsManager = statisticsManager;
        this.operationSelect = null;
        this.filterInputGroup = null;
        this.filterInput = null;
        this.processAllCheckbox = null;
        this.processButton = null;
        this.errorMessage = null;
        this.loadingSpinner = null;
        this.buttonText = null;
        
        this.processCallback = null;
        
        this.init();
    }
    
    /**
     * Initialize the control panel components
     */
    init() {
        this.bindElements();
        this.attachEventListeners();
        this.updateUI();
    }
    
    /**
     * Bind DOM elements to class properties
     */
    bindElements() {
        // Bind multiple operation select menus
        this.cleanModifySelect = document.getElementById('clean-modify-select');
        this.deduplicateSelect = document.getElementById('deduplicate-select');
        this.filterSelect = document.getElementById('filter-select');
        this.sortSelect = document.getElementById('sort-select');
        
        this.filterInputGroup = document.querySelector('.filter-input-group');
        this.filterInput = document.getElementById('filter-input');
        this.processAllCheckbox = document.getElementById('process-all-checkbox');
        this.processButton = document.getElementById('process-btn');
        this.errorMessage = document.getElementById('error-message');
        this.loadingSpinner = this.processButton?.querySelector('.loading-spinner');
        this.buttonText = this.processButton?.querySelector('.btn-text');
        
        // Validate required elements
        if (!this.cleanModifySelect || !this.deduplicateSelect || !this.filterSelect || !this.sortSelect || !this.processButton) {
            throw new Error('Required control panel elements not found');
        }
        
        // Store all select elements for easier iteration
        this.allSelects = [this.cleanModifySelect, this.deduplicateSelect, this.filterSelect, this.sortSelect];
    }
    
    /**
     * Attach event listeners to control elements
     */
    attachEventListeners() {
        // Operation selection change for all select menus
        this.allSelects.forEach(select => {
            select.addEventListener('change', (event) => {
                // If a selection was made, clear the other select menus
                if (event.target.value) {
                    this.allSelects.forEach(otherSelect => {
                        if (otherSelect !== event.target) {
                            otherSelect.value = '';
                        }
                    });
                }
                this.handleOperationChange();
            });
        });
        
        // Process button click
        this.processButton.addEventListener('click', () => {
            this.handleProcessClick();
        });
        
        // Filter input validation
        if (this.filterInput) {
            this.filterInput.addEventListener('input', () => {
                this.validateFilterInput();
                // Ensure button state is updated when filter input changes
                this.updateProcessButtonState();
            });
        }
        
        // Process all checkbox change
        if (this.processAllCheckbox) {
            this.processAllCheckbox.addEventListener('change', () => {
                this.handleProcessAllChange();
            });
        }
    }
    
    /**
     * Handle operation selection change
     */
    handleOperationChange() {
        const operation = this.getOperation();
        const requiresFilter = this.operationRequiresFilter(operation);
        
        // Debug logging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Operation changed:', { operation, requiresFilter });
        }
        
        // Show/hide filter input based on operation
        this.toggleFilterInput(requiresFilter);
        
        // Update process button state
        this.updateProcessButtonState();
        
        // Clear any existing error messages
        this.hideError();
    }
    
    /**
     * Handle process button click
     */
    handleProcessClick() {
        if (this.processCallback && this.validateInput()) {
            const options = this.getProcessingOptions();
            this.processCallback(options);
        }
    }
    
    /**
     * Handle process all checkbox change
     */
    handleProcessAllChange() {
        // This can be used for additional logic when the checkbox state changes
        // For now, just update the UI state
        this.updateUI();
    }
    
    /**
     * Validate filter input when required
     */
    validateFilterInput() {
        const operation = this.getOperation();
        if (this.operationRequiresFilter(operation)) {
            const filterString = this.getFilterString();
            
            // Use InputValidator if available
            if (window.InputValidator) {
                const validator = new InputValidator();
                const result = validator.validateFilterString(filterString, { required: true });
                
                if (!result.isValid && result.errors.length > 0) {
                    this.showError(result.errors[0].message);
                    return false;
                } else if (result.warnings.length > 0) {
                    // Show first warning as info
                    console.info('Filter validation warning:', result.warnings[0].message);
                }
            } else {
                // Fallback validation
                if (!filterString.trim()) {
                    this.showError('Filter string is required for this operation');
                    return false;
                }
            }
            
            this.hideError();
            this.updateProcessButtonState(); // Update button state after validation
            return true;
        }
        this.updateProcessButtonState(); // Update button state for non-filter operations
        return true;
    }
    
    /**
     * Validate all input before processing
     */
    validateInput() {
        const operation = this.getOperation();
        
        // Use InputValidator if available
        if (window.InputValidator) {
            const validator = new InputValidator();
            
            // Validate operation
            const operationResult = validator.validateOperation(operation);
            if (!operationResult.isValid && operationResult.errors.length > 0) {
                this.showError(operationResult.errors[0].message);
                return false;
            }
            
            // Validate filter if required
            if (operationResult.requiresFilter) {
                const filterResult = validator.validateFilterString(this.getFilterString(), { required: true });
                if (!filterResult.isValid && filterResult.errors.length > 0) {
                    this.showError(filterResult.errors[0].message);
                    return false;
                }
            }
        } else {
            // Fallback validation
            if (!operation) {
                this.showError('Please select an operation');
                return false;
            }
            
            if (this.operationRequiresFilter(operation)) {
                const filterString = this.getFilterString();
                if (!filterString.trim()) {
                    this.showError('Filter string is required for this operation');
                    return false;
                }
            }
        }
        
        this.hideError();
        return true;
    }
    
    /**
     * Check if operation requires filter input
     */
    operationRequiresFilter(operation) {
        return operation === 'filterRemove' || operation === 'filterKeep';
    }
    
    /**
     * Toggle filter input visibility
     */
    toggleFilterInput(show) {
        if (this.filterInputGroup) {
            this.filterInputGroup.style.display = show ? 'flex' : 'none';
            
            // Clear filter input when hiding
            if (!show && this.filterInput) {
                this.filterInput.value = '';
            }
        }
    }
    
    /**
     * Update process button state based on current selections
     */
    updateProcessButtonState() {
        if (!this.processButton) return;
        
        const operation = this.getOperation();
        const hasValidFilter = !this.operationRequiresFilter(operation) || 
                              (this.getFilterString() && this.getFilterString().trim());
        
        const shouldBeEnabled = operation && hasValidFilter;
        this.processButton.disabled = !shouldBeEnabled;
        
        // Debug logging to help identify issues
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Button state update:', {
                operation,
                hasValidFilter,
                shouldBeEnabled,
                buttonDisabled: this.processButton.disabled,
                buttonElement: this.processButton,
                operationSelectValue: this.operationSelect?.value,
                filterInputValue: this.filterInput?.value
            });
        }
        
        // Force the button state if there's a mismatch
        if (shouldBeEnabled && this.processButton.disabled) {
            console.warn('Button should be enabled but is disabled - forcing enable');
            this.processButton.disabled = false;
        } else if (!shouldBeEnabled && !this.processButton.disabled) {
            console.warn('Button should be disabled but is enabled - forcing disable');
            this.processButton.disabled = true;
        }
    }
    
    /**
     * Update overall UI state
     */
    updateUI() {
        this.updateProcessButtonState();
    }
    
    /**
     * Get selected operation from any of the select menus
     */
    getOperation() {
        // Check all select menus and return the one that has a value
        for (const select of this.allSelects) {
            if (select.value) {
                return select.value;
            }
        }
        return '';
    }
    
    /**
     * Set selected operation
     */
    setOperation(operation) {
        // Clear all selects first
        this.allSelects.forEach(select => select.value = '');
        
        // Find the appropriate select menu for this operation and set it
        const operationMap = {
            'removeParams': this.cleanModifySelect,
            'trimLastPath': this.cleanModifySelect,
            'extractTLD': this.cleanModifySelect,
            'keepTLD': this.cleanModifySelect,
            'deduplicateTLD': this.deduplicateSelect,
            'deduplicateDomain': this.deduplicateSelect,
            'deduplicateFull': this.deduplicateSelect,
            'filterKeep': this.filterSelect,
            'filterRemove': this.filterSelect,
            'sortByDomain': this.sortSelect,
            'sortByLength': this.sortSelect,
            'sortByFilename': this.sortSelect
        };
        
        const targetSelect = operationMap[operation];
        if (targetSelect) {
            targetSelect.value = operation;
            this.handleOperationChange();
        }
    }
    
    /**
     * Get filter string value
     */
    getFilterString() {
        return this.filterInput?.value || '';
    }
    
    /**
     * Set filter string value
     */
    setFilterString(value) {
        if (this.filterInput) {
            this.filterInput.value = value;
            this.validateFilterInput();
        }
    }
    
    /**
     * Check if process all text is enabled
     */
    isProcessAllEnabled() {
        return this.processAllCheckbox?.checked || false;
    }
    
    /**
     * Set process all checkbox state
     */
    setProcessAll(enabled) {
        if (this.processAllCheckbox) {
            this.processAllCheckbox.checked = enabled;
        }
    }
    
    /**
     * Get processing options object
     */
    getProcessingOptions() {
        return {
            operation: this.getOperation(),
            filterString: this.getFilterString(),
            processAll: this.isProcessAllEnabled()
        };
    }
    
    /**
     * Set callback for process button click
     */
    onProcessClick(callback) {
        this.processCallback = callback;
    }
    
    /**
     * Show loading state
     * @param {string} message - Optional loading message
     */
    showLoading(message = 'Processing...') {
        if (this.processButton) {
            this.processButton.disabled = true;
            this.processButton.classList.add('btn-processing');
        }
        
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'inline-block';
        }
        
        if (this.buttonText) {
            this.buttonText.textContent = message;
        }
        
        // Add loading state to button for accessibility
        this.processButton?.setAttribute('aria-busy', 'true');
        this.processButton?.setAttribute('aria-describedby', 'loading-status');
        
        // Create or update loading status for screen readers
        this.updateLoadingStatus(message);
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
        
        if (this.buttonText) {
            this.buttonText.textContent = 'Process URLs';
        }
        
        if (this.processButton) {
            this.processButton.classList.remove('btn-processing');
            this.processButton.removeAttribute('aria-busy');
            this.processButton.removeAttribute('aria-describedby');
        }
        
        // Remove loading status
        this.removeLoadingStatus();
        
        // Re-enable button based on current state
        this.updateProcessButtonState();
    }
    
    /**
     * Update loading message while processing
     * @param {string} message - Loading message
     */
    updateLoadingMessage(message) {
        if (this.buttonText) {
            this.buttonText.textContent = message;
        }
        this.updateLoadingStatus(message);
    }
    
    /**
     * Create or update loading status for accessibility
     * @param {string} message - Loading message
     * @private
     */
    updateLoadingStatus(message) {
        let statusElement = document.getElementById('loading-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'loading-status';
            statusElement.className = 'visually-hidden';
            statusElement.setAttribute('aria-live', 'polite');
            statusElement.setAttribute('aria-atomic', 'true');
            document.body.appendChild(statusElement);
        }
        statusElement.textContent = message;
    }
    
    /**
     * Remove loading status element
     * @private
     */
    removeLoadingStatus() {
        const statusElement = document.getElementById('loading-status');
        if (statusElement) {
            statusElement.remove();
        }
    }
    
    /**
     * Set statistics manager instance
     * @param {StatisticsManager} statisticsManager - Statistics manager instance
     */
    setStatisticsManager(statisticsManager) {
        this.statisticsManager = statisticsManager;
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.statisticsManager) {
            this.statisticsManager.showError(message);
        } else if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            this.errorMessage.setAttribute('aria-live', 'polite');
        }
    }
    
    /**
     * Hide error message
     */
    hideError() {
        if (this.statisticsManager) {
            this.statisticsManager.hideError();
        } else if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
            this.errorMessage.textContent = '';
        }
    }
    
    /**
     * Reset control panel to initial state
     */
    reset() {
        this.setOperation('');
        this.setFilterString('');
        this.setProcessAll(false);
        this.hideError();
        this.hideLoading();
        this.toggleFilterInput(false);
    }
    
    /**
     * Get available operations list from all select menus
     */
    getAvailableOperations() {
        const allOptions = [];
        
        // Collect options from all select menus
        this.allSelects.forEach(select => {
            const options = Array.from(select.options);
            options
                .filter(option => option.value)
                .forEach(option => {
                    allOptions.push({
                        value: option.value,
                        text: option.textContent,
                        category: select.id.replace('-select', '')
                    });
                });
        });
        
        return allOptions;
    }
    
    /**
     * Enable/disable the control panel
     */
    setEnabled(enabled) {
        // Enable/disable all select menus
        this.allSelects.forEach(select => {
            select.disabled = !enabled;
        });
        
        if (this.filterInput) {
            this.filterInput.disabled = !enabled;
        }
        if (this.processAllCheckbox) {
            this.processAllCheckbox.disabled = !enabled;
        }
        if (this.processButton && enabled) {
            this.updateProcessButtonState();
        } else if (this.processButton) {
            this.processButton.disabled = true;
        }
    }
}