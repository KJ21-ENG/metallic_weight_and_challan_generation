const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const { pathToFileURL } = require('url');
const iconConfig = require('./icon-config');

let mainWindow;

// Try to load weight scale service if available (dynamically)
let weightScaleService = null;
try {
  // eslint-disable-next-line global-require
  weightScaleService = require(path.join(__dirname, 'backend', 'services', 'weightScaleService.js'));
  // weightScaleService loaded
} catch (e) {
  console.warn('WeightScaleService not available:', e && e.message ? e.message : e);
}

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
          width: 75 * 1000,   // 75mm in microns
          height: 125 * 1000  // 125mm in microns
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

/* debug-weight-scale handler removed */

// Standard weight scale IPC handlers delegating to weightScaleService if available
ipcMain.handle('weight-scale-status', async () => {
  try {
    const status = { available: !!weightScaleService, connected: !!(weightScaleService && weightScaleService.isConnected) };
    console.log('[IPC] weight-scale-status ->', status);
    return status.connected || false;
  } catch (err) {
    console.error('[IPC] weight-scale-status error:', err);
    return false;
  }
});

ipcMain.handle('connect-weight-scale', async (event, options) => {
  try {
    if (!weightScaleService) throw new Error('WeightScaleService not loaded');
    console.log('[IPC] connect-weight-scale options:', options);
    const res = await weightScaleService.initialize(options || {});
    console.log('[IPC] connect-weight-scale result:', res);
    return res;
  } catch (err) {
    console.error('[IPC] connect-weight-scale error:', err);
    throw err;
  }
});

ipcMain.handle('auto-detect-weight-scale', async () => {
  try {
    if (!weightScaleService) throw new Error('WeightScaleService not loaded');
    console.log('[IPC] auto-detect-weight-scale');
    const res = await weightScaleService.autoDetectAndConnect();
    console.log('[IPC] auto-detect-weight-scale result:', res);
    return res;
  } catch (err) {
    console.error('[IPC] auto-detect-weight-scale error:', err);
    throw err;
  }
});

ipcMain.handle('disconnect-weight-scale', async () => {
  try {
    if (!weightScaleService) {
      console.warn('[IPC] disconnect-weight-scale: service not loaded');
      return true;
    }
    console.log('[IPC] disconnect-weight-scale');
    const res = await weightScaleService.disconnect();
    console.log('[IPC] disconnect-weight-scale result:', res);
    return res;
  } catch (err) {
    console.error('[IPC] disconnect-weight-scale error:', err);
    throw err;
  }
});

ipcMain.handle('capture-weight', async () => {
  try {
    if (!weightScaleService) throw new Error('WeightScaleService not loaded');
    console.log('[IPC] capture-weight invoked');
    // If not connected, try to auto-detect first
    if (!weightScaleService.isConnected) {
      console.log('[IPC] capture-weight: service not connected, attempting auto-detect');
      try { await weightScaleService.autoDetectAndConnect(); } catch (e) { console.warn('[IPC] auto-detect failed during capture-weight:', e.message || e); }
    }
    if (!weightScaleService.isConnected) throw new Error('Weight scale not connected');
    const w = await weightScaleService.captureWeight();
    console.log('[IPC] capture-weight ->', w);
    return w;
  } catch (err) {
    console.error('[IPC] capture-weight error:', err);
    throw err;
  }
});

ipcMain.handle('get-available-ports', async () => {
  try {
    if (!weightScaleService) throw new Error('WeightScaleService not loaded');
    const ports = await weightScaleService.getAvailablePorts();
    console.log('[IPC] get-available-ports ->', ports);
    return ports;
  } catch (err) {
    console.error('[IPC] get-available-ports error:', err);
    throw err;
  }
});

// Read weight from scale or ask user to input manually via a modal dialog.
// If you later add serial/USB scale integration, replace the modal flow with direct serial reads here.
ipcMain.handle('read-weight', async (event) => {
  try {
    // If SCALE_PORT env is provided, user may want serial integration (not implemented here yet)
    const scalePort = process.env.SCALE_PORT || '';
    if (scalePort) {
      // Placeholder: implement serial port read here if desired.
      console.log('SCALE_PORT set but serial reading not implemented. Falling back to manual input.');
    }

    return await new Promise((resolve) => {
      // Create a small modal window with an input field for manual weight entry
      const modal = new BrowserWindow({
        width: 360,
        height: 180,
        resizable: false,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Enter Weight</title></head><body style="font-family: Arial, sans-serif; display:flex;align-items:center;justify-content:center;height:100%;margin:0"><div style="width:100%;padding:12px"><h3 style="margin:0 0 8px 0">Enter Weight (kg)</h3><input id="w" type="number" step="0.001" style="width:100%;padding:8px;font-size:16px" /><div style="display:flex;gap:8px;margin-top:10px"><button id="ok" style="flex:1;padding:8px">OK</button><button id="cancel" style="flex:1;padding:8px">Cancel</button></div></div><script>const { ipcRenderer } = require('electron');document.getElementById('ok').addEventListener('click', ()=>{ const v = document.getElementById('w').value; ipcRenderer.send('read-weight-response', v); }); document.getElementById('cancel').addEventListener('click', ()=>{ ipcRenderer.send('read-weight-response', null); }); document.getElementById('w').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('ok').click(); } }); document.getElementById('w').focus();</script></body></html>`;

      ipcMain.once('read-weight-response', (_ev, value) => {
        try {
          const n = value === null || value === undefined || value === '' ? null : Number(value);
          if (n === null || !Number.isFinite(n)) resolve(null);
          else resolve(n);
        } catch (err) { resolve(null); }
        if (!modal.isDestroyed()) modal.close();
      });

      modal.on('closed', () => {
        // If closed without response, resolve null
        resolve(null);
      });

      modal.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      modal.once('ready-to-show', () => modal.show());
    });
  } catch (err) {
    console.error('Error in read-weight handler:', err);
    return null;
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
    icon: iconConfig.main,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.maximize();

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

function logToFile(message) {
  try {
    const logDir = app.getPath('userData');
    const logFile = path.join(logDir, 'app.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  } catch {}
}

function loadClientFromResources() {
  try {
    const clientIndex = `file://${path.join(process.resourcesPath, 'client-dist', 'index.html')}`;
    if (mainWindow) {
      mainWindow.loadURL(clientIndex);
      mainWindow.once('ready-to-show', () => {
        console.log('Client loaded from resources, showing window');
        mainWindow.show();
      });
    }
  } catch (e) {
    console.error('Failed to load client from resources', e);
    logToFile(`Failed to load client from resources: ${String(e && e.stack || e)}`);
  }
}

async function startProductionServerAndLoad() {
  // In production, spawn the compiled server from extraResources
  const serverDistPath = path.join(process.resourcesPath, 'server-dist');
  const serverMain = path.join(serverDistPath, 'index.js');
  // Run server with Electron's node runtime by toggling ELECTRON_RUN_AS_NODE.
  // Use a PROJECT_ROOT on the same drive as installation so PDFs go to that drive.
  // Prefer <Drive>:\Bohra Jari Challan System, falling back to userData if needed.
  function isWritableDir(dir) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      const probe = path.join(dir, '.write-probe.tmp');
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      return true;
    } catch {
      return false;
    }
  }

  function pickProjectRoot() {
    const candidates = [];
    try {
      const parsed = path.parse(process.resourcesPath);
      const driveRoot = parsed.root; // e.g., 'D:\\'
      if (driveRoot && /^[A-Za-z]:\\$/.test(driveRoot)) {
        candidates.push(path.join(driveRoot, 'Bohra Jari Challan System'));
      }
    } catch {}
    try {
      const installDir = path.dirname(process.resourcesPath);
      candidates.push(installDir);
    } catch {}
    candidates.push(app.getPath('userData'));

    for (const c of candidates) {
      if (isWritableDir(c)) {
        try { logToFile(`Selected PROJECT_ROOT=${c}`); } catch {}
        return c;
      } else {
        try { logToFile(`PROJECT_ROOT not writable, skipping: ${c}`); } catch {}
      }
    }
    return app.getPath('userData');
  }
  const desiredProjectRoot = pickProjectRoot();
  // Ensure packaged .env (in resources) is available to the server by copying it into the
  // writable project root where the server looks for PROJECT_ROOT/.env. This preserves
  // writable location for PDFs while allowing the server to read env vars from .env.
  try {
    const packagedEnv = path.join(process.resourcesPath, '.env');
    const targetEnv = path.join(desiredProjectRoot, '.env');
    if (fs.existsSync(packagedEnv)) {
      // create target dir if necessary
      try { fs.mkdirSync(desiredProjectRoot, { recursive: true }); } catch (e) {}
      fs.copyFileSync(packagedEnv, targetEnv);
      logToFile(`Copied packaged .env to ${targetEnv}`);
    }
  } catch (e) { logToFile(`Failed to copy packaged .env: ${String(e && e.stack || e)}`); }
  // Start server as ESM using dynamic import
  const serverUrl = pathToFileURL(serverMain).href;
  // Fixed production port
  const chosenPort = process.env.PORT || '4000';
  // Launch server as a normal Node script using Electron's embedded Node (ELECTRON_RUN_AS_NODE)
  const stdio = ['ignore', 'pipe', 'pipe'];
  const spawnEnv = { 
    ...process.env, 
    ELECTRON_RUN_AS_NODE: '1', 
    NODE_ENV: 'production', 
    PORT: chosenPort, 
    PROJECT_ROOT: desiredProjectRoot,
    RESOURCES_ENV_PATH: path.join(process.resourcesPath, '.env')
  };
  const spawnOpts = { cwd: serverDistPath, env: spawnEnv, stdio, windowsHide: true };
  serverChild = spawn(process.execPath, [serverMain], spawnOpts);

  // Pipe child output to log file
  try {
    const logDir = app.getPath('userData');
    const logFile = path.join(logDir, 'app.log');
    const writeStream = fs.createWriteStream(logFile, { flags: 'a' });
    writeStream.write(`\n===== Server start @ ${new Date().toISOString()} =====\n`);
    writeStream.write(`serverMain=${serverMain}\nresourcesPath=${process.resourcesPath}\nPORT=${chosenPort}\n`);
    if (serverChild.stdout) serverChild.stdout.pipe(writeStream);
    if (serverChild.stderr) serverChild.stderr.pipe(writeStream);
  } catch {}
  serverChild.on('exit', (code, signal) => {
    const msg = `Server process exited with code=${code} signal=${signal}`;
    console.error(msg);
    logToFile(msg);
  });
  await waitForServer(`http://localhost:${chosenPort}/api/health`);
  // Load built client with apiBase query param
  const clientIndex = `file://${path.join(process.resourcesPath, 'client-dist', 'index.html')}?apiBase=${encodeURIComponent(`http://localhost:${chosenPort}`)}`;
  console.log('Loading main application from:', clientIndex);
  if (mainWindow) {
    mainWindow.loadURL(clientIndex);
    mainWindow.once('ready-to-show', () => {
      console.log('Main application ready, showing window');
      mainWindow.show();
    });
  }
}

app.whenReady().then(async () => {
  createWindow();
  
  if (process.env.APP_URL) {
    // Development mode - load the dev server URL directly
    const devUrl = process.env.APP_URL;
    console.log('Development mode - loading from:', devUrl);
    if (mainWindow) {
      mainWindow.loadURL(devUrl);
      mainWindow.once('ready-to-show', () => {
        console.log('Development app ready, showing window');
        mainWindow.show();
      });
    }
  } else {
    // Production mode - start server and load built client
    try { 
      await startProductionServerAndLoad(); 
    } catch (e) {
      /* eslint-disable no-console */
      console.error('Error starting production server', e);
      logToFile(`Error starting production server: ${String(e && e.stack || e)}`);
      // Load client UI anyway so user sees an error state in UI rather than a blank placeholder
      loadClientFromResources();
    }
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
