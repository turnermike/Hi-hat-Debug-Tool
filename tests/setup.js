/**
 * Jest setup file for Hi-hat Debug Tool
 * Provides mocks for Chrome Extension APIs
 */

// Mock Chrome APIs
global.chrome = {
  tabs: {
    query: jest.fn(),
    update: jest.fn(),
    sendMessage: jest.fn(),
    reload: jest.fn(),
    captureVisibleTab: jest.fn()
  },
  browsingData: {
    remove: jest.fn(),
    removeCache: jest.fn(),
    removeCookies: jest.fn(),
    removeLocalStorage: jest.fn(),
    removeServiceWorkers: jest.fn(),
    removeFormData: jest.fn()
  },
  downloads: {
    download: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Mock window.close for popup
global.window.close = jest.fn();

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  writable: true,
  value: {
    readText: jest.fn(),
    writeText: jest.fn()
  }
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
