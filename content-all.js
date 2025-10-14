console.log('Hi-hat Debug Tool - Content script loading...');

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
  console.log('Creating measurement overlay');
  
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
  
  console.log('Measurement overlay created');
}

function setupCanvas() {
  if (!canvas || !ctx) {
    console.error('Canvas or context not available');
    return;
  }
  
  // Force a small delay to ensure overlay is rendered
  setTimeout(() => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    console.log('Canvas rect:', rect);
    
    // Use window dimensions as fallback
    const width = rect.width > 0 ? rect.width : window.innerWidth;
    const height = rect.height > 0 ? rect.height : window.innerHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    console.log('Canvas setup complete:', width, 'x', height);
  }, 10);
}

function activateMeasurement() {
  console.log('Activating measurement');
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
  console.log('Deactivating measurement');
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
  
  console.log('Starting measurement at:', e.clientX, e.clientY);
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
  
  console.log('Ending measurement');
  
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
  ctx.strokeStyle = isActive ? '#3b82f6' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.8;
  
  // Draw rectangle
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
    console.log('Measurements cleared');
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
  console.log('Message received:', request.action);
  
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
});

console.log('Hi-hat Debug Tool - Content script loaded successfully');