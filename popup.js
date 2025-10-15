document.addEventListener('DOMContentLoaded', function() {
  const addDebugBtn = document.getElementById('addDebugBtn');
  const clearFormsBtn = document.getElementById('clearFormsBtn');
  const measureBtn = document.getElementById('measureBtn');
  const statusDiv = document.getElementById('status');
  
  // WordPress elements
  const wordpressSection = document.getElementById('wordpressSection');
  const wpDebugBtn = document.getElementById('wpDebugBtn');
  const wpQueryBtn = document.getElementById('wpQueryBtn');
  const wpCacheBtn = document.getElementById('wpCacheBtn');
  const wpCustomizerBtn = document.getElementById('wpCustomizerBtn');
  
  // User switching elements
  const userSwitchingRow = document.getElementById('userSwitchingRow');
  const wpSwitchAdminBtn = document.getElementById('wpSwitchAdminBtn');
  const wpSwitchEditorBtn = document.getElementById('wpSwitchEditorBtn');
  const wpSwitchOffBtn = document.getElementById('wpSwitchOffBtn');
  
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
      updateButtonState(wpCustomizerBtn, params.has('customize_theme') || params.has('customizer'));
      
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
  
  wpCustomizerBtn.addEventListener('click', function() {
    toggleUrlParameter('customize_theme', '1', 'Customizer preview');
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
});
