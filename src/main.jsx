import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// Manifest dosyasının yolu. 
// Vercel'e atınca kendi domainin ile güncellersen iyi olur ama şu an da çalışır.
const manifestUrl = "/tonconnect-manifest.json";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
)
