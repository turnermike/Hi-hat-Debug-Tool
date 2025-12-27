/**
 * Background script for Hi-hat Debug Tool Chrome Extension
 * Handles extension lifecycle events and provides service worker functionality
 */

// Extension installation and update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Hi-hat Debug Tool installed');
    
    // Set default settings or perform initial setup
    chrome.storage.local.set({
      extensionVersion: chrome.runtime.getManifest().version,
      installDate: new Date().toISOString(),
      settings: {
        autoDetectWordPress: true,
        showSecurityWarnings: true,
        defaultScreenshotFormat: 'png'
      }
    });
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;
    console.log(`Hi-hat Debug Tool updated from ${previousVersion} to ${currentVersion}`);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Hi-hat Debug Tool started');
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url) {
    return;
  }
  
  // Skip restricted pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    return;
  }
  
  if (command === 'copy-url') {
    try {
      // Store URL in extension storage
      await chrome.storage.local.set({ 'clipboardUrl': tab.url });
      
      // Copy to system clipboard using content script
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'copyToClipboard', 
        text: tab.url 
      });
      
      // Show notification
      chrome.tabs.sendMessage(tab.id, { 
        action: 'showNotification', 
        message: 'URL copied to clipboard (Cmd+Shift+C)' 
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  } else if (command === 'paste-url') {
    try {
      // Get URL from system clipboard using content script
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'readFromClipboard' 
      });
      
      if (response && response.success && response.text) {
        const clipboardText = response.text.trim();
        
        // Check if it's a valid URL
        try {
          new URL(clipboardText);
          // Navigate to the URL
          await chrome.tabs.update(tab.id, { url: clipboardText });
          
          // Store in extension storage
          await chrome.storage.local.set({ 'clipboardUrl': clipboardText });
        } catch (urlError) {
          // Show error notification
          chrome.tabs.sendMessage(tab.id, { 
            action: 'showNotification', 
            message: 'Clipboard does not contain a valid URL',
            isError: true 
          });
        }
      }
    } catch (error) {
      console.error('Failed to paste URL:', error);
    }
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any background processing if needed
  
  if (request.action === 'getExtensionInfo') {
    sendResponse({
      version: chrome.runtime.getManifest().version,
      name: chrome.runtime.getManifest().name
    });
    return true;
  }
  
  if (request.action === 'logEvent') {
    console.log(`[${new Date().toISOString()}] ${request.event}:`, request.data);
    return true;
  }
  
  // Handle clipboard operations from popup
  if (request.action === 'getClipboardUrl') {
    chrome.storage.local.get(['clipboardUrl'], (result) => {
      sendResponse({ clipboardUrl: result.clipboardUrl || '' });
    });
    return true;
  }

  if (request.action === 'toggleDebugMode') {
    StorageManager.set('isDebugModeEnabled', request.enabled);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getStorage') {
    StorageManager.get(request.key).then(value => {
      sendResponse({ value });
    });
    return true;
  }

  if (request.action === 'setStorage') {
    StorageManager.set(request.key, request.value).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'fullPageScreenshot') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/scroll-and-stitch.js'],
        });
        chrome.tabs.sendMessage(tab.id, { 
          action: 'startFullPageScreenshot',
          tabUrl: tab.url,
          tabTitle: tab.title
        });
      } catch (error) {
        console.error("Error starting full page screenshot:", error);
      }
    })();
  }

  if (request.action === 'captureVisibleTab') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      sendResponse(dataUrl);
    })();
    return true;
  }

  if (request.action === 'stitchScreenshots') {
    (async () => {
      try {
        console.log("Stitching screenshots...");
        const { screenshots, pageHeight, viewportHeight, tabUrl, tabTitle } = request;

        if (!screenshots || screenshots.length === 0) {
          console.log("No screenshots to stitch.");
          return;
        }
        console.log(`Received ${screenshots.length} screenshots.`);

        const imageBitmaps = await Promise.all(
          screenshots.map(async (dataUrl) => {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            return await createImageBitmap(blob);
          })
        );
        console.log("Created image bitmaps.");

        const { width } = imageBitmaps[0];
        const canvas = new OffscreenCanvas(width, pageHeight);
        const ctx = canvas.getContext('2d');
        console.log("Created canvas.");

        for (let i = 0; i < imageBitmaps.length; i++) {
          ctx.drawImage(imageBitmaps[i], 0, i * viewportHeight);
        }
        console.log("Drew images on canvas.");
        
        const blob = await canvas.convertToBlob();
        console.log("Converted canvas to blob.");

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const dataUrl = reader.result;
          console.log("Created data URL.");

          const tabURL = new URL(tabUrl);
          const domain = tabURL.hostname;
          const pageName = tabTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const filename = `${domain}-${pageName}-full.png`;
          console.log(`Generated filename: ${filename}`);

          chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
          });
          console.log("Download started.");
        };
      } catch (error) {
        console.error("Error stitching screenshots:", error);
      }
    })();
  }
});

// Handle tab updates for WordPress detection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when the page has finished loading
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip restricted pages
    const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'edge://', 'about:'];
    const isRestricted = restrictedPrefixes.some(prefix => tab.url.startsWith(prefix));
    
    if (!isRestricted) {
      const isDebugModeEnabled = await StorageManager.get('isDebugModeEnabled');
      if (isDebugModeEnabled) {
        chrome.tabs.sendMessage(tabId, { action: 'createBreakpointBox' });
      } else {
        chrome.tabs.sendMessage(tabId, { action: 'removeBreakpointBox' });
        const url = new URL(tab.url);
        if (url.searchParams.has('debug')) {
          url.searchParams.delete('debug');
          chrome.tabs.update(tabId, { url: url.toString() });
        }
      }
    }
  }
});

// Handle extension icon click (optional - alternative to popup)
chrome.action.onClicked.addListener((tab) => {
  // This only fires if no popup is defined in manifest
  // Since we have a popup, this won't be used, but kept for reference
});

// Cleanup on extension suspend/shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('Hi-hat Debug Tool suspending');
});

// Error handling
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.log('Port disconnected:', chrome.runtime.lastError.message);
    }
  });
});

// Storage management
const StorageManager = {
  async get(key) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  async remove(key) {
    try {
      await chrome.storage.local.remove(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};

// Make StorageManager available to other parts of the extension
globalThis.StorageManager = StorageManager;