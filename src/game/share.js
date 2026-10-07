// Condivisione: carica il log sul server (senza chat né nick avversario) e ne ricava un link pubblico.
//
// Per caricare serve un token personale, che l'utente incolla una volta in "Server e token"
// e che resta salvato solo sul suo computer (chiave "optcg.share").
import { get, set } from '../store.js';
import * as Core from '../core/index.js';
import { desktop, isDesktop } from '../lib/platform.js';
import { toast, copyText } from '../lib/toast.js';
import { readText, shareOf, setShare, keyOf } from './library.js';
import { openNotes } from './notes.js';
import { setNotesVisible } from './view.js';
import { t } from '../i18n/index.js';

// indirizzo predefinito del server dei replay
const SHARE_SERVER = 'https://178-104-213-148.sslip.io';
const KEY = 'optcg.share';

const trimSlashes = (url) => url.replace(/\/+$/, '');

/** L'indirizzo del server in uso: quello scelto dall'utente, altrimenti il predefinito. */
export const shareBase = () => trimSlashes(get().shareCfg.base || SHARE_SERVER);

/** true se c'è tutto quello che serve per creare un link. */
export const shareReady = () => !!(get().shareCfg.token && shareBase());

/** L'intestazione con il token, ma solo per il server per cui è stato configurato: non va mai a un altro indirizzo. */
export function shareHeaders(serverBase) {
  const { token } = get().shareCfg;
  return token && serverBase === shareBase() ? { Authorization: 'Bearer ' + token } : {};
}

/** Da chiamare una volta all'avvio: legge server e token salvati. */
export function initShare() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    set({ shareCfg: { ...get().shareCfg, ...saved } });
  } catch (e) {
    // archivio del browser non disponibile
  }
  // exe: se qui non è stato salvato nulla vale la voce "share" del file delle impostazioni dell'app (settings.json),
  // così il token si può preconfigurare senza doverlo incollare
  if (isDesktop && !get().shareCfg.token) {
    desktop.getSettings().then((settings) => {
      if (settings && settings.share && !get().shareCfg.token) {
        set({ shareCfg: { ...get().shareCfg, ...settings.share } });
      }
    });
  }
}

export const openShareSettings = () => set({ shareDlgOpen: true });
export const closeShareSettings = () => set({ shareDlgOpen: false });

/**
 * Controlla server e token chiedendo al server "chi sono?", e se va bene li salva.
 * @returns {Promise<string|null>} il messaggio d'errore da mostrare, oppure null se è andata bene
 */
export async function saveShareSettings(baseInput, tokenInput) {
  const base = trimSlashes(baseInput.trim());
  const token = tokenInput.trim();
  if (!/^https?:\/\//.test(base)) return t("L'indirizzo deve iniziare con http:// o https://");
  let response;
  try {
    response = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  } catch (e) {
    return t('Server non raggiungibile');
  }
  if (!response.ok) {
    return response.status === 401
      ? t('Token non valido')
      : t('Il server ha risposto con un errore ({status})', { status: response.status });
  }
  const who = await response.json().catch(() => ({}));
  const shareCfg = { base, token };
  set({ shareCfg, shareDlgOpen: false });
  try {
    localStorage.setItem(KEY, JSON.stringify(shareCfg));
  } catch (e) {
    // vale solo per questa visita
  }
  toast(t('Token valido: ciao {name}. Ora puoi generare i link.', { name: who.name || '' }));
  return null;
}

// Carica un log sul server. Restituisce { id, url, base } oppure null (e spiega perché con un avviso).
async function createLink(text) {
  if (!shareReady()) {
    openShareSettings();
    return null;
  }
  const base = shareBase();
  let response;
  try {
    response = await fetch(base + '/api/replays', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + get().shareCfg.token, 'Content-Type': 'text/plain; charset=utf-8' },
      body: Core.redact(text),
    });
  } catch (e) {
    toast(t('Server non raggiungibile: {base}', { base }));
    return null;
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    toast(t('Il token non è più valido'));
    openShareSettings();
    return null;
  }
  if (!response.ok) {
    toast(
      body.error ? t(body.error) : t('Il server ha risposto con un errore ({status})', { status: response.status }),
    );
    return null;
  }
  return { id: body.id, url: body.url, base };
}

async function copyLink(share, justCreated) {
  const copied = await copyText(share.url);
  const vars = { url: share.url };
  if (justCreated)
    toast(copied ? t('Link creato e copiato negli appunti: {url}', vars) : t('Link creato: {url}', vars));
  else toast(copied ? t('Link copiato negli appunti: {url}', vars) : t('Link: {url}', vars));
}

/** Pulsante "Genera link" della partita aperta: crea il link se manca, lo copia e apre le note. */
export async function shareCurrent() {
  const { snaps, share, logRef, text } = get();
  if (!snaps.length) return;
  if (share) return copyLink(share);
  const created = await createLink(text);
  if (!created) return;
  if (logRef) setShare(logRef, created);
  // nel frattempo l'utente potrebbe aver aperto un'altra partita
  if (text === get().text) {
    set({ share: created });
    openNotes(created, [], true);
    setNotesVisible(true);
  }
  copyLink(created, true);
}

/** Pulsante "Genera link" su una riga della raccolta. */
export async function shareLog(logFile) {
  const existing = shareOf(logFile);
  if (existing) return copyLink(existing);
  let text;
  try {
    text = await readText(logFile);
  } catch (e) {
    toast(t('Non riesco a leggere {name}', { name: logFile.name }));
    return;
  }
  const created = await createLink(text);
  if (!created) return;
  setShare(logFile, created);
  const { logRef } = get();
  if (logRef && keyOf(logRef) === keyOf(logFile)) {
    set({ share: created });
    openNotes(created, [], true);
  }
  copyLink(created, true);
}
