import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppWalletProvider } from './WalletProvider.jsx'

// Add polyfill for Buffer
import { Buffer } from 'buffer'
window.Buffer = Buffer

createRoot(document.getElementById('root')).render(
  <AppWalletProvider>
    <App />
  </AppWalletProvider>,
)