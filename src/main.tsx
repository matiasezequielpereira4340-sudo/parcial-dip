import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { ProgresoProvider } from './lib/progreso'

// En visores embebidos sin service worker, la app funciona igual (sin modo offline)
try { if ('serviceWorker' in navigator) registerSW({ immediate: true, onRegisterError: () => {} }) } catch { /* sin SW */ }
createRoot(document.getElementById('root')!).render(
  <StrictMode><ProgresoProvider><App /></ProgresoProvider></StrictMode>
)
