// Punto di partenza della pagina: carica gli stili e disegna <App> dentro #root (vedi index.html).
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
