import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter }
from 'react-router-dom';
import App from './App'; // App.tsx は後で作成
import './index.css'; // あとでグローバルCSSをここに置くか検討

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
