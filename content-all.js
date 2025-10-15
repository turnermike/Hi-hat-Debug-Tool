
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
let startPoint = null;
let measurements = [];
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

function startMeasurement(e) {
  if (!measurementActive) return;
  
  isDrawing = true;
  startPoint = { x: e.clientX, y: e.clientY };
}

function updateMeasurement(e) {
  if (!measurementActive || !isDrawing || !startPoint) return;
  
  const currentPoint = { x: e.clientX, y: e.clientY };
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);
  
  // Clear and redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw current measurement
  drawMeasurementBox(startPoint, currentPoint, width, height, true);
  
  // Draw saved measurements
  measurements.forEach(measurement => {
    drawMeasurementBox(measurement.start, measurement.end, measurement.width, measurement.height, false);
  });
}

function endMeasurement(e) {
  if (!measurementActive || !isDrawing || !startPoint) return;
  
  const endPoint = { x: e.clientX, y: e.clientY };
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  
  // Save measurement if it's big enough
  if (width > 5 || height > 5) {
    measurements.push({
      start: startPoint,
      end: endPoint,
      width: width,
      height: height
    });
    
    // Copy dimensions to clipboard
    const dimensionText = `${Math.round(width)}×${Math.round(height)}`;
    copyToClipboard(dimensionText);
    showClipboardNotification(dimensionText);
  }
  
  isDrawing = false;
  startPoint = null;
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

// Vulnerability scanning functionality
function scanForVulnerabilities() {
  const vulnerabilities = [];
  
  // 1. Check for missing HTTPS
  if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    vulnerabilities.push({
      type: 'insecure-connection',
      severity: 'medium',
      title: 'Insecure Connection',
      description: 'Site is not using HTTPS encryption'
    });
  }
  
  // 2. Check for forms without CSRF protection
  const forms = document.querySelectorAll('form[method="post"], form:not([method])');
  forms.forEach((form, index) => {
    const hasCSRFToken = form.querySelector('input[name*="csrf"], input[name*="token"], input[name*="nonce"]');
    if (!hasCSRFToken) {
      vulnerabilities.push({
        type: 'csrf-missing',
        severity: 'high',
        title: 'Missing CSRF Protection',
        description: `Form ${index + 1} lacks CSRF token protection`
      });
    }
  });
  
  // 3. Check for password fields without autocomplete="off"
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach((field, index) => {
    if (field.autocomplete !== 'off' && field.autocomplete !== 'new-password' && field.autocomplete !== 'current-password') {
      vulnerabilities.push({
        type: 'password-autocomplete',
        severity: 'low',
        title: 'Password Autocomplete',
        description: `Password field ${index + 1} allows autocomplete`
      });
    }
  });
  
  // 4. Check for potential XSS in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const suspiciousParams = [];
  const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /<iframe/i, /<object/i];
  
  urlParams.forEach((value, key) => {
    xssPatterns.forEach(pattern => {
      if (pattern.test(value)) {
        suspiciousParams.push(key);
      }
    });
  });
  
  if (suspiciousParams.length > 0) {
    vulnerabilities.push({
      type: 'xss-url-params',
      severity: 'critical',
      title: 'Potential XSS in URL',
      description: `Suspicious content in URL parameters: ${suspiciousParams.join(', ')}`
    });
  }
  
  // 5. Check for inline JavaScript
  const inlineScripts = document.querySelectorAll('script:not([src])');
  if (inlineScripts.length > 3) {
    vulnerabilities.push({
      type: 'inline-scripts',
      severity: 'medium',
      title: 'Multiple Inline Scripts',
      description: `Found ${inlineScripts.length} inline script tags (CSP risk)`
    });
  }
  
  // 6. Check for missing security headers (based on response analysis)
  const metaTags = document.querySelectorAll('meta[http-equiv]');
  const securityHeaders = {
    csp: false,
    xframe: false,
    xss: false
  };
  
  metaTags.forEach(meta => {
    const equiv = meta.getAttribute('http-equiv').toLowerCase();
    if (equiv === 'content-security-policy') securityHeaders.csp = true;
    if (equiv === 'x-frame-options') securityHeaders.xframe = true;
    if (equiv === 'x-xss-protection') securityHeaders.xss = true;
  });
  
  if (!securityHeaders.csp) {
    vulnerabilities.push({
      type: 'missing-csp',
      severity: 'medium',
      title: 'Missing CSP Header',
      description: 'Content Security Policy not detected'
    });
  }
  
  // 7. Check for exposed sensitive information
  const bodyText = document.body.textContent.toLowerCase();
  const sensitivePatterns = [
    { pattern: /api[_-]?key/i, name: 'API Keys' },
    { pattern: /password\s*[:=]\s*["'][^"']{6,}/i, name: 'Exposed Passwords' },
    { pattern: /secret[_-]?key/i, name: 'Secret Keys' },
    { pattern: /token\s*[:=]\s*["'][^"']{10,}/i, name: 'Access Tokens' }
  ];
  
  sensitivePatterns.forEach(({ pattern, name }) => {
    if (pattern.test(bodyText)) {
      vulnerabilities.push({
        type: 'exposed-sensitive',
        severity: 'critical',
        title: 'Exposed Sensitive Data',
        description: `Potential ${name} found in page content`
      });
    }
  });
  
  // 8. Check for clickjacking protection
  const frameOptions = document.querySelector('meta[http-equiv="x-frame-options"]');
  if (!frameOptions && window.parent === window) {
    vulnerabilities.push({
      type: 'clickjacking',
      severity: 'medium',
      title: 'Clickjacking Risk',
      description: 'Page lacks X-Frame-Options protection'
    });
  }
  
  // 9. Check for mixed content (HTTP resources on HTTPS page)
  if (window.location.protocol === 'https:') {
    const httpResources = [];
    const images = document.querySelectorAll('img[src^="http:"]');
    const scripts = document.querySelectorAll('script[src^="http:"]');
    const links = document.querySelectorAll('link[href^="http:"]');
    
    if (images.length > 0) httpResources.push(`${images.length} images`);
    if (scripts.length > 0) httpResources.push(`${scripts.length} scripts`);
    if (links.length > 0) httpResources.push(`${links.length} stylesheets`);
    
    if (httpResources.length > 0) {
      vulnerabilities.push({
        type: 'mixed-content',
        severity: 'high',
        title: 'Mixed Content',
        description: `HTTP resources on HTTPS page: ${httpResources.join(', ')}`
      });
    }
  }
  
  // 10. Check for outdated libraries (basic check)
  const scripts = document.querySelectorAll('script[src]');
  const outdatedLibraries = [];
  
  scripts.forEach(script => {
    const src = script.src;
    // Check for common outdated library patterns
    if (src.includes('jquery') && (src.includes('1.') || src.includes('2.'))) {
      outdatedLibraries.push('jQuery (potentially outdated)');
    }
    if (src.includes('angular') && src.includes('1.')) {
      outdatedLibraries.push('AngularJS 1.x (deprecated)');
    }
  });
  
  if (outdatedLibraries.length > 0) {
    vulnerabilities.push({
      type: 'outdated-libraries',
      severity: 'medium',
      title: 'Outdated Libraries',
      description: `Potentially outdated: ${outdatedLibraries.join(', ')}`
    });
  }
  
  return vulnerabilities;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'scanVulnerabilities') {
    try {
      const vulnerabilities = scanForVulnerabilities();
      sendResponse({ 
        success: true,
        vulnerabilities: vulnerabilities,
        summary: {
          total: vulnerabilities.length,
          critical: vulnerabilities.filter(v => v.severity === 'critical').length,
          high: vulnerabilities.filter(v => v.severity === 'high').length,
          medium: vulnerabilities.filter(v => v.severity === 'medium').length,
          low: vulnerabilities.filter(v => v.severity === 'low').length
        }
      });
    } catch (error) {
      sendResponse({ 
        success: false, 
        message: 'Error scanning for vulnerabilities: ' + error.message 
      });
    }
    return true;
  }
  
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
});

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

