import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// He borrado la línea de index.css para que no dé error
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
