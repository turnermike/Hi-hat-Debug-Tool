document.addEventListener('DOMContentLoaded', function() {
  const addDebugBtn = document.getElementById('addDebugBtn');
  const clearFormsBtn = document.getElementById('clearFormsBtn');
  const statusDiv = document.getElementById('status');

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
      
      // Check if debug parameter already exists
      if (currentUrl.searchParams.has('debug')) {
        showStatus('Debug parameter already exists!');
        return;
      }

      // Add the debug parameter
      currentUrl.searchParams.set('debug', 'true');
      
      // Update the tab with the new URL
      await chrome.tabs.update(tab.id, { url: currentUrl.toString() });
      
      showStatus('Debug parameter added!');
      
      // Close popup after successful action
      setTimeout(() => {
        window.close();
      }, 1000);
      
    } catch (error) {
      console.error('Error adding debug parameter:', error);
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
      console.error('Error clearing forms:', error);
      showStatus('Error: Could not clear forms', true);
    }
  });
});
