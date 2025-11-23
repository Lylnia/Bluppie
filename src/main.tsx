import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // App.jsx veya App.tsx import edilir
import './index.css'

// TypeScript'te 'root' elementinin null olmayacağını garanti etmek için ünlem (!) işareti kullanılır.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
