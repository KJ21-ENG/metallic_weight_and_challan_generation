// Example Browser Extension Content Script
// This shows how the extension would intercept print requests and send them to the local service

class PrintService {
  constructor() {
    this.serviceUrl = 'http://localhost:3001';
    this.extensionId = 'metallic-print-extension';
    this.init();
  }

  init() {
    // Listen for print requests from the web app
    this.setupMessageListener();
    
    // Inject printer selection UI
    this.injectPrinterUI();
    
    // Check if local service is available
    this.checkServiceHealth();
  }

  setupMessageListener() {
    // Listen for messages from the web app
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      
      if (event.data.type === 'PRINT_LABEL') {
        this.handleLabelPrint(event.data.labelData);
      } else if (event.data.type === 'PRINT_CHALLAN') {
        this.handleChallanPrint(event.data.challanData);
      }
    });
  }

  injectPrinterUI() {
    // Create printer selection dropdown
    const printerSelect = document.createElement('select');
    printerSelect.id = 'extension-printer-select';
    printerSelect.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: white;
      font-size: 12px;
    `;
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Printer...';
    printerSelect.appendChild(defaultOption);
    
    // Load available printers
    this.loadPrinters(printerSelect);
    
    document.body.appendChild(printerSelect);
  }

  async loadPrinters(selectElement) {
    try {
      const response = await fetch(`${this.serviceUrl}/printers`);
      const data = await response.json();
      
      if (data.printers && data.printers.length > 0) {
        data.printers.forEach(printer => {
          const option = document.createElement('option');
          option.value = printer.name;
          option.textContent = printer.name;
          selectElement.appendChild(option);
        });
        
        // Load saved preference
        const savedPrinter = localStorage.getItem('extension-default-printer');
        if (savedPrinter) {
          selectElement.value = savedPrinter;
        }
        
        // Save preference when changed
        selectElement.addEventListener('change', (e) => {
          localStorage.setItem('extension-default-printer', e.target.value);
        });
      }
    } catch (error) {
      console.error('Failed to load printers:', error);
    }
  }

  async handleLabelPrint(labelData) {
    const printerName = this.getSelectedPrinter();
    if (!printerName) {
      this.showNotification('Please select a printer first', 'error');
      return;
    }

    try {
      this.showNotification('Sending print job...', 'info');
      
      const response = await fetch(`${this.serviceUrl}/print/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName, labelData })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification(`Label sent to ${printerName}`, 'success');
      } else {
        this.showNotification(`Print failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showNotification(`Failed to send print job: ${error.message}`, 'error');
    }
  }

  async handleChallanPrint(challanData) {
    const printerName = this.getSelectedPrinter();
    if (!printerName) {
      this.showNotification('Please select a printer first', 'error');
      return;
    }

    try {
      this.showNotification('Sending challan print job...', 'info');
      
      const response = await fetch(`${this.serviceUrl}/print/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName, challanData })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification(`Challan sent to ${printerName}`, 'success');
      } else {
        this.showNotification(`Print failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showNotification(`Failed to send print job: ${error.message}`, 'error');
    }
  }

  getSelectedPrinter() {
    const select = document.getElementById('extension-printer-select');
    return select ? select.value : null;
  }

  async checkServiceHealth() {
    try {
      const response = await fetch(`${this.serviceUrl}/health`);
      if (response.ok) {
        this.showNotification('Print service connected', 'success');
      }
    } catch (error) {
      this.showNotification('Print service not available', 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      z-index: 10001;
      padding: 10px 15px;
      border-radius: 5px;
      color: white;
      font-size: 12px;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    // Set color based on type
    switch (type) {
      case 'success':
        notification.style.background = '#28a745';
        break;
      case 'error':
        notification.style.background = '#dc3545';
        break;
      case 'info':
      default:
        notification.style.background = '#17a2b8';
        break;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the print service when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PrintService();
  });
} else {
  new PrintService();
}

// Example of how the web app would trigger printing
// This would be called from the web app when "ADD & PRINT LABEL" is clicked
function triggerLabelPrint(labelData) {
  window.postMessage({
    type: 'PRINT_LABEL',
    labelData: labelData
  }, window.location.origin);
}

function triggerChallanPrint(challanData) {
  window.postMessage({
    type: 'PRINT_CHALLAN',
    challanData: challanData
  }, window.location.origin);
}

// Example usage:
/*
// From the web app, when "ADD & PRINT LABEL" is clicked:
const labelData = {
  header: 'GLINTEX',
  dateText: new Date().toLocaleString(),
  color: 'Red',
  cut: 'Standard',
  bobQty: 5,
  gross: 2.500,
  bobWeight: 0.250,
  boxWeight: 0.100,
  net: 2.150,
  operator: 'John Doe',
  helper: 'Jane Smith',
  barcode: 'CH-25-000001-01'
};

triggerLabelPrint(labelData);
*/
