# Hi-hat Debug Tool

A Chrome extension that provides useful debugging and form utilities with simple one-click actions.

## Features

- 🚀 One-click debug parameter addition (`?debug=true`)
- 🔍 Smart detection of existing debug parameters
- 🧹 Clear all form fields on any webpage
- ✅ User feedback with status messages
- 📊 Count display for cleared form fields

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

### Adding Debug Parameter

1. Navigate to any website
2. Click the Hi-hat Debug Tool extension icon in your toolbar
3. Click "Add ?debug=true" button
4. The page will reload with the debug parameter added

### Clearing Form Fields

1. Navigate to any website with forms
2. Click the Hi-hat Debug Tool extension icon in your toolbar
3. Click "Clear All Forms" button
4. All form fields on the page will be cleared instantly
   - Text inputs, passwords, emails, etc.
   - Textareas
   - Select dropdowns (reset to first option)
   - Checkboxes and radio buttons

## How It Works

The extension uses Chrome's Extension API to:

### Debug Parameter Feature
- Access the current active tab
- Parse the existing URL
- Check if `debug=true` already exists
- Append or add the debug parameter
- Reload the page with the modified URL

### Form Clearing Feature
- Inject a content script into the current page
- Query all form elements (inputs, textareas, selects)
- Clear values and reset states appropriately
- Trigger input/change events for compatibility
- Provide feedback on the number of fields cleared

## Technical Details

- **Manifest Version:** 3 (latest Chrome extension standard)
- **Permissions:** `activeTab`, `tabs`
- **Framework:** Vanilla JavaScript with Tailwind CSS
- **Content Scripts:** Injected for form manipulation
- **File Structure:**
  ```
  debug-url-extension/
  ├── manifest.json    # Extension configuration
  ├── popup.html       # User interface
  ├── popup.js         # Popup functionality
  ├── content.js       # Content script for form clearing
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
