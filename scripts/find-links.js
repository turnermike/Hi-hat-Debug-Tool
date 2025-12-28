/**
 * Content script for finding all navigation links on a page.
 */
(function() {
  const findNavLinks = () => {
    const selectors = ['nav', '[role="navigation"]', '.nav', '.menu', '#nav', '#menu'];
    let navLinks = [];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const links = element.getElementsByTagName('a');
        for (let link of links) {
          if (link.href) {
            navLinks.push(link.href);
          }
        }
      });
    });

    // Filter duplicates and non-http links
    const uniqueLinks = [...new Set(navLinks)];
    const absoluteLinks = uniqueLinks.filter(link => link.startsWith('http'));

    return absoluteLinks;
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
