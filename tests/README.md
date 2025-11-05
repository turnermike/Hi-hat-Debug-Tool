# Hi-hat Debug Tool - Unit Tests

This directory contains unit tests for the Hi-hat Debug Tool Chrome extension.

## Test Coverage

### Clear Data Functionality (`clearData.test.js`)

The test suite covers the following scenarios:

#### 1. **getCurrentOrigin Function**
- ✅ Correctly returns the origin of the active tab
- ✅ Returns null when tab has no URL
- ✅ Returns null when no tab is found
- ✅ Handles errors when URL parsing fails
- ✅ Correctly extracts origin from different URL formats (http/https, localhost, subdomains, custom ports)

#### 2. **clearCacheBtn Functionality**
- ✅ Successfully clears the browser cache for the current origin
- ✅ Shows loading state while clearing cache
- ✅ Handles error when no origin is available
- ✅ Updates button state and displays success message

#### 3. **clearCookiesBtn Functionality**
- ✅ Successfully clears cookies for the current origin
- ✅ Handles errors gracefully when clearing cookies fails
- ✅ Displays appropriate error messages

#### 4. **clearAllDataBtn Functionality**
- ✅ Clears all specified browsing data (cache, cookies, localStorage, indexedDB, serviceWorkers, cacheStorage, formData, webSQL)
- ✅ Reloads the current tab after clearing all data
- ✅ Closes the popup after successful operation
- ✅ Handles errors gracefully
- ✅ Does not reload if origin is not available

#### 5. **Error Handling and Edge Cases**
- ✅ Displays appropriate status messages for restricted pages (chrome://, etc.)
- ✅ Handles simultaneous clear operations gracefully
- ✅ Maintains button state consistency during async operations

## Setup

### Install Dependencies

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `jest-environment-jsdom` - DOM environment for tests
- `@types/chrome` - TypeScript definitions for Chrome APIs

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.js           # Jest setup with Chrome API mocks
├── clearData.test.js  # Tests for clear data functionality
└── README.md          # This file
```

## Mocked Chrome APIs

The test suite includes mocks for the following Chrome Extension APIs:

- `chrome.tabs.query()` - Get active tab information
- `chrome.tabs.update()` - Update tab properties
- `chrome.tabs.reload()` - Reload tab
- `chrome.browsingData.remove()` - Clear all browsing data
- `chrome.browsingData.removeCache()` - Clear cache
- `chrome.browsingData.removeCookies()` - Clear cookies
- `chrome.browsingData.removeLocalStorage()` - Clear local storage
- `chrome.browsingData.removeServiceWorkers()` - Clear service workers
- `chrome.browsingData.removeFormData()` - Clear form data
- `window.close()` - Close popup window

## Writing New Tests

To add new tests:

1. Create a new test file in the `tests/` directory
2. Import any necessary mocks from `setup.js`
3. Follow the existing test structure and patterns
4. Ensure all Chrome APIs used in tests are mocked in `setup.js`

Example:
```javascript
describe('New Feature', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `...`;
    jest.clearAllMocks();
  });

  test('should do something', async () => {
    // Arrange
    chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);

    // Act
    const result = await someFunction();

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage report
  run: npm run test:coverage
```

## Test Philosophy

The tests follow these principles:

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Mocking**: External dependencies (Chrome APIs) are mocked
3. **Coverage**: All critical paths and edge cases are tested
4. **Clarity**: Tests are descriptive and easy to understand
5. **Maintainability**: Tests mirror the actual implementation structure
