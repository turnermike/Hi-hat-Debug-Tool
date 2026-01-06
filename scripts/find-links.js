/**
 * Content script for finding all navigation links on a page.
 */
(function() {
  const findNavLinks = () => {
    const navSelectors = [
      'nav',
      '[role="navigation"]',
      '.nav',
      '.menu',
      '#nav',
      '#menu',
      '.navigation',
      '#navigation',
      '[class*="nav-"]',
      '[class*="-nav"]',
      '[class*="menu-"]',
      '[class*="-menu"]'
    ];
    let navLinks = [];
    const pageUrl = new URL(window.location.href);

    const navElements = document.querySelectorAll(navSelectors.join(','));

    navElements.forEach(navElement => {
      const links = navElement.getElementsByTagName('a');
      for (let link of links) {
        if (link.href) {
          try {
            const linkUrl = new URL(link.href, pageUrl.origin);
            // Only include links that are on the same domain
            if (linkUrl.hostname === pageUrl.hostname) {
              navLinks.push(linkUrl.href);
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      }
    });

    // Remove duplicates
    const uniqueLinks = [...new Set(navLinks)];

    return uniqueLinks;
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'findNavLinks') {
      const links = findNavLinks();
      sendResponse({ links });
    }
  });

  // Signal to the background script that the content script is ready
  chrome.runtime.sendMessage({ action: 'findLinksScriptReady' });
})();
