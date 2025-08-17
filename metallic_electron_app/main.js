const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;

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
