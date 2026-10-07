// La cartella dei combat log: sceglierla, ricordarla, elencarne i file, aprirne uno.
//
// Ci sono tre modi di arrivare ai file, a seconda di dove gira la pagina:
//   1. nell'exe          window.desktop legge la cartella direttamente e avvisa quando compare un log nuovo;
//   2. Chrome / Edge     File System Access API: l'utente sceglie la cartella una volta, il browser la ricorda
//                        ma a ogni visita chiede di confermare il permesso (pulsante "↻ Riapri");
//   3. Safari, Firefox, o cartelle di sistema che Chrome blocca (su Mac i log stanno sotto ~/Library):
//                        la finestra classica dei file (<input webkitdirectory>). Niente viene ricordato.
//
// Ogni voce di logFiles ha { name, mtime, size } più UNO tra: path (exe), handle (caso 2), file (caso 3).
import { get, set } from '../store.js';
import { kvGet, kvSet } from '../lib/storage.js';
import { desktop, isDesktop } from '../lib/platform.js';
import { loadText, loadFile } from './loader.js';
import { syncLibrary } from './library.js';
import { t } from '../i18n/index.js';

const LOG_FILE = /\.(log|txt)$/i;
const newestFirst = (a, b) => b.mtime - a.mtime;

// il permesso sulla cartella dato dal browser (caso 2); negli altri casi resta null
let dirHandle = null;

// Mette in pagina un elenco di log appena letto e fa partire l'analisi di quelli nuovi.
function showLogs(logFiles, folderName) {
  set(folderName ? { logFiles, folderName, canReopen: true } : { logFiles });
  syncLibrary();
}

/** Rilegge l'elenco dei log della cartella scelta. */
export async function listLogs() {
  if (isDesktop) {
    const logFiles = await desktop.listLogs();
    const settings = await desktop.getSettings();
    showLogs(logFiles, settings.logDir ? settings.logDir.split(/[\\/]/).pop() : '');
    return;
  }
  const logFiles = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== 'file' || !LOG_FILE.test(name)) continue;
    const file = await handle.getFile();
    logFiles.push({ name, handle, mtime: file.lastModified, size: file.size });
  }
  logFiles.sort(newestFirst);
  showLogs(logFiles, dirHandle.name);
}

/** Apre il log numero i dell'elenco. */
export async function openLog(i) {
  const logFile = get().logFiles[i];
  if (!logFile) return;
  if (logFile.path) {
    set({ progress: t('Leggo {name}…', { name: logFile.name }) });
    await loadText(await desktop.readLog(logFile.path), logFile.name, logFile);
  } else {
    await loadFile(logFile.file || (await logFile.handle.getFile()), logFile);
  }
}

/**
 * Caso 3: i file arrivano dalla finestra classica (<input type="file" webkitdirectory>).
 * Si tengono solo quelli direttamente nella cartella scelta, come fa listLogs; restano in memoria e niente viene ricordato.
 */
export function takeFolderFiles(files) {
  const list = [...files].filter((f) => LOG_FILE.test(f.name) && (f.webkitRelativePath || '').split('/').length <= 2);
  if (!list.length) {
    alert(t('Nessun file .log in questa cartella'));
    return;
  }
  dirHandle = null;
  const logFiles = list.map((f) => ({ name: f.name, file: f, mtime: f.lastModified, size: f.size }));
  logFiles.sort(newestFirst);
  showLogs(logFiles, (list[0].webkitRelativePath || '').split('/')[0]);
  set({ hasFolder: false, canReopen: false });
}

/** L'utente vuole scegliere (o cambiare) la cartella dei log. */
export async function pickFolder() {
  if (isDesktop) {
    const dir = await desktop.pickDir(t('Scegli la cartella dei combat log di OPTCGSim'));
    if (dir) await listLogs();
    return;
  }
  if (!window.showDirectoryPicker) {
    document.getElementById('dirfiles').click();
    return;
  }
  try {
    dirHandle = await window.showDirectoryPicker({ id: 'optcg-logs', mode: 'read' });
  } catch (e) {
    return; // finestra chiusa senza scegliere
  }
  set({ hasFolder: true });
  await kvSet('dir', dirHandle);
  await listLogs();
}

/** Pulsante "↻ Riapri": richiede al browser il permesso sulla cartella ricordata. */
export async function reopenFolder() {
  if (isDesktop) return listLogs();
  const handle = await kvGet('dir');
  if (!handle) return pickFolder();
  let permission = await handle.queryPermission({ mode: 'read' });
  if (permission !== 'granted') permission = await handle.requestPermission({ mode: 'read' });
  if (permission !== 'granted') return pickFolder();
  dirHandle = handle;
  set({ hasFolder: true });
  await listLogs();
}

/** Da chiamare una volta all'avvio: riprende la cartella ricordata, se c'è. */
export function initFolder() {
  if (isDesktop) {
    // exe: cartella ricordata e aperta da sola; i log nuovi compaiono appena il sim li salva
    set({ hasFolder: true });
    desktop.getSettings().then(async (settings) => {
      if (!settings.logDir) return;
      await listLogs();
      const openLatest = new URLSearchParams(location.search).get('open') === 'latest';
      if (openLatest && get().logFiles.length) openLog(0);
    });
    desktop.onLogsChanged((logFiles) => showLogs(logFiles));
    return;
  }
  kvGet('dir').then(async (handle) => {
    if (!handle) return;
    set({ folderName: handle.name, canReopen: true });
    try {
      // se il browser ricorda ancora il permesso la cartella si apre da sola, altrimenti resta il pulsante "↻ Riapri"
      if ((await handle.queryPermission({ mode: 'read' })) === 'granted') {
        dirHandle = handle;
        set({ hasFolder: true });
        await listLogs();
      }
    } catch (e) {
      // cartella spostata o cancellata: si potrà sceglierne un'altra
    }
  });
}
