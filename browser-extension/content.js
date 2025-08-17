// Content Script for Metallic Challan Print Extension
// Injects into the web page to intercept print requests and show printer selection

class MetallicPrintExtension {
  constructor() {
    this.extensionId = 'metallic-print-extension';
    this.isInitialized = false;
    this.printerUI = null;
    this.notificationContainer = null;
    this.init();
  }

  init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupExtension());
    } else {
      this.setupExtension();
    }
  }

  setupExtension() {
    if (this.isInitialized) return;
    
    try {
      // Create printer selection UI
      this.createPrinterUI();
      
      // Create notification container
      this.createNotificationContainer();
      
      // Intercept print requests
      this.interceptPrintRequests();
      
      // Listen for messages from background script
      this.setupMessageListener();
      
      // Check if we're on the right page
      this.checkPageCompatibility();
      
      this.isInitialized = true;
      console.log('Metallic Print Extension initialized');
    } catch (error) {
      console.error('Failed to initialize extension:', error);
    }
  }

  createPrinterUI() {
    // Create printer selection container
    this.printerUI = document.createElement('div');
    this.printerUI.id = 'metallic-print-extension-ui';
    this.printerUI.innerHTML = `
      <div class="mpe-container">
        <div class="mpe-header">
          <span class="mpe-title">🖨️ Print Service</span>
          <button class="mpe-close" title="Hide">×</button>
        </div>
        <div class="mpe-content">
          <div class="mpe-section">
            <label>Label Printer:</label>
            <select id="mpe-label-printer" class="mpe-select">
              <option value="">Loading...</option>
            </select>
          </div>
          <div class="mpe-section">
            <label>Challan Printer:</label>
            <select id="mpe-challan-printer" class="mpe-select">
              <option value="">Loading...</option>
            </select>
          </div>
          <div class="mpe-status">
            <span id="mpe-service-status" class="mpe-status-indicator">Checking...</span>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();
    
    // Add to page
    document.body.appendChild(this.printerUI);
    
    // Load printers
    this.loadPrinters();
    
    // Setup event listeners
    this.setupUIEventListeners();
    
    // Position the UI
    this.positionUI();
  }

  createNotificationContainer() {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'metallic-print-notifications';
    document.body.appendChild(this.notificationContainer);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #metallic-print-extension-ui {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .mpe-container {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 250px;
        max-width: 300px;
      }
      
      .mpe-header {
        background: #f8f9fa;
        padding: 8px 12px;
        border-bottom: 1px solid #ddd;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mpe-title {
        font-weight: 600;
        color: #333;
      }
      
      .mpe-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .mpe-close:hover {
        color: #333;
      }
      
      .mpe-content {
        padding: 12px;
      }
      
      .mpe-section {
        margin-bottom: 12px;
      }
      
      .mpe-section label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: #555;
      }
      
      .mpe-select {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        background: white;
      }
      
      .mpe-select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
      }
      
      .mpe-status {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #eee;
      }
      
      .mpe-status-indicator {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 12px;
        background: #f8f9fa;
        color: #666;
      }
      
      .mpe-status-indicator.connected {
        background: #d4edda;
        color: #155724;
      }
      
      .mpe-status-indicator.disconnected {
        background: #f8d7da;
        color: #721c24;
      }
      
      .mpe-status-indicator.checking {
        background: #fff3cd;
        color: #856404;
      }
      
      #metallic-print-notifications {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10001;
        max-width: 300px;
      }
      
      .mpe-notification {
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-size: 12px;
        animation: slideIn 0.3s ease-out;
      }
      
      .mpe-notification.success {
        border-color: #28a745;
        background: #d4edda;
        color: #155724;
      }
      
      .mpe-notification.error {
        border-color: #dc3545;
        background: #f8d7da;
        color: #721c24;
      }
      
      .mpe-notification.info {
        border-color: #17a2b8;
        background: #d1ecf1;
        color: #0c5460;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupUIEventListeners() {
    // Close button
    const closeBtn = this.printerUI.querySelector('.mpe-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.printerUI.style.display = 'none';
      });
    }

    // Printer selection changes
    const labelPrinter = this.printerUI.querySelector('#mpe-label-printer');
    const challanPrinter = this.printerUI.querySelector('#mpe-challan-printer');

    if (labelPrinter) {
      labelPrinter.addEventListener('change', (e) => {
        this.savePrinterPreference('label', e.target.value);
      });
    }

    if (challanPrinter) {
      challanPrinter.addEventListener('change', (e) => {
        this.savePrinterPreference('challan', e.target.value);
      });
    }
  }

  async loadPrinters() {
    try {
      // Get printers from background script
      const response = await chrome.runtime.sendMessage({ type: 'GET_PRINTERS' });
      
      if (response.success && response.printers) {
        this.populatePrinterSelects(response.printers);
        this.loadSavedPreferences();
      } else {
        this.showNotification('Failed to load printers', 'error');
      }
    } catch (error) {
      console.error('Error loading printers:', error);
      this.showNotification('Failed to load printers', 'error');
    }
  }

  populatePrinterSelects(printers) {
    const labelSelect = this.printerUI.querySelector('#mpe-label-printer');
    const challanSelect = this.printerUI.querySelector('#mpe-challan-printer');

    if (labelSelect) {
      labelSelect.innerHTML = '<option value="">Select Label Printer</option>';
      printers.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.name;
        option.textContent = printer.name;
        labelSelect.appendChild(option);
      });
    }

    if (challanSelect) {
      challanSelect.innerHTML = '<option value="">Select Challan Printer</option>';
      printers.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.name;
        option.textContent = printer.name;
        challanSelect.appendChild(option);
      });
    }
  }

  async loadSavedPreferences() {
    try {
      const result = await chrome.storage.local.get(['labelPrinter', 'challanPrinter']);
      
      if (result.labelPrinter) {
        const labelSelect = this.printerUI.querySelector('#mpe-label-printer');
        if (labelSelect) labelSelect.value = result.labelPrinter;
      }
      
      if (result.challanPrinter) {
        const challanSelect = this.printerUI.querySelector('#mpe-challan-printer');
        if (challanSelect) challanSelect.value = result.challanPrinter;
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async savePrinterPreference(type, printerName) {
    try {
      const key = type === 'label' ? 'labelPrinter' : 'challanPrinter';
      console.log(`Content script saving ${type} printer preference:`, { key, printerName });
      
      // Check if this preference was already set by the popup
      const existing = await chrome.storage.local.get([key]);
      if (existing[key] && existing[key] !== printerName) {
        console.log(`Content script overriding existing preference: ${existing[key]} -> ${printerName}`);
      }
      
      await chrome.storage.local.set({ [key]: printerName });
      console.log(`Content script printer preference saved successfully:`, { key, printerName });
      
      // Show success feedback
      this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} printer saved: ${printerName}`, 'success');
    } catch (error) {
      console.error('Content script error saving preference:', error);
      this.showNotification('Failed to save printer preference', 'error');
    }
  }

  interceptPrintRequests() {
    // Override the browser's print function
    const originalPrint = window.print;
    window.print = (...args) => {
      // Check if this is a label or challan print request
      this.handlePrintRequest('unknown', args);
      return originalPrint.apply(window, args);
    };

    // Listen for custom print events from the web app
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      
      if (event.data.type === 'PRINT_LABEL') {
        this.handlePrintRequest('label', event.data.labelData);
      } else if (event.data.type === 'PRINT_CHALLAN') {
        this.handlePrintRequest('challan', event.data.challanData);
      }
    });

    // Intercept button clicks that might trigger printing
    this.interceptPrintButtons();
  }

  interceptPrintButtons() {
    // Look for buttons that might trigger printing
    const printButtons = document.querySelectorAll('button');
    printButtons.forEach(button => {
      const text = button.textContent.toLowerCase();
      if (text.includes('print') || text.includes('label') || text.includes('challan')) {
        button.addEventListener('click', (e) => {
          // Add a small delay to let the original handler run first
          setTimeout(() => {
            this.checkForPrintData();
          }, 100);
        });
      }
    });
  }

  checkForPrintData() {
    // Look for label or challan data in the page
    // This is a fallback method if the web app doesn't send custom events
    const pageContent = document.body.textContent;
    
    if (pageContent.includes('GLINTEX') || pageContent.includes('CH-')) {
      // Might be a label or challan page
      this.showNotification('Print data detected. Use the extension UI to print.', 'info');
    }
  }

  handlePrintRequest(printType, data) {
    try {
      console.log(`${printType} print request intercepted by extension`);
      
      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Send message to background script
        chrome.runtime.sendMessage({
          type: 'PRINT_REQUEST',
          printType: printType,
          data: data
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Extension communication error:', chrome.runtime.lastError);
            this.showNotification('Extension communication failed. Please check if extension is properly loaded.', 'error');
          } else if (response && response.success) {
            this.showNotification(`${printType} print job sent successfully!`, 'success');
          } else {
            this.showNotification(`Failed to send ${printType} print job.`, 'error');
          }
        });
      } else {
        // Fallback: try to communicate with local print service directly
        console.log('Extension context not available, trying direct communication...');
        this.sendPrintRequestDirectly(printType, data);
      }
    } catch (error) {
      console.error('Extension print error:', error);
      this.showNotification(`Print error: ${error.message}`, 'error');
    }
  }

  // Fallback method to communicate directly with local print service
  async sendPrintRequestDirectly(printType, data) {
    try {
      const endpoint = printType === 'label' ? '/print/label' : '/print/challan';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerName: this.getSelectedPrinter(printType),
          [printType === 'label' ? 'labelData' : 'challanData']: data
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.showNotification(`${printType} print job sent successfully!`, 'success');
        console.log('Direct print result:', result);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Direct print request failed:', error);
      this.showNotification(`Direct print failed: ${error.message}`, 'error');
    }
  }

  // Helper method to get selected printer
  getSelectedPrinter(printType) {
    if (!this.printerUI) return 'Default Printer';
    
    const selector = printType === 'label' ? '#mpe-label-printer' : '#mpe-challan-printer';
    const select = this.printerUI.querySelector(selector);
    return select ? select.value : 'Default Printer';
  }

  setupMessageListener() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'SHOW_NOTIFICATION') {
        this.showNotification(request.message, request.notificationType);
        sendResponse({ success: true });
      } else if (request.type === 'SHOW_PRINT_UI') {
        this.showPrintUI();
        sendResponse({ success: true });
      }
    });
  }

  showPrintUI() {
    // Show the printer selection UI
    if (this.printerUI) {
      this.printerUI.style.display = 'block';
      this.printerUI.classList.add('active');
      
      // Position the UI
      this.positionUI();
      
      // Show a notification
      this.showNotification('Print UI is now visible. Select your printers and start printing!', 'info');
    }
  }

  checkPageCompatibility() {
    // Check if we're on a compatible page
    const pageUrl = window.location.href;
    const isCompatible = pageUrl.includes('localhost') || 
                        pageUrl.includes('127.0.0.1') || 
                        pageUrl.includes('metallic-challan');
    
    if (!isCompatible) {
      this.printerUI.style.display = 'none';
      this.showNotification('This extension works on Metallic Challan System pages only', 'info');
    }
  }

  positionUI() {
    // Ensure UI is positioned correctly
    const rect = this.printerUI.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.printerUI.style.right = '10px';
    }
    if (rect.bottom > window.innerHeight) {
      this.printerUI.style.top = '10px';
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `mpe-notification ${type}`;
    notification.textContent = message;
    
    this.notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Public method to trigger printing programmatically
  printLabel(labelData) {
    this.handlePrintRequest('label', labelData);
  }

  printChallan(challanData) {
    this.handlePrintRequest('challan', challanData);
  }
}

// Initialize the extension
const metallicPrintExtension = new MetallicPrintExtension();

// Make it available globally for the web app to use
window.metallicPrintExtension = metallicPrintExtension;

// Export functions for the web app
window.triggerLabelPrint = (labelData) => {
  metallicPrintExtension.printLabel(labelData);
};

window.triggerChallanPrint = (challanData) => {
  metallicPrintExtension.printChallan(challanData);
};
