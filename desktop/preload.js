// Ponte sicuro tra la pagina e il processo principale: window.desktop.*
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  listLogs: () => ipcRenderer.invoke('logs:list'),
  readLog: (p) => ipcRenderer.invoke('logs:read', p),
  pickDir: () => ipcRenderer.invoke('logs:pickDir'),
  openDir: () => ipcRenderer.invoke('logs:openDir'),
  onLogsChanged: (cb) => ipcRenderer.on('logs-changed', (e, list) => cb(list)),
});
