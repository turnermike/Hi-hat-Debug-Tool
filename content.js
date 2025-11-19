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
  const results = [];
  
  // 1. Check for HTTPS
  if (window.location.protocol === 'https:') {
    results.push({
      type: 'https-check',
      severity: 'pass',
      title: '✓ HTTPS Enabled',
      description: 'Site is using secure HTTPS encryption'
    });
  } else if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
    results.push({
      type: 'https-check',
      severity: 'info',
      title: 'ℹ Local Development',
      description: 'HTTPS not required for local development'
    });
  } else {
    results.push({
      type: 'insecure-connection',
      severity: 'medium',
      title: '⚠ Insecure Connection',
      description: 'Site is not using HTTPS encryption'
    });
  }
  
  
  // 2. Check for CSRF protection on forms
  const forms = document.querySelectorAll('form[method="post"], form:not([method])');
  let formsWithoutCSRF = 0;
  let totalForms = forms.length;
  
  forms.forEach((form, index) => {
    const hasCSRFToken = form.querySelector('input[name*="csrf"], input[name*="token"], input[name*="nonce"]');
    if (!hasCSRFToken) {
      formsWithoutCSRF++;
    }
  });
  
  if (totalForms === 0) {
    results.push({
      type: 'csrf-check',
      severity: 'info',
      title: 'ℹ No Forms Found',
      description: 'No POST forms detected on this page'
    });
  } else if (formsWithoutCSRF === 0) {
    results.push({
      type: 'csrf-check',
      severity: 'pass',
      title: `✓ CSRF Protection (${totalForms} forms)`,
      description: 'All forms have CSRF token protection'
    });
  } else {
    results.push({
      type: 'csrf-missing',
      severity: 'high',
      title: `⚠ Missing CSRF Protection`,
      description: `${formsWithoutCSRF} of ${totalForms} forms lack CSRF tokens`
    });
  }
  
  // 3. Check for password field autocomplete settings
  const passwordFields = document.querySelectorAll('input[type="password"]');
  let unsafePasswordFields = 0;
  const totalPasswordFields = passwordFields.length;
  
  passwordFields.forEach((field, index) => {
    if (field.autocomplete !== 'off' && field.autocomplete !== 'new-password' && field.autocomplete !== 'current-password') {
      unsafePasswordFields++;
    }
  });
  
  if (totalPasswordFields === 0) {
    results.push({
      type: 'password-check',
      severity: 'info',
      title: 'ℹ No Password Fields',
      description: 'No password fields detected on this page'
    });
  } else if (unsafePasswordFields === 0) {
    results.push({
      type: 'password-check',
      severity: 'pass',
      title: `✓ Password Security (${totalPasswordFields} fields)`,
      description: 'All password fields have appropriate autocomplete settings'
    });
  } else {
    results.push({
      type: 'password-autocomplete',
      severity: 'low',
      title: `⚠ Password Autocomplete Risk`,
      description: `${unsafePasswordFields} of ${totalPasswordFields} password fields allow autocomplete`
    });
  }
  
  // 4. Check for XSS patterns in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const suspiciousParams = [];
  const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /<iframe/i, /<object/i];
  const totalParams = Array.from(urlParams.keys()).length;
  
  urlParams.forEach((value, key) => {
    xssPatterns.forEach(pattern => {
      if (pattern.test(value)) {
        suspiciousParams.push(key);
      }
    });
  });
  
  if (totalParams === 0) {
    results.push({
      type: 'xss-check',
      severity: 'info',
      title: 'ℹ No URL Parameters',
      description: 'No URL parameters to check for XSS patterns'
    });
  } else if (suspiciousParams.length === 0) {
    results.push({
      type: 'xss-check',
      severity: 'pass',
      title: `✓ URL Parameter Safety (${totalParams} params)`,
      description: 'No suspicious XSS patterns found in URL parameters'
    });
  } else {
    results.push({
      type: 'xss-url-params',
      severity: 'critical',
      title: '⚠ Potential XSS in URL',
      description: `Suspicious content in URL parameters: ${suspiciousParams.join(', ')}`
    });
  }
  
  
  // 5. Check for inline JavaScript (CSP risk)
  const inlineScripts = document.querySelectorAll('script:not([src])');
  if (inlineScripts.length === 0) {
    results.push({
      type: 'inline-scripts-check',
      severity: 'pass',
      title: '✓ No Inline Scripts',
      description: 'No inline JavaScript detected (CSP friendly)'
    });
  } else if (inlineScripts.length <= 3) {
    results.push({
      type: 'inline-scripts-check',
      severity: 'info',
      title: `ℹ Minimal Inline Scripts (${inlineScripts.length})`,
      description: 'Small number of inline scripts detected'
    });
  } else {
    results.push({
      type: 'inline-scripts',
      severity: 'medium',
      title: `⚠ Multiple Inline Scripts (${inlineScripts.length})`,
      description: 'High number of inline script tags poses CSP risk'
    });
  }
  
  // 6. Check for security headers (meta tag detection)
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
  
  if (securityHeaders.csp) {
    results.push({
      type: 'csp-check',
      severity: 'pass',
      title: '✓ CSP Header Present',
      description: 'Content Security Policy detected via meta tag'
    });
  } else {
    results.push({
      type: 'missing-csp',
      severity: 'medium',
      title: '⚠ Missing CSP Header',
      description: 'Content Security Policy not detected (may be set via HTTP headers)'
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
  
  const exposedData = [];
  sensitivePatterns.forEach(({ pattern, name }) => {
    if (pattern.test(bodyText)) {
      exposedData.push(name);
    }
  });
  
  if (exposedData.length === 0) {
    results.push({
      type: 'sensitive-data-check',
      severity: 'pass',
      title: '✓ No Exposed Sensitive Data',
      description: 'No obvious sensitive information found in page content'
    });
  } else {
    results.push({
      type: 'exposed-sensitive',
      severity: 'critical',
      title: `⚠ Exposed Sensitive Data`,
      description: `Potential sensitive data found: ${exposedData.join(', ')}`
    });
  }
  
  // 8. Check for clickjacking protection
  const frameOptions = document.querySelector('meta[http-equiv="x-frame-options"]');
  if (frameOptions || window.parent !== window) {
    results.push({
      type: 'clickjacking-check',
      severity: 'pass',
      title: '✓ Clickjacking Protection',
      description: 'X-Frame-Options detected or page is in frame'
    });
  } else {
    results.push({
      type: 'clickjacking',
      severity: 'medium',
      title: '⚠ Clickjacking Risk',
      description: 'Page lacks X-Frame-Options protection'
    });
  }
  
  // 9. Check for mixed content (only relevant for HTTPS pages)
  if (window.location.protocol === 'https:') {
    const httpResources = [];
    const images = document.querySelectorAll('img[src^="http:"]');
    const scripts = document.querySelectorAll('script[src^="http:"]');
    const links = document.querySelectorAll('link[href^="http:"]');
    
    if (images.length > 0) httpResources.push(`${images.length} images`);
    if (scripts.length > 0) httpResources.push(`${scripts.length} scripts`);
    if (links.length > 0) httpResources.push(`${links.length} stylesheets`);
    
    if (httpResources.length === 0) {
      results.push({
        type: 'mixed-content-check',
        severity: 'pass',
        title: '✓ No Mixed Content',
        description: 'All resources loaded over HTTPS'
      });
    } else {
      results.push({
        type: 'mixed-content',
        severity: 'high',
        title: '⚠ Mixed Content Detected',
        description: `HTTP resources on HTTPS page: ${httpResources.join(', ')}`
      });
    }
  }
  
  // 10. Check for potentially outdated libraries
  const scripts = document.querySelectorAll('script[src]');
  const outdatedLibraries = [];
  
  scripts.forEach(script => {
    const src = script.src;
    if (src.includes('jquery') && (src.includes('1.') || src.includes('2.'))) {
      outdatedLibraries.push('jQuery (potentially outdated)');
    }
    if (src.includes('angular') && src.includes('1.')) {
      outdatedLibraries.push('AngularJS 1.x (deprecated)');
    }
  });
  
  if (outdatedLibraries.length === 0) {
    results.push({
      type: 'library-check',
      severity: 'pass',
      title: '✓ No Obviously Outdated Libraries',
      description: 'No clearly outdated JavaScript libraries detected'
    });
  } else {
    results.push({
      type: 'outdated-libraries',
      severity: 'medium',
      title: '⚠ Potentially Outdated Libraries',
      description: `Found: ${outdatedLibraries.join(', ')}`
    });
  }
  
  return results;
}

// Full page screenshot functionality
let originalScrollPosition = 0;

function prepareFullPageScreenshot() {
  // Store original scroll position
  originalScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  // Get page dimensions
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
  
  const viewportHeight = window.innerHeight;
  const scrollSteps = [];
  
  // Calculate scroll positions needed to capture the entire page
  for (let y = 0; y < totalHeight; y += viewportHeight) {
    scrollSteps.push(y);
  }
  
  // Ensure we don't have unnecessary final step if the last step covers the remaining height
  const lastStep = scrollSteps[scrollSteps.length - 1];
  if (lastStep + viewportHeight >= totalHeight && scrollSteps.length > 1) {
    scrollSteps[scrollSteps.length - 1] = Math.max(0, totalHeight - viewportHeight);
  }
  
  return {
    success: true,
    totalHeight,
    viewportHeight,
    scrollSteps
  };
}

function scrollToPosition(scrollY) {
  window.scrollTo({
    top: scrollY,
    left: 0,
    behavior: 'auto' // Use auto for immediate scroll without animation
  });
  
  return { success: true };
}

function restoreScrollPosition() {
  window.scrollTo({
    top: originalScrollPosition,
    left: 0,
    behavior: 'smooth'
  });
  
  return { success: true };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'scanVulnerabilities') {
    try {
      const results = scanForVulnerabilities();
      const vulnerabilities = results.filter(r => ['critical', 'high', 'medium', 'low'].includes(r.severity));
      sendResponse({ 
        success: true,
        vulnerabilities: results, // Send all results including passes
        summary: {
          total: results.length,
          issues: vulnerabilities.length,
          passed: results.filter(r => r.severity === 'pass').length,
          critical: results.filter(r => r.severity === 'critical').length,
          high: results.filter(r => r.severity === 'high').length,
          medium: results.filter(r => r.severity === 'medium').length,
          low: results.filter(r => r.severity === 'low').length,
          info: results.filter(r => r.severity === 'info').length
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
  
  if (request.action === 'prepareFullPageScreenshot') {
    try {
      const result = prepareFullPageScreenshot();
      sendResponse(result);
    } catch (error) {
      sendResponse({ success: false, message: 'Error preparing screenshot: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'scrollToPosition') {
    try {
      const result = scrollToPosition(request.scrollY);
      sendResponse(result);
    } catch (error) {
      sendResponse({ success: false, message: 'Error scrolling: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'restoreScrollPosition') {
    try {
      const result = restoreScrollPosition();
      sendResponse(result);
    } catch (error) {
      sendResponse({ success: false, message: 'Error restoring scroll: ' + error.message });
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
  
  // Handle notifications from background script
  if (request.action === 'showNotification') {
    try {
      if (request.message.includes('recording stopped') || request.message.includes('time limit reached')) {
        showRecordingNotification(request.message, 'warning');
      } else {
        showClipboardNotification(request.message);
      }
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, message: 'Error showing notification: ' + error.message });
    }
    return true;
  }
  
  // Handle recording toolbar commands
  if (request.action === 'showRecordingToolbar') {
    try {
      showRecordingToolbar();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, message: 'Error showing toolbar: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'updateRecordingTime') {
    try {
      updateRecordingToolbarTime(request.time, {
        remaining: request.remaining,
        warningLevel: request.warningLevel
      });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, message: 'Error updating time: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'hideRecordingToolbar') {
    try {
      hideRecordingToolbar();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, message: 'Error hiding toolbar: ' + error.message });
    }
    return true;
  }
  
  if (request.action === 'updateRecordingState') {
    try {
      updateRecordingToolbarState(request.state);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, message: 'Error updating state: ' + error.message });
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

function showRecordingNotification(text, level = 'info') {
  const existing = document.getElementById('hihat-recording-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'hihat-recording-notification';
  notification.textContent = text;
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: ${level === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(34, 197, 94, 0.95)'} !important;
    color: white !important;
    padding: 10px 16px !important;
    border-radius: 6px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    z-index: 2147483649 !important;
    pointer-events: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  `;
  
  document.body.appendChild(notification);
  
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
  }, 2500);
}

// Recording Toolbar Functions
function showRecordingToolbar(details = {}) {
  console.log('showRecordingToolbar function called');
  console.log('Document readyState:', document.readyState);
  console.log('Document body present:', !!document.body);
  console.log('Toolbar mode:', details.mode || 'recording');
  
  const isReadyMode = details.mode === 'ready';
  
  // Check if we're in an iframe (might be restricted)
  if (window.self !== window.top) {
    console.log('Extension running in an iframe, may have restrictions');
  }
  
  // Remove any existing toolbar
  const existing = document.getElementById('hihat-recording-toolbar');
  if (existing) {
    console.log('Removing existing toolbar');
    existing.remove();
  }
  
  const toolbar = document.createElement('div');
  toolbar.id = 'hihat-recording-toolbar';
  
  // Apply all styles with cssText (simpler and more reliable)
  toolbar.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: rgba(23, 23, 23, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    color: white !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important;
    z-index: 2147483647 !important;
    visibility: visible !important;
    opacity: 1 !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    min-width: 240px !important;
    border: 3px solid red !important;
  `;
  
  // Add animation keyframes directly to style tag
  const pulseKeyframes = `@keyframes hihat-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
  
  @keyframes hihat-record-pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }`;
  
  const style = document.createElement('style');
  style.textContent = pulseKeyframes;
  
  document.head.appendChild(style);
  document.body.appendChild(toolbar);
  
  // Create status section
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
  
  // Create dot
  const dot = document.createElement('span');
  dot.style.cssText = 'width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; animation: hihat-pulse 1.5s ease-in-out infinite';
  dot.className = 'hihat-rec-dot';
  
  // Create label
  const label = document.createElement('span');
  label.textContent = 'Recording';
  label.style.cssText = 'font-weight: 600; font-size: 13px;';
  label.className = 'hihat-rec-label';
  
  statusDiv.appendChild(dot);
  statusDiv.appendChild(label);
  
  // Create time display
  const timeDiv = document.createElement('div');
  timeDiv.textContent = '00:00';
  timeDiv.style.cssText = 'font-family: "SF Mono", Monaco, "Courier New", monospace; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; color: #fbbf24; margin-left: auto;';
  timeDiv.className = 'hihat-rec-time';
  
  // Create controls section
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = 'display: flex; gap: 6px; margin-left: 8px;';
  
  // Create play/pause button with FontAwesome icon
  const playPauseBtn = document.createElement('button');
  playPauseBtn.id = 'hihat-pause-btn'; // Keep ID for compatibility
  
  if (isReadyMode) {
    // Show record button in ready mode
    playPauseBtn.title = 'Start Recording';
    playPauseBtn.style.cssText = 'border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s ease; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.7); animation: hihat-record-pulse 1.5s ease-in-out infinite; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);';
    playPauseBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><circle cx="224" cy="256" r="224"/></svg>`;
    
    // In ready mode, clicking play starts the recording
    const readyClickHandler = () => {
      chrome.runtime.sendMessage({ action: 'startActualRecording' });
    };
    playPauseBtn.addEventListener('click', readyClickHandler);
    playPauseBtn._readyClickHandler = readyClickHandler;
  } else {
    // Show record button in recording mode
    playPauseBtn.title = 'Start Recording';
    playPauseBtn.style.cssText = 'border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3); background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);';
    playPauseBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><circle cx="224" cy="256" r="224"/></svg>`;
  }
  
  // Create stop button with FontAwesome icon
  const stopBtn = document.createElement('button');
  stopBtn.id = 'hihat-stop-btn';
  stopBtn.title = 'Stop';
  stopBtn.style.cssText = 'border: none; border-radius: 6px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);';
  stopBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 384 512" fill="currentColor"><path d="M352 80v352c0 26.5-21.5 48-48 48H80c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h224c26.5 0 48 21.5 48 48z"/></svg>`;
  
  controlsDiv.appendChild(playPauseBtn);
  controlsDiv.appendChild(stopBtn);
  
  // Assemble toolbar
  toolbar.appendChild(statusDiv);
  toolbar.appendChild(timeDiv);
  toolbar.appendChild(controlsDiv);
  
  // Update status text based on mode
  if (isReadyMode) {
    label.textContent = 'Ready to Record';
    dot.style.display = 'none'; // Hide the recording dot in ready mode
  }
  
  // Log that toolbar was added
  console.log('Recording toolbar added to DOM');
  console.log('Toolbar DOM element:', toolbar);
  console.log('Toolbar position:', getComputedStyle(toolbar).position);
  console.log('Toolbar z-index:', getComputedStyle(toolbar).zIndex);
  console.log('Toolbar visibility:', getComputedStyle(toolbar).visibility);
  
  // Add event listeners for buttons
  if (!isReadyMode) {
    // Only add pause toggle event if not in ready mode
    playPauseBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'togglePauseRecording' });
    });
  }
  
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopRecording' });
  });
  
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'togglePauseRecording' });
    });
  }
  
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stopRecording' });
    });
  }
  
  console.log('Event listeners added to buttons');
}

function updateRecordingToolbarTime(timeString, details) {
  const toolbar = document.getElementById('hihat-recording-toolbar');
  if (toolbar) {
    const timeElement = toolbar.querySelector('.hihat-rec-time');
    if (timeElement) {
      // Format as remaining time if provided
      if (details && details.remaining !== undefined) {
        const remainingTime = Math.max(0, Math.floor(details.remaining));
        const remainingMins = Math.floor(remainingTime / 60);
        const remainingSecs = remainingTime % 60;
        timeElement.textContent = `${String(remainingMins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
        
        // Apply warning styles based on warning level
        switch (details.warningLevel) {
          case 'critical':
            timeElement.style.color = '#ef4444';
            toolbar.style.border = '3px solid #ef4444';
            toolbar.style.animation = 'hihat-pulse 0.5s ease-in-out infinite';
            break;
          case 'warning':
            timeElement.style.color = '#f59e0b';
            toolbar.style.border = '3px solid #f59e0b';
            toolbar.style.animation = '';
            break;
          default:
            timeElement.style.color = '#fbbf24';
            toolbar.style.border = '3px solid red';
            toolbar.style.animation = '';
        }
      } else {
        timeElement.textContent = timeString;
        timeElement.style.color = '#fbbf24';
      }
    }
  }
}

function hideRecordingToolbar() {
  const toolbar = document.getElementById('hihat-recording-toolbar');
  if (toolbar) {
    toolbar.style.transition = 'opacity 0.3s ease-out';
    toolbar.style.opacity = '0';
    setTimeout(() => {
      if (toolbar.parentNode) {
        toolbar.remove();
      }
    }, 300);
  }
}

function updateRecordingToolbarState(state) {
  const toolbar = document.getElementById('hihat-recording-toolbar');
  if (!toolbar) return;
  
  const playPauseBtn = toolbar.querySelector('#hihat-pause-btn');
  const statusLabel = toolbar.querySelector('.hihat-rec-label');
  const dot = toolbar.querySelector('.hihat-rec-dot');
  
  // Handle transition from ready mode to recording mode
  if (state === 'recording' && statusLabel.textContent === 'Ready to Record') {
    // Switch to recording mode
    statusLabel.textContent = 'Recording';
    dot.style.display = 'block'; // Show the recording dot
    
    // Update button to record
    playPauseBtn.title = 'Start Recording';
    playPauseBtn.style.cssText = 'border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3); background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);';
    playPauseBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><circle cx="224" cy="256" r="224"/></svg>`;
    
    // Replace the click handler
    playPauseBtn.removeEventListener('click', playPauseBtn._readyClickHandler);
    playPauseBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'togglePauseRecording' });
    });
    
    return; // Don't continue to the regular state handling
  }
  
  if (state === 'paused') {
    playPauseBtn.classList.add('paused');
    playPauseBtn.title = 'Resume Recording';
    playPauseBtn.style.cssText = 'border: none; border-radius: 6px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(21, 128, 61, 0.3); background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);';
    playPauseBtn.innerHTML = `<svg width="12" height="14" viewBox="0 0 320 512" fill="currentColor"><path d="M368 80h-320c-17.67 0-32 14.33-32 32v256c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-256c0-17.67-14.33-32-32-32zm-352 80l144 72v-144l-144 72z"/></svg>`;
    statusLabel.textContent = 'Recording Paused';
    dot.style.animationPlayState = 'paused';
    dot.style.backgroundColor = '#fbbf24';
  } else if (state === 'recording') {
    playPauseBtn.classList.remove('paused');
    playPauseBtn.title = 'Start Recording';
    playPauseBtn.style.cssText = 'border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3); background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);';
    playPauseBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><circle cx="224" cy="256" r="224"/></svg>`;
    statusLabel.textContent = 'Recording';
    dot.style.animationPlayState = 'running';
    dot.style.backgroundColor = '#ef4444';
  }
}

