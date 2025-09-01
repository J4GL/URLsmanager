# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URL Manager is a client-side web application for processing and manipulating large collections of URLs. It's built with vanilla JavaScript and uses Web Workers for performance optimization. The application is entirely client-side with no server dependencies.

## Development Commands

### Testing
```bash
npm run test          # Run Playwright tests
npm run test:playwright  # Alternative command
npm run test:pw       # Short version
```

### Local Development
```bash
# Serve files locally using Python
python -m http.server 8000

# Or using Node.js serve
npx serve .
```

### Running Tests
- Tests use Playwright and are configured for visible browser windows
- Test configuration is in `playwright.config.ts`
- Base URL can be overridden with `MCP_BASE_URL` environment variable

## Architecture Overview

### Core Application Structure
The application follows a modular component-based architecture with a main controller pattern:

- **URLManager** (`js/url-manager.js`) - Main application controller that coordinates all components
- **URLProcessor** (`js/url-processor.js`) - Core URL processing engine with operations like deduplication, filtering, parameter removal
- **WorkerManager** (`js/worker-manager.js`) - Manages Web Worker lifecycle and communication for background processing
- **StatisticsManager** - Real-time statistics tracking for input/output/removed URL counts
- **TextAreaManager** - Input/output text area management with clipboard integration
- **ControlPanel** - UI controls and operation selection
- **AccessibilityManager** - WCAG compliance and accessibility features

### Performance Optimization Components
- **PerformanceOptimizer** - General performance optimizations
- **MemoryManager** - Memory management and garbage collection hints
- **DOMOptimizer** - Efficient DOM updates and event handling

### Web Worker Architecture
- **Standalone Worker** (`js/url-worker-standalone.js`) - Self-contained worker for large dataset processing
- **Modular Worker** (`js/url-worker.js`) - Fallback worker implementation
- Workers automatically handle datasets >10,000 URLs to prevent UI blocking

### Error Handling
- Centralized error handling via **ErrorHandler** class
- Browser compatibility checks on initialization
- Input validation for all operations
- User-friendly error messages with accessibility support

## Key Features

### URL Operations
- Remove query parameters from URLs
- Deduplicate by TLD, domain, or exact match
- Filter URLs by containing/excluding text
- Extract domain-only versions
- Sort by domain, length, or filename

### Performance Features
- Automatic Web Worker usage for large datasets (10,000+ URLs)
- Memory optimization for datasets up to 1M URLs
- Progress tracking for long-running operations
- Batch processing with configurable chunk sizes

### Accessibility
- Full WCAG compliance with ARIA labels
- Keyboard navigation (Ctrl+Enter to process, Ctrl+C to copy)
- Screen reader support
- High contrast mode detection
- Focus management and skip links

## File Loading Order
Scripts must be loaded in this specific order (as defined in `index.html`):

1. Performance optimization scripts first
2. Core application scripts
3. URLManager initialization in DOMContentLoaded

## Development Notes

### Component Integration
- All components are instantiated and managed by URLManager
- Components communicate through the main controller pattern
- Shared state is managed centrally in URLManager

### Testing Approach
- Integration tests run automatically in development mode (localhost)
- Manual testing with various URL formats and dataset sizes
- Browser compatibility testing across Chrome 80+, Firefox 75+, Safari 13+

### Memory Considerations
- Application optimized for large datasets but memory usage scales with input size
- Use "Process All Text" option for datasets >1000 lines
- Web Workers help prevent memory issues in main thread

### Browser Compatibility Requirements
- ES6+ JavaScript (classes, async/await)
- Web Workers support
- CSS Grid and Flexbox
- Clipboard API for copy functionality