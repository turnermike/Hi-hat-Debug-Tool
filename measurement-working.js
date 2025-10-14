// Working measurement tool
console.log('Measurement tool loading...');

// Test if we can run in this context
try {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    throw new Error('Chrome runtime not available');
  }
  console.log('Chrome runtime available:', !!chrome.runtime);
} catch (e) {
  console.error('Failed to access Chrome runtime:', e);
}

// Global measurement state
let measurementActive = false;
let isDrawing = false;
let startPoint = null;
let measurements = [];
let overlay = null;
let canvas = null;
let ctx = null;

// Create measurement overlay
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
  
  // Get context - don't setup canvas yet since overlay is hidden
  ctx = canvas.getContext('2d');
  
  // Add event listeners
  canvas.addEventListener('mousedown', startMeasurement);
  canvas.addEventListener('mousemove', updateMeasurement);
  canvas.addEventListener('mouseup', endMeasurement);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  console.log('Measurement overlay created successfully');
}

// Setup canvas dimensions
function setupCanvas() {
  if (!canvas || !ctx) {
    console.error('Canvas or context not available for setup');
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  console.log('Setting up canvas - getBoundingClientRect:', rect);
  console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight);
  
  // Use window dimensions as fallback if rect is empty
  const width = rect.width > 0 ? rect.width : window.innerWidth;
  const height = rect.height > 0 ? rect.height : window.innerHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  
  console.log('Canvas setup complete:', width, 'x', height, 'DPR:', dpr);
  console.log('Canvas actual size:', canvas.width, 'x', canvas.height);
}

// Activate measurement mode
function activateMeasurement() {
  console.log('Activating measurement mode');
  measurementActive = true;
  
  if (!overlay) {
    createMeasurementOverlay();
  }
  
  overlay.style.display = 'block';
  overlay.style.pointerEvents = 'all';
  document.body.style.cursor = 'crosshair';
  
  // Now setup canvas since overlay is visible
  setupCanvas();
  
  // Show instructions
  showInstructions();
  
  console.log('Measurement mode activated');
}

// Deactivate measurement mode
function deactivateMeasurement() {
  console.log('Deactivating measurement mode');
  measurementActive = false;
  isDrawing = false;
  
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
  }
  
  document.body.style.cursor = '';
  measurements = [];
  hideInstructions();
  
  console.log('Measurement mode deactivated');
}

// Show instructions
function showInstructions() {
  // Remove existing instructions
  const existing = document.getElementById('hihat-instructions');
  if (existing) existing.remove();
  
  const instructions = document.createElement('div');
  instructions.id = 'hihat-instructions';
  instructions.innerHTML = 'Click and drag to measure • Press ESC to clear • Click extension to exit';
  instructions.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    padding: 12px 24px !important;
    border-radius: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    z-index: 2147483648 !important;
    pointer-events: none !important;
  `;
  
  document.body.appendChild(instructions);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (instructions.parentNode) {
      instructions.style.transition = 'opacity 0.5s';
      instructions.style.opacity = '0';
      setTimeout(() => instructions.remove(), 500);
    }
  }, 5000);
}

// Hide instructions
function hideInstructions() {
  const instructions = document.getElementById('hihat-instructions');
  if (instructions) {
    instructions.remove();
  }
}

// Start measurement
function startMeasurement(e) {
  if (!measurementActive) return;
  
  console.log('Starting measurement at:', e.clientX, e.clientY);
  
  isDrawing = true;
  startPoint = {
    x: e.clientX,
    y: e.clientY
  };
}

// Update measurement
function updateMeasurement(e) {
  if (!measurementActive || !isDrawing || !startPoint) return;
  
  const currentPoint = {
    x: e.clientX,
    y: e.clientY
  };
  
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

// End measurement
function endMeasurement(e) {
  if (!measurementActive || !isDrawing || !startPoint) return;
  
  console.log('Ending measurement');
  
  const endPoint = {
    x: e.clientX,
    y: e.clientY
  };
  
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  
  // Save measurement if it's big enough
  if (width > 10 || height > 10) {
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

// Draw measurement box
function drawMeasurementBox(start, end, width, height, isActive) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const right = Math.max(start.x, end.x);
  const bottom = Math.max(start.y, end.y);
  
  // Set styles
  ctx.strokeStyle = isActive ? '#3b82f6' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.globalAlpha = 0.8;
  
  // Draw rectangle
  ctx.strokeRect(left, top, width, height);
  
  // Draw measurements
  ctx.fillStyle = isActive ? '#3b82f6' : '#ef4444';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Width label (top)
  if (width > 60) {
    const midX = left + width / 2;
    const labelY = top - 20;
    const text = `${Math.round(width)}px`;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const metrics = ctx.measureText(text);
    ctx.fillRect(midX - metrics.width/2 - 4, labelY - 8, metrics.width + 8, 16);
    
    // Text
    ctx.fillStyle = isActive ? '#3b82f6' : '#ef4444';
    ctx.fillText(text, midX, labelY);
  }
  
  // Height label (left)
  if (height > 60) {
    ctx.save();
    const midY = top + height / 2;
    const labelX = left - 30;
    const text = `${Math.round(height)}px`;
    
    ctx.translate(labelX, midY);
    ctx.rotate(-Math.PI / 2);
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const metrics = ctx.measureText(text);
    ctx.fillRect(-metrics.width/2 - 4, -8, metrics.width + 8, 16);
    
    // Text
    ctx.fillStyle = isActive ? '#3b82f6' : '#ef4444';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  
  // Combined label for small measurements
  if (width <= 60 || height <= 60) {
    const labelX = right + 10;
    const labelY = top + 20;
    const text = `${Math.round(width)}×${Math.round(height)}px`;
    
    ctx.textAlign = 'left';
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const metrics = ctx.measureText(text);
    ctx.fillRect(labelX - 4, labelY - 8, metrics.width + 8, 16);
    
    // Text
    ctx.fillStyle = isActive ? '#3b82f6' : '#ef4444';
    ctx.fillText(text, labelX, labelY);
  }
  
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

// Message listener with error handling
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request.action);
    
    if (request.action === 'toggleMeasurement') {
      try {
        if (measurementActive) {
          deactivateMeasurement();
          sendResponse({ success: true, message: 'Measurement mode disabled', active: false });
        } else {
          activateMeasurement();
          sendResponse({ success: true, message: 'Measurement mode enabled', active: true });
        }
        return true;
      } catch (error) {
        console.error('Error in toggleMeasurement:', error);
        sendResponse({ success: false, message: 'Error: ' + error.message });
        return true;
      }
    }
  });
  console.log('Message listener registered successfully');
} catch (error) {
  console.error('Failed to register message listener:', error);
}

console.log('Measurement tool loaded successfully');