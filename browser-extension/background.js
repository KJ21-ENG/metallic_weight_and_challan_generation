// Background Service Worker for Metallic Challan Print Extension
// Handles print job management and communication with local print service

class PrintServiceManager {
  constructor() {
    this.serviceUrl = 'http://localhost:3001';
    this.serviceStatus = 'disconnected';
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Background script received message:', request);
      
      if (request.type === 'PRINT_REQUEST') {
        this.handlePrintRequest(request.printType, request.data, sendResponse);
        return true; // Keep message channel open for async response
      }
      
      if (request.type === 'CHECK_SERVICE_HEALTH') {
        this.handleServiceHealthCheck(sendResponse);
        return true; // Keep message channel open for async response
      }
      
      if (request.type === 'GET_PRINTERS') {
        this.handleGetPrinters(sendResponse);
        return true; // Keep message channel open for async response
      }
      
      // Handle other message types...
      sendResponse({ success: false, error: 'Unknown message type' });
    });
    
    // Check service health periodically
    this.checkServiceHealth();
    setInterval(() => this.checkServiceHealth(), 30000); // Check every 30 seconds
  }

  async getAvailablePrinters() {
    try {
      const response = await fetch('http://localhost:3001/printers');
      if (response.ok) {
        const data = await response.json();
        return data.printers || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get printers:', error);
      return [];
    }
  }

  // Check service health
  async checkServiceHealth() {
    try {
      const response = await fetch('http://localhost:3001/health');
      const isHealthy = response.ok;
      
      this.updateBadge(isHealthy ? 'ON' : 'OFF');
      this.serviceStatus = isHealthy ? 'connected' : 'disconnected';
      
      return isHealthy;
    } catch (error) {
      console.error('Service health check failed:', error);
      this.updateBadge('OFF');
      this.serviceStatus = 'disconnected';
      return false;
    }
  }

  // Update extension badge
  updateBadge(text) {
    try {
      if (text === 'ON') {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setBadgeBackgroundColor({ color: '#00ff00' });
      } else {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
      }
    } catch (error) {
      console.error('Failed to update badge:', error);
    }
  }

  showNotification(message, type = 'info') {
    // Send notification to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SHOW_NOTIFICATION',
          message,
          notificationType: type
        });
      }
    });
  }

  // Handle print requests
  async handlePrintRequest(printType, data, sendResponse) {
    try {
      console.log(`Processing ${printType} print request...`);
      
      // Get selected printer from storage
      const storage = await chrome.storage.local.get(['labelPrinter', 'challanPrinter']);
      const printerName = printType === 'label' ? storage.labelPrinter : storage.challanPrinter;
      
      if (!printerName || printerName === 'Select Label Printer' || printerName === 'Select Challan Printer') {
        sendResponse({ success: false, error: `Please select a ${printType} printer first` });
        return;
      }
      
      // Send to local print service
      const endpoint = printType === 'label' ? '/print/label' : '/print/challan';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerName: printerName,
          [printType === 'label' ? 'labelData' : 'challanData']: data
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`${printType} print result:`, result);
        sendResponse({ success: true, result: result });
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Print request error:`, error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Handle service health check request from popup
  async handleServiceHealthCheck(sendResponse) {
    try {
      const isHealthy = await this.checkServiceHealth();
      sendResponse({ 
        success: true, 
        health: {
          isHealthy: isHealthy,
          timestamp: new Date().toISOString(),
          url: 'http://localhost:3001'
        }
      });
    } catch (error) {
      console.error('Service health check error:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Handle get printers request from popup
  async handleGetPrinters(sendResponse) {
    try {
      const printers = await this.getAvailablePrinters();
      sendResponse({ 
        success: true, 
        printers: printers 
      });
    } catch (error) {
      console.error('Get printers error:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

// Initialize the print service manager
const printManager = new PrintServiceManager();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Metallic Challan Print Extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      labelPrinter: '',
      challanPrinter: '',
      serviceUrl: 'http://localhost:3001',
      autoConnect: true
    });
  } else if (details.reason === 'update') {
    console.log('Metallic Challan Print Extension updated');
    
    // Clean up old storage keys and migrate to new ones
    chrome.storage.local.get(['defaultLabelPrinter', 'defaultChallanPrinter'], (result) => {
      if (result.defaultLabelPrinter || result.defaultChallanPrinter) {
        // Migrate old keys to new ones
        const newData = {};
        if (result.defaultLabelPrinter) newData.labelPrinter = result.defaultLabelPrinter;
        if (result.defaultChallanPrinter) newData.challanPrinter = result.defaultChallanPrinter;
        
        chrome.storage.local.set(newData, () => {
          // Remove old keys
          chrome.storage.local.remove(['defaultLabelPrinter', 'defaultChallanPrinter']);
          console.log('Storage keys migrated successfully');
        });
      }
    });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Metallic Challan Print Extension started');
  printManager.checkServiceHealth();
});
