// main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css';
import App from './App.jsx'; // Componente principal 1
// import App2 from './App2.jsx'; // Componente principal 2

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <App2 /> */}
  </StrictMode>
);
