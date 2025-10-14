// Measurement tool functionality
class MeasurementTool {
  constructor() {
    this.isActive = false;
    this.isDrawing = false;
    this.measurements = [];
    this.currentMeasurement = null;
    this.startPoint = null;
    this.overlay = null;
    this.canvas = null;
    this.ctx = null;
    
    this.init();
  }
  
  init() {
    this.createOverlay();
    this.bindEvents();
  }
  
  createOverlay() {
    console.log('Creating measurement overlay');
    
    // Create main overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'hihat-measurement-overlay';
    this.overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      display: none !important;
      background: rgba(255, 0, 0, 0.05) !important;
    `;
    
    // Create canvas for drawing measurements
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      cursor: crosshair !important;
      display: block !important;
    `;
    
    this.overlay.appendChild(this.canvas);
    document.body.appendChild(this.overlay);
    
    console.log('Overlay created and added to body:', !!this.overlay.parentNode);
    console.log('Canvas created:', !!this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    console.log('Resizing canvas - rect:', rect, 'dpr:', dpr);
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    console.log('Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
    
    this.redrawMeasurements();
  }
  
  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.startMeasurement(e));
    this.canvas.addEventListener('mousemove', (e) => this.updateMeasurement(e));
    this.canvas.addEventListener('mouseup', (e) => this.endMeasurement(e));
    
    // Handle escape key to clear measurements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.clearMeasurements();
      }
    });
    
    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  activate() {
    console.log('Activating measurement tool');
    this.isActive = true;
    this.overlay.style.display = 'block';
    this.overlay.style.pointerEvents = 'all';
    document.body.style.cursor = 'crosshair';
    
    console.log('Overlay display:', this.overlay.style.display);
    console.log('Overlay dimensions:', this.overlay.offsetWidth, 'x', this.overlay.offsetHeight);
    console.log('Canvas dimensions:', this.canvas.offsetWidth, 'x', this.canvas.offsetHeight);
    
    // Add visual indicator
    this.showInstructions();
  }
  
  deactivate() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    this.overlay.style.pointerEvents = 'none';
    document.body.style.cursor = '';
    this.clearMeasurements();
    this.hideInstructions();
  }
  
  showInstructions() {
    if (document.getElementById('hihat-instructions')) return;
    
    const instructions = document.createElement('div');
    instructions.id = 'hihat-instructions';
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 1000000;
      pointer-events: none;
    `;
    instructions.textContent = 'Click and drag to measure • Press ESC to clear • Click extension icon to exit';
    
    document.body.appendChild(instructions);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (instructions.parentNode) {
        instructions.style.opacity = '0';
        instructions.style.transition = 'opacity 0.5s';
        setTimeout(() => instructions.remove(), 500);
      }
    }, 5000);
  }
  
  hideInstructions() {
    const instructions = document.getElementById('hihat-instructions');
    if (instructions) {
      instructions.remove();
    }
  }
  
  startMeasurement(e) {
    if (!this.isActive) return;
    
    console.log('Starting measurement at:', e.clientX, e.clientY);
    
    this.isDrawing = true;
    this.startPoint = {
      x: e.clientX,
      y: e.clientY
    };
    
    this.currentMeasurement = {
      start: { ...this.startPoint },
      end: { ...this.startPoint },
      width: 0,
      height: 0
    };
  }
  
  updateMeasurement(e) {
    if (!this.isActive || !this.isDrawing) return;
    
    const currentPoint = {
      x: e.clientX,
      y: e.clientY
    };
    
    this.currentMeasurement.end = currentPoint;
    this.currentMeasurement.width = Math.abs(currentPoint.x - this.startPoint.x);
    this.currentMeasurement.height = Math.abs(currentPoint.y - this.startPoint.y);
    
    console.log('Updating measurement:', this.currentMeasurement.width, 'x', this.currentMeasurement.height);
    
    this.redrawMeasurements();
  }
  
  endMeasurement(e) {
    if (!this.isActive || !this.isDrawing) return;
    
    this.isDrawing = false;
    
    if (this.currentMeasurement.width > 5 || this.currentMeasurement.height > 5) {
      this.measurements.push({ ...this.currentMeasurement });
    }
    
    this.currentMeasurement = null;
    this.redrawMeasurements();
  }
  
  clearMeasurements() {
    this.measurements = [];
    this.currentMeasurement = null;
    this.isDrawing = false;
    this.redrawMeasurements();
  }
  
  redrawMeasurements() {
    if (!this.ctx) {
      console.log('No context available for drawing');
      return;
    }
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    console.log('Redrawing measurements - saved:', this.measurements.length, 'current:', !!this.currentMeasurement);
    
    // Draw all saved measurements
    this.measurements.forEach(measurement => {
      this.drawMeasurement(measurement);
    });
    
    // Draw current measurement being drawn
    if (this.currentMeasurement && this.isDrawing) {
      console.log('Drawing current measurement');
      this.drawMeasurement(this.currentMeasurement, true);
    }
  }
  
  drawMeasurement(measurement, isActive = false) {
    const { start, end, width, height } = measurement;
    
    // Calculate rectangle bounds
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const right = Math.max(start.x, end.x);
    const bottom = Math.max(start.y, end.y);
    
    // Set styles
    this.ctx.strokeStyle = isActive ? '#3b82f6' : '#ef4444';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.globalAlpha = 0.8;
    
    // Draw rectangle
    this.ctx.strokeRect(left, top, width, height);
    
    // Draw rulers and measurements
    this.drawRulers(left, top, right, bottom, width, height, isActive);
    
    // Reset styles
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;
  }
  
  drawRulers(left, top, right, bottom, width, height, isActive = false) {
    const color = isActive ? '#3b82f6' : '#ef4444';
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw width measurement (top)
    if (width > 50) {
      const midX = left + width / 2;
      const labelY = top - 15;
      
      // Ruler line
      this.ctx.setLineDash([]);
      this.ctx.beginPath();
      this.ctx.moveTo(left, top - 8);
      this.ctx.lineTo(left, top - 12);
      this.ctx.moveTo(right, top - 8);
      this.ctx.lineTo(right, top - 12);
      this.ctx.moveTo(left, top - 10);
      this.ctx.lineTo(right, top - 10);
      this.ctx.stroke();
      
      // Label background
      const labelText = `${Math.round(width)}px`;
      const metrics = this.ctx.measureText(labelText);
      const labelWidth = metrics.width + 8;
      const labelHeight = 16;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fillRect(midX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight);
      
      // Label text
      this.ctx.fillStyle = color;
      this.ctx.fillText(labelText, midX, labelY);
    }
    
    // Draw height measurement (left)
    if (height > 50) {
      const midY = top + height / 2;
      const labelX = left - 25;
      
      // Ruler line
      this.ctx.beginPath();
      this.ctx.moveTo(left - 8, top);
      this.ctx.lineTo(left - 12, top);
      this.ctx.moveTo(left - 8, bottom);
      this.ctx.lineTo(left - 12, bottom);
      this.ctx.moveTo(left - 10, top);
      this.ctx.lineTo(left - 10, bottom);
      this.ctx.stroke();
      
      // Rotated label for height
      this.ctx.save();
      this.ctx.translate(labelX, midY);
      this.ctx.rotate(-Math.PI / 2);
      
      const labelText = `${Math.round(height)}px`;
      const metrics = this.ctx.measureText(labelText);
      const labelWidth = metrics.width + 8;
      const labelHeight = 16;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fillRect(-labelWidth/2, -labelHeight/2, labelWidth, labelHeight);
      
      this.ctx.fillStyle = color;
      this.ctx.fillText(labelText, 0, 0);
      this.ctx.restore();
    }
    
    // Draw dimensions in corner for small measurements
    if (width <= 50 || height <= 50) {
      const labelX = right + 10;
      const labelY = top + 15;
      const labelText = `${Math.round(width)}×${Math.round(height)}px`;
      
      const metrics = this.ctx.measureText(labelText);
      const labelWidth = metrics.width + 8;
      const labelHeight = 16;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fillRect(labelX - 4, labelY - labelHeight/2, labelWidth, labelHeight);
      
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = color;
      this.ctx.fillText(labelText, labelX, labelY);
    }
  }
}

// Create global measurement tool instance
let measurementTool = null;

console.log('Measurement.js loaded, document ready state:', document.readyState);

// Initialize measurement tool when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing measurement tool');
    measurementTool = new MeasurementTool();
    console.log('Measurement tool initialized:', !!measurementTool);
  });
} else {
  console.log('DOM already loaded, initializing measurement tool immediately');
  measurementTool = new MeasurementTool();
  console.log('Measurement tool initialized:', !!measurementTool);
}

// Simple test function to create a visible overlay
function createTestOverlay() {
  console.log('Creating test overlay');
  
  // Remove any existing test overlay
  const existing = document.getElementById('test-overlay');
  if (existing) existing.remove();
  
  const testOverlay = document.createElement('div');
  testOverlay.id = 'test-overlay';
  testOverlay.innerHTML = 'TEST OVERLAY - This should be visible';
  testOverlay.style.cssText = `
    position: fixed !important;
    top: 50px !important;
    left: 50px !important;
    width: 300px !important;
    height: 100px !important;
    background: red !important;
    color: white !important;
    z-index: 2147483647 !important;
    display: block !important;
    font-size: 16px !important;
    padding: 20px !important;
    border: 2px solid black !important;
  `;
  
  document.body.appendChild(testOverlay);
  console.log('Test overlay added to body:', !!testOverlay.parentNode);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (testOverlay.parentNode) {
      testOverlay.remove();
      console.log('Test overlay removed');
    }
  }, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in measurement.js:', request.action);
  
  if (request.action === 'toggleMeasurement') {
    console.log('Processing toggleMeasurement, tool available:', !!measurementTool);
    
    // First, test if we can create any overlay at all
    createTestOverlay();
    
    if (measurementTool) {
      if (measurementTool.isActive) {
        console.log('Deactivating measurement tool');
        measurementTool.deactivate();
        sendResponse({ success: true, message: 'Measurement mode disabled', active: false });
      } else {
        console.log('Activating measurement tool');
        measurementTool.activate();
        sendResponse({ success: true, message: 'Measurement mode enabled', active: true });
      }
    } else {
      console.log('Measurement tool not ready');
      sendResponse({ success: false, message: 'Measurement tool not ready' });
    }
  }
});
