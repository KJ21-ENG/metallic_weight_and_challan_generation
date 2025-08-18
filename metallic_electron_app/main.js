const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;

// IPC handler for getting printers
ipcMain.handle('get-printers', async () => {
  try {
    if (mainWindow && mainWindow.webContents) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log('Detected printers:', printers);
      return printers;
    }
    console.log('Main window or webContents not available');
    return [];
  } catch (error) {
    console.error('Error getting printers from main process:', error);
    return [];
  }
});

// Test IPC handler
ipcMain.handle('test', async () => {
  console.log('Test IPC handler called');
  return 'IPC is working!';
});

// Print to specific printer handler
ipcMain.handle('print-to-printer', async (event, printerName, content) => {
  try {
    console.log(`Printing to printer: ${printerName}`);
    
    if (mainWindow && mainWindow.webContents) {
      // Create a new window for printing
      const printWindow = new BrowserWindow({
        parent: mainWindow,
        width: 800,
        height: 600,
        show: false,
        webPreferences: { 
          contextIsolation: false, 
          nodeIntegration: true 
        }
      });

      // Load the content as HTML
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Print to specific printer
      const printOptions = {
        silent: false,
        printBackground: true,
        deviceName: printerName
      };
      
      const success = await printWindow.webContents.print(printOptions);
      
      // Close the print window
      printWindow.close();
      
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('Error printing to printer:', error);
    return false;
  }
});

// Silent printing handler for labels - working approach from receive.js
ipcMain.handle('print-silently', async (event, options) => {
  try {
    const { html, silent = true, printBackground = true, deviceName } = options;
    console.log(`Silent printing to printer: ${deviceName}`);
    
    if (mainWindow && mainWindow.webContents) {
      // Create a new hidden window for printing
      const printWindow = new BrowserWindow({
        parent: mainWindow,
        width: 800,
        height: 600,
        show: false,
        webPreferences: { 
          contextIsolation: false, 
          nodeIntegration: true 
        }
      });

      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      
      // Wait for content to load and barcode to generate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Print silently to specific printer using callback method
      const printOptions = {
        silent: silent,
        printBackground: printBackground,
        deviceName: deviceName,
        margins: {
          marginType: 'none'
        },
        pageSize: {
          width: 283000, // 75mm in microns
          height: 472000  // 125mm in microns
        }
      };
      
      console.log('Print options:', printOptions);
      
      // Use the callback method to get the actual print result
      return new Promise((resolve) => {
        try {
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            console.log('Print callback result:', { success, failureReason });
            
            // Close the print window
            printWindow.close();
            
            if (success) {
              console.log('Silent print successful');
              resolve(true);
            } else {
              console.error('Silent print failed:', failureReason);
              // Try fallback method
              console.log('Trying fallback print method...');
              resolve(tryFallbackPrint(deviceName, html));
            }
          });
        } catch (printError) {
          console.error('Error calling webContents.print:', printError);
          printWindow.close();
          // Try fallback method
          console.log('Trying fallback print method due to error...');
          resolve(tryFallbackPrint(deviceName, html));
        }
      });
    }
    
    return false;
  } catch (error) {
    console.error('Error in silent printing:', error);
    return false;
  }
});

// Fallback printing method using printToPDF
async function tryFallbackPrint(deviceName, html) {
  try {
    console.log('Using fallback print method for device:', deviceName);
    
    // Create a new window for fallback printing
    const fallbackWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: { 
        contextIsolation: false, 
        nodeIntegration: true 
      }
    });

    // Load the HTML content
    await fallbackWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to print using a different approach
    const printOptions = {
      silent: false, // Show print dialog as fallback
      printBackground: true,
      deviceName: deviceName
    };
    
    console.log('Fallback print options:', printOptions);
    
    return new Promise((resolve) => {
      fallbackWindow.webContents.print(printOptions, (success, failureReason) => {
        console.log('Fallback print result:', { success, failureReason });
        fallbackWindow.close();
        resolve(success);
      });
    });
    
  } catch (error) {
    console.error('Error in fallback printing:', error);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  const isDev = !!process.env.APP_URL;
  const startUrl = process.env.APP_URL || `file://${path.join(__dirname, 'index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle challan print popups inside Electron; otherwise open externally
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const isChallanPrint = /:\/\/localhost:4000\/api\/challans\/.+\/print/.test(url) || /\/api\/challans\/.+\/print$/.test(url);
      if (isChallanPrint) {
        const printWindow = new BrowserWindow({
          parent: mainWindow,
          width: 900,
          height: 700,
          show: true,
          webPreferences: { contextIsolation: true, nodeIntegration: false },
        });
        const absoluteUrl = url.startsWith('/api/') ? `http://localhost:4000${url}` : url;
        printWindow.loadURL(absoluteUrl);
        printWindow.webContents.on('did-finish-load', () => {
          setTimeout(() => {
            try { printWindow.webContents.print({ silent: false }); } catch {}
          }, 500);
        });
        return { action: 'deny' };
      }
    } catch {}
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, (res) => {
        res.resume();
        resolve(true);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Server not ready'));
        setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

let serverChild;

async function startProductionServerAndLoad() {
  // In production, spawn the compiled server from extraResources
  const serverDistPath = path.join(process.resourcesPath, 'server-dist');
  const serverMain = path.join(serverDistPath, 'index.js');
  serverChild = spawn(process.execPath, [serverMain], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '4000', PROJECT_ROOT: process.resourcesPath },
    stdio: 'inherit'
  });
  await waitForServer('http://localhost:4000/api/health');
  // Load built client from extraResources
  const clientIndex = `file://${path.join(process.resourcesPath, 'client-dist', 'index.html')}`;
  if (mainWindow) mainWindow.loadURL(clientIndex);
}

app.whenReady().then(async () => {
  createWindow();
  if (!process.env.APP_URL) {
    try { await startProductionServerAndLoad(); } catch (e) { /* eslint-disable no-console */ console.error(e); }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try { if (serverChild) serverChild.kill(); } catch {}
});
