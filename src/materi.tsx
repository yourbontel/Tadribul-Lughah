import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ModuleReaderApp from './ModuleReaderApp.tsx';
import './index.css';

createRoot(document.getElementById('materi-root')!).render(
  <StrictMode>
    <ModuleReaderApp />
  </StrictMode>,
);
