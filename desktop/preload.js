// Ponte sicuro tra la pagina e il processo principale: window.desktop.*
const { contextBridge, ipcRenderer, clipboard } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  // copia negli appunti senza dipendere dal fuoco della finestra (il prompt del Memory Trainer è lungo e deve arrivare intero)
  copy: (text) => clipboard.writeText(String(text)),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  listLogs: () => ipcRenderer.invoke('logs:list'),
  readLog: (p) => ipcRenderer.invoke('logs:read', p),
  // il titolo della finestra lo passa la pagina, nella lingua scelta
  pickDir: (title) => ipcRenderer.invoke('logs:pickDir', title),
  openDir: () => ipcRenderer.invoke('logs:openDir'),
  onLogsChanged: (cb) => ipcRenderer.on('logs-changed', (e, list) => cb(list)),
});
