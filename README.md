# Debug URL Helper

A simple Chrome extension that adds `?debug=true` to any website URL with a single click.

## Features

- ✨ Clean, modern interface built with Tailwind CSS
- 🚀 One-click debug parameter addition
- 🔍 Smart detection of existing debug parameters
- ✅ User feedback with status messages
- 🎯 Works on any website

## Installation

### Method 1: Install from Chrome Web Store
*Coming soon - this extension will be published to the Chrome Web Store*

### Method 2: Install as Developer Extension

1. **Download the Extension:**
   - Clone this repository or download as ZIP
   ```bash
   git clone https://github.com/yourusername/debug-url-helper.git
   ```

2. **Open Chrome Extensions:**
   - Go to `chrome://extensions/`
   - Or navigate via Menu → More tools → Extensions

3. **Enable Developer Mode:**
   - Toggle "Developer mode" in the top-right corner

4. **Load the Extension:**
   - Click "Load unpacked"
   - Select the downloaded extension folder

## Usage

1. Navigate to any website
2. Click the Debug URL Helper extension icon in your toolbar
3. Click "Add ?debug=true" button
4. The page will reload with the debug parameter added

## How It Works

The extension uses Chrome's Extension API to:
- Access the current active tab
- Parse the existing URL
- Check if `debug=true` already exists
- Append or add the debug parameter
- Reload the page with the modified URL

## Technical Details

- **Manifest Version:** 3 (latest Chrome extension standard)
- **Permissions:** `activeTab`, `tabs`
- **Framework:** Vanilla JavaScript with Tailwind CSS
- **File Structure:**
  ```
  debug-url-extension/
  ├── manifest.json    # Extension configuration
  ├── popup.html       # User interface
  ├── popup.js         # Core functionality
  └── README.md        # Documentation
  ```

## Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Clone the repository
2. Make your changes to the source files
3. Go to `chrome://extensions/`
4. Click "Reload" on the Debug URL Helper extension card
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

If you encounter any issues or have feature requests, please [open an issue](https://github.com/yourusername/debug-url-helper/issues) on GitHub.

---

Made with ❤️ for developers who need quick debug access