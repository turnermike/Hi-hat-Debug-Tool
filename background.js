importScripts('/lib/jszip.js');

/**
 * Background script for Hi-hat Debug Tool Chrome Extension
 * Handles extension lifecycle events and provides service worker functionality
 */

const screenshotPromises = new Map();

function blobToDataUrl(blob) {
  return blob.arrayBuffer().then(arrayBuffer => {
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return 'data:image/png;base64,' + btoa(binary);
  });
}

async function contentScript(tabUrl, tabTitle) {
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // Ensure scrolling is not blocked
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  // Store original styles of fixed/sticky elements and hide them only after the first capture
  const fixedElements = [];
  document.querySelectorAll('*').forEach(element => {
    const style = window.getComputedStyle(element);
    if (style.position === 'fixed' || style.position === 'sticky') {
      fixedElements.push({
        element,
        originalDisplay: element.style.getPropertyValue('display'),
        originalVisibility: element.style.getPropertyValue('visibility'),
        originalPosition: element.style.getPropertyValue('position')
      });
    }
  });

  window.__hiHatDebug__ = {
    fixedElements,
    originalScrollX,
    originalScrollY
  };

  // Pre-scrolling logic to trigger lazy loading and determine full page metrics
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(resolve => setTimeout(resolve, 1000));
  window.scrollTo(0, 0);
  await new Promise(resolve => setTimeout(resolve, 500));

  const viewportHeight = window.innerHeight;
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  );

  return { pageHeight, viewportHeight };
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
      await chrome.tabs.sendMessage(tab.id, {
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
          await chrome.tabs.sendMessage(tab.id, {
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

async function getCrawlableLinks(tabId) {
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
    target: { tabId },
    files: ['scripts/find-links.js'],
  });
  await contentScriptReadyPromise;

  const response = await chrome.tabs.sendMessage(tabId, { action: 'findNavLinks' });
  return response?.links || [];
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('background message received:', request.action, sender && sender.tab ? sender.tab.id : 'no-tab');
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
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
        sendResponse({ success: true, dataUrl });
      } catch (error) {
        console.error('captureVisibleTab failed:', error);
        sendResponse({ success: false, error: error.message });
      }
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
        const dpiScale = imageBitmaps[0].height / viewportHeight;
        const scaledPageHeight = Math.round(pageHeight * dpiScale);
        const canvas = new OffscreenCanvas(width, scaledPageHeight);
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < imageBitmaps.length; i++) {
          const { scrollY } = screenshots[i];
          const drawY = Math.round(scrollY * dpiScale);
          ctx.drawImage(imageBitmaps[i], 0, drawY);
        }

        const blob = await canvas.convertToBlob();

        const tabURL = new URL(tabUrl);
        let domain = tabURL.hostname;
        if (domain.startsWith('www.')) {
          domain = domain.substring(4);
        }
        const sanitizedTitle = tabTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        const filename = `${domain}-${sanitizedTitle}.png`;

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
    return true;
  }

  if (request.action === 'fullPageScreenshot') {
    (async () => {
      try {
        console.log('fullPageScreenshot requested');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const { filename, blob } = await captureAndStitch(tab.id, tab.url, tab.title);

        let downloadUrl;
        let objectUrl;
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          objectUrl = URL.createObjectURL(blob);
          downloadUrl = objectUrl;
          console.log('downloading objectUrl', objectUrl, 'filename', filename);
        } else {
          console.log('URL.createObjectURL unavailable, using data URL fallback');
          downloadUrl = await blobToDataUrl(blob);
        }

        let downloadId;
        try {
          downloadId = await new Promise((resolve, reject) => {
            chrome.downloads.download({
              url: downloadUrl,
              filename: filename,
              saveAs: true
            }, (id) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve(id);
            });
          });
          console.log('Download started:', downloadId);
        } catch (downloadError) {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          console.warn('primary download failed, falling back to data URL:', downloadError.message);
          const dataUrl = await blobToDataUrl(blob);
          downloadId = await new Promise((resolve, reject) => {
            chrome.downloads.download({
              url: dataUrl,
              filename: filename,
              saveAs: true
            }, (id) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve(id);
            });
          });
          console.log('Download started via fallback dataUrl:', downloadId);
        } finally {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
        }

        console.log('downloadId resolved:', downloadId, 'filename:', filename);
      } catch (error) {
        console.error("Error taking full page screenshot:", error);
      }
    })();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'previewCrawlableLinks') {
    (async () => {
      try {
        const [mainTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!mainTab?.id) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }
        const links = await getCrawlableLinks(mainTab.id);
        sendResponse({ success: true, links });
      } catch (error) {
        console.error('Error previewing crawlable links:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (request.action === 'scanAndCapture') {
    (async () => {
      try {
        const [mainTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const links = request.links ?? await getCrawlableLinks(mainTab.id);

        if (!links.length) {
          console.warn('No crawlable links to capture');
          return;
        }

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
            } catch (e) {
              console.error(`Failed to capture ${link}`, e);
              return null;
            }
          })
        );

        const zip = new JSZip();
        screenshotResults.filter(r => r).forEach(({ filename, blob }) => {
          zip.file(filename, blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const dataUrl = await blobToDataUrl(zipBlob);
        await new Promise((resolve, reject) => {
          chrome.downloads.download({
            url: dataUrl,
            filename: 'screenshots.zip',
            saveAs: true
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(downloadId);
          });
        });

      } catch (error) {
        console.error("Error scanning and capturing:", error);
      }
    })();
    return true;
  }
});

async function captureAndStitch(tabId, url, title) {
  console.log('captureAndStitch start', tabId, url);
  const [prepareResult] = await chrome.scripting.executeScript({
    target: { tabId },
    func: contentScript,
    args: [url, title]
  });

  console.log('contentScript prepareResult', prepareResult);
  if (!prepareResult || !prepareResult.result) {
    throw new Error('Failed to prepare full-page screenshot capture');
  }

  const { pageHeight, viewportHeight } = prepareResult.result;
  console.log('pageHeight', pageHeight, 'viewportHeight', viewportHeight);
  const tab = await chrome.tabs.get(tabId);
  const screenshots = [];
  const numScrolls = Math.ceil(pageHeight / viewportHeight);

  try {
    for (let i = 0; i < numScrolls; i++) {
      let scrollY = i * viewportHeight;

      if (scrollY + viewportHeight > pageHeight) {
        scrollY = pageHeight - viewportHeight;
        if (scrollY < 0) scrollY = 0;
      }

      console.log('scrolling to', scrollY, 'step', i + 1, 'of', numScrolls);
      if (i > 0) {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const state = window.__hiHatDebug__;
            if (!state) {
              return false;
            }
            state.fixedElements.forEach(item => {
              item.element.style.setProperty('display', 'none', 'important');
            });
            return true;
          }
        });
      }

      await chrome.scripting.executeScript({
        target: { tabId },
        func: (y) => {
          window.scrollTo(0, y);
          return window.scrollY;
        },
        args: [scrollY]
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      console.log('captured viewport', i, 'dataUrl length', dataUrl?.length || 0);
      screenshots.push({ dataUrl, scrollY });
    }
  } finally {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const state = window.__hiHatDebug__;
        if (!state) {
          return false;
        }

        state.fixedElements.forEach(item => {
          if (item.originalDisplay) {
            item.element.style.setProperty('display', item.originalDisplay, 'important');
          } else {
            item.element.style.removeProperty('display');
          }

          if (item.originalVisibility) {
            item.element.style.setProperty('visibility', item.originalVisibility, 'important');
          } else {
            item.element.style.removeProperty('visibility');
          }

          if (item.originalPosition) {
            item.element.style.setProperty('position', item.originalPosition, 'important');
          } else {
            item.element.style.removeProperty('position');
          }
        });

        window.scrollTo(state.originalScrollX, state.originalScrollY);
        delete window.__hiHatDebug__;
        return true;
      }
    });
  }

  const imageBitmaps = await Promise.all(
    screenshots.map(async ({ dataUrl }) => {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return await createImageBitmap(blob);
    })
  );

  const { width } = imageBitmaps[0];
  const dpiScale = imageBitmaps[0].height / viewportHeight;
  const scaledPageHeight = Math.round(pageHeight * dpiScale);
  const canvas = new OffscreenCanvas(width, scaledPageHeight);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < imageBitmaps.length; i++) {
    const { scrollY } = screenshots[i];
    const drawY = Math.round(scrollY * dpiScale);
    ctx.drawImage(imageBitmaps[i], 0, drawY);
  }

  const blob = await canvas.convertToBlob();
  const tabURL = new URL(url);
  let domain = tabURL.hostname;
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
  const filename = `${domain}-${sanitizedTitle}.png`;

  return { filename, blob };
}


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