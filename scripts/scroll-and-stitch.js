/**
 * Content script for taking full-page screenshots by scrolling and stitching.
 */
(function() {
  // This script is injected programmatically, so it needs to be self-contained.

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startFullPageScreenshot') {
      startScreenshotProcess(request.tabUrl, request.tabTitle).then(sendResponse);
      return true; // Indicates that the response is sent asynchronously
    }
  });

  async function startScreenshotProcess(tabUrl, tabTitle) {
    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;

    try {
      const screenshots = [];
      const pageHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      let scrollY = 0;

      while (scrollY < pageHeight) {
        window.scrollTo(0, scrollY);
        
        // Wait for the scroll to take effect and for the page to render
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const dataUrl = await chrome.runtime.sendMessage({ action: 'captureVisibleTab' });
        screenshots.push(dataUrl);

        scrollY += viewportHeight;
      }

      // Restore original scroll position
      window.scrollTo(originalScrollX, originalScrollY);

      // Send the collected screenshots to the background for stitching
      chrome.runtime.sendMessage({ 
        action: 'stitchScreenshots', 
        screenshots, 
        pageHeight, 
        viewportHeight,
        tabUrl,
        tabTitle
      });

      return { success: true };
    } catch (error) {
      // Restore scroll position on error
      window.scrollTo(originalScrollX, originalScrollY);
      return { success: false, error: error.message };
    }
  }
})();
