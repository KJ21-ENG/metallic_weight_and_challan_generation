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
