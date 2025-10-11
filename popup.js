document.addEventListener('DOMContentLoaded', function() {
  const addDebugBtn = document.getElementById('addDebugBtn');
  const statusDiv = document.getElementById('status');

  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `mt-3 text-sm ${isError ? 'text-red-600' : 'text-green-600'}`;
    statusDiv.classList.remove('hidden');
    
    // Hide status after 2 seconds
    setTimeout(() => {
      statusDiv.classList.add('hidden');
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
});