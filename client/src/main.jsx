import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

// Tras un despliegue nuevo, los archivos JS antiguos dejan de existir. Si alguien tenía
// la web abierta y navega a una página que aún no había descargado, fallaría:
// recargamos una vez para traer la versión nueva.
window.addEventListener('vite:preloadError', (event) => {
  const last = Number(sessionStorage.getItem('butaca_reloaded') || 0);
  if (Date.now() - last > 10000) {
    event.preventDefault();
    sessionStorage.setItem('butaca_reloaded', String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
