import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { HelmetProvider } from 'react-helmet-async';
import AuthProviders from './store/Providers.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { injectStoreToFetch } from './utils/fetchJWT.ts'
import { store } from './store/store.ts'

injectStoreToFetch(store);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProviders>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProviders>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode >,
)
