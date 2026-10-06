// Avvisi brevi in basso e copia negli appunti.
import { get, set } from '../store.js';

/** Mostra un avviso per qualche secondo (lo disegna components/Toast.jsx). */
export function toast(msg) {
  set({ toast: { msg, n: get().toast.n + 1 } });
}

/**
 * Copia un testo negli appunti.
 * @returns {Promise<boolean>} true se la copia è riuscita
 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // senza permesso (pagina non in primo piano, browser vecchi) si prova il metodo di una volta
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;opacity:0';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  area.remove();
  return ok;
}
