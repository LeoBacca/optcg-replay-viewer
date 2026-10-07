// t() per i componenti React: chi la prende da qui si ridisegna da solo quando si cambia lingua.
import { useStore } from '../store.js';
import { t } from './index.js';

export function useT() {
  useStore((s) => s.settings.lang);
  return t;
}
