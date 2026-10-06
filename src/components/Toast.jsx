// L'avviso breve in basso (lo fa comparire toast() in lib/toast.js): resta qualche secondo e sparisce da solo.
import { useEffect, useState } from 'react';
import { useStore } from '../store.js';

const VISIBLE_MS = 4500;

export function Toast() {
  const toast = useStore((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast.n) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast.n]);

  return (
    <div id="toast" role="status" className={visible ? 'show' : ''}>
      {toast.msg}
    </div>
  );
}
