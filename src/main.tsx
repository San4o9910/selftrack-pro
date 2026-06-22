import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import {safeGetString} from './lib/storage';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  // Defensive: never assume the mount node exists.
  throw new Error('Root element #root not found');
}

const initialLang = safeGetString('appLanguage', 'ru');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary language={initialLang}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
