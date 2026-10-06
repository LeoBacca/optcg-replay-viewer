// Tastiera del telefono: copre il fondo della pagina senza ridimensionarla.
// Qui si misura di quanto (variabili CSS --kb e --vvh, classe "kb" sulla pagina), così il pannello delle note le sta sopra.
import { useEffect } from 'react';

export function usePhoneKeyboard() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const measure = () => {
      // con lo zoom a due dita la misura non vale
      const keyboard =
        viewport.scale > 1.01 ? 0 : Math.max(0, root.clientHeight - viewport.height - viewport.offsetTop);
      root.style.setProperty('--kb', keyboard + 'px');
      root.style.setProperty('--vvh', viewport.height + 'px');
      root.classList.toggle('kb', keyboard > 80);
    };
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
    };
  }, []);
}
