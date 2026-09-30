import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './design-system/ThemeProvider'
import { LanguageProvider } from './features/multilingual/LanguageContext'
import { AlertProvider } from './features/alerts/AlertContext'
import { PWAProvider } from './features/pwa/PWAProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultMode="system" storageKey="cyclone-ai-theme">
        <LanguageProvider defaultLanguage="en">
          <AlertProvider>
            <PWAProvider>
              <App />
            </PWAProvider>
          </AlertProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)