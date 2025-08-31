/**
 * AccessibilityManager - Manages keyboard shortcuts, focus management, and accessibility features
 * Provides comprehensive accessibility support for the URL Manager application
 */
class AccessibilityManager {
    constructor() {
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.keyboardShortcuts = new Map();
        this.announcements = [];
        this.lastAnnouncement = null;
        
        // Initialize accessibility features
        this.init();
    }
    
    /**
     * Initialize accessibility manager
     */
    init() {
        this.setupKeyboardShortcuts();
        this.setupFocusManagement();
        this.setupAriaLiveRegion();
        this.updateFocusableElements();
        
        console.log('AccessibilityManager initialized');
    }
    
    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // Register standard shortcuts
        this.registerShortcut('ctrl+a', (event) => this.handleSelectAll(event));
        this.registerShortcut('ctrl+c', (event) => this.handleCopy(event));
        this.registerShortcut('ctrl+v', (event) => this.handlePaste(event));
        this.registerShortcut('escape', (event) => this.handleEscape(event));
        this.registerShortcut('f6', (event) => this.handleSectionNavigation(event));
        this.registerShortcut('ctrl+enter', (event) => this.handleProcessShortcut(event));
        
        console.log('Keyboard shortcuts registered');
    }
    
    /**
     * Register a keyboard shortcut
     * @param {string} shortcut - Shortcut key combination (e.g., 'ctrl+a')
     * @param {Function} handler - Handler function
     */
    registerShortcut(shortcut, handler) {
        this.keyboardShortcuts.set(shortcut.toLowerCase(), handler);
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        const shortcut = this.getShortcutString(event);
        const handler = this.keyboardShortcuts.get(shortcut);
        
        if (handler) {
            handler(event);
        }
    }
    
    /**
     * Get shortcut string from keyboard event
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {string} Shortcut string
     */
    getShortcutString(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('ctrl');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');
        if (event.metaKey) parts.push('meta');
        
        const key = event.key.toLowerCase();
        if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
            parts.push(key);
        }
        
        return parts.join('+');
    }
    
    /**
     * Handle Ctrl+A (Select All)
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleSelectAll(event) {
        const activeElement = document.activeElement;
        
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            // Let the browser handle textarea selection
            return;
        }
        
        // If not in a textarea, select all text in the focused text area
        const inputTextarea = document.getElementById('input-textarea');
        const outputTextarea = document.getElementById('output-textarea');
        
        if (activeElement === inputTextarea || activeElement === outputTextarea) {
            // Browser will handle this automatically
            return;
        }
        
        // If no textarea is focused, focus and select input textarea
        if (inputTextarea) {
            event.preventDefault();
            inputTextarea.focus();
            inputTextarea.select();
            this.announce('All text selected in input area');
        }
    }
    
    /**
     * Handle Ctrl+C (Copy)
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleCopy(event) {
        const activeElement = document.activeElement;
        
        // If in a textarea with selection, let browser handle it
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
            const hasSelection = activeElement.selectionStart !== activeElement.selectionEnd;
            if (hasSelection) {
                return; // Let browser handle
            }
        }
        
        // If in output textarea without selection, copy all output
        const outputTextarea = document.getElementById('output-textarea');
        if (activeElement === outputTextarea) {
            event.preventDefault();
            this.copyOutputToClipboard();
            return;
        }
        
        // If not in any textarea, copy output results
        if (!activeElement || activeElement.tagName !== 'TEXTAREA') {
            event.preventDefault();
            this.copyOutputToClipboard();
        }
    }
    
    /**
     * Handle Ctrl+V (Paste)
     * @param {KeyboardEvent} event - Keyboard event
     */
    handlePaste(event) {
        const activeElement = document.activeElement;
        
        // If in input textarea, let browser handle it
        const inputTextarea = document.getElementById('input-textarea');
        if (activeElement === inputTextarea) {
            return; // Let browser handle
        }
        
        // If not in input textarea, focus it and paste
        if (inputTextarea) {
            event.preventDefault();
            inputTextarea.focus();
            this.pasteToInput();
        }
    }
    
    /**
     * Handle Escape key
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleEscape(event) {
        // Clear error messages
        const errorMessage = document.getElementById('error-message');
        if (errorMessage && errorMessage.style.display !== 'none') {
            errorMessage.style.display = 'none';
            this.announce('Error message cleared');
            return;
        }
        
        // Clear focus from current element
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
            this.announce('Focus cleared');
        }
    }
    
    /**
     * Handle F6 (Section Navigation)
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleSectionNavigation(event) {
        event.preventDefault();
        this.navigateToNextSection();
    }
    
    /**
     * Handle Ctrl+Enter (Process URLs)
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleProcessShortcut(event) {
        event.preventDefault();
        const processButton = document.getElementById('process-btn');
        if (processButton && !processButton.disabled) {
            processButton.click();
            this.announce('Processing URLs');
        } else {
            this.announce('Process button is not available');
        }
    }
    
    /**
     * Copy output to clipboard
     */
    async copyOutputToClipboard() {
        try {
            const outputTextarea = document.getElementById('output-textarea');
            if (outputTextarea && outputTextarea.value.trim()) {
                await navigator.clipboard.writeText(outputTextarea.value);
                this.announce('Results copied to clipboard');
            } else {
                this.announce('No results to copy');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.announce('Failed to copy to clipboard');
        }
    }
    
    /**
     * Paste to input textarea
     */
    async pasteToInput() {
        try {
            const text = await navigator.clipboard.readText();
            const inputTextarea = document.getElementById('input-textarea');
            if (inputTextarea) {
                inputTextarea.value = text;
                inputTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                this.announce(`Pasted ${text.split('\n').length} lines to input`);
            }
        } catch (error) {
            console.error('Failed to paste from clipboard:', error);
            this.announce('Failed to paste from clipboard');
        }
    }
    
    /**
     * Set up focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (event) => {
            this.handleFocusChange(event.target);
        });
        
        // Set up tab navigation
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.handleTabNavigation(event);
            }
        });
    }
    
    /**
     * Handle focus changes
     * @param {Element} element - Focused element
     */
    handleFocusChange(element) {
        // Update current focus index
        const index = this.focusableElements.indexOf(element);
        if (index !== -1) {
            this.currentFocusIndex = index;
        }
        
        // Announce focus changes for screen readers
        this.announceFocusChange(element);
    }
    
    /**
     * Announce focus changes
     * @param {Element} element - Focused element
     */
    announceFocusChange(element) {
        if (!element) return;
        
        let announcement = '';
        
        // Get element description
        const label = this.getElementLabel(element);
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        
        if (label) {
            announcement = `${label}, ${role}`;
        } else {
            announcement = role;
        }
        
        // Add state information
        const state = this.getElementState(element);
        if (state) {
            announcement += `, ${state}`;
        }
        
        // Don't announce if it's the same as the last announcement
        if (announcement !== this.lastAnnouncement) {
            this.announce(announcement, 'polite');
            this.lastAnnouncement = announcement;
        }
    }
    
    /**
     * Get element label
     * @param {Element} element - Element to get label for
     * @returns {string} Element label
     */
    getElementLabel(element) {
        // Check for aria-label
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }
        
        // Check for associated label
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }
        
        // Check for aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement) {
                return labelElement.textContent.trim();
            }
        }
        
        // Check for placeholder
        if (element.placeholder) {
            return element.placeholder;
        }
        
        // Check for button text
        if (element.tagName === 'BUTTON') {
            return element.textContent.trim();
        }
        
        return '';
    }
    
    /**
     * Get element state
     * @param {Element} element - Element to get state for
     * @returns {string} Element state
     */
    getElementState(element) {
        const states = [];
        
        if (element.disabled) states.push('disabled');
        if (element.checked) states.push('checked');
        if (element.selected) states.push('selected');
        if (element.getAttribute('aria-expanded') === 'true') states.push('expanded');
        if (element.getAttribute('aria-expanded') === 'false') states.push('collapsed');
        if (element.required) states.push('required');
        if (element.readOnly) states.push('read only');
        
        return states.join(', ');
    }
    
    /**
     * Handle tab navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleTabNavigation(event) {
        // Update focusable elements list
        this.updateFocusableElements();
        
        // Let browser handle normal tab navigation
        // This method can be extended for custom tab behavior if needed
    }
    
    /**
     * Navigate to next section
     */
    navigateToNextSection() {
        const sections = [
            document.getElementById('input-textarea'),
            document.getElementById('operation-select'),
            document.getElementById('process-btn'),
            document.getElementById('output-textarea')
        ].filter(el => el && !el.disabled);
        
        if (sections.length === 0) return;
        
        const currentElement = document.activeElement;
        let currentIndex = sections.indexOf(currentElement);
        
        // Move to next section
        currentIndex = (currentIndex + 1) % sections.length;
        sections[currentIndex].focus();
        
        // Announce section change
        const sectionNames = ['Input Area', 'Operation Selection', 'Process Button', 'Output Area'];
        this.announce(`Navigated to ${sectionNames[currentIndex]}`);
    }
    
    /**
     * Update list of focusable elements
     */
    updateFocusableElements() {
        const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(document.querySelectorAll(selector))
            .filter(el => !el.disabled && el.offsetParent !== null);
    }
    
    /**
     * Set up ARIA live region for announcements
     */
    setupAriaLiveRegion() {
        // Create polite live region
        let politeRegion = document.getElementById('aria-live-polite');
        if (!politeRegion) {
            politeRegion = document.createElement('div');
            politeRegion.id = 'aria-live-polite';
            politeRegion.setAttribute('aria-live', 'polite');
            politeRegion.setAttribute('aria-atomic', 'true');
            politeRegion.className = 'visually-hidden';
            document.body.appendChild(politeRegion);
        }
        
        // Create assertive live region
        let assertiveRegion = document.getElementById('aria-live-assertive');
        if (!assertiveRegion) {
            assertiveRegion = document.createElement('div');
            assertiveRegion.id = 'aria-live-assertive';
            assertiveRegion.setAttribute('aria-live', 'assertive');
            assertiveRegion.setAttribute('aria-atomic', 'true');
            assertiveRegion.className = 'visually-hidden';
            document.body.appendChild(assertiveRegion);
        }
    }
    
    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        if (!message) return;
        
        const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
        const region = document.getElementById(regionId);
        
        if (region) {
            // Clear and set message
            region.textContent = '';
            setTimeout(() => {
                region.textContent = message;
            }, 100);
            
            // Store announcement
            this.announcements.push({
                message,
                priority,
                timestamp: Date.now()
            });
            
            // Keep only last 10 announcements
            if (this.announcements.length > 10) {
                this.announcements = this.announcements.slice(-10);
            }
        }
        
        console.log(`Accessibility announcement (${priority}): ${message}`);
    }
    
    /**
     * Focus first focusable element
     */
    focusFirst() {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }
    }
    
    /**
     * Focus last focusable element
     */
    focusLast() {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
            this.focusableElements[this.focusableElements.length - 1].focus();
        }
    }
    
    /**
     * Focus element by ID
     * @param {string} elementId - Element ID to focus
     */
    focusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element && !element.disabled) {
            element.focus();
            return true;
        }
        return false;
    }
    
    /**
     * Get recent announcements
     * @param {number} count - Number of recent announcements to get
     * @returns {Array} Recent announcements
     */
    getRecentAnnouncements(count = 5) {
        return this.announcements.slice(-count);
    }
    
    /**
     * Clear all announcements
     */
    clearAnnouncements() {
        this.announcements = [];
        
        const politeRegion = document.getElementById('aria-live-polite');
        const assertiveRegion = document.getElementById('aria-live-assertive');
        
        if (politeRegion) politeRegion.textContent = '';
        if (assertiveRegion) assertiveRegion.textContent = '';
    }
    
    /**
     * Get accessibility status
     * @returns {Object} Accessibility status information
     */
    getAccessibilityStatus() {
        return {
            focusableElementsCount: this.focusableElements.length,
            currentFocusIndex: this.currentFocusIndex,
            recentAnnouncementsCount: this.announcements.length,
            keyboardShortcutsCount: this.keyboardShortcuts.size,
            hasAriaLiveRegions: !!(document.getElementById('aria-live-polite') && document.getElementById('aria-live-assertive'))
        };
    }
}