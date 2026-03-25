import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index'
import './styles/globals.css'
import App from './App'
import { seedDatabase } from './db/seeds'

// Seed dev data on first run
if (import.meta.env.DEV) {
  seedDatabase().catch(console.error)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
