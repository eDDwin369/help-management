/**
 * Entry point.
 *
 * - Initialize Sentry FIRST so its global handlers catch errors
 *   thrown during the initial React render.
 * - Then mount the app.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from './config/sentry';
import { App } from './app/App';
import './main.css';

initSentry();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
