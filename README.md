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

#### Reset Query Params
1. Click the "Reset" button (red refresh icon) to clean up the URL
2. Removes all extension-added parameters including:
   - Debug parameters (`debug`)
   - WordPress debug parameters (`WP_DEBUG`, `debug_queries`, etc.)
   - Cache-busting parameters (`nocache`, `cache_bust`, etc.)
   - User switching parameters (`simulate_user_role`, etc.)
3. Shows count of removed parameters and reloads the page with clean URL

### WordPress-Specific Tools

*WordPress tools automatically appear when a WordPress site is detected*

#### WordPress Debug Features
- **WP Debug:** Enables comprehensive WordPress debugging
- **Query Debug:** Shows database query information
- **No Cache:** Adds cache-busting parameters

#### User Role Switching
*Available when User Switching plugin is detected*
- **Admin:** Simulate administrator role
- **Editor:** Simulate editor role  
- **Switch Off:** Remove role simulation

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

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code for your own projects!

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/turnermike/-debug-true/issues) on GitHub.
