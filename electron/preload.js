const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (_, filePath) => callback(filePath));
  }
});
