import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Due build dallo stesso codice:
//   npm run build          → dist/         il sito (servito dal server o da GitHub Pages)
//   npm run build:desktop  → desktop/app/  la pagina dentro l'exe, che in più contiene il Memory Trainer
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // percorsi relativi: l'exe apre la pagina da file, non da un indirizzo web
  base: './',
  define: {
    __DESKTOP__: JSON.stringify(mode === 'desktop'),
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
}));
