// Popup Script for Metallic Challan Print Extension
// Handles the extension popup UI and user interactions

class PopupManager {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPopup());
    } else {
      this.setupPopup();
    }
  }

  setupPopup() {
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data in the correct order
    this.loadServiceStatus();
    this.loadPrinters().then(() => {
      // Load saved preferences AFTER printers are loaded
      this.loadSavedPreferences();
    }).catch(error => {
      console.error('Failed to load printers:', error);
      // Still try to load preferences even if printers fail
      this.loadSavedPreferences();
    });
  }

  setupEventListeners() {
    // Refresh printers button
    const refreshBtn = document.getElementById('refresh-printers');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshPrinters());
    }

    // Test connection button
    const testBtn = document.getElementById('test-connection');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testConnection());
    }

    // Show UI button
    const showUIBtn = document.getElementById('show-ui');
    if (showUIBtn) {
      showUIBtn.addEventListener('click', () => this.showPrintUI());
    }

    // Debug button - add this to test storage
    const debugBtn = document.getElementById('debug-storage');
    if (debugBtn) {
      debugBtn.addEventListener('click', () => this.debugStorage());
    }

    // Force reload preferences button
    const forceReloadBtn = document.getElementById('force-reload');
    if (forceReloadBtn) {
      forceReloadBtn.addEventListener('click', () => this.forceReloadPreferences());
    }

    // Printer selection changes
    const labelPrinter = document.getElementById('label-printer');
    const challanPrinter = document.getElementById('challan-printer');

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

  async loadServiceStatus() {
    try {
      const statusElement = document.getElementById('service-status');
      if (!statusElement) return;

      statusElement.textContent = 'Checking...';
      statusElement.className = 'status-indicator checking';

      const response = await chrome.runtime.sendMessage({ type: 'CHECK_SERVICE_HEALTH' });
      
      if (response.success && response.health) {
        const health = response.health;
        
        if (health.isHealthy) {
          statusElement.textContent = 'Connected';
          statusElement.className = 'status-indicator connected';
        } else {
          statusElement.textContent = 'Disconnected';
          statusElement.className = 'status-indicator disconnected';
        }
      } else {
        statusElement.textContent = 'Error';
        statusElement.className = 'status-indicator disconnected';
      }
    } catch (error) {
      console.error('Error loading service status:', error);
      const statusElement = document.getElementById('service-status');
      if (statusElement) {
        statusElement.textContent = 'Error';
        statusElement.className = 'status-indicator disconnected';
      }
    }
  }

  async loadPrinters() {
    try {
      const labelSelect = document.getElementById('label-printer');
      const challanSelect = document.getElementById('challan-printer');

      if (!labelSelect || !challanSelect) return;

      // Show loading state
      labelSelect.innerHTML = '<option value="">Loading printers...</option>';
      challanSelect.innerHTML = '<option value="">Loading printers...</option>';

      const response = await chrome.runtime.sendMessage({ type: 'GET_PRINTERS' });
      
      if (response.success && response.printers) {
        this.populatePrinterSelects(response.printers);
      } else {
        labelSelect.innerHTML = '<option value="">No printers found</option>';
        challanSelect.innerHTML = '<option value="">No printers found</option>';
      }
    } catch (error) {
      console.error('Error loading printers:', error);
      const labelSelect = document.getElementById('label-printer');
      const challanSelect = document.getElementById('challan-printer');
      
      if (labelSelect) labelSelect.innerHTML = '<option value="">Error loading</option>';
      if (challanSelect) challanSelect.innerHTML = '<option value="">Error loading</option>';
    }
  }

  populatePrinterSelects(printers) {
    const labelSelect = document.getElementById('label-printer');
    const challanSelect = document.getElementById('challan-printer');

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
      console.log('Loading saved preferences...');
      const result = await chrome.storage.local.get(['labelPrinter', 'challanPrinter']);
      console.log('Storage result:', result);
      
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (result.labelPrinter) {
        console.log('Setting label printer to:', result.labelPrinter);
        const labelSelect = document.getElementById('label-printer');
        if (labelSelect) {
          labelSelect.value = result.labelPrinter;
          console.log('Label printer set successfully');
        } else {
          console.error('Label printer select element not found');
        }
      } else {
        console.log('No saved label printer found');
      }
      
      if (result.challanPrinter) {
        console.log('Setting challan printer to:', result.challanPrinter);
        const challanSelect = document.getElementById('challan-printer');
        if (challanSelect) {
          challanSelect.value = result.challanPrinter;
          console.log('Challan printer set successfully');
        } else {
          console.error('Challan printer select element not found');
        }
      } else {
        console.log('No saved challan printer found');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async savePrinterPreference(type, printerName) {
    try {
      const key = type === 'label' ? 'labelPrinter' : 'challanPrinter';
      console.log(`Saving ${type} printer preference:`, { key, printerName });
      
      await chrome.storage.local.set({ [key]: printerName });
      console.log(`Printer preference saved successfully:`, { key, printerName });
      
      // Verify the save worked
      const result = await chrome.storage.local.get([key]);
      console.log(`Verification - storage now contains:`, result);
      
      // Show success feedback
      this.showFeedback(`${type.charAt(0).toUpperCase() + type.slice(1)} printer saved: ${printerName}`);
    } catch (error) {
      console.error('Error saving preference:', error);
      this.showFeedback('Failed to save printer preference', 'error');
    }
  }

  async refreshPrinters() {
    try {
      const refreshBtn = document.getElementById('refresh-printers');
      if (refreshBtn) {
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.disabled = true;
      }

      await this.loadPrinters();
      this.showFeedback('Printers refreshed successfully');
    } catch (error) {
      console.error('Error refreshing printers:', error);
      this.showFeedback('Failed to refresh printers', 'error');
    } finally {
      const refreshBtn = document.getElementById('refresh-printers');
      if (refreshBtn) {
        refreshBtn.textContent = 'Refresh Printers';
        refreshBtn.disabled = false;
      }
    }
  }

  async testConnection() {
    try {
      const testBtn = document.getElementById('test-connection');
      if (testBtn) {
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;
      }

      const response = await chrome.runtime.sendMessage({ type: 'CHECK_SERVICE_HEALTH' });
      
      if (response.success && response.health) {
        const health = response.health;
        if (health.isHealthy) {
          this.showFeedback('Connection successful! Service is running.', 'success');
        } else {
          this.showFeedback('Connection failed. Service is not responding.', 'error');
        }
      } else {
        this.showFeedback('Connection test failed.', 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      this.showFeedback('Connection test failed: ' + error.message, 'error');
    } finally {
      const testBtn = document.getElementById('test-connection');
      if (testBtn) {
        testBtn.textContent = 'Test Connection';
        testBtn.disabled = false;
      }
    }
  }

  async showPrintUI() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // Send message to content script to show the UI
        await chrome.tabs.sendMessage(tab.id, { type: 'SHOW_PRINT_UI' });
        
        // Close the popup
        window.close();
      } else {
        this.showFeedback('No active tab found', 'error');
      }
    } catch (error) {
      console.error('Error showing print UI:', error);
      this.showFeedback('Failed to show print UI', 'error');
    }
  }

  async debugStorage() {
    try {
      const debugBtn = document.getElementById('debug-storage');
      if (debugBtn) {
        debugBtn.textContent = 'Debugging...';
        debugBtn.disabled = true;
      }

      const result = await chrome.storage.local.get(['labelPrinter', 'challanPrinter']);
      console.log('Current Storage Contents:');
      console.log('Label Printer:', result.labelPrinter);
      console.log('Challan Printer:', result.challanPrinter);

      // Check if there are any conflicts
      if (!result.labelPrinter && !result.challanPrinter) {
        console.log('No printer preferences found in storage');
        this.showFeedback('No printer preferences found. Please select printers first.', 'info');
      } else {
        this.showFeedback('Debugging complete. Check console for storage contents.', 'info');
      }
    } catch (error) {
      console.error('Error debugging storage:', error);
      this.showFeedback('Failed to debug storage: ' + error.message, 'error');
    } finally {
      const debugBtn = document.getElementById('debug-storage');
      if (debugBtn) {
        debugBtn.textContent = 'Debug Storage';
        debugBtn.disabled = false;
      }
    }
  }

  // Force reload preferences from storage
  async forceReloadPreferences() {
    try {
      console.log('Force reloading preferences...');
      await this.loadSavedPreferences();
      this.showFeedback('Preferences reloaded from storage', 'success');
    } catch (error) {
      console.error('Error force reloading preferences:', error);
      this.showFeedback('Failed to reload preferences: ' + error.message, 'error');
    }
  }

  showFeedback(message, type = 'info') {
    // Create a temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
      color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
    `;

    document.body.appendChild(feedback);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 3000);
  }
}

// Initialize the popup manager
const popupManager = new PopupManager();
