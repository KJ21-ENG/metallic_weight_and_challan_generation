const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // reserved for future IPC hooks like printing
});
