const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

const store = new Store();

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Main: Attempting to load preload script from:', preloadPath);
  const win = new BrowserWindow({
    width: 320,
    height: 220,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html').catch(err => {
    console.error('Main: Failed to load index.html:', err);
  });
  win.setResizable(false);
}

ipcMain.handle('dialog:openFolder', async () => {
  console.log('Main: Opening folder dialog');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('readFolder', async (event, folderPath) => {
  console.log('Main: Reading folder:', folderPath);
  try {
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isFile: file.isFile()
    }));
  } catch (error) {
    console.error('Main: Error reading folder:', error);
    throw error;
  }
});

ipcMain.handle('getFilePath', (event, folder, file) => {
  console.log('Main: Getting file path:', folder, file);
  return path.join(folder, file);
});

ipcMain.handle('store:getFolder', () => {
  console.log('Main: Getting stored folder');
  return store.get('musicFolder');
});

ipcMain.handle('store:setFolder', (event, folder) => {
  console.log('Main: Setting stored folder:', folder);
  store.set('musicFolder', folder);
});

app.whenReady().then(() => {
  console.log('Main: App is ready, creating window');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch(err => {
  console.error('Main: Failed to initialize app:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});