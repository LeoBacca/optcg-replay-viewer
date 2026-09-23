// OPTCG Replay — processo principale Electron.
// Apre index.html in una finestra nativa e dà al renderer l'accesso alla cartella dei log
// (scelta una volta, ricordata, sorvegliata: i log nuovi compaiono da soli).
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const SETTINGS = () => path.join(app.getPath('userData'), 'settings.json');
function loadSettings() { try { return JSON.parse(fs.readFileSync(SETTINGS(), 'utf8')); } catch (e) { return {}; } }
function saveSettings(s) { try { fs.mkdirSync(path.dirname(SETTINGS()), { recursive: true }); fs.writeFileSync(SETTINGS(), JSON.stringify(s, null, 2)); } catch (e) { } }

let win = null, watcher = null, watchTimer = null;

function listLogs(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!/\.(log|txt)$/i.test(name)) continue;
    try { const st = fs.statSync(path.join(dir, name)); if (st.isFile()) out.push({ name, path: path.join(dir, name), mtime: st.mtimeMs, size: st.size }); } catch (e) { }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

function watchDir(dir) {
  if (watcher) { try { watcher.close(); } catch (e) { } watcher = null; }
  if (!dir || !fs.existsSync(dir)) return;
  try {
    watcher = fs.watch(dir, () => {
      clearTimeout(watchTimer);
      watchTimer = setTimeout(() => { if (win && !win.isDestroyed()) win.webContents.send('logs-changed', listLogs(dir)); }, 600);
    });
  } catch (e) { watcher = null; }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 900, minWidth: 1100, minHeight: 700,
    backgroundColor: '#8a4a1c', title: 'OPTCG Replay', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'), { query: process.argv.includes('--open-latest') ? { open: 'latest' } : {} });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // --screenshot=<file> : cattura la finestra dopo 8 s ed esce (per i test)
  const shot = process.argv.find(a => a.startsWith('--screenshot='));
  if (shot) win.webContents.once('did-finish-load', () => setTimeout(async () => { const img = await win.webContents.capturePage(); fs.writeFileSync(shot.slice(13), img.toPNG()); app.quit(); }, 8000));
}

app.whenReady().then(() => {
  createWindow();
  const s = loadSettings();
  watchDir(s.logDir);
});
app.on('window-all-closed', () => app.quit());

ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('logs:list', () => listLogs(loadSettings().logDir));
ipcMain.handle('logs:read', (e, p) => fs.readFileSync(p, 'utf8'));
ipcMain.handle('logs:pickDir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Scegli la cartella dei combat log di OPTCGSim', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const s = loadSettings(); s.logDir = r.filePaths[0]; saveSettings(s); watchDir(s.logDir);
  return s.logDir;
});
ipcMain.handle('logs:openDir', () => { const d = loadSettings().logDir; if (d) shell.openPath(d); });
