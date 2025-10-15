/**
 * Shared utility functions for Hi-hat Debug Tool Chrome Extension
 */

// URL manipulation utilities
export const UrlUtils = {
  /**
   * Safely create a URL object from a string
   */
  createUrl(urlString) {
    try {
      return new URL(urlString);
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if URL is a restricted page that can't be modified
   */
  isRestrictedUrl(url) {
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'moz-extension://',
      'webkit://'
    ];
    return restrictedPrefixes.some(prefix => url.startsWith(prefix));
  },

  /**
   * Toggle a URL parameter on/off
   */
  toggleUrlParameter(url, paramName, paramValue = '1') {
    const urlObj = this.createUrl(url);
    if (!urlObj) return null;

    const hasParam = urlObj.searchParams.has(paramName);
    
    if (hasParam) {
      urlObj.searchParams.delete(paramName);
    } else {
      urlObj.searchParams.set(paramName, paramValue);
    }
    
    return urlObj.toString();
  },

  /**
   * Remove multiple URL parameters
   */
  removeUrlParameters(url, paramNames) {
    const urlObj = this.createUrl(url);
    if (!urlObj) return null;

    paramNames.forEach(paramName => {
      urlObj.searchParams.delete(paramName);
    });

    return urlObj.toString();
  }
};

// Chrome extension utilities
export const ChromeUtils = {
  /**
   * Get the current active tab
   */
  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  },

  /**
   * Send message to content script with error handling
   */
  async sendMessageToTab(tabId, message) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update tab URL safely
   */
  async updateTabUrl(tabId, newUrl) {
    try {
      await chrome.tabs.update(tabId, { url: newUrl });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// File name sanitization utilities
export const FileUtils = {
  /**
   * Sanitize filename for downloads
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '_')
      .trim();
  },

  /**
   * Generate timestamp-based filename
   */
  generateTimestampFilename(prefix = '', extension = '') {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    return `${prefix}${timestamp}${extension}`;
  }
};

// WordPress detection patterns
export const WordPressPatterns = {
  // Common WordPress plugins with their detection patterns
  commonPlugins: [
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
  ],

  // WordPress detection indicators
  indicators: [
    'link[href*="wp-content"]',
    'script[src*="wp-content"]',
    'link[href*="wp-includes"]',
    'script[src*="wp-includes"]',
    'meta[name="generator"][content*="WordPress"]',
    '#wpadminbar',
    '.wp-toolbar',
    'link[rel="https://api.w.org/"]',
    '.wp-content',
    '.wp-footer',
    '#wp-footer',
    'link[href*="wp-login.php"]',
    'link[href*="wp-admin"]'
  ],

  // WordPress parameter lists for cleanup
  extensionParameters: [
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
  ]
};

// Status message utilities
export const StatusUtils = {
  /**
   * Show status message with auto-hide
   */
  showStatus(element, message, isError = false, duration = 2000) {
    if (!element) return;
    
    element.textContent = message;
    element.className = `status-message ${isError ? 'status-error' : 'status-success'}`;
    
    setTimeout(() => {
      element.className = 'status-message status-hidden';
    }, duration);
  }
};

// Security scanning patterns
export const SecurityPatterns = {
  xssPatterns: [/<script/i, /javascript:/i, /on\w+=/i, /<iframe/i, /<object/i],
  
  sensitiveDataPatterns: [
    { pattern: /api[_-]?key/i, name: 'API Keys' },
    { pattern: /password\s*[:=]\s*["'][^"']{6,}/i, name: 'Exposed Passwords' },
    { pattern: /secret[_-]?key/i, name: 'Secret Keys' },
    { pattern: /token\s*[:=]\s*["'][^"']{10,}/i, name: 'Access Tokens' }
  ]
};