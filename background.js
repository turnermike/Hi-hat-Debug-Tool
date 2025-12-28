importScripts('/lib/jszip.js');

/**
 * Background script for Hi-hat Debug Tool Chrome Extension
 * Handles extension lifecycle events and provides service worker functionality
 */

const screenshotPromises = new Map();

async function contentScript(tabUrl, tabTitle) {
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // Ensure scrolling is not blocked
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  // Store original styles of fixed/sticky elements and hide them
  const fixedElements = [];
  document.querySelectorAll('*').forEach(element => {
    const style = window.getComputedStyle(element);
    if (style.position === 'fixed' || style.position === 'sticky') {
      fixedElements.push({
        element: element,
        originalPosition: style.position,
        originalVisibility: style.visibility
      });
      element.style.setProperty('position', 'static', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
    }
  });

  // Pre-scrolling logic to trigger lazy loading
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(resolve => setTimeout(resolve, 1000));
  window.scrollTo(0, 0);
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const screenshots = [];
    const viewportHeight = window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight; // Standard height calculation
    const numScrolls = Math.ceil(pageHeight / viewportHeight); // Calculate number of scrolls

    // Ensure we start at the top
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500)); 

    for (let i = 0; i < numScrolls; i++) {
      let scrollY = i * viewportHeight;

      // Adjust the last scroll position to precisely capture the remaining content at the bottom
      if (scrollY + viewportHeight > pageHeight) {
        scrollY = pageHeight - viewportHeight;
        if (scrollY < 0) scrollY = 0; // Handle very short pages that fit in one viewport
      }

      window.scrollTo(0, scrollY);
      await new Promise(resolve => setTimeout(resolve, 500)); 

      const dataUrl = await chrome.runtime.sendMessage({ action: 'captureVisibleTab' });
      screenshots.push({ dataUrl, scrollY });
    }

    chrome.runtime.sendMessage({
      action: 'stitchScreenshots',
      screenshots,
      pageHeight, // Use the standard pageHeight
      viewportHeight,
      tabUrl,
      tabTitle
    });

  } catch (error) {
    // Handle error
  } finally {
    // Restore original state of fixed/sticky elements
    fixedElements.forEach(item => {
      item.element.style.setProperty('position', item.originalPosition, 'important');
      item.element.style.setProperty('visibility', item.originalVisibility, 'important');
    });
    window.scrollTo(originalScrollX, originalScrollY); // Restore original scroll
  }
}

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
        const { screenshots, pageHeight, viewportHeight, tabUrl, tabTitle } = request;
        const tabId = sender.tab.id;

        if (!screenshots || screenshots.length === 0) {
          if (screenshotPromises.has(tabId)) {
            screenshotPromises.get(tabId).reject(new Error("No screenshots to stitch."));
            screenshotPromises.delete(tabId);
          }
          return;
        }

        const imageBitmaps = await Promise.all(
          screenshots.map(async ({ dataUrl }) => {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            return await createImageBitmap(blob);
          })
        );

        const { width } = imageBitmaps[0];
        const canvas = new OffscreenCanvas(width, pageHeight);
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < imageBitmaps.length; i++) {
          const { scrollY } = screenshots[i];
          ctx.drawImage(imageBitmaps[i], 0, scrollY);
        }
        
        const blob = await canvas.convertToBlob();
        
        const tabURL = new URL(tabUrl);
        let domain = tabURL.hostname;
        if (domain.startsWith('www.')) {
          domain = domain.substring(4);
        }
        const sanitizedTitle = tabTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        const filename = `${domain}-${sanitizedTitle}-full.png`;

        if (screenshotPromises.has(tabId)) {
          screenshotPromises.get(tabId).resolve({ filename, blob });
          screenshotPromises.delete(tabId);
        }

      } catch (error) {
        console.error("Error stitching screenshots:", error);
        const tabId = sender.tab.id;
        if (screenshotPromises.has(tabId)) {
            screenshotPromises.get(tabId).reject(error);
            screenshotPromises.delete(tabId);
        }
      }
    })();
  }
  
  if (request.action === 'fullPageScreenshot') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const { filename, blob } = await captureAndStitch(tab.id, tab.url, tab.title);
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const dataUrl = reader.result;
          chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
          });
        };

      } catch (error) {
        console.error("Error taking full page screenshot:", error);
      }
    })();
  }

  if (request.action === 'scanAndCapture') {
    (async () => {
      try {
        const [mainTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const contentScriptReadyPromise = new Promise(resolve => {
          const listener = (message) => {
            if (message.action === 'findLinksScriptReady') {
              chrome.runtime.onMessage.removeListener(listener);
              resolve();
            }
          };
          chrome.runtime.onMessage.addListener(listener);
        });

        await chrome.scripting.executeScript({
          target: { tabId: mainTab.id },
          files: ['scripts/find-links.js'],
        });
        await contentScriptReadyPromise; // Wait for the content script to be ready
        
        const { links } = await chrome.tabs.sendMessage(mainTab.id, { action: 'findNavLinks' });

        const screenshotResults = await Promise.all(
          links.map(async (link) => {
            try {
              const newTab = await chrome.tabs.create({ url: link, active: false });
              await new Promise(resolve => {
                const listener = (tabId, changeInfo) => {
                  if (tabId === newTab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                  }
                };
                chrome.tabs.onUpdated.addListener(listener);
              });
              const createdTab = await chrome.tabs.get(newTab.id);
              const result = await captureAndStitch(newTab.id, createdTab.url, createdTab.title);
              chrome.tabs.remove(newTab.id);
              return result;
            } catch(e) {
                console.error(`Failed to capture ${link}`, e);
                return null;
            }
          })
        );

        const zip = new JSZip();
        screenshotResults.filter(r => r).forEach(({filename, blob}) => {
            zip.file(filename, blob);
        });

        const reader = new FileReader();
        reader.readAsDataURL(zipBlob);
        reader.onloadend = () => {
          const dataUrl = reader.result;
          chrome.downloads.download({
            url: dataUrl,
            filename: 'screenshots.zip',
            saveAs: true
          });
        };

      } catch (error) {
        console.error("Error scanning and capturing:", error);
      }
    })();
  }
});

function captureAndStitch(tabId, url, title) {
    return new Promise((resolve, reject) => {
        screenshotPromises.set(tabId, { resolve, reject });
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: contentScript,
            args: [url, title],
        });
    });
}

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