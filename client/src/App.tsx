import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { UIProvider } from '@/contexts/UIContext'
import AppRouter from '@/routes/AppRouter'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#0F2B46',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }}
    />
    <AuthProvider>
      <UIProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </UIProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
