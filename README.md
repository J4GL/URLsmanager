# URL Manager

A powerful, client-side web application for efficiently managing, processing, and manipulating large collections of URLs. Built with vanilla JavaScript and optimized for performance and accessibility.

## Features

### Core Operations
- **Remove Parameters** - Strip query parameters from URLs
- **Deduplicate by TLD** - Remove duplicate URLs based on top-level domain
- **Deduplicate by Domain** - Remove duplicates including subdomains
- **Deduplicate by Full URL** - Remove exact URL duplicates
- **Filter URLs** - Keep or remove URLs containing specific text
- **Keep TLD Only** - Extract only the top-level domain without subdomains

### Performance & Usability
- **Web Workers** - Background processing for large datasets without UI blocking
- **Memory Management** - Efficient handling of large URL collections
- **Real-time Statistics** - Live count of input, output, and removed URLs
- **Progress Tracking** - Visual progress bar for long-running operations
- **Clipboard Integration** - Easy copy/paste functionality
- **Keyboard Shortcuts** - Ctrl+Enter to process, Ctrl+C to copy results

### Accessibility
- **WCAG Compliant** - Full keyboard navigation and screen reader support
- **Skip Links** - Quick navigation for assistive technologies
- **ARIA Labels** - Comprehensive labeling for all interactive elements
- **High Contrast Support** - Optimized for users with visual impairments
- **Focus Management** - Clear visual focus indicators

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- No server or installation required - runs entirely in the browser

### Usage

1. **Open the Application**
   - Open `index.html` in your web browser
   - Or serve the files from a local web server

2. **Input URLs**
   - Paste or type URLs into the left textarea (one per line)
   - Use the "Paste" button for clipboard content

3. **Select Operation**
   - Choose from the dropdown menu in the center panel
   - Some operations require additional filter text

4. **Process URLs**
   - Click "Process URLs" or press Ctrl+Enter
   - Watch the progress bar for large datasets

5. **Get Results**
   - Processed URLs appear in the right textarea
   - Use "Copy Results" or Ctrl+C to copy to clipboard

### Example Operations

**Remove Parameters:**
```
Input:  https://example.com/page?utm_source=google&ref=123
Output: https://example.com/page
```

**Deduplicate by Domain:**
```
Input:  https://example.com/page1
        https://example.com/page2
        https://sub.example.com/page3
Output: https://example.com/page1
        https://sub.example.com/page3
```

**Filter - Keep URLs containing "api":**
```
Input:  https://example.com/api/users
        https://example.com/about
        https://api.service.com/data
Output: https://example.com/api/users
        https://api.service.com/data
```

## Architecture

### Core Components

- **URLManager** - Main application controller
- **URLProcessor** - Core URL processing logic
- **WorkerManager** - Web Worker coordination for background processing
- **StatisticsManager** - Real-time statistics tracking
- **TextAreaManager** - Input/output text area management
- **ControlPanel** - User interface controls
- **AccessibilityManager** - Accessibility features and ARIA management
- **ClipboardUtilityManager** - Clipboard operations
- **ErrorHandler** - Centralized error handling and user feedback

### Performance Optimizations

- **Web Workers** - CPU-intensive operations run in background threads
- **Memory Management** - Automatic cleanup and garbage collection hints
- **DOM Optimization** - Efficient DOM updates and event handling
- **Lazy Loading** - Components initialized only when needed

## File Structure

```
├── index.html                      # Main application page
├── styles.css                      # Application styles and themes
├── js/
│   ├── url-manager.js              # Main application controller
│   ├── url-processor.js            # Core URL processing logic
│   ├── worker-manager.js           # Web Worker management
│   ├── url-worker.js               # Web Worker implementation
│   ├── statistics-manager.js      # Statistics tracking
│   ├── text-area-manager.js       # Text area management
│   ├── control-panel.js           # UI controls
│   ├── accessibility-manager.js   # Accessibility features
│   ├── clipboard-utility-manager.js # Clipboard operations
│   ├── error-handler.js           # Error handling
│   ├── input-validator.js         # Input validation
│   ├── performance-optimizer.js   # Performance optimizations
│   ├── memory-manager.js          # Memory management
│   └── dom-optimizer.js           # DOM optimization
├── README.md                       # This file
├── UNLICENSE                       # Public domain license
└── .gitignore                      # Git ignore rules
```

## Browser Compatibility

- **Chrome/Edge** 80+
- **Firefox** 75+
- **Safari** 13+
- **Mobile browsers** with modern JavaScript support

### Required Features
- ES6+ JavaScript (classes, async/await, modules)
- Web Workers
- CSS Grid and Flexbox
- Clipboard API (for copy functionality)

## Development

### Local Development
```bash
# Serve files locally (Python example)
python -m http.server 8000

# Or use any static file server
npx serve .
```

### Testing
- Open browser developer tools for console logs
- Integration tests run automatically in development mode
- Manual testing with various URL formats and sizes

### Contributing
This project is in the public domain. Feel free to:
- Fork and modify for your needs
- Submit improvements via pull requests
- Report issues or suggest features
- Use the code in your own projects

## Performance Notes

### Large Datasets
- **1,000+ URLs**: Processed instantly
- **10,000+ URLs**: Uses Web Workers automatically
- **100,000+ URLs**: Enable "Process All Text" option
- **Memory usage**: Optimized for datasets up to 1M URLs

### Optimization Tips
- Use "Process All Text" for large datasets
- Close other browser tabs for maximum performance
- Consider breaking very large datasets into smaller chunks

## Security

- **Client-side only** - No data sent to external servers
- **Content Security Policy** - Prevents XSS attacks
- **Input validation** - Sanitizes all user input
- **No external dependencies** - Reduces attack surface

## Accessibility Features

- **Keyboard Navigation** - Full functionality without mouse
- **Screen Reader Support** - NVDA, JAWS, VoiceOver compatible
- **High Contrast Mode** - Automatic detection and optimization
- **Focus Management** - Clear visual focus indicators
- **Skip Links** - Quick navigation to main content
- **ARIA Labels** - Comprehensive labeling for all elements

## License

This project is released into the public domain under The Unlicense. See [UNLICENSE](UNLICENSE) for details.

## Changelog

### v1.0.0
- Initial release with core URL processing operations
- Web Worker support for large datasets
- Full accessibility compliance
- Performance optimizations and memory management
- Comprehensive error handling and user feedback

---

**URL Manager** - Efficient URL processing made simple.