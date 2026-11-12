import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfirmProvider, ThemeProvider } from '@awb/ui'
import App from './App'
import SessionEvents from '@/components/SessionEvents'
import { queryClient } from '@/lib/queryClient'
import '@/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfirmProvider>
          <SessionEvents />
          <App />
        </ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
