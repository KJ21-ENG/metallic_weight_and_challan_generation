const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Get available printers
  getPrinters: async () => {
    try {
      // Use IPC to get printers from main process
      return await ipcRenderer.invoke('get-printers');
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  },
  
  // Print to specific printer
  printToPrinter: async (printerName, content) => {
    try {
      return await ipcRenderer.invoke('print-to-printer', printerName, content);
    } catch (error) {
      console.error('Error printing to printer:', error);
      return false;
    }
  },
  
  // Silent printing for labels - working approach from receive.js
  printSilently: async (options) => {
    try {
      return await ipcRenderer.invoke('print-silently', options);
    } catch (error) {
      console.error('Error in silent printing:', error);
      return false;
    }
  },

  // Weight scale related helpers
  weightScaleStatus: async () => { return await ipcRenderer.invoke('weight-scale-status'); },
  connectWeightScale: async (opts) => { return await ipcRenderer.invoke('connect-weight-scale', opts); },
  autoDetectWeightScale: async () => { return await ipcRenderer.invoke('auto-detect-weight-scale'); },
  disconnectWeightScale: async () => { return await ipcRenderer.invoke('disconnect-weight-scale'); },
  captureWeight: async () => { return await ipcRenderer.invoke('capture-weight'); },
  getAvailablePorts: async () => { return await ipcRenderer.invoke('get-available-ports'); },
  
  // Test function to verify IPC is working
  test: async () => {
    try {
      return await ipcRenderer.invoke('test');
    } catch (error) {
      console.error('Error in test:', error);
      return 'IPC test failed';
    }
  }
});

// Expose electron object for direct access (needed for the working printing approach)
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: async (channel, ...args) => {
      try {
        return await ipcRenderer.invoke(channel, ...args);
      } catch (error) {
        console.error(`Error in IPC call to ${channel}:`, error);
        throw error;
      }
    }
  }
});
