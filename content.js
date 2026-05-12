/**
 * Hi-hat Debug Tool - Content Script
 * Injected into all web pages to provide debugging functionality
 * Handles WordPress detection, form clearing, measurements, vulnerability scanning, etc.
 */

// Debug parameter normalization
function normalizeDebugParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const debugValue = urlParams.get('debug');
  
  // Convert debug=1 to debug=true for sites that expect string values
  if (debugValue === '1') {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('debug', 'true');
    
    // Update the URL without reloading
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', newUrl.toString());
    }
  }
}

// Run debug normalization on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', normalizeDebugParameter);
} else {
  normalizeDebugParameter();
}

// WordPress detection
let isWordPressSite = false;
let wpDebugInfo = {
  hasAdminBar: false,
  hasWPAPI: false,
  hasWPFooter: false,
  hasUserSwitching: false,
  version: null,
  theme: null
};

// Enhanced WordPress scan data
let wpScanData = {
  version: null,
  theme: {
    name: null,
    version: null,
    path: null,
    stylesheet: null
  },
  plugins: [],
  adminUrl: null,
  restApi: null,
  loginUrl: null,
  xmlrpc: null,
  generator: null,
  feeds: [],
  security: {
    directoryListing: false,
    wpConfigVisible: false,
    versionInGenerator: false,
    usesHttps: false
  }
};

function detectWordPress() {
  // Check for various WordPress indicators
  const indicators = [
    // Common WordPress patterns
    document.querySelector('link[href*="wp-content"]'),
    document.querySelector('script[src*="wp-content"]'),
    document.querySelector('link[href*="wp-includes"]'),
    document.querySelector('script[src*="wp-includes"]'),
    
    // WordPress generator meta tag
    document.querySelector('meta[name="generator"][content*="WordPress"]'),
    
    // WordPress admin bar
    document.querySelector('#wpadminbar'),
    document.querySelector('.wp-toolbar'),
    
    // REST API link
    document.querySelector('link[rel="https://api.w.org/"]'),
    
    // WordPress body classes
    document.body && document.body.classList.contains('wordpress'),
    document.body && document.body.className.includes('wp-'),
    
    // WordPress specific elements
    document.querySelector('.wp-content'),
    document.querySelector('.wp-footer'),
    document.querySelector('#wp-footer'),
    
    // WordPress login/admin patterns
    document.querySelector('link[href*="wp-login.php"]'),
    document.querySelector('link[href*="wp-admin"]')
  ];
  
  isWordPressSite = indicators.some(indicator => indicator !== null && indicator !== false);
  
  if (isWordPressSite) {
    // Get more specific WordPress info
    const generator = document.querySelector('meta[name="generator"][content*="WordPress"]');
    if (generator) {
      const versionMatch = generator.content.match(/WordPress ([0-9.]+)/);
      wpDebugInfo.version = versionMatch ? versionMatch[1] : null;
    }
    
    wpDebugInfo.hasAdminBar = !!document.querySelector('#wpadminbar');
    wpDebugInfo.hasWPAPI = !!document.querySelector('link[rel="https://api.w.org/"]');
    wpDebugInfo.hasWPFooter = !!document.querySelector('.wp-footer, #wp-footer');
    
    // Check for User Switching plugin
    wpDebugInfo.hasUserSwitching = !!(
      document.querySelector('#wpadminbar .user-switching') ||
      document.querySelector('a[href*="user_switching"]') ||
      document.querySelector('.user-switching-switch') ||
      document.body.innerHTML.includes('user_switching_nonce')
    );
    
    // Try to detect theme from body classes
    if (document.body) {
      const bodyClasses = document.body.className;
      const themeMatch = bodyClasses.match(/theme-([\w-]+)/);
      wpDebugInfo.theme = themeMatch ? themeMatch[1] : null;
    }
    
  }
  
  return isWordPressSite;
}

// Run detection when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectWordPress);
} else {
  detectWordPress();
}

// Also check again after a short delay in case content loads dynamically
setTimeout(detectWordPress, 1000);

// Comprehensive WordPress scanning function
function performComprehensiveWPScan() {
  // Reset scan data
  wpScanData = {
    version: null,
    theme: {
      name: null,
      version: null,
      path: null,
      stylesheet: null
    },
    plugins: [],
    adminUrl: null,
    restApi: null,
    loginUrl: null,
    xmlrpc: null,
    generator: null,
    feeds: [],
    security: {
      directoryListing: false,
      wpConfigVisible: false,
      versionInGenerator: false,
      usesHttps: window.location.protocol === 'https:'
    }
  };

  // 1. Extract WordPress version
  const generator = document.querySelector('meta[name="generator"][content*="WordPress"]');
  if (generator) {
    wpScanData.generator = generator.content;
    const versionMatch = generator.content.match(/WordPress ([0-9.]+)/);
    if (versionMatch) {
      wpScanData.version = versionMatch[1];
      wpScanData.security.versionInGenerator = true;
    }
  }

  // 2. Extract theme information
  // Look for theme in stylesheets
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  stylesheets.forEach(link => {
    const href = link.href;
    if (href.includes('/wp-content/themes/')) {
      const themeMatch = href.match(/\/wp-content\/themes\/([^\/]+)/);
      if (themeMatch && !wpScanData.theme.name) {
        wpScanData.theme.name = themeMatch[1];
        wpScanData.theme.path = themeMatch[0];
        
        // Try to extract version from CSS file URL
        const versionMatch = href.match(/[?&]ver=([^&]+)/);
        if (versionMatch) {
          wpScanData.theme.version = versionMatch[1];
        }
      }
    }
  });

  // Look for theme in body class
  if (document.body && !wpScanData.theme.name) {
    const bodyClasses = document.body.className;
    const themeMatch = bodyClasses.match(/theme-([\w-]+)/);
    if (themeMatch) {
      wpScanData.theme.name = themeMatch[1];
    }
  }

  // 3. Extract plugin information
  const allLinks = document.querySelectorAll('link, script');
  const pluginSet = new Set();
  
  allLinks.forEach(element => {
    const src = element.src || element.href;
    if (src && src.includes('/wp-content/plugins/')) {
      const pluginMatch = src.match(/\/wp-content\/plugins\/([^\/]+)/);
      if (pluginMatch) {
        const pluginName = pluginMatch[1];
        if (!pluginSet.has(pluginName)) {
          pluginSet.add(pluginName);
          
          // Try to extract version
          const versionMatch = src.match(/[?&]ver=([^&]+)/);
          wpScanData.plugins.push({
            name: pluginName,
            version: versionMatch ? versionMatch[1] : null,
            type: element.tagName === 'SCRIPT' ? 'JavaScript' : 'CSS'
          });
        }
      }
    }
  });

  // Check for specific plugins in HTML content
  const htmlContent = document.documentElement.outerHTML;
  const commonPlugins = [
    { name: 'yoast', pattern: /yoast|wpseo/i, displayName: 'Yoast SEO' },
    { name: 'elementor', pattern: /elementor/i, displayName: 'Elementor' },
    { name: 'woocommerce', pattern: /woocommerce|wc-/i, displayName: 'WooCommerce' },
    { name: 'contact-form-7', pattern: /contact-form-7|wpcf7/i, displayName: 'Contact Form 7' },
    { name: 'jetpack', pattern: /jetpack/i, displayName: 'Jetpack' },
    { name: 'wordfence', pattern: /wordfence/i, displayName: 'Wordfence Security' },
    { name: 'akismet', pattern: /akismet/i, displayName: 'Akismet' },
    { name: 'rankmath', pattern: /rank-math/i, displayName: 'Rank Math' },
    { name: 'wpml', pattern: /wpml/i, displayName: 'WPML' },
    { name: 'gravity-forms', pattern: /gravity.*forms?|gform/i, displayName: 'Gravity Forms' }
  ];

  commonPlugins.forEach(plugin => {
    if (plugin.pattern.test(htmlContent)) {
      if (!wpScanData.plugins.some(p => p.name.includes(plugin.name))) {
        wpScanData.plugins.push({
          name: plugin.displayName,
          version: null,
          type: 'Detected',
          detected: true
        });
      }
    }
  });

  // 4. Find WordPress URLs
  const baseUrl = window.location.origin;
  wpScanData.adminUrl = baseUrl + '/wp-admin/';
  wpScanData.loginUrl = baseUrl + '/wp-login.php';
  wpScanData.xmlrpc = baseUrl + '/xmlrpc.php';

  // Look for REST API
  const restApiLink = document.querySelector('link[rel="https://api.w.org/"]');
  if (restApiLink) {
    wpScanData.restApi = restApiLink.href;
  } else {
    wpScanData.restApi = baseUrl + '/wp-json/wp/v2/';
  }

  // 5. Find RSS/Atom feeds
  const feeds = document.querySelectorAll('link[type*="rss"], link[type*="atom"]');
  feeds.forEach(feed => {
    wpScanData.feeds.push({
      type: feed.type,
      title: feed.title || 'Feed',
      url: feed.href
    });
  });

  return wpScanData;
}

// Form clearing functionality
function clearAllForms() {
  let clearedCount = 0;
  
  // Find all form elements
  const inputs = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="reset"])');
  const textareas = document.querySelectorAll('textarea');
  const selects = document.querySelectorAll('select');
  
  // Clear input fields
  inputs.forEach(input => {
    const hadValue = input.value !== '' || input.checked;
    
    if (input.type === 'checkbox' || input.type === 'radio') {
      if (input.checked) {
        input.checked = false;
        input.removeAttribute('checked');
        clearedCount++;
      }
    } else {
      // Clear the value in multiple ways to ensure compatibility
      input.value = '';
      input.removeAttribute('value');
      input.defaultValue = '';
      
      // For React/Vue and other frameworks, try to clear internal state
      if (input._valueTracker) {
        input._valueTracker.setValue('');
      }
      
      if (hadValue) {
        clearedCount++;
      }
    }
    
    // Trigger multiple events to ensure frameworks detect the change
    if (hadValue) {
      const events = ['input', 'change', 'keyup', 'blur'];
      events.forEach(eventType => {
        input.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // Trigger React-style events
      const reactEvent = new Event('input', { bubbles: true });
      reactEvent.simulated = true;
      input.dispatchEvent(reactEvent);
    }
  });
  
  // Clear textareas
  textareas.forEach(textarea => {
    const hadValue = textarea.value !== '';
    
    if (hadValue) {
      // Clear the value in multiple ways
      textarea.value = '';
      textarea.removeAttribute('value');
      textarea.defaultValue = '';
      textarea.textContent = '';
      textarea.innerHTML = '';
      
      // For React/Vue and other frameworks
      if (textarea._valueTracker) {
        textarea._valueTracker.setValue('');
      }
      
      clearedCount++;
      
      // Trigger multiple events
      const events = ['input', 'change', 'keyup', 'blur'];
      events.forEach(eventType => {
        textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // Trigger React-style events
      const reactEvent = new Event('input', { bubbles: true });
      reactEvent.simulated = true;
      textarea.dispatchEvent(reactEvent);
    }
  });
  
  // Clear select elements (reset to first option)
  selects.forEach(select => {
    const hadSelection = select.selectedIndex !== 0;
    
    if (hadSelection) {
      select.selectedIndex = 0;
      select.value = select.options[0] ? select.options[0].value : '';
      
      // Remove selected attribute from all options
      Array.from(select.options).forEach((option, index) => {
        if (index === 0) {
          option.selected = true;
        } else {
          option.selected = false;
          option.removeAttribute('selected');
        }
      });
      
      clearedCount++;
      
      // Trigger change event
      select.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Trigger React-style events
      const reactEvent = new Event('change', { bubbles: true });
      reactEvent.simulated = true;
      select.dispatchEvent(reactEvent);
    }
  });
  
  // Additional cleanup: Try to clear any contentEditable elements that might be used as form inputs
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(element => {
    if (element.textContent.trim() !== '') {
      element.textContent = '';
      element.innerHTML = '';
      clearedCount++;
      
      // Trigger events for contentEditable
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
  
  return clearedCount;
}

// Measurement functionality
let measurementActive = false;
let isDrawing = false;
let isDragging = false;
let startPoint = null;
let dragOffset = null;
let drawnRectangle = null; // Stores the single drawn rectangle
let overlay = null;
let canvas = null;
let ctx = null;

function createMeasurementOverlay() {
  
  // Remove existing overlay if any
  if (overlay) {
    overlay.remove();
  }
  
  // Create overlay container
  overlay = document.createElement('div');
  overlay.id = 'hihat-measurement-overlay';
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    pointer-events: none !important;
    z-index: 2147483647 !important;
    display: none !important;
    background: rgba(0, 255, 0, 0.02) !important;
  `;
  
  // Create canvas
  canvas = document.createElement('canvas');
  canvas.style.cssText = `
    width: 100% !important;
    height: 100% !important;
    cursor: crosshair !important;
    display: block !important;
  `;
  
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  
  // Get context
  ctx = canvas.getContext('2d');
  
  // Add event listeners
  canvas.addEventListener('mousedown', startMeasurement);
  canvas.addEventListener('mousemove', updateMeasurement);
  canvas.addEventListener('mouseup', endMeasurement);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
}

function setupCanvas() {
  if (!canvas || !ctx) {
    return;
  }
  
  // Force a small delay to ensure overlay is rendered
  setTimeout(() => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Use window dimensions as fallback
    const width = rect.width > 0 ? rect.width : window.innerWidth;
    const height = rect.height > 0 ? rect.height : window.innerHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }, 10);
}

function activateMeasurement() {
  measurementActive = true;
  
  if (!overlay) {
    createMeasurementOverlay();
  }
  
  overlay.style.display = 'block';
  overlay.style.pointerEvents = 'all';
  document.body.style.cursor = 'crosshair';
  
  // Setup canvas after overlay is visible
  setupCanvas();
  
  // Show instructions
  showInstructions();
}

function deactivateMeasurement() {
  measurementActive = false;
  isDrawing = false;
  
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
  }
  
  document.body.style.cursor = '';
  measurements = [];
  hideInstructions();
}

function showInstructions() {
  const existing = document.getElementById('hihat-instructions');
  if (existing) existing.remove();
  
  const instructions = document.createElement('div');
  instructions.id = 'hihat-instructions';
  instructions.innerHTML = 'Click and drag to measure • Press ESC to clear • Click measure button to exit';
  instructions.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: rgba(0, 0, 0, 0.85) !important;
    color: white !important;
    padding: 12px 20px !important;
    border-radius: 6px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important;
    z-index: 2147483648 !important;
    pointer-events: none !important;
  `;
  
  document.body.appendChild(instructions);
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    if (instructions.parentNode) {
      instructions.style.transition = 'opacity 0.5s';
      instructions.style.opacity = '0';
      setTimeout(() => instructions.remove(), 500);
    }
  }, 4000);
}

function hideInstructions() {
  const instructions = document.getElementById('hihat-instructions');
  if (instructions) instructions.remove();
}

function isPointInRectangle(point, rect) {
  const left = Math.min(rect.start.x, rect.end.x);
  const top = Math.min(rect.start.y, rect.end.y);
  const right = Math.max(rect.start.x, rect.end.x);
  const bottom = Math.max(rect.start.y, rect.end.y);
  
  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
}

function startMeasurement(e) {
  if (!measurementActive) return;
  
  // Check if clicking on existing rectangle to drag it
  if (drawnRectangle && isPointInRectangle({ x: e.clientX, y: e.clientY }, drawnRectangle)) {
    isDragging = true;
    const rectLeft = Math.min(drawnRectangle.start.x, drawnRectangle.end.x);
    const rectTop = Math.min(drawnRectangle.start.y, drawnRectangle.end.y);
    dragOffset = {
      x: e.clientX - rectLeft,
      y: e.clientY - rectTop
    };
    // Update cursor to indicate dragging
    canvas.style.cursor = 'grab';
    return;
  }
  
  // Start drawing new rectangle (clears previous)
  isDrawing = true;
  startPoint = { x: e.clientX, y: e.clientY };
  drawnRectangle = null;
}

function updateMeasurement(e) {
  if (!measurementActive) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Handle dragging
  if (isDragging && drawnRectangle && dragOffset) {
    const rectWidth = Math.abs(drawnRectangle.end.x - drawnRectangle.start.x);
    const rectHeight = Math.abs(drawnRectangle.end.y - drawnRectangle.start.y);
    
    const newLeft = e.clientX - dragOffset.x;
    const newTop = e.clientY - dragOffset.y;
    
    drawnRectangle.start = { x: newLeft, y: newTop };
    drawnRectangle.end = { x: newLeft + rectWidth, y: newTop + rectHeight };
    drawnRectangle.width = rectWidth;
    drawnRectangle.height = rectHeight;
    
    canvas.style.cursor = 'grabbing';
  }
  // Handle drawing
  else if (isDrawing && startPoint) {
    const currentPoint = { x: e.clientX, y: e.clientY };
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);
    
    // Draw current (preview) measurement
    drawMeasurementBox(startPoint, currentPoint, width, height, true);
  }
  
  // Always redraw saved rectangle
  if (drawnRectangle) {
    drawMeasurementBox(
      drawnRectangle.start,
      drawnRectangle.end,
      drawnRectangle.width,
      drawnRectangle.height,
      false
    );
  }
}

function endMeasurement(e) {
  if (!measurementActive) return;
  
  if (isDragging) {
    isDragging = false;
    dragOffset = null;
    canvas.style.cursor = 'crosshair';
    return;
  }
  
  if (!isDrawing || !startPoint) return;
  
  const endPoint = { x: e.clientX, y: e.clientY };
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  
  // Save single rectangle if it's big enough
  if (width > 5 || height > 5) {
    drawnRectangle = {
      start: startPoint,
      end: endPoint,
      width: width,
      height: height
    };
    
    // Copy dimensions to clipboard
    const dimensionText = `${Math.round(width)}×${Math.round(height)}`;
    copyToClipboard(dimensionText);
    showClipboardNotification(dimensionText);
  }
  
  isDrawing = false;
  startPoint = null;
  
  // Redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (drawnRectangle) {
    drawMeasurementBox(
      drawnRectangle.start,
      drawnRectangle.end,
      drawnRectangle.width,
      drawnRectangle.height,
      false
    );
  }
}

function drawMeasurementBox(start, end, width, height, isActive) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const right = Math.max(start.x, end.x);
  const bottom = Math.max(start.y, end.y);
  
  // Set styles
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.8;
  
  // Draw background fill
  ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  ctx.fillRect(left, top, width, height);
  
  // Draw border
  ctx.strokeStyle = isActive ? '#3b82f6' : '#ef4444';
  ctx.strokeRect(left, top, width, height);
  
  // Draw measurements
  ctx.fillStyle = isActive ? '#3b82f6' : '#ef4444';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Simple label for all measurements
  const labelX = right + 10;
  const labelY = top + 15;
  const text = `${Math.round(width)}×${Math.round(height)}px`;
  
  ctx.textAlign = 'left';
  
  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const metrics = ctx.measureText(text);
  ctx.fillRect(labelX - 4, labelY - 10, metrics.width + 8, 20);
  
  // Text
  ctx.fillStyle = isActive ? '#3b82f6' : '#ef4444';
  ctx.fillText(text, labelX, labelY);
  
  // Reset styles
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// Handle escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && measurementActive) {
    measurements = [];
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  if (measurementActive && canvas) {
    setupCanvas();
  }
});


// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'clearForms') {
    try {
      const clearedCount = clearAllForms();
      sendResponse({ 
        success: true, 
        message: `Cleared ${clearedCount} form field${clearedCount !== 1 ? 's' : ''}` 
      });
    } catch (error) {
      sendResponse({ 
        success: false, 
        message: 'Error clearing forms: ' + error.message 
      });
    }
    return true;
  }
  
  if (request.action === 'toggleMeasurement') {
    try {
      if (measurementActive) {
        deactivateMeasurement();
        sendResponse({ success: true, message: 'Measurement mode disabled', active: false });
      } else {
        activateMeasurement();
        sendResponse({ success: true, message: 'Measurement mode enabled', active: true });
      }
    } catch (error) {
      console.error('Measurement error:', error);
      sendResponse({ success: false, message: 'Measurement error: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'checkWordPress') {
    try {
      // Re-run detection to make sure we have the latest info
      detectWordPress();
      sendResponse({ 
        success: true, 
        isWordPress: isWordPressSite,
        debugInfo: wpDebugInfo
      });
    } catch (error) {
      sendResponse({
        success: false, 
        message: 'WordPress detection error: ' + error.message,
        isWordPress: false
      });
    }
    return true;
  }
  
  if (request.action === 'scanWordPress') {
    try {
      // First check if it's a WordPress site
      detectWordPress();
      
      if (!isWordPressSite) {
        sendResponse({
          success: false,
          message: 'This does not appear to be a WordPress site'
        });
        return true;
      }
      
      // Perform comprehensive scan
      const scanResults = performComprehensiveWPScan();
      
      sendResponse({
        success: true,
        scanData: scanResults,
        summary: {
          version: scanResults.version,
          theme: scanResults.theme.name,
          pluginsCount: scanResults.plugins.length,
          hasRestApi: !!scanResults.restApi,
          isSecure: scanResults.security.usesHttps
        }
      });
    } catch (error) {
      sendResponse({
        success: false,
        message: 'WordPress scan error: ' + error.message
      });
    }
    return true;
  }
  
  // Handle clipboard operations from keyboard shortcuts
  if (request.action === 'copyToClipboard') {
    try {
      copyToClipboard(request.text);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, message: 'Error copying to clipboard: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'readFromClipboard') {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          sendResponse({ success: true, text: text });
        }).catch(error => {
          sendResponse({ success: false, message: 'Error reading clipboard: ' + error.message });
        });
        return true; // Keep the message channel open for async response
      } else {
        sendResponse({ success: false, message: 'Clipboard API not available' });
      }
    } catch (error) {
      sendResponse({ success: false, message: 'Error reading clipboard: ' + error.message });
    }
    return true;
  }

  if (request.action === 'createBreakpointBox') {
    createBreakpointBox();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'removeBreakpointBox') {
    removeBreakpointBox();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'removeUrlParameters') {
    try {
      const currentUrl = new URL(window.location.href);
      
      // If there are no params, just return
      if (currentUrl.search === '') {
        sendResponse({ success: true, message: 'No parameters to remove' });
        return true;
      }
      
      // Remove all query parameters
      currentUrl.search = '';
      
      // Update the URL without reloading
      window.history.replaceState({}, '', currentUrl.toString());
      
      sendResponse({ success: true, message: 'All URL parameters removed' });
    } catch (error) {
      sendResponse({ success: false, message: 'Error removing parameters: ' + error.message });
    }
    return true;
  }
});

function createBreakpointBox() {
  const existingBox = document.getElementById('hihat-breakpoint-box');
  if (existingBox) {
    return;
  }

  const box = document.createElement('div');
  box.id = 'hihat-breakpoint-box';
  box.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 5px;
    padding: 8px 12px;
    z-index: 99999;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    text-align: right;
    pointer-events: none;
  `;
  document.body.appendChild(box);

  function updateBreakpointBox() {
    const width = window.innerWidth;
    let breakpoint = '';

    if (width >= 1400) {
      breakpoint = 'XXL';
    } else if (width >= 1200) {
      breakpoint = 'XL';
    } else if (width >= 992) {
      breakpoint = 'LG';
    } else if (width >= 768) {
      breakpoint = 'MD';
    } else if (width >= 576) {
      breakpoint = 'SM';
    } else {
      breakpoint = 'XS'; // Assuming anything below SM is XS
    }

    box.innerHTML = `
      Breakpoint: <span style="font-weight: bold;">${breakpoint}</span><br>
      Screen Width: <span style="font-weight: bold;">${width} PX</span>
    `;
  }

  window.addEventListener('resize', updateBreakpointBox);
  updateBreakpointBox();
}

function removeBreakpointBox() {
  const box = document.getElementById('hihat-breakpoint-box');
  if (box) {
    box.remove();
  }
}

// Add debug parameter to links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) {
    return;
  }

  try {
    if (!chrome.runtime) {
      return;
    }
    chrome.runtime.sendMessage({ action: 'getStorage', key: 'isDebugModeEnabled' }, ({ value }) => {
      if (value) {
        try {
          const url = new URL(link.href);
          if (url.hostname === window.location.hostname) {
            url.searchParams.set('debug', 'true');
            link.href = url.href;
          }
        } catch (error) {
          // Ignore URL parsing errors
        }
      }
    });
  } catch (error) {
    // Ignore extension context errors
  }
}, true);


// Clipboard functionality
function copyToClipboard(text) {
  try {
    // Try the modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        // Success
      }).catch(err => {
        copyToClipboardFallback(text);
      });
    } else {
      copyToClipboardFallback(text);
    }
  } catch (error) {
    copyToClipboardFallback(text);
  }
}

function copyToClipboardFallback(text) {
  try {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
  } catch (error) {
    // Fallback copy failed
  }
}

function showClipboardNotification(text) {
  // Remove any existing notification
  const existing = document.getElementById('hihat-clipboard-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'hihat-clipboard-notification';
  notification.innerHTML = `📋 Copied: ${text}`;
  notification.style.cssText = `
    position: fixed !important;
    top: 60px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: rgba(34, 197, 94, 0.95) !important;
    color: white !important;
    padding: 8px 16px !important;
    border-radius: 6px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    z-index: 2147483649 !important;
    pointer-events: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 2 seconds with fade out
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transition = 'opacity 0.3s ease-out';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 2000);
}