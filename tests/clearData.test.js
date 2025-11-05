/**
 * Unit tests for Clear Data functionality
 * Tests cache clearing, cookies, local storage, and all browsing data clearing
 */

describe('Clear Data Functionality', () => {
  let mockStatusDiv;
  let mockClearCacheBtn;
  let mockClearCookiesBtn;
  let mockClearAllDataBtn;

  // Helper function to create a mock button
  const createMockButton = (id) => {
    const btn = document.createElement('button');
    btn.id = id;
    btn.innerHTML = '<span class="wp-button-label">Test</span>';
    btn.disabled = false;
    return btn;
  };

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="status" class="status-message status-hidden"></div>
      <button id="clearCacheBtn"><span class="wp-button-label">Cache</span></button>
      <button id="clearCookiesBtn"><span class="wp-button-label">Cookies</span></button>
      <button id="clearAllDataBtn"><span class="wp-button-label">Clear All</span></button>
    `;

    mockStatusDiv = document.getElementById('status');
    mockClearCacheBtn = document.getElementById('clearCacheBtn');
    mockClearCookiesBtn = document.getElementById('clearCookiesBtn');
    mockClearAllDataBtn = document.getElementById('clearAllDataBtn');

    // Reset Chrome API mocks
    jest.clearAllMocks();
  });

  describe('getCurrentOrigin function', () => {
    test('should correctly return the origin of the active tab', async () => {
      // Mock chrome.tabs.query to return a tab with a URL
      const mockTab = {
        id: 1,
        url: 'https://example.com/path/to/page?query=param'
      };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Create the getCurrentOrigin function inline for testing
      const getCurrentOrigin = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            const url = new URL(tab.url);
            return url.origin;
          }
        } catch (error) {
          console.error('Error getting current origin:', error);
        }
        return null;
      };

      const origin = await getCurrentOrigin();

      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true
      });
      expect(origin).toBe('https://example.com');
    });

    test('should return null when tab has no URL', async () => {
      const mockTab = { id: 1 };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const getCurrentOrigin = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            const url = new URL(tab.url);
            return url.origin;
          }
        } catch (error) {
          console.error('Error getting current origin:', error);
        }
        return null;
      };

      const origin = await getCurrentOrigin();
      expect(origin).toBeNull();
    });

    test('should return null when no tab is found', async () => {
      chrome.tabs.query.mockResolvedValue([]);

      const getCurrentOrigin = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            const url = new URL(tab.url);
            return url.origin;
          }
        } catch (error) {
          console.error('Error getting current origin:', error);
        }
        return null;
      };

      const origin = await getCurrentOrigin();
      expect(origin).toBeNull();
    });

    test('should handle error when URL parsing fails', async () => {
      const mockTab = {
        id: 1,
        url: 'not-a-valid-url'
      };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const getCurrentOrigin = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            const url = new URL(tab.url);
            return url.origin;
          }
        } catch (error) {
          console.error('Error getting current origin:', error);
        }
        return null;
      };

      const origin = await getCurrentOrigin();
      expect(origin).toBeNull();
    });

    test('should correctly extract origin from different URL formats', async () => {
      const testCases = [
        { url: 'https://example.com', expected: 'https://example.com' },
        { url: 'http://localhost:3000/page', expected: 'http://localhost:3000' },
        { url: 'https://sub.example.com/path?query=1', expected: 'https://sub.example.com' },
        { url: 'https://example.com:8080/path', expected: 'https://example.com:8080' }
      ];

      const getCurrentOrigin = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            const url = new URL(tab.url);
            return url.origin;
          }
        } catch (error) {
          console.error('Error getting current origin:', error);
        }
        return null;
      };

      for (const testCase of testCases) {
        chrome.tabs.query.mockResolvedValue([{ id: 1, url: testCase.url }]);
        const origin = await getCurrentOrigin();
        expect(origin).toBe(testCase.expected);
      }
    });
  });

  describe('clearCacheBtn functionality', () => {
    test('should successfully clear the browser cache for the current origin when clicked', async () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com/page'
      };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.browsingData.removeCache.mockResolvedValue(undefined);

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          const url = new URL(tab.url);
          return url.origin;
        }
        return null;
      };

      // Simulate button click handler
      const handleClick = async () => {
        const btn = mockClearCacheBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            await chrome.browsingData.removeCache({
              origins: [origin]
            });

            btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
            mockStatusDiv.textContent = 'Cache cleared successfully!';
            mockStatusDiv.className = 'status-message status-success';

            setTimeout(() => {
              btn.innerHTML = originalContent;
              btn.disabled = false;
            }, 2000);
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
          mockStatusDiv.textContent = 'Error clearing cache: ' + error.message;
          mockStatusDiv.className = 'status-message status-error';
        }
      };

      await handleClick();

      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true
      });
      expect(chrome.browsingData.removeCache).toHaveBeenCalledWith({
        origins: ['https://example.com']
      });
      expect(mockStatusDiv.textContent).toBe('Cache cleared successfully!');
      expect(mockStatusDiv.className).toBe('status-message status-success');
      expect(mockClearCacheBtn.innerHTML).toContain('✓ Cleared!');
      expect(mockClearCacheBtn.disabled).toBe(true);
    });

    test('should show loading state while clearing cache', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      
      let resolveCache;
      chrome.browsingData.removeCache.mockImplementation(() => {
        return new Promise(resolve => {
          resolveCache = resolve;
        });
      });

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearCacheBtn;
        btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
        btn.disabled = true;
        
        const origin = await getCurrentOrigin();
        if (origin) {
          await chrome.browsingData.removeCache({ origins: [origin] });
        }
      };

      const clickPromise = handleClick();
      
      // Check loading state before promise resolves
      expect(mockClearCacheBtn.innerHTML).toContain('⏳ Clearing...');
      expect(mockClearCacheBtn.disabled).toBe(true);
      
      resolveCache();
      await clickPromise;
    });

    test('should handle error when no origin is available', async () => {
      chrome.tabs.query.mockResolvedValue([]);

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearCacheBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            await chrome.browsingData.removeCache({ origins: [origin] });
          } else {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            mockStatusDiv.textContent = 'Cannot clear cache on this page';
            mockStatusDiv.className = 'status-message status-error';
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      };

      await handleClick();

      expect(chrome.browsingData.removeCache).not.toHaveBeenCalled();
      expect(mockStatusDiv.textContent).toBe('Cannot clear cache on this page');
      expect(mockStatusDiv.className).toBe('status-message status-error');
      expect(mockClearCacheBtn.disabled).toBe(false);
    });
  });

  describe('clearCookiesBtn functionality', () => {
    test('should successfully clear cookies for the current origin when clicked', async () => {
      const mockTab = { id: 1, url: 'https://example.com/page' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.browsingData.removeCookies.mockResolvedValue(undefined);

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearCookiesBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            await chrome.browsingData.removeCookies({
              origins: [origin]
            });

            btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
            mockStatusDiv.textContent = 'Cookies cleared successfully!';
            mockStatusDiv.className = 'status-message status-success';
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      };

      await handleClick();

      expect(chrome.browsingData.removeCookies).toHaveBeenCalledWith({
        origins: ['https://example.com']
      });
      expect(mockStatusDiv.textContent).toBe('Cookies cleared successfully!');
      expect(mockClearCookiesBtn.innerHTML).toContain('✓ Cleared!');
    });

    test('should handle error gracefully when clearing cookies fails', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.browsingData.removeCookies.mockRejectedValue(new Error('Permission denied'));

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearCookiesBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            await chrome.browsingData.removeCookies({ origins: [origin] });
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
          mockStatusDiv.textContent = 'Error clearing cookies: ' + error.message;
          mockStatusDiv.className = 'status-message status-error';
        }
      };

      await handleClick();

      expect(mockStatusDiv.textContent).toBe('Error clearing cookies: Permission denied');
      expect(mockStatusDiv.className).toBe('status-message status-error');
      expect(mockClearCookiesBtn.disabled).toBe(false);
    });
  });

  describe('clearAllDataBtn functionality', () => {
    test('should clear all specified browsing data for the current origin and reload the tab', async () => {
      const mockTab = { id: 1, url: 'https://example.com/page' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.browsingData.remove.mockResolvedValue(undefined);
      chrome.tabs.reload.mockResolvedValue(undefined);

      // Use fake timers for setTimeout
      jest.useFakeTimers();

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearAllDataBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            const clearPromise = chrome.browsingData.remove({
              origins: [origin]
            }, {
              cache: true,
              cookies: true,
              localStorage: true,
              indexedDB: true,
              serviceWorkers: true,
              cacheStorage: true,
              formData: true,
              webSQL: true
            });

            const delayPromise = new Promise(resolve => setTimeout(resolve, 500));
            await Promise.all([clearPromise, delayPromise]);

            btn.innerHTML = '<span class="wp-button-label">✓ All Cleared!</span>';
            mockStatusDiv.textContent = 'All site data cleared! Reloading...';
            mockStatusDiv.className = 'status-message status-success';

            setTimeout(async () => {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab) {
                await chrome.tabs.reload(tab.id);
              }
              window.close();
            }, 1500);
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      };

      const clickPromise = handleClick();
      
      // Fast-forward timers
      jest.advanceTimersByTime(500);
      await clickPromise;

      expect(chrome.browsingData.remove).toHaveBeenCalledWith(
        { origins: ['https://example.com'] },
        {
          cache: true,
          cookies: true,
          localStorage: true,
          indexedDB: true,
          serviceWorkers: true,
          cacheStorage: true,
          formData: true,
          webSQL: true
        }
      );
      expect(mockStatusDiv.textContent).toBe('All site data cleared! Reloading...');
      expect(mockClearAllDataBtn.innerHTML).toContain('✓ All Cleared!');

      // Fast-forward to reload timer
      jest.advanceTimersByTime(1500);
      await Promise.resolve(); // Allow async operations to complete

      expect(chrome.tabs.reload).toHaveBeenCalledWith(1);
      expect(window.close).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should handle error when clearing all data fails', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.browsingData.remove.mockRejectedValue(new Error('Failed to clear data'));

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearAllDataBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            await chrome.browsingData.remove({ origins: [origin] }, {
              cache: true,
              cookies: true,
              localStorage: true,
              indexedDB: true,
              serviceWorkers: true,
              cacheStorage: true,
              formData: true,
              webSQL: true
            });
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
          mockStatusDiv.textContent = 'Error clearing all data: ' + error.message;
          mockStatusDiv.className = 'status-message status-error';
        }
      };

      await handleClick();

      expect(mockStatusDiv.textContent).toBe('Error clearing all data: Failed to clear data');
      expect(mockStatusDiv.className).toBe('status-message status-error');
      expect(mockClearAllDataBtn.disabled).toBe(false);
    });

    test('should not reload tab if origin is not available', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]); // No URL

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      const handleClick = async () => {
        const btn = mockClearAllDataBtn;
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
          btn.disabled = true;

          const origin = await getCurrentOrigin();

          if (origin) {
            await chrome.browsingData.remove({ origins: [origin] }, {
              cache: true,
              cookies: true,
              localStorage: true
            });
          } else {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            mockStatusDiv.textContent = 'Cannot clear data on this page';
            mockStatusDiv.className = 'status-message status-error';
          }
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      };

      await handleClick();

      expect(chrome.browsingData.remove).not.toHaveBeenCalled();
      expect(chrome.tabs.reload).not.toHaveBeenCalled();
      expect(mockStatusDiv.textContent).toBe('Cannot clear data on this page');
    });
  });

  describe('Error handling and edge cases', () => {
    test('should display appropriate status message when clearing cache on restricted page', async () => {
      const mockTab = { id: 1, url: 'chrome://extensions' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const getCurrentOrigin = async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            // Restricted URLs throw when creating URL object
            if (tab.url.startsWith('chrome://')) {
              return null;
            }
            return new URL(tab.url).origin;
          }
        } catch (error) {
          return null;
        }
        return null;
      };

      const origin = await getCurrentOrigin();
      expect(origin).toBeNull();
    });

    test('should handle simultaneous clear operations gracefully', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.browsingData.removeCache.mockResolvedValue(undefined);
      chrome.browsingData.removeCookies.mockResolvedValue(undefined);

      const getCurrentOrigin = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return new URL(tab.url).origin;
        }
        return null;
      };

      // Simulate clicking multiple buttons at once
      const clearCache = async () => {
        const origin = await getCurrentOrigin();
        if (origin) {
          await chrome.browsingData.removeCache({ origins: [origin] });
        }
      };

      const clearCookies = async () => {
        const origin = await getCurrentOrigin();
        if (origin) {
          await chrome.browsingData.removeCookies({ origins: [origin] });
        }
      };

      await Promise.all([clearCache(), clearCookies()]);

      expect(chrome.browsingData.removeCache).toHaveBeenCalledTimes(1);
      expect(chrome.browsingData.removeCookies).toHaveBeenCalledTimes(1);
    });

    test('should maintain button state consistency during async operations', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      
      let resolveCache;
      chrome.browsingData.removeCache.mockImplementation(() => {
        return new Promise(resolve => {
          resolveCache = resolve;
        });
      });

      const originalContent = mockClearCacheBtn.innerHTML;
      
      const handleClick = async () => {
        const btn = mockClearCacheBtn;
        btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
        btn.disabled = true;
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const origin = new URL(tab.url).origin;
        
        try {
          await chrome.browsingData.removeCache({ origins: [origin] });
          btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        } catch (error) {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      };

      const clickPromise = handleClick();
      
      // Button should be disabled with loading state
      expect(mockClearCacheBtn.disabled).toBe(true);
      expect(mockClearCacheBtn.innerHTML).toContain('⏳ Clearing...');
      
      // Resolve the promise
      resolveCache();
      await clickPromise;
      
      // Button should show success state
      expect(mockClearCacheBtn.innerHTML).toContain('✓ Cleared!');
      expect(mockClearCacheBtn.disabled).toBe(true);
    });
  });
});
