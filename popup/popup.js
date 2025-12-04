/**
 * Hi-hat Debug Tool - Popup Script
 * Handles all popup UI interactions and Chrome extension API calls
 * Refactored with improved structure following Chrome extension best practices
 */

document.addEventListener('DOMContentLoaded', function() {
  const addDebugBtn = document.getElementById('addDebugBtn');
  const clearFormsBtn = document.getElementById('clearFormsBtn');
  const measureBtn = document.getElementById('measureBtn');
  const scanBtn = document.getElementById('scanBtn');
  const screenshotBtn = document.getElementById('screenshotBtn');
  const fullPageScreenshotBtn = document.getElementById('fullPageScreenshotBtn');
  const responsiveScreenshotsBtn = document.getElementById('responsiveScreenshotsBtn');
  const resetParamsBtn = document.getElementById('resetParamsBtn');
  const statusDiv = document.getElementById('status');
  
  // Modal elements
  const filenameModal = document.getElementById('filenameModal');
  const closeModal = document.getElementById('closeModal');
  const cancelScreenshot = document.getElementById('cancelScreenshot');
  const filenameInput = document.getElementById('filenameInput');
  const filenamePreview = document.getElementById('filenamePreview');
  const saveScreenshot = document.getElementById('saveScreenshot');
  
  // Track which type of screenshot is being taken
  let currentScreenshotType = 'viewport'; // 'viewport' or 'fullpage'
  
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
  
  // Video Recording elements
  const startRecordingBtn = document.getElementById('startRecordingBtn');
  const stopRecordingBtn = document.getElementById('stopRecordingBtn');
  const recordingStatus = document.getElementById('recordingStatus');
  const recordingTime = document.querySelector('.recording-time');
  
  // Recording state
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStartTime = null;
  let recordingInterval = null;
  let streamId = null;
  let isPaused = false;
  let pausedTime = 0;
  let currentTabId = null;
  
  // Listen for messages from content script (toolbar buttons)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'togglePauseRecording') {
      togglePauseRecording();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'stopRecording') {
      stopRecording();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'startActualRecording') {
      startActualRecording();
      sendResponse({ success: true });
      return true;
    }
  });
  
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
  refreshClipboardBtn.addEventListener('click', function() {
    console.log('Refresh button clicked');
    refreshClipboard();
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
  
  // Modal utility functions
  function showModal(screenshotType = 'viewport') {
    currentScreenshotType = screenshotType;
    
    // Generate default filename with appropriate prefix
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const prefix = screenshotType === 'fullpage' ? 'fullpage-' : 'viewport-';
    const defaultFilename = `${prefix}${timestamp}`;
    
    filenameInput.value = defaultFilename;
    updateFilenamePreview();
    filenameModal.style.display = 'flex';
    filenameInput.focus();
    filenameInput.select();
  }
  
  function hideModal() {
    filenameModal.style.display = 'none';
    filenameInput.value = '';
  }
  
  function updateFilenamePreview() {
    const filename = filenameInput.value.trim() || 'screenshot';
    filenamePreview.textContent = `${filename}.png`;
  }
  
  function sanitizeFilename(filename) {
    // Remove or replace invalid characters for filenames
    return filename.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '_');
  }
  
  // Modal event listeners
  closeModal.addEventListener('click', hideModal);
  cancelScreenshot.addEventListener('click', hideModal);
  
  // Update preview when typing
  filenameInput.addEventListener('input', updateFilenamePreview);
  
  // Handle Enter key in filename input
  filenameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveScreenshot.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideModal();
    }
  });
  
  // Close modal when clicking outside
  filenameModal.addEventListener('click', function(e) {
    if (e.target === filenameModal) {
      hideModal();
    }
  });

  addDebugBtn.addEventListener('click', async function() {
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

  clearFormsBtn.addEventListener('click', async function() {
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

  measureBtn.addEventListener('click', async function() {
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
  
  wpDebugBtn.addEventListener('click', async function() {
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
  
  wpQueryBtn.addEventListener('click', function() {
    toggleUrlParameter('debug_queries', '1', 'Query debug');
  });
  
  
  
  wpCacheBtn.addEventListener('click', async function() {
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
  wpSwitchAdminBtn.addEventListener('click', function() {
    toggleUrlParameter('simulate_user_role', 'administrator', 'Admin role simulation');
  });
  
  wpSwitchEditorBtn.addEventListener('click', function() {
    toggleUrlParameter('simulate_user_role', 'editor', 'Editor role simulation');
  });
  
  wpSwitchOffBtn.addEventListener('click', async function() {
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
  
  // Screenshot functionality - show modal instead of taking screenshot directly
  screenshotBtn.addEventListener('click', function() {
    showModal('viewport');
  });
  
  fullPageScreenshotBtn.addEventListener('click', function() {
    showModal('fullpage');
  });
  
  responsiveScreenshotsBtn.addEventListener('click', function() {
    takeResponsiveScreenshots();
  });
  
  // Unified screenshot save function
  saveScreenshot.addEventListener('click', async function() {
    const filename = sanitizeFilename(filenameInput.value.trim() || 'screenshot');
    hideModal();
    
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        showStatus('Unable to get current tab', true);
        return;
      }
      
      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showStatus('Cannot screenshot this page', true);
        return;
      }
      
      if (currentScreenshotType === 'viewport') {
        // Take viewport screenshot
        showStatus('Taking screenshot...');
        
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: 'png',
          quality: 100
        });
        
        await chrome.downloads.download({
          url: dataUrl,
          filename: `${filename}.png`,
          saveAs: false
        });
        
        showStatus('Screenshot saved to Downloads!');
      } else {
        // Take full page screenshot
        showStatus('Taking full page screenshot...');
        
        try {
          // Send message to content script to prepare for full page capture
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'prepareFullPageScreenshot' });
          
          if (!response || !response.success) {
            showStatus('Error: Could not prepare page for screenshot', true);
            return;
          }
          
          const { totalHeight, viewportHeight, scrollSteps } = response;
          const screenshots = [];
          
          // Take screenshots for each scroll position
          for (let i = 0; i < scrollSteps.length; i++) {
            const scrollY = scrollSteps[i];
            
            // Scroll to position
            await chrome.tabs.sendMessage(tab.id, { 
              action: 'scrollToPosition', 
              scrollY: scrollY 
            });
            
            // Wait for scroll to complete
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Capture screenshot
            const dataUrl = await chrome.tabs.captureVisibleTab(null, {
              format: 'png',
              quality: 100
            });
            
            screenshots.push({
              dataUrl,
              scrollY,
              isLast: i === scrollSteps.length - 1
            });
            
            showStatus(`Capturing... ${i + 1}/${scrollSteps.length}`);
          }
          
          // Restore original scroll position
          await chrome.tabs.sendMessage(tab.id, { action: 'restoreScrollPosition' });
          
          // Stitch screenshots together
          const stitchedDataUrl = await stitchScreenshots(screenshots, viewportHeight, totalHeight);
          
          // Download the screenshot with custom filename
          await chrome.downloads.download({
            url: stitchedDataUrl,
            filename: `${filename}.png`,
            saveAs: false
          });
          
          showStatus('Full page screenshot saved!');
          
        } catch (messageError) {
          showStatus('Error: Content script not responding. Try refreshing the page.', true);
          return;
        }
      }
      
      // Close popup after successful action
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      showStatus(`Error: Could not take screenshot - ${error.message}`, true);
    }
  });
  
  // Function to stitch multiple screenshots together
  async function stitchScreenshots(screenshots, viewportHeight, totalHeight) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      canvas.width = screenshots[0] ? 1920 : 1920; // Default width, will be adjusted
      canvas.height = totalHeight;
      
      let loadedCount = 0;
      const images = [];
      
      // Load all images
      screenshots.forEach((screenshot, index) => {
        const img = new Image();
        img.onload = () => {
          images[index] = img;
          loadedCount++;
          
          // Set canvas width based on first image
          if (index === 0) {
            canvas.width = img.width;
          }
          
          // When all images are loaded, draw them
          if (loadedCount === screenshots.length) {
            // Draw screenshots with proper positioning
            screenshots.forEach((screenshot, i) => {
              const img = images[i];
              const y = screenshot.scrollY;
              
              // Handle potential overlap for last screenshot
              if (screenshot.isLast && totalHeight < y + viewportHeight) {
                const cropHeight = totalHeight - y;
                ctx.drawImage(img, 0, 0, img.width, cropHeight, 0, y, img.width, cropHeight);
              } else {
                ctx.drawImage(img, 0, y);
              }
            });
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
          }
        };
        img.src = screenshot.dataUrl;
      });
    });
  }
  
  // Event listeners for vulnerability scanner
  scanBtn.addEventListener('click', performVulnerabilityScan);
  
  rescanBtn.addEventListener('click', performVulnerabilityScan);
  
  clearResultsBtn.addEventListener('click', function() {
    clearScanResults();
    showStatus('Scan results cleared');
  });
  
  // WordPress scan event listeners
  wpScanBtn.addEventListener('click', performWordPressScan);
  
  rescanWpBtn.addEventListener('click', performWordPressScan);
  
  clearWpResultsBtn.addEventListener('click', function() {
    clearWordPressScanResults();
    showStatus('WordPress scan results cleared');
  });
  
  // Reset Query Parameters functionality
  resetParamsBtn.addEventListener('click', async function() {
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
      
      // List of all parameters that this extension can add
      const extensionParams = [
        // Debug parameters
        'debug',
        
        // WordPress debug parameters
        'WP_DEBUG',
        'WPDEBUG', 
        'wp_debug',
        'WP_DEBUG_LOG',
        'WP_DEBUG_DISPLAY',
        'debug_queries',
        'query_debug',
        
        // Cache parameters
        'nocache',
        'cache_bust',
        'no_cache',
        'v',
        '_',
        
        // User switching parameters
        'simulate_user_role',
        'user_switching',
        'switch_to'
      ];
      
      let removedCount = 0;
      
      // Remove all extension-added parameters
      extensionParams.forEach(param => {
        if (currentUrl.searchParams.has(param)) {
          currentUrl.searchParams.delete(param);
          removedCount++;
        }
      });
      
      if (removedCount === 0) {
        showStatus('No extension parameters found to remove');
        return;
      }
      
      // Update the tab with the cleaned URL
      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });
      
      showStatus(`Removed ${removedCount} parameter${removedCount !== 1 ? 's' : ''}`);
      
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
  clearCacheBtn.addEventListener('click', async function() {
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
        showStatus('Cache cleared successfully!');
        
        // Reset button after delay
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear cache on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing cache: ' + error.message, true);
    }
  });
  
  // Clear cookies
  clearCookiesBtn.addEventListener('click', async function() {
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
        showStatus('Cookies cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear cookies on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing cookies: ' + error.message, true);
    }
  });
  
  // Clear local storage
  clearLocalStorageBtn.addEventListener('click', async function() {
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
        showStatus('Local storage cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear local storage on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing local storage: ' + error.message, true);
    }
  });
  
  // Clear IndexedDB
  clearIndexedDBBtn.addEventListener('click', async function() {
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
        showStatus('IndexedDB cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear IndexedDB on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing IndexedDB: ' + error.message, true);
    }
  });
  
  // Clear Service Workers
  clearServiceWorkersBtn.addEventListener('click', async function() {
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
        showStatus('Service workers cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear service workers on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing service workers: ' + error.message, true);
    }
  });
  
  // Clear Cache Storage (CacheStorage API)
  clearCacheStorageBtn.addEventListener('click', async function() {
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
        showStatus('Cache storage cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear cache storage on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing cache storage: ' + error.message, true);
    }
  });
  
  // Clear Form Data (autofill)
  clearFormDataBtn.addEventListener('click', async function() {
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
        showStatus('Form data cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear form data on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing form data: ' + error.message, true);
    }
  });
  
  // Clear Web SQL
  clearWebSQLBtn.addEventListener('click', async function() {
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
        showStatus('Web SQL cleared successfully!');
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }, 2000);
      } else {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        showStatus('Cannot clear Web SQL on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing Web SQL: ' + error.message, true);
    }
  });
  
  // Clear all site data
  clearAllDataBtn.addEventListener('click', async function() {
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
        showStatus('All site data cleared! Reloading...');
        
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
        showStatus('Cannot clear data on this page', true);
      }
    } catch (error) {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      showStatus('Error clearing all data: ' + error.message, true);
    }
  });
  
// Video Recording functionality

  // Constants for recording time limits
  const MAX_RECORDING_TIME = 180; // 3 minutes in seconds  
  const WARNING_TIME_30S = 150; // 30 seconds before max 
  const WARNING_TIME_10S = 170; // 10 seconds before max
  
  // Format time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  // Update recording timer
  function updateRecordingTimer() {
    if (recordingStartTime) {
      const elapsed = Math.floor((Date.now() - recordingStartTime - pausedTime) / 1000);
      const timeString = formatTime(elapsed);
      recordingTime.textContent = timeString;
      
      // Check if approaching time limits
      let warningLevel = 'none';
      let remainingTime = MAX_RECORDING_TIME - elapsed;
      
      if (elapsed >= WARNING_TIME_10S) {
        warningLevel = 'critical';
      } else if (elapsed >= WARNING_TIME_30S) {
        warningLevel = 'warning';
      }
      
      // Update toolbar on page with time details
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { 
          action: 'updateRecordingTime', 
          time: timeString,
          elapsed: elapsed,
          remaining: remainingTime,
          warningLevel: warningLevel
        }).catch(() => {});
      }
      
      // Automatically stop when limit is reached
      if (elapsed >= MAX_RECORDING_TIME) {
        console.log('Maximum recording time reached, stopping recording');
        
        // Show notification about time limit reached
        if (currentTabId) {
          chrome.tabs.sendMessage(currentTabId, { 
            action: 'showNotification', 
            message: 'Recording stopped: maximum time of 3 minutes reached'
          }).catch(() => {});
        }
        
        stopRecording();
        return;
      }
    }
  }
  
  // Start recording
  startRecordingBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        showStatus('Unable to get current tab', true);
        return;
      }
      
      currentTabId = tab.id;
      
      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showStatus('Cannot record this page', true);
        return;
      }
      
      // Close popup immediately when user clicks Start Recording
      setTimeout(() => {
        window.close();
      }, 200);
      
      // Show recording toolbar on the page (without starting recording immediately)
      console.log('Showing recording toolbar without recording...');
      
      // Try multiple attempts with delays to ensure the page is ready
      const tryShowToolbar = (attempt = 1, maxAttempts = 3) => {
        chrome.tabs.sendMessage(currentTabId, { action: 'showRecordingToolbar', mode: 'ready' })
          .then(response => {
            if (!response || !response.success) {
              console.error(`Failed to show recording toolbar (attempt ${attempt}):`, response?.message || 'Unknown error');
              if (attempt < maxAttempts) {
                setTimeout(() => tryShowToolbar(attempt + 1, maxAttempts), 500 * attempt);
              }
            } else {
              console.log('Recording toolbar shown successfully');
            }
          })
          .catch(error => {
            console.error(`Error sending showRecordingToolbar message (attempt ${attempt}):`, error);
            if (attempt < maxAttempts) {
              setTimeout(() => tryShowToolbar(attempt + 1, maxAttempts), 500 * attempt);
            }
          });
      };
      
      // First attempt with no delay
      tryShowToolbar();
      
      // Store tabId but don't start recording yet
      // The user must click play button in the toolbar to start recording
      
    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  });
  
  // New function to actually start recording when user clicks play
  async function startActualRecording() {
    try {
      if (!currentTabId) {
        showStatus('No active tab for recording', true);
        return;
      }
      
      // Request tab capture
      console.log('Requesting tab capture for actual recording...');
      chrome.tabCapture.capture({
        audio: true,
        video: true,
        videoConstraints: {
          mandatory: {
            minWidth: 1280,
            minHeight: 720,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30
          }
        }
      }, (stream) => {
        if (chrome.runtime.lastError) {
          console.error('Tab capture error:', chrome.runtime.lastError);
          showStatus('Error: ' + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (!stream) {
          console.error('No stream received');
          showStatus('Failed to capture tab', true);
          return;
        }
        
        console.log('Stream received:', stream);
        
        // Create media recorder
        try {
          recordedChunks = [];
          isPaused = false;
          pausedTime = 0;
          
          const options = { mimeType: 'video/webm;codecs=vp9' };
          
          // Fallback to vp8 if vp9 is not supported
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log('VP9 not supported, falling back to VP8');
            options.mimeType = 'video/webm;codecs=vp8';
          }
          
          console.log('Creating MediaRecorder with options:', options);
          mediaRecorder = new MediaRecorder(stream, options);
          console.log('MediaRecorder created successfully');
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunks.push(event.data);
              console.log('Data chunk received:', event.data.size, 'bytes. Total chunks:', recordedChunks.length);
            }
          };
          
          mediaRecorder.onstop = async () => {
            console.log('MediaRecorder stopped. Total chunks:', recordedChunks.length);
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Create blob from recorded chunks
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            
            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `recording-${timestamp}.webm`;
            
            // Create download URL
            const url = URL.createObjectURL(blob);
            
            // Download the video
            try {
              await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
              });
              
              showStatus('Recording saved!');
            } catch (error) {
              showStatus('Error saving recording: ' + error.message, true);
            } finally {
              URL.revokeObjectURL(url);
            }
            
            // Hide toolbar
            if (currentTabId) {
              chrome.tabs.sendMessage(currentTabId, { 
                action: 'hideRecordingToolbar' 
              }).catch(() => {});
            }
            
            // Reset UI
            recordingStatus.style.display = 'none';
            startRecordingBtn.disabled = false;
            stopRecordingBtn.disabled = true;
            stopRecordingBtn.style.opacity = '0.5';
            
            // Clear interval
            if (recordingInterval) {
              clearInterval(recordingInterval);
              recordingInterval = null;
            }
            
            recordedChunks = [];
            mediaRecorder = null;
            isPaused = false;
            pausedTime = 0;
            currentTabId = null;
          };
          
          // Start recording
          console.log('Starting MediaRecorder...');
          mediaRecorder.start(100); // Collect data every 100ms
          console.log('MediaRecorder state:', mediaRecorder.state);
          
          // Update UI
          recordingStartTime = Date.now();
          recordingTime.textContent = '00:00';
          recordingStatus.style.display = 'block';
          startRecordingBtn.disabled = true;
          stopRecordingBtn.disabled = false;
          stopRecordingBtn.style.opacity = '1';
          
          // Update toolbar state to recording
          chrome.tabs.sendMessage(currentTabId, { action: 'updateRecordingState', state: 'recording' })
            .catch(() => {});
          
          // Start timer
          recordingInterval = setInterval(() => {
            if (!isPaused) {
              updateRecordingTimer();
            }
          }, 1000);
          
          showStatus('Recording started');
          console.log('Recording setup complete');
          
    } catch (error) {
      showStatus('Error starting recording: ' + error.message, true);
      stream.getTracks().forEach(track => track.stop());
    }
  });
  
    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  }
  
  // Toggle pause/resume recording
  function togglePauseRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
    
    if (mediaRecorder.state === 'recording') {
      // Pause
      mediaRecorder.pause();
      isPaused = true;
      const pauseStartTime = Date.now();
      
      // Update toolbar UI
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { 
          action: 'updateRecordingState', 
          state: 'paused' 
        }).catch(() => {});
      }
      
      showStatus('Recording paused');
      
      // Store when pause started for accurate time tracking
      window.pauseStartTime = pauseStartTime;
      
    } else if (mediaRecorder.state === 'paused') {
      // Resume
      mediaRecorder.resume();
      isPaused = false;
      
      // Add the paused duration to total paused time
      if (window.pauseStartTime) {
        pausedTime += Date.now() - window.pauseStartTime;
        delete window.pauseStartTime;
      }
      
      // Update toolbar UI
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { 
          action: 'updateRecordingState', 
          state: 'recording' 
        }).catch(() => {});
      }
      
      showStatus('Recording resumed');
    }
  }
  
  // Stop recording function
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      showStatus('Stopping recording...');
    }
  }
  
  // Stop recording
  stopRecordingBtn.addEventListener('click', stopRecording);

  //==============================
  // Responsive Screenshots (3 states)
  //==============================
  async function takeResponsiveScreenshots() {
    try {
      console.log('Starting responsive screenshots...');
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) {
        console.log('Unable to get current tab');
        showStatus('Unable to get current tab', true);
        return;
      }
      if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://') || activeTab.url.startsWith('edge://') || activeTab.url.startsWith('about:')) {
        console.log('Cannot screenshot this page - restricted URL');
        showStatus('Cannot screenshot this page', true);
        return;
      }

      console.log('Current active tab:', activeTab.url);
      showStatus('Preparing responsive screenshots...');

      const sizes = [
        { width: 1890, height: 1200, label: 'desktop' },
        { width: 1024, height: 1200, label: 'tablet' },
        { width: 390,  height: 1200, label: 'mobile' },
      ];

      const pngs = [];
      const urlObj = new URL(activeTab.url);
      // Extract domain, page path and format date
      const domain = urlObj.hostname;
      const pagePath = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-|-$/g, '') || 'home';
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const zipName = `${domain}-${pagePath}-${dateStr}.zip`;

      for (let i = 0; i < sizes.length; i++) {
        const s = sizes[i];
        showStatus(`Opening ${s.label} window (${s.width}px)...`);

        // Open a temporary window at the requested width
        console.log('Opening window for size:', s.label);
        const createdWin = await chrome.windows.create({ url: activeTab.url, width: s.width, height: s.height, type: 'normal', focused: true, state: 'normal' });
        console.log('Created window:', createdWin);
        const createdWinId = createdWin.id;
        const createdTabId = createdWin.tabs && createdWin.tabs[0] ? createdWin.tabs[0].id : null;
        if (!createdTabId || !createdWinId) {
          showStatus('Failed to open temporary window', true);
          if (createdWinId) await chrome.windows.remove(createdWinId);
          return;
        }

        // Wait for tab to finish loading
        await waitForTabComplete(createdTabId);
        
        // Additional wait to ensure page is fully rendered
        await new Promise(r => setTimeout(r, 1000));
        
        // Focus the window to make sure it's active
        await chrome.windows.update(createdWinId, { focused: true });
        
        // Another small delay after focusing
        await new Promise(r => setTimeout(r, 500));

        // Prepare page for full page capture
        const prep = await chrome.tabs.sendMessage(createdTabId, { action: 'prepareFullPageScreenshot' }).catch(() => null);
        if (!prep || !prep.success) {
          await chrome.windows.remove(createdWinId);
          showStatus('Error preparing page for screenshot', true);
          return;
        }

        const { totalHeight, viewportHeight, scrollSteps } = prep;
        const screenshots = [];

        for (let idx = 0; idx < scrollSteps.length; idx++) {
          const y = scrollSteps[idx];
          console.log(`Capturing part ${idx+1}/${scrollSteps.length} at y=${y}`);
          await chrome.tabs.sendMessage(createdTabId, { action: 'scrollToPosition', scrollY: y }).catch(() => ({}));
          await new Promise(r => setTimeout(r, 1000)); // Longer wait
          
          // Try capturing the tab
          let dataUrl;
          try {
            dataUrl = await chrome.tabs.captureVisibleTab(createdWinId, { format: 'png', quality: 100 });
            console.log(`Captured section ${idx+1}, data URL length:`, dataUrl.length);
          } catch (error) {
            console.error(`Error capturing section ${idx+1}:`, error);
            // Try without window ID
            try {
              dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 });
              console.log(`Captured with null window ID, length:`, dataUrl.length);
            } catch (error2) {
              console.error(`Error with null window ID:`, error2);
              // Exit early if we can't capture
              await chrome.windows.remove(createdWinId);
              showStatus('Error capturing screenshots', true);
              return;
            }
          }
          
          screenshots.push({ dataUrl, scrollY: y, isLast: idx === scrollSteps.length - 1 });
          showStatus(`Capturing ${s.label} ${idx + 1}/${scrollSteps.length}`);
        }

        // Restore scroll position and stitch
        await chrome.tabs.sendMessage(createdTabId, { action: 'restoreScrollPosition' }).catch(() => ({}));
        const stitched = await stitchScreenshots(screenshots, viewportHeight, totalHeight);

        pngs.push({
          name: `${pagePath}-${s.label}-${s.width}px.png`,
          dataUrl: stitched
        });

        // Close the temporary window
        await chrome.windows.remove(createdWinId);
      }

      showStatus('Packaging ZIP...');
      console.log('PNGs to zip:', pngs.length, 'files');

      // Build ZIP (STORE, no compression)
      const zipBlob = await buildZipFromDataUrls(pngs);
      console.log('Created ZIP blob, size:', zipBlob.size, 'bytes');
      const zipUrl = URL.createObjectURL(zipBlob);

      try {
        await chrome.downloads.download({ url: zipUrl, filename: zipName, saveAs: false });
        console.log('Download triggered successfully');
      } catch (downloadError) {
        console.error('Error downloading ZIP:', downloadError);
        showStatus('Error downloading ZIP: ' + downloadError.message, true);
        return;
      }
      setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);

      showStatus('Download ready!');

      setTimeout(() => { window.close(); }, 1500);
    } catch (e) {
      console.error('Error in responsive screenshots:', e);
      showStatus(`Error: ${e.message}`, true);
    }
  }

  function waitForTabComplete(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.get(tabId, (t) => {
        if (t && t.status === 'complete') return resolve();
        const listener = (id, changeInfo) => {
          if (id === tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    });
  }

  // Minimal ZIP builder (STORE method)
  async function buildZipFromDataUrls(files) {
    // helpers
    const textEncoder = new TextEncoder();

    function decodeDataUrl(dataUrl) {
      const base64 = dataUrl.split(',')[1];
      const binStr = atob(base64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
      return bytes;
    }

    function crc32(buf) {
      let c = 0 ^ (-1);
      for (let i = 0; i < buf.length; i++) {
        c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
      }
      return (c ^ (-1)) >>> 0;
    }

    // Precompute CRC table
    const CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }

    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const f of files) {
      const nameBytes = textEncoder.encode(f.name);
      const data = decodeDataUrl(f.dataUrl);
      const crc = crc32(data);
      const compSize = data.length; // STORE
      const uncompSize = data.length;

      // DOS time/date (now)
      const now = new Date();
      const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() / 2)) & 0xFFFF;
      const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

      // Local file header
      const lfh = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(lfh.buffer);
      dv.setUint32(0, 0x04034b50, true); // signature
      dv.setUint16(4, 20, true); // version needed
      dv.setUint16(6, 0, true); // flags
      dv.setUint16(8, 0, true); // compression (0=store)
      dv.setUint16(10, dosTime, true);
      dv.setUint16(12, dosDate, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, compSize, true);
      dv.setUint32(22, uncompSize, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true); // extra len
      lfh.set(nameBytes, 30);

      localParts.push(lfh, data);

      // Central directory header
      const cdfh = new Uint8Array(46 + nameBytes.length);
      const cdv = new DataView(cdfh.buffer);
      cdv.setUint32(0, 0x02014b50, true); // signature
      cdv.setUint16(4, 20, true); // version made by
      cdv.setUint16(6, 20, true); // version needed
      cdv.setUint16(8, 0, true); // flags
      cdv.setUint16(10, 0, true); // compression
      cdv.setUint16(12, dosTime, true);
      cdv.setUint16(14, dosDate, true);
      cdv.setUint32(16, crc, true);
      cdv.setUint32(20, compSize, true);
      cdv.setUint32(24, uncompSize, true);
      cdv.setUint16(28, nameBytes.length, true);
      cdv.setUint16(30, 0, true); // extra
      cdv.setUint16(32, 0, true); // comment
      cdv.setUint16(34, 0, true); // disk number
      cdv.setUint16(36, 0, true); // internal attrs
      cdv.setUint32(38, 0, true); // external attrs
      cdv.setUint32(42, offset, true); // relative offset of local header
      cdfh.set(nameBytes, 46);

      centralParts.push(cdfh);

      offset += lfh.length + data.length;
    }

    // Concatenate local parts
    const localSize = localParts.reduce((a, p) => a + p.length, 0);
    const centralSize = centralParts.reduce((a, p) => a + p.length, 0);

    const eocd = new Uint8Array(22);
    const edv = new DataView(eocd.buffer);
    edv.setUint32(0, 0x06054b50, true); // signature
    edv.setUint16(4, 0, true); // disk number
    edv.setUint16(6, 0, true); // disk start
    edv.setUint16(8, files.length, true); // entries on disk
    edv.setUint16(10, files.length, true); // total entries
    edv.setUint32(12, centralSize, true); // size of central dir
    edv.setUint32(16, localSize, true); // offset of central dir
    edv.setUint16(20, 0, true); // comment length

    // Build final blob
    const parts = [...localParts, ...centralParts, eocd];
    return new Blob(parts, { type: 'application/zip' });
  }
});
