# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The Hi-hat Debug Tool is a comprehensive Chrome extension that provides debugging, security, and development utilities. It enables smart URL parameter management (especially for debugging), form field clearing, page measurement, vulnerability scanning, and WordPress-specific debugging features.

## Architecture

The extension follows the modern Chrome Extension Manifest V3 architecture:

- **Background Service Worker** (`background.js`) handles extension lifecycle, keyboard shortcuts, and storage management
- **Content Script** (`content.js`) is injected into all web pages and provides main functionality for WordPress detection, form clearing, measurement tools, and vulnerability scanning
- **Popup Interface** (`popup/`) provides the UI for interacting with extension features
- **Utilities** (`scripts/utils.js`) contains shared helper functions for URL manipulation, Chrome extension APIs, and detection patterns

### Key Components

- **WordPress Detection**: Automatically detects WordPress sites and shows contextually relevant tools
- **Security Scanning**: Performs client-side vulnerability detection for common web security issues
- **Measurement Tools**: Canvas-based overlay system for measuring page elements
- **Cache Management**: Site-specific data clearing using Chrome's browsingData API
- **URL Parameter Management**: Smart cycling and management of debug and WordPress-specific parameters

## Testing

Run tests with:
```bash
npm test          # Run all tests
npm run test:watch   # Run in watch mode
npm run test:coverage  # Generate coverage report
```

The test suite includes 23+ unit tests covering cache clearing, cookie clearing, and other core functionality. Tests are located in `tests/` with setup in `tests/setup.js`.

## Development Workflow

Since this is a Chrome extension, local development requires:
1. Loading the extension in Chrome (`chrome://extensions/` > "Load unpacked")
2. Making changes to source files
3. Clicking "Reload" on the extension card to test changes
4. No build process required - direct file modification

The extension uses vanilla JavaScript with minimal dependencies defined in `package.json` (mostly for testing).

## Common Development Tasks

### Adding New Debug Parameters
Add parameters to `extensionParameters` in `scripts/utils.js` to ensure they're included in the "Reset URL Params" functionality.

### WordPress Detection Patterns
WordPress detection relies on patterns defined in `content.js` and `scripts/utils.js`. To add new plugin detection, update the `commonPlugins` array in `WordPressPatterns`.

### Security Scanning
Vulnerability patterns are defined in `SecurityPatterns` in `scripts/utils.js`. Add new security checks to the `scanForVulnerabilities()` function in `content.js`.

### Cache Clearing Implementation
All cache clearing functionality uses the `getCurrentOrigin()` helper and Chrome's `browsingData.remove` API. Clearing is site-origin specific, not global browser cache.