import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SuperAdminApp from './SuperAdminApp.tsx';
import './index.css';

createRoot(document.getElementById('superadmin-root')!).render(
  <StrictMode>
    <SuperAdminApp />
  </StrictMode>
);
