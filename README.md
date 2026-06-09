# Hi-hat Debug Tool

<<<<<<< HEAD
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
=======
Hi-hat Debug Tool is a Chrome Extension for day-to-day web debugging tasks, with extra support for WordPress workflows.

It combines URL cleanup, form utilities, measurement overlays, screenshots, clipboard helpers, and site-scoped browser data clearing in one popup.

## Recent updates (May 2026)

- Reworked the Clear Browser Data section for better status feedback and per-action loading states.
- Added and validated granular clear actions for cache, cookies, local storage, IndexedDB, service workers, cache storage, form data, Web SQL, and clear-all.
- Improved UX after clear operations, including tab reload behavior for cache and clear-all flows.
- Confirmed behavior with updated tests in `tests/clearData.test.js`.

## Features

### Core tools

- Measure: click-and-drag ruler overlay with pixel output copied to clipboard.
- Clear Forms: clears form fields on the active page.
- URL Cleanup: removes all query parameters from the current URL.

### Screenshots

- Full Page Screenshot: captures full-page content.
- Browser Viewport Screenshot: captures only the visible viewport.
- Scan and Capture Pages: finds links on the current site, captures full-page screenshots in background tabs, then downloads a ZIP.

### WordPress tools (auto-detected)

- WP Debug toggle (`WP_DEBUG`, `WP_DEBUG_LOG`, `WP_DEBUG_DISPLAY`).
- Query Debug toggle.
- No Cache toggle with timestamp parameter.
- User role simulation helpers when supported.
- WordPress Scan panel with version, theme, plugin, URL, and basic security details.

### Clear Browser Data

Site-scoped clear actions (current origin):

- Cache
- Cookies
- Local Storage
- IndexedDB
- Service Workers
- Cache Storage
- Web SQL (browser support dependent)
- Clear All (combined site data clear)

Also includes Form Data clear (Chrome autofill data), which is not origin-scoped.

## Installation

### Load unpacked extension

1. Clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this repository folder.
>>>>>>> dev

## Usage

1. Open a page in Chrome.
2. Click the extension icon.
3. Choose the tool in the popup.

Notes:

- On restricted pages (`chrome://`, `chrome-extension://`, `edge://`, `about:`), some actions are unavailable.
- Clear All in the browser data section clears selected data types, reloads the tab, then closes the popup.

## Keyboard shortcuts

Defined in `manifest.json`:

- Copy current URL: `Command+Shift+C` on macOS (`Ctrl+Shift+C` on Windows/Linux)
- Navigate to URL from clipboard: `Command+Shift+V` on macOS (`Ctrl+Shift+V` on Windows/Linux)

## Project structure

- `manifest.json`: extension metadata, permissions, commands.
- `background.js`: service worker, screenshots, background coordination.
- `content.js`: in-page actions (measurement, form clearing, WordPress scan, URL cleanup).
- `popup/popup.html`: popup markup.
- `popup/popup.js`: popup behavior and Chrome API integration.
- `popup/popup.css`: popup styles.
- `scripts/find-links.js`: link discovery used by scan-and-capture.
- `tests/clearData.test.js`: clear-browser-data unit tests.

## Development

### Requirements

- Node.js
- Google Chrome

### Install dependencies

```bash
npm install
```

### Run tests

```bash
npm test
```

Run only the clear data test suite:

```bash
npm test -- --runInBand tests/clearData.test.js
```

### Reload extension while developing

After changes, open `chrome://extensions/` and click Reload on Hi-hat Debug Tool.

## Contributing

1. Create a branch.
2. Make your changes.
3. Run tests.
4. Open a pull request with a clear summary.

## License

MIT

## Support

Open a GitHub issue for bugs, regressions, or feature requests.
