import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StudentPortalApp from './StudentPortalApp.tsx';
import './index.css';

createRoot(document.getElementById('pelajar-root')!).render(
  <StrictMode>
    <StudentPortalApp />
  </StrictMode>,
);
