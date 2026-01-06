# Hi-hat Debug Tool

A compact Chrome extension that provides developer-focused utilities for debugging, site troubleshooting, and lightweight client-side security checks. Designed for web developers, QA engineers, and security researchers who need fast, origin-scoped tools.

## Features

- Smart Debug Parameters: cycle `?debug=1` → `?debug=true` → remove
- Reset URL Params: remove common and extension-added debug/query params
- Form Clearing: clear inputs, textareas, selects, checkboxes, radios and contentEditable areas
- Page Measurement: click-and-drag pixel measurements copied to clipboard
- Site-Scoped Clear Data: clear cache, cookies, localStorage, indexedDB, service workers and more for the current origin
- Vulnerability Scan: lightweight client-side checks for common issues (mixed content, missing headers, XSS surface, exposed data patterns)
- WordPress Helpers: extra tools when WordPress is detected (debug toggles, cache busting, optional role simulation)

## Installation

Install as an unpacked extension (developer mode):

1. Clone the repository:

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd debug-extension
```

2. Open Chrome extensions: `chrome://extensions/`
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked** and select this repository folder

To distribute, create a ZIP release on GitHub or submit the packaged extension to the Chrome Web Store.

## Usage

1. Open any website in Chrome.
2. Click the extension icon to open the popup.
3. Use the controls in the popup:
   - **Debug** — cycle debug query values on the current URL.
   - **Reset URL Params** — remove common debug/cache/query parameters.
   - **Clear Data** — clear site-scoped storage and cache for the current origin.
   - **Measure** — click-and-drag to measure pixel distances on the page.
   - **Scan** — run a lightweight client-side security scan of the page.

## Files of interest

- [manifest.json](manifest.json#L1) — extension configuration and permissions
- [background.js](background.js#L1) — background/service worker logic
- [content.js](content.js#L1) — content-script actions and page analysis
- [popup/popup.html](popup/popup.html#L1) and [popup/popup.js](popup/popup.js#L1) — popup UI and behavior
- [scripts/utils.js](scripts/utils.js#L1) — shared helper utilities

## How it works (high level)

- The popup UI communicates with the background script and content script using the Chrome Extensions messaging and Tabs APIs.
- Site-scoped clearing uses Chrome's `browsingData` methods restricted to the active origin.
- WordPress detection inspects common DOM markers (admin bar, meta generator tag, `wp-content` paths) to show WP-specific helpers.
- The vulnerability scan performs client-side DOM checks and pattern matching — this is a convenience tool and not a full security audit.

## Development

Prerequisites: Node.js (for tests and tooling), Google Chrome

Setup:

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd debug-extension
npm install
```

Work cycle:

- Make changes to source files
- Reload the extension from `chrome://extensions/` → Reload

### Tests

Run unit tests (Jest):

```bash
npm test
```

See the `tests/` directory for test files and mock setup.

## Contributing

Contributions and bug reports are welcome.

1. Fork the repository
2. Create a topic branch (feature/ or fix/)
3. Run tests locally and add tests for new behavior
4. Open a pull request describing the change

## License

This project is released under the MIT License.

## Support

Open an issue in the repository for bugs or feature requests. Include steps to reproduce and Chrome version where applicable.

---

If you'd like, I can also:

- remove or consolidate the duplicate content in `tests/README.md`
- update the repository `package.json` README fields or add GitHub release notes

Would you like me to commit this README change to the repo now?

# Hi-hat Debug Tool

A small, practical Chrome extension to speed up web debugging and site troubleshooting. It provides quick toggles for debug query parameters, form clearing, page measurements, site-scoped data clearing, and an on-page security scan. Useful for developers, QA, and security researchers.

## Quick links

- Source: repository root
- Popup UI: [popup/popup.html](popup/popup.html#L1)
- Extension manifest: [manifest.json](manifest.json#L1)

## Features

- Smart Debug Parameters: toggle `debug` query values (cycles `?debug=1` → `?debug=true` → remove)
- Reset URL Params: remove extension-added and common debug/query params
- Form Clearing: clear inputs, textareas, selects, checkboxes, radios and contentEditable areas
- Page Measurement: click-and-drag pixel measurements copied to clipboard
- Site-Scoped Clear Data: clear cache, cookies, localStorage, indexedDB, service workers and more for the current origin
- Vulnerability Scan: client-side checks for common issues (mixed content, missing headers, XSS surface, exposed data patterns)
- WordPress Helpers: automatically-visible tools when WordPress is detected (WP debug toggles, cache busting, user-role simulation if supported)

## Installation

Install as an unpacked extension (developer mode):

1. Clone the repository:

```bash
git clone <your-repo-url>
cd debug-extension
```

2. Open Chrome extensions: `chrome://extensions/`
3. Enable Developer mode (top-right)
4. Click "Load unpacked" and select the repository folder

For distribution, package a ZIP of the extension and publish a release on GitHub or load via the Chrome Web Store.

## Usage (quick)

1. Open any website
2. Click the extension icon to open the popup
3. Use the buttons for the task you need:
   - Debug: cycle debug query values
   - Reset URL Params: remove debug/cache/user parameters
   - Clear Data: remove site-scoped cache and storage types
   - Measure: click-and-drag to measure elements
   - Scan: run a quick client-side security analysis of the page

## Files of interest

- [manifest.json](manifest.json#L1) — extension config and permissions
- [background.js](background.js#L1) — background/service worker logic
- [content.js](content.js#L1) — page analysis and DOM actions
- [popup/popup.html](popup/popup.html#L1), [popup/popup.js](popup/popup.js#L1) — UI and popup logic
- [scripts/utils.js](scripts/utils.js#L1) — shared helpers

## How it works (high level)

- The popup UI calls the background script and content scripts to perform actions on the active tab using the Chrome Extensions API.
- Site-scoped clearing uses the `browsingData` API restricted to the current origin.
- WordPress detection inspects DOM markers (admin bar, meta generator, `wp-content` paths) to conditionally show WP tools.
- The vulnerability scan is a lightweight client-side DOM analysis (not a replacement for a full security audit).

## Development

Prerequisites: Node.js (for tests), Google Chrome

Local workflow:

```bash
git clone <your-repo-url>
npm install
# Make edits
# Reload the extension at chrome://extensions/ (Reload button)
```

### Tests

The repo includes unit tests for critical features. Run tests with:

```bash
npm test
```

See the `tests/` directory for test files and test helpers.

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Run tests locally (`npm test`)
4. Open a pull request with a clear description

## License

MIT

## Support

Open an issue in the repository for feature requests or bug reports.

# Hi-hat Debug Tool

A comprehensive Chrome extension that provides essential debugging, security, and development utilities with simple one-click actions. Features smart parameter management with easy reset functionality. Perfect for web developers, security researchers, and QA professionals.

## Features

### Core Debug Tools

- 🚀 **Smart Debug Parameters** - Cycles through `?debug=1` → `?debug=true` → remove
- 🧹 **Form Field Clearing** - Clear all form fields with framework compatibility (React, Vue, etc.)
- 📏 **Page Measurement Tool** - Click and drag to measure elements with pixel-perfect accuracy
- 🛡️ **Vulnerability Scanner** - Comprehensive security analysis detecting 10+ common issues
- 🔄 **Reset Query Params** - Remove all extension-added URL parameters in one click

### WordPress-Specific Tools

- 🔍 **Auto WordPress Detection** - Automatically detects WordPress sites
- ⚙️ **WordPress Debug Mode** - Enable WP_DEBUG, WP_DEBUG_LOG, WP_DEBUG_DISPLAY
- 🗄️ **Query Debug** - Enable database query debugging
- 🚫 **Cache Busting** - Disable caching with timestamp parameters
- 👥 **User Role Switching** - Simulate different user roles (when plugin detected)

### Clear Cache Tools

- 🗑️ **Site-Specific Cache Clearing** - Clear cache, cookies, storage, and more for the current site
- 📦 **Multiple Data Types** - Cache, Cookies, Local Storage, IndexedDB, Service Workers, Cache Storage, Form Data, Web SQL
- 🎯 **Origin-Based** - Only clears data for the current website origin, not global browser cache

## Installation

### Install as Developer Extension

1. **Download the Extension:**

   - Clone this repository or download as ZIP

   ```bash
   git clone https://github.com/turnermike/-debug-true.git
   ```

2. **Open Chrome Extensions:**

   - Go to `chrome://extensions/`
   - Or navigate via Menu → More tools → Extensions

3. **Enable Developer Mode:**

   - Toggle "Developer mode" in the top-right corner

4. **Load the Extension:**
   - Click "Load unpacked"
   - Select the Hi-hat Debug Tool extension folder

## Usage

### Core Debug Tools

#### Smart Debug Parameters

1. Navigate to any website
2. Click the Hi-hat Debug Tool extension icon
3. Click the "Debug" button to cycle through:
   - First click: Adds `?debug=1`
   - Second click: Changes to `?debug=true`
   - Third click: Removes debug parameter

#### Form Field Clearing

1. Navigate to any website with forms
2. Click the "Clear" button
3. All form fields are instantly cleared:
   - Text inputs, passwords, emails, etc.
   - Textareas and contentEditable elements
   - Select dropdowns (reset to first option)
   - Checkboxes and radio buttons
   - Compatible with React, Vue, and other frameworks

#### Page Measurement Tool

1. Click the "Measure" button
2. Click and drag on the page to measure elements
3. Measurements are displayed in pixels and copied to clipboard
4. Press ESC to clear measurements
5. Click "Measure" again to exit measurement mode

#### Vulnerability Scanner

1. Click the "Scan" button to analyze the current page
2. Results appear in the Security Scan section showing:
   - **Critical:** XSS potential, exposed sensitive data
   - **High:** Missing CSRF protection, mixed content
   - **Medium:** Missing HTTPS, security headers, inline scripts
   - **Low:** Password autocomplete issues
3. Use "Re-scan" to refresh results or "Clear" to hide them

### WordPress-Specific Tools

_WordPress tools automatically appear when a WordPress site is detected_

#### WordPress Debug Features

- **WP Debug:** Enables comprehensive WordPress debugging
- **Query Debug:** Shows database query information
- **No Cache:** Adds cache-busting parameters

#### User Role Switching

_Available when User Switching plugin is detected_

- **Admin:** Simulate administrator role
- **Editor:** Simulate editor role
- **Switch Off:** Remove role simulation

### URL Cleanup

#### Reset Query Params

1. Click the "Reset URL Params" button to clean up the URL
2. Removes all extension-added parameters including:
   - Debug parameters (`debug`)
   - WordPress debug parameters (`WP_DEBUG`, `debug_queries`, etc.)
   - Cache-busting parameters (`nocache`, `cache_bust`, etc.)
   - User switching parameters (`simulate_user_role`, etc.)
3. Shows count of removed parameters and reloads the page with clean URL

### Clear Cache Tools

#### How Cache Clearing Works

The extension clears **site-specific** data for the current website's origin using Chrome's `browsingData` API. This is different from clearing Chrome's global disk cache.

**What gets cleared:**

- HTTP cache entries for the current website
- Memory-cached resources for the current origin
- Cookies, local storage, and other site-specific data

**What doesn't get cleared:**

- Global Chrome disk cache at `~/Library/Caches/Google/Chrome/`
- Cache for other websites
- Shared cache resources

#### Verifying Cache Clearing

To confirm the cache button is working:

1. Open DevTools (F12) → Network tab
2. Ensure "Disable cache" is unchecked
3. Load a page with resources (images, CSS, JS)
4. Note resource load status ("from disk cache" or 304)
5. Click the Cache button in the extension
6. Reload the page (F5)
7. Resources should re-download with 200 status instead of loading from cache

#### Available Clear Options

- **Cache:** HTTP cache for current site
- **Cookies:** Site cookies and session data
- **Local Storage:** LocalStorage data
- **IndexedDB:** IndexedDB databases
- **Service Workers:** Registered service workers
- **Cache Storage:** CacheStorage API data
- **Form Data:** Autofill form data
- **Web SQL:** Web SQL databases (deprecated but still supported)
- **Clear All:** Removes all of the above for the current site

## How It Works

The extension uses Chrome's Extension API to provide comprehensive debugging capabilities:

### Debug Parameter Management

- Intelligent URL parsing and parameter manipulation
- Smart cycling through debug states (`?debug=1` → `?debug=true` → remove)
- Preserves existing URL parameters and structure
- One-click reset removes all extension-added parameters

### WordPress Detection

- Analyzes page content for WordPress indicators
- Detects admin bar, generator meta tags, wp-content paths
- Identifies installed plugins (User Switching, etc.)
- Shows relevant tools only on WordPress sites

### Vulnerability Scanning

- Client-side security analysis using DOM inspection
- Checks for 10+ common security issues:
  - Missing HTTPS, CSRF protection, security headers
  - XSS potential in URL parameters
  - Mixed content, clickjacking risks
  - Exposed sensitive data patterns
  - Outdated JavaScript libraries

### Form Clearing & Measurement

- Advanced form field detection and clearing
- Framework compatibility (React, Vue, Angular)
- Canvas-based measurement overlay
- Pixel-perfect measurements with clipboard integration

## Technical Details

- **Manifest Version:** 3 (latest Chrome extension standard)
- **Permissions:** `activeTab`, `tabs` (minimal permissions for security)
- **Architecture:** Vanilla JavaScript with custom CSS styling
- **Content Scripts:** Comprehensive page analysis and manipulation
- **File Structure:**
  ```
  debug-url-extension/
  ├── manifest.json         # Extension configuration & permissions
  ├── package.json          # NPM dependencies and test scripts
  ├── background.js         # Service worker for extension lifecycle
  ├── content.js            # Content script injected into pages
  ├── popup/
  │   ├── popup.html        # Main UI with custom styling
  │   ├── popup.js          # Popup logic & Chrome API integration
  │   └── popup.css         # Custom CSS with responsive design
  ├── assets/
  │   └── icons/            # Extension icons (16, 32, 48, 128px)
  ├── scripts/
  │   └── utils.js          # Shared utility functions
  ├── tests/
  │   ├── setup.js          # Jest setup with Chrome API mocks
  │   ├── clearData.test.js # Unit tests for clear data functionality
  │   └── README.md         # Test documentation
  ├── WARP.md              # AI development guidance
  └── README.md            # Comprehensive documentation
  ```

### Security Features

The vulnerability scanner detects:

- **Insecure Connections:** HTTP vs HTTPS usage
- **CSRF Vulnerabilities:** Missing token protection in forms
- **XSS Potential:** Suspicious URL parameters and content
- **Mixed Content:** HTTP resources on HTTPS pages
- **Missing Security Headers:** CSP, X-Frame-Options, etc.
- **Exposed Sensitive Data:** API keys, tokens, passwords
- **Clickjacking Risks:** Missing frame protection
- **Password Security:** Autocomplete configuration
- **Outdated Libraries:** jQuery, AngularJS version detection
- **Inline Script Risks:** CSP policy implications

## Development

### Prerequisites

- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development

1. Clone the repository
2. Make your changes to the source files
3. Go to `chrome://extensions/`
4. Click "Reload" on the Hi-hat Debug Tool extension card
5. Test your changes

### Testing

The extension includes a comprehensive Jest test suite for critical functionality.

#### Setup Tests

```bash
# Install test dependencies
npm install
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Test Coverage

The test suite includes 23+ unit tests covering:

- **getCurrentOrigin Function**

  - Origin extraction from active tabs
  - Error handling for invalid URLs
  - Support for various URL formats (http/https, localhost, subdomains, custom ports)

- **Clear Cache Functionality**

  - Browser cache clearing for current origin
  - Loading states and button updates
  - Error handling for restricted pages

- **Clear Cookies Functionality**

  - Cookie removal for current origin
  - Permission error handling
  - Status message display

- **Clear All Data Functionality**

  - Comprehensive data removal (cache, cookies, localStorage, indexedDB, serviceWorkers, etc.)
  - Tab reload after clearing
  - Popup auto-close behavior

- **Error Handling & Edge Cases**
  - Restricted page handling (chrome://, etc.)
  - Simultaneous operations
  - Button state consistency during async operations

For detailed test documentation, see [`tests/README.md`](tests/README.md).

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Run the test suite** (`npm test`)
5. Test thoroughly in the browser
6. Submit a pull request

## License

MIT License - feel free to use this code for your own projects!

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/turnermike/-debug-true/issues) on GitHub.
