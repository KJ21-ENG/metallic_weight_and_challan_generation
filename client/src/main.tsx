import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppTheme } from './theme'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppTheme>
      <HashRouter>
        <App />
      </HashRouter>
    </AppTheme>
  </React.StrictMode>
)
