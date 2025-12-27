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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Scroll to a large number to find the maximum scroll position
    window.scrollTo(0, 100000);
    await new Promise(resolve => setTimeout(resolve, 500));
    const pageHeight = window.scrollY + window.innerHeight + 300;
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const screenshots = [];
      const viewportHeight = window.innerHeight;
      let scrollY = 0;

      while (scrollY < pageHeight) {
        window.scrollTo(0, scrollY);
        
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const dataUrl = await chrome.runtime.sendMessage({ action: 'captureVisibleTab' });
        screenshots.push(dataUrl);

        scrollY += viewportHeight;
      }

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
      return { success: false, error: error.message };
    } finally {
      // Restore original state
      document.body.style.overflow = originalOverflow;
      window.scrollTo(originalScrollX, originalScrollY);
    }
  }
})();
