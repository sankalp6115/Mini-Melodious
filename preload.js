const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFolder: (folderPath) => ipcRenderer.invoke('readFolder', folderPath),
  getFilePath: (folder, file) => ipcRenderer.invoke('getFilePath', folder, file),
  getStoredFolder: () => ipcRenderer.invoke('store:getFolder'),
  setStoredFolder: (folder) => ipcRenderer.invoke('store:setFolder', folder),

  // We remove `getImagePath` here completely — not safe in preload with webpack
});
