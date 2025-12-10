/**
 * Hi-hat Debug Tool - Popup Script
 * Handles all popup UI interactions and Chrome extension API calls
 * Refactored with improved structure following Chrome extension best practices
 */

document.addEventListener('DOMContentLoaded', function () {
  const addDebugBtn = document.getElementById('addDebugBtn');
  const clearFormsBtn = document.getElementById('clearFormsBtn');
  const measureBtn = document.getElementById('measureBtn');
  const scanBtn = document.getElementById('scanBtn');
  const resetParamsBtn = document.getElementById('resetParamsBtn');
  const statusDiv = document.getElementById('status');

  // Vulnerability scanner elements
  const scanResultsSection = document.getElementById('scanResultsSection');
  const scanResults = document.getElementById('scanResults');
  const rescanBtn = document.getElementById('rescanBtn');
  const clearResultsBtn = document.getElementById('clearResultsBtn');

  // WordPress elements
  const wordpressSection = document.getElementById('wordpressSection');
  const wpDebugBtn = document.getElementById('wpDebugBtn');
  const wpQueryBtn = document.getElementById('wpQueryBtn');
  const wpCacheBtn = document.getElementById('wpCacheBtn');

  // User switching elements
  const userSwitchingRow = document.getElementById('userSwitchingRow');
  const wpSwitchAdminBtn = document.getElementById('wpSwitchAdminBtn');
  const wpSwitchEditorBtn = document.getElementById('wpSwitchEditorBtn');
  const wpSwitchOffBtn = document.getElementById('wpSwitchOffBtn');

  // WordPress scan elements
  const wpScanBtn = document.getElementById('wpScanBtn');
  const wpScanResultsSection = document.getElementById('wpScanResultsSection');
  const wpScanResults = document.getElementById('wpScanResults');
  const rescanWpBtn = document.getElementById('rescanWpBtn');
  const clearWpResultsBtn = document.getElementById('clearWpResultsBtn');

  // Clipboard elements
  const clipboardDisplay = document.getElementById('clipboardDisplay');
  const clipboardContent = document.getElementById('clipboardContent');
  const refreshClipboardBtn = document.getElementById('refreshClipboardBtn');
  const clearClipboardBtn = document.getElementById('clearClipboardBtn');

  // Clear Cache elements
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  const clearCookiesBtn = document.getElementById('clearCookiesBtn');
  const clearLocalStorageBtn = document.getElementById('clearLocalStorageBtn');
  const clearIndexedDBBtn = document.getElementById('clearIndexedDBBtn');
  const clearServiceWorkersBtn = document.getElementById('clearServiceWorkersBtn');
  const clearCacheStorageBtn = document.getElementById('clearCacheStorageBtn');
  const clearFormDataBtn = document.getElementById('clearFormDataBtn');
  const clearWebSQLBtn = document.getElementById('clearWebSQLBtn');
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  const clearCacheStatus = document.getElementById('clear-cache-status');

  // WordPress detection and initialization
  async function initializeWordPress() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        return;
      }

      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        return;
      }

      // Check if WordPress
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkWordPress' });

        if (response && response.success && response.isWordPress) {
          wordpressSection.style.display = 'block';

          // Show user switching row if plugin is detected
          if (response.debugInfo.hasUserSwitching) {
            userSwitchingRow.style.display = 'table-row';
          }

          // Update button states based on current URL
          updateWordPressButtonStates(tab.url);
        }

        // Always update main debug button state regardless of WordPress
        updateWordPressButtonStates(tab.url);
      } catch (error) {
        // Could not check WordPress status
      }
    } catch (error) {
      // Error initializing WordPress
    }
  }

  function updateWordPressButtonStates(url) {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      // Update button active states based on current URL parameters
      const debugValue = params.get('debug');
      updateButtonState(addDebugBtn, debugValue === '1' || debugValue === 'true');
      updateButtonState(wpDebugBtn, params.has('WP_DEBUG') || params.has('WPDEBUG') || params.has('wp_debug'));
      updateButtonState(wpQueryBtn, params.has('debug_queries') || params.has('query_debug'));
      updateButtonState(wpCacheBtn, params.has('nocache') || params.has('no_cache') || params.has('cache_bust'));

      // Update user switching button states
      if (wpSwitchAdminBtn) {
        updateButtonState(wpSwitchAdminBtn, params.get('simulate_user_role') === 'administrator');
      }
      if (wpSwitchEditorBtn) {
        updateButtonState(wpSwitchEditorBtn, params.get('simulate_user_role') === 'editor');
      }
      if (wpSwitchOffBtn) {
        updateButtonState(wpSwitchOffBtn, false); // This button doesn't stay active
      }
    } catch (error) {
      // Error updating button states
    }
  }

  function updateButtonState(button, isActive) {
    if (isActive) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }

  // Initialize WordPress detection
  initializeWordPress();

  // Add refresh button click handler
  refreshClipboardBtn.addEventListener('click', function () {
    console.log('Refresh button clicked');
    refreshClipboard();
  });

  // Add clear clipboard button click handler
  clearClipboardBtn.addEventListener('click', function () {
    clearClipboard();
  });

  // Create a shared clipboard refresh function
  async function refreshClipboard() {
    console.log('Refreshing clipboard...');

    // Always show the clipboard section
    clipboardDisplay.style.display = 'block';

    // Show loading state
    updateClipboardDisplay('Reading clipboard...');

    try {
      // Try the Clipboard API (works with user interaction)
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        console.log('Fresh clipboard text:', clipboardText);
        updateClipboardDisplay(clipboardText || '');
        return;
      }
    } catch (clipboardError) {
      console.log('Clipboard API error:', clipboardError);
      updateClipboardDisplay('Click refresh button to read clipboard');
    }
  }

  // Auto-trigger clipboard refresh when popup opens
  // Use setTimeout to ensure DOM is fully loaded and simulate user interaction
  setTimeout(() => {
    refreshClipboard();
  }, 100);

  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${isError ? 'status-error' : 'status-success'}`;

    // Hide status after 2 seconds
    setTimeout(() => {
      statusDiv.className = 'status-message status-hidden';
    }, 2000);
  }

  function showCacheStatus(message, isError = false) {
    clearCacheStatus.textContent = message;
    clearCacheStatus.className = `status-message ${isError ? 'status-error' : 'status-success'}`;

    // Hide status after 2 seconds
    setTimeout(() => {
      clearCacheStatus.className = 'status-message status-hidden';
    }, 2000);
  }

  addDebugBtn.addEventListener('click', async function () {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab URL', true);
        return;
      }

      // Parse the current URL
      const currentUrl = new URL(tab.url);

      // Get current debug value if it exists
      const currentDebugValue = currentUrl.searchParams.get('debug');

      if (currentDebugValue === '1') {
        // Change from ?debug=1 to ?debug=true
        currentUrl.searchParams.set('debug', 'true');
        showStatus('Changed to ?debug=true');
      } else if (currentDebugValue === 'true') {
        // Remove debug parameter
        currentUrl.searchParams.delete('debug');
        showStatus('Debug parameter removed');
      } else {
        // Add ?debug=1 (first state or if some other value exists)
        currentUrl.searchParams.set('debug', '1');
        showStatus('Added ?debug=1');
      }

      // Update the tab with the new URL
      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });

      showStatus('Debug parameter added!');

      // Close popup after successful action
      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  });

  clearFormsBtn.addEventListener('click', async function () {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab', true);
        return;
      }

      // Send message to content script to clear forms
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'clearForms' });

      if (response.success) {
        showStatus(response.message);
      } else {
        showStatus(response.message, true);
      }

      // Close popup after successful action
      if (response.success) {
        setTimeout(() => {
          window.close();
        }, 1500);
      }

    } catch (error) {
      showStatus('Error: Could not clear forms', true);
    }
  });

  measureBtn.addEventListener('click', async function () {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab', true);
        return;
      }

      // Check if it's a chrome:// or other restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showStatus('Cannot measure on this page', true);
        return;
      }

      // Send message to content script to toggle measurement
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleMeasurement' });

        if (response && response.success) {
          showStatus(response.message);

          // Update button appearance based on state
          if (response.active) {
            measureBtn.style.backgroundColor = '#dcfce7';
            measureBtn.style.transform = 'scale(0.95)';
          } else {
            measureBtn.style.backgroundColor = '';
            measureBtn.style.transform = '';
          }
        } else {
          showStatus(response ? response.message : 'Unknown error occurred', true);
        }
      } catch (messageError) {
        showStatus('Error: Content script not responding. Try refreshing the page.', true);
      }

    } catch (error) {
      showStatus('Error: Could not toggle measurement - ' + error.message, true);
    }
  });

  // WordPress button event handlers

  // Helper function to add/remove URL parameters
  async function toggleUrlParameter(paramName, paramValue = '1', statusMessage = '') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab URL', true);
        return;
      }

      const currentUrl = new URL(tab.url);
      const hasParam = currentUrl.searchParams.has(paramName);

      if (hasParam) {
        currentUrl.searchParams.delete(paramName);
        showStatus(`${statusMessage} disabled`);
      } else {
        currentUrl.searchParams.set(paramName, paramValue);
        showStatus(`${statusMessage} enabled`);
      }

      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });

      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  }

  wpDebugBtn.addEventListener('click', async function () {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab URL', true);
        return;
      }

      const currentUrl = new URL(tab.url);
      const hasDebug = currentUrl.searchParams.has('WP_DEBUG') || currentUrl.searchParams.has('WPDEBUG') || currentUrl.searchParams.has('wp_debug');

      // Remove all debug parameters first
      currentUrl.searchParams.delete('WP_DEBUG');
      currentUrl.searchParams.delete('WPDEBUG');
      currentUrl.searchParams.delete('wp_debug');
      currentUrl.searchParams.delete('WP_DEBUG_LOG');
      currentUrl.searchParams.delete('WP_DEBUG_DISPLAY');

      if (!hasDebug) {
        // Add comprehensive WordPress debug parameters
        currentUrl.searchParams.set('WP_DEBUG', '1');
        currentUrl.searchParams.set('WP_DEBUG_LOG', '1');
        currentUrl.searchParams.set('WP_DEBUG_DISPLAY', '1');
        showStatus('WordPress debug enabled');
      } else {
        showStatus('WordPress debug disabled');
      }

      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });

      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  });

  wpQueryBtn.addEventListener('click', function () {
    toggleUrlParameter('debug_queries', '1', 'Query debug');
  });



  wpCacheBtn.addEventListener('click', async function () {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab URL', true);
        return;
      }

      const currentUrl = new URL(tab.url);
      const hasNoCacheParam = currentUrl.searchParams.has('nocache') || currentUrl.searchParams.has('cache_bust');

      if (hasNoCacheParam) {
        // Remove cache busting parameters
        currentUrl.searchParams.delete('nocache');
        currentUrl.searchParams.delete('cache_bust');
        currentUrl.searchParams.delete('v');
        currentUrl.searchParams.delete('_');
        showStatus('Cache busting disabled');
      } else {
        // Add cache busting parameter with timestamp
        const timestamp = Date.now();
        currentUrl.searchParams.set('nocache', timestamp.toString());
        showStatus('Cache busting enabled');
      }

      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });

      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  });


  // User switching functionality (simulates user roles for testing)
  wpSwitchAdminBtn.addEventListener('click', function () {
    toggleUrlParameter('simulate_user_role', 'administrator', 'Admin role simulation');
  });

  wpSwitchEditorBtn.addEventListener('click', function () {
    toggleUrlParameter('simulate_user_role', 'editor', 'Editor role simulation');
  });

  wpSwitchOffBtn.addEventListener('click', async function () {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab URL', true);
        return;
      }

      const currentUrl = new URL(tab.url);

      // Remove all user switching parameters
      currentUrl.searchParams.delete('simulate_user_role');
      currentUrl.searchParams.delete('user_switching');
      currentUrl.searchParams.delete('switch_to');

      showStatus('User switching disabled');

      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });

      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  });

  // Vulnerability scanner functionality
  async function performVulnerabilityScan() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab', true);
        return;
      }

      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showStatus('Cannot scan this page', true);
        return;
      }

      showStatus('Scanning for vulnerabilities...');

      // Send message to content script to perform scan
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanVulnerabilities' });

      if (response && response.success) {
        displayScanResults(response.vulnerabilities, response.summary);
        showStatus(`Scan complete: ${response.summary.issues} issues, ${response.summary.passed} passed`);
      } else {
        showStatus(response ? response.message : 'Scan failed', true);
      }

    } catch (error) {
      showStatus('Error: Content script not responding. Try refreshing the page.', true);
    }
  }

  function displayScanResults(results, summary) {
    // Show the results section
    scanResultsSection.style.display = 'block';

    // Clear previous results
    scanResults.innerHTML = '';

    // Add summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'scan-summary';
    summaryDiv.innerHTML = `
      <strong>Security Scan Results:</strong> ${summary.total} checks completed<br>
      <span style="color: #22c55e;">✓ ${summary.passed} passed</span> • 
      <span style="color: #f59e0b;">ℹ ${summary.info} info</span>
      ${summary.issues > 0 ? ` • <span style="color: #ef4444;">⚠ ${summary.issues} issues</span>` : ''}
    `;
    scanResults.appendChild(summaryDiv);

    // Group results by severity for better organization
    const severityOrder = ['pass', 'info', 'low', 'medium', 'high', 'critical'];
    const groupedResults = {};

    // Initialize groups
    severityOrder.forEach(severity => {
      groupedResults[severity] = results.filter(r => r.severity === severity);
    });

    // Display results in order
    severityOrder.forEach(severity => {
      const items = groupedResults[severity];
      if (items.length === 0) return;

      items.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = `vulnerability-item ${result.severity}`;
        resultDiv.innerHTML = `
          <div class="vulnerability-title">${result.title}</div>
          <div class="vulnerability-description">${result.description}</div>
        `;
        scanResults.appendChild(resultDiv);
      });
    });
  }

  function clearScanResults() {
    scanResultsSection.style.display = 'none';
    scanResults.innerHTML = '';
  }

  // WordPress scan functionality
  async function performWordPressScan() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab', true);
        return;
      }

      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showStatus('Cannot scan this page', true);
        return;
      }

      showStatus('Scanning WordPress site...');

      // Send message to content script to perform WordPress scan
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanWordPress' });

      if (response && response.success) {
        displayWordPressScanResults(response.scanData, response.summary);
        showStatus(`WordPress scan complete: Found ${response.summary.pluginsCount} plugins`);
      } else {
        showStatus(response ? response.message : 'WordPress scan failed', true);
      }

    } catch (error) {
      showStatus('Error: Content script not responding. Try refreshing the page.', true);
    }
  }

  function displayWordPressScanResults(scanData, summary) {
    // Show the results section
    wpScanResultsSection.style.display = 'block';

    // Clear previous results
    wpScanResults.innerHTML = '';

    // Add WordPress version and theme
    const headerDiv = document.createElement('div');
    headerDiv.className = 'wp-scan-header';
    headerDiv.innerHTML = `
      <div class="wp-scan-item">
        <strong>WordPress Version:</strong> ${scanData.version || 'Unknown'}
        ${scanData.security.versionInGenerator ? ' <span style="color: #f59e0b;">(⚠ Version exposed)</span>' : ''}
      </div>
      <div class="wp-scan-item">
        <strong>Theme:</strong> ${scanData.theme.name || 'Unknown'}
        ${scanData.theme.version ? ` (v${scanData.theme.version})` : ''}
      </div>
      <div class="wp-scan-item">
        <strong>Security:</strong> ${scanData.security.usesHttps ? '🔒 HTTPS' : '⚠ HTTP only'}
      </div>
    `;
    wpScanResults.appendChild(headerDiv);

    // Add plugins section
    if (scanData.plugins.length > 0) {
      const pluginsHeader = document.createElement('div');
      pluginsHeader.className = 'wp-scan-section-title';
      pluginsHeader.innerHTML = `<strong>Plugins (${scanData.plugins.length}):</strong>`;
      wpScanResults.appendChild(pluginsHeader);

      const pluginsList = document.createElement('div');
      pluginsList.className = 'wp-plugins-list';

      scanData.plugins.forEach(plugin => {
        const pluginDiv = document.createElement('div');
        pluginDiv.className = 'wp-plugin-item';
        pluginDiv.innerHTML = `
          <div class="plugin-name">${plugin.name}</div>
          ${plugin.version ? `<div class="plugin-version">v${plugin.version}</div>` : ''}
          <div class="plugin-type">${plugin.type}</div>
        `;
        pluginsList.appendChild(pluginDiv);
      });

      wpScanResults.appendChild(pluginsList);
    } else {
      const noPlugins = document.createElement('div');
      noPlugins.className = 'wp-scan-item';
      noPlugins.innerHTML = '<strong>Plugins:</strong> None detected';
      wpScanResults.appendChild(noPlugins);
    }

    // Add WordPress URLs section
    const urlsDiv = document.createElement('div');
    urlsDiv.className = 'wp-urls-section';
    urlsDiv.innerHTML = `
      <div class="wp-scan-section-title"><strong>WordPress URLs:</strong></div>
      <div class="wp-url-item">Admin: <a href="${scanData.adminUrl}" target="_blank">${scanData.adminUrl}</a></div>
      <div class="wp-url-item">Login: <a href="${scanData.loginUrl}" target="_blank">${scanData.loginUrl}</a></div>
      ${scanData.restApi ? `<div class="wp-url-item">REST API: <a href="${scanData.restApi}" target="_blank">${scanData.restApi}</a></div>` : ''}
      ${scanData.feeds.length > 0 ? `<div class="wp-url-item">Feeds: ${scanData.feeds.length} found</div>` : ''}
    `;
    wpScanResults.appendChild(urlsDiv);
  }

  function clearWordPressScanResults() {
    wpScanResultsSection.style.display = 'none';
    wpScanResults.innerHTML = '';
  }

  // Event listeners for vulnerability scanner
  scanBtn.addEventListener('click', performVulnerabilityScan);

  rescanBtn.addEventListener('click', performVulnerabilityScan);

  clearResultsBtn.addEventListener('click', function () {
    clearScanResults();
    showStatus('Scan results cleared');
  });

  // WordPress scan event listeners
  wpScanBtn.addEventListener('click', performWordPressScan);

  rescanWpBtn.addEventListener('click', performWordPressScan);

  clearWpResultsBtn.addEventListener('click', function () {
    clearWordPressScanResults();
    showStatus('WordPress scan results cleared');
  });

  // Reset Query Parameters functionality
  resetParamsBtn.addEventListener('click', async function () {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        showStatus('Unable to get current tab URL', true);
        return;
      }

      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showStatus('Cannot modify this page', true);
        return;
      }

      const currentUrl = new URL(tab.url);

      // If there are no params, do nothing
      if (currentUrl.search === '') {
        showStatus('No parameters to remove.');
        return;
      }

      // Remove all query parameters
      currentUrl.search = '';

      // Update the tab with the cleaned URL
      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });

      showStatus(`All URL parameters removed`);

      // Close popup after successful action
      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  });


  function updateClipboardDisplay(text) {
    if (text && text.trim()) {
      clipboardContent.textContent = text.trim();
      clipboardContent.style.fontStyle = 'normal';
      clipboardContent.style.color = '#1e293b';
      clipboardDisplay.style.display = 'block';
    } else {
      // Show a message when clipboard is empty
      clipboardContent.textContent = 'No content available';
      clipboardContent.style.fontStyle = 'italic';
      clipboardContent.style.color = '#9ca3af';
      clipboardDisplay.style.display = 'block';
    }
  }

  async function clearClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Write an empty string to clear the clipboard
        await navigator.clipboard.writeText('');
        showStatus('Clipboard cleared!');

        // Refresh the clipboard display to reflect the change
        setTimeout(() => {
          refreshClipboard();
        }, 100);
      } else {
        showStatus('Clipboard API not supported', true);
      }
    } catch (error) {
      showStatus('Failed to clear clipboard: ' + error.message, true);
    }
  }

  // Clear Cache functionality

  // Helper function to get current tab origin for clearing site-specific data
  async function getCurrentOrigin() {
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
  }

  // Clear browser cache
  clearCacheBtn.addEventListener('click', async function () {
    const btn = clearCacheBtn;
    const originalContent = btn.innerHTML;

    try {
      // Show loading state
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.removeCache({
          origins: [origin]
        });

        // Show success state
        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('Cache cleared successfully!');

        // Reset button after delay
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear cache on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing cache: ' + error.message, true);
    }
  });

  // Clear cookies
  clearCookiesBtn.addEventListener('click', async function () {
    const btn = clearCookiesBtn;
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
        showCacheStatus('Cookies cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear cookies on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing cookies: ' + error.message, true);
    }
  });

  // Clear local storage
  clearLocalStorageBtn.addEventListener('click', async function () {
    const btn = clearLocalStorageBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.removeLocalStorage({
          origins: [origin]
        });

        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('Local storage cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear local storage on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing local storage: ' + error.message, true);
    }
  });

  // Clear IndexedDB
  clearIndexedDBBtn.addEventListener('click', async function () {
    const btn = clearIndexedDBBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.remove({
          origins: [origin]
        }, {
          indexedDB: true
        });

        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('IndexedDB cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear IndexedDB on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing IndexedDB: ' + error.message, true);
    }
  });

  // Clear Service Workers
  clearServiceWorkersBtn.addEventListener('click', async function () {
    const btn = clearServiceWorkersBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.removeServiceWorkers({
          origins: [origin]
        });

        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('Service workers cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear service workers on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing service workers: ' + error.message, true);
    }
  });

  // Clear Cache Storage (CacheStorage API)
  clearCacheStorageBtn.addEventListener('click', async function () {
    const btn = clearCacheStorageBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.remove({
          origins: [origin]
        }, {
          cacheStorage: true
        });

        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('Cache storage cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear cache storage on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing cache storage: ' + error.message, true);
    }
  });

  // Clear Form Data (autofill)
  clearFormDataBtn.addEventListener('click', async function () {
    const btn = clearFormDataBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.removeFormData({
          origins: [origin]
        });

        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('Form data cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear form data on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing form data: ' + error.message, true);
    }
  });

  // Clear Web SQL
  clearWebSQLBtn.addEventListener('click', async function () {
    const btn = clearWebSQLBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        await chrome.browsingData.remove({
          origins: [origin]
        }, {
          webSQL: true
        });

        btn.innerHTML = '<span class="wp-button-label">✓ Cleared!</span>';
        showCacheStatus('Web SQL cleared successfully!');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear Web SQL on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing Web SQL: ' + error.message, true);
    }
  });

  // Clear all site data
  clearAllDataBtn.addEventListener('click', async function () {
    const btn = clearAllDataBtn;
    const originalContent = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="wp-button-label">⏳ Clearing...</span>';
      btn.disabled = true;

      const origin = await getCurrentOrigin();

      if (origin) {
        // Add minimum delay to ensure loading state is visible
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

        // Wait for both clearing and minimum delay
        await Promise.all([clearPromise, delayPromise]);

        btn.innerHTML = '<span class="wp-button-label">✓ All Cleared!</span>';
        showCacheStatus('All site data cleared! Reloading...');

        // Close popup and reload the tab after clearing all data
        setTimeout(async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await chrome.tabs.reload(tab.id);
          }
          window.close();
        }, 1500);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showCacheStatus('Cannot clear data on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showCacheStatus('Error clearing all data: ' + error.message, true);
    }
  });
});