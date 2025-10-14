// Simple measurement test script
console.log('Measurement test script loaded successfully');

// Simple message listener for testing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in measurement-test.js:', request.action);
  
  if (request.action === 'toggleMeasurement') {
    console.log('Creating simple test overlay...');
    
    // Remove any existing test overlay
    const existing = document.getElementById('simple-test-overlay');
    if (existing) existing.remove();
    
    // Create a simple visible div
    const testDiv = document.createElement('div');
    testDiv.id = 'simple-test-overlay';
    testDiv.innerHTML = 'MEASUREMENT TEST - Click me to remove';
    testDiv.style.cssText = `
      position: fixed !important;
      top: 100px !important;
      left: 100px !important;
      width: 300px !important;
      height: 100px !important;
      background: blue !important;
      color: white !important;
      z-index: 999999 !important;
      display: block !important;
      font-size: 16px !important;
      padding: 20px !important;
      border: 3px solid yellow !important;
      cursor: pointer !important;
    `;
    
    // Add click handler to remove
    testDiv.addEventListener('click', () => {
      testDiv.remove();
      console.log('Test overlay removed by click');
    });
    
    document.body.appendChild(testDiv);
    
    console.log('Test overlay created and added to body');
    
    sendResponse({ 
      success: true, 
      message: 'Test overlay created successfully', 
      active: true 
    });
    
    return true; // Keep message channel open
  }
});

console.log('Measurement test script initialization complete');