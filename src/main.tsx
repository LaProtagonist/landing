import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyUIThemeToRoot, getReleaseUITheme, getStoredUITheme } from './lib/uiTheme'

applyUIThemeToRoot(import.meta.env.DEV ? getStoredUITheme() : getReleaseUITheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
