// La finestra "Condivisione dei replay": indirizzo del server e token personale, verificati prima di essere salvati.
import { useEffect, useRef, useState } from 'react';
import { useStore, get } from '../store.js';
import { shareBase, saveShareSettings, closeShareSettings } from '../game/share.js';
import { useT } from '../i18n/useT.js';

export function ShareDialog() {
  const t = useT();
  const open = useStore((s) => s.shareDlgOpen);
  const ref = useRef(null);
  const [base, setBase] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  // a ogni apertura i campi ripartono dai valori salvati
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      setBase(shareBase());
      setToken(get().shareCfg.token);
      setStatus('');
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  async function save() {
    setStatus(t('Verifico…'));
    const error = await saveShareSettings(base, token);
    if (error) setStatus(error);
  }

  return (
    <dialog id="share-dlg" ref={ref} onClose={closeShareSettings}>
      <h3>{t('Condivisione dei replay')}</h3>
      <p className="kbd">
        {t(
          'Per creare i link serve un token personale: te lo dà chi gestisce il server. Resta salvato solo su questo computer.',
        )}
      </p>
      <label htmlFor="share-base">{t('Indirizzo del server')}</label>
      <input
        type="text"
        id="share-base"
        placeholder="https://…"
        spellCheck="false"
        value={base}
        onChange={(e) => setBase(e.target.value)}
      />
      <label htmlFor="share-token">Token</label>
      <input
        type="password"
        id="share-token"
        autoComplete="off"
        spellCheck="false"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <p id="share-status">{status}</p>
      <p style={{ textAlign: 'right', margin: '10px 0 0' }}>
        <button id="share-cancel" onClick={closeShareSettings}>
          {t('Annulla')}
        </button>{' '}
        <button id="share-save" className="primary" onClick={save}>
          {t('Verifica e salva')}
        </button>
      </p>
    </dialog>
  );
}
