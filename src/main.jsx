import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// --- MANIFEST URL DÜZELTMESİ ---
// window.location.origin -> Mevcut site adresini alır (localhost veya vercel.app)
const manifestUrl = window.location.origin + "/tonconnect-manifest.json";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* errorBoundary false yaparak ufak hatalarda beyaz ekranı engeller */}
    <TonConnectUIProvider manifestUrl={manifestUrl} errorBoundary={false}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
)
