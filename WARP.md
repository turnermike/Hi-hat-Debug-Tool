# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Architecture

This is a Chrome Browser Extension (Manifest V3) that adds `?debug=true` to website URLs. The extension follows a simple, focused architecture:

### Core Components
- **manifest.json**: Extension configuration using Manifest V3 with `activeTab` and `tabs` permissions
- **popup.html**: Extension UI built with Tailwind CSS via CDN, featuring a single button interface
- **popup.js**: Core functionality using Chrome Extension APIs for tab manipulation and URL parsing

### Key Architectural Patterns
- **Vanilla JavaScript**: No build process or frameworks, uses modern ES6+ features
- **Chrome Extension APIs**: Leverages `chrome.tabs.query()` and `chrome.tabs.update()` for tab management
- **URL Manipulation**: Uses the native `URL()` constructor and `URLSearchParams` API for safe URL handling
- **User Feedback**: Implements status messages with automatic hide/show functionality
- **Error Handling**: Comprehensive try-catch blocks with user-friendly error messages

### Extension Structure
```
debug-url-extension/
├── manifest.json    # Extension metadata and permissions
├── popup.html       # UI with Tailwind CSS styling  
├── popup.js         # Tab manipulation and URL logic
└── README.md        # Documentation
```

## Common Development Tasks

### Testing the Extension
```bash
# Load extension in Chrome for testing
# 1. Open chrome://extensions/
# 2. Enable "Developer mode" 
# 3. Click "Load unpacked" and select this directory
# 4. Test by clicking extension icon on any webpage
```

### Reloading Changes During Development
```bash
# After making code changes:
# 1. Go to chrome://extensions/
# 2. Click "Reload" on the Debug URL Helper extension card
# 3. Test changes immediately
```

### Packaging for Distribution
```bash
# Create production package (generates .crx file)
# 1. Go to chrome://extensions/
# 2. Click "Pack extension" 
# 3. Select extension directory
# 4. Optionally provide private key for updates
```

## Styling Guidelines

- Uses Tailwind CSS via CDN (no build process required)
- Follow the existing design system: blue primary colors, gray backgrounds
- Maintain responsive design within the 256px popup width constraint
- Use Tailwind's transition classes for hover states and animations

## Extension-Specific Considerations

- **Manifest V3 Compliance**: All code follows the latest Chrome extension standards
- **Permission Scope**: Uses minimal `activeTab` permission for security
- **URL Safety**: Always validate URLs before manipulation to prevent errors on special pages (chrome://, file://, etc.)
- **User Experience**: Provides clear feedback and auto-closes popup after successful actions
- **Error Handling**: Gracefully handles edge cases like missing tabs or invalid URLs

## Testing Scenarios

When making changes, test these key scenarios:
- Adding debug parameter to clean URLs
- Handling URLs that already have query parameters  
- Behavior on special pages (chrome://, about:, file://)
- Error states and user feedback display
- Extension popup behavior and auto-close functionality