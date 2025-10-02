import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppWalletProvider } from './WalletProvider.jsx'

// Polyfills for Solana web3.js
import { Buffer } from 'buffer'
import process from 'process'

window.Buffer = Buffer
window.process = process
window.global = window

createRoot(document.getElementById('root')).render(
  <AppWalletProvider>
    <App />
  </AppWalletProvider>,
)