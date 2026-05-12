// Bootstraps React rendering with required runtime providers.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

/** Mounts the SPA into `rootElement` (defaults to `#root`). Used by `index.js` and unit tests. */
export function mountApp(rootElement = document.getElementById('root')) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
  return root;
}
