import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LoginApp from './LoginApp.tsx';
import './index.css';

createRoot(document.getElementById('login-root')!).render(
  <StrictMode>
    <LoginApp />
  </StrictMode>
);
