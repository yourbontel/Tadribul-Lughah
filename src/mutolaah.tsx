import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutholaahApp } from './MutholaahApp';
import './index.css';

createRoot(document.getElementById('mutolaah-root')!).render(
  <StrictMode>
    <MutholaahApp />
  </StrictMode>
);
