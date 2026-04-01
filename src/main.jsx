import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import VConsole from 'vconsole';
import App from './App.jsx';
import './index.css';

if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.setHeaderColor('#020611');
  window.Telegram.WebApp.setBackgroundColor('#020611');
  new VConsole();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
