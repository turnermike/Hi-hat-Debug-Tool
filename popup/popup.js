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
});
