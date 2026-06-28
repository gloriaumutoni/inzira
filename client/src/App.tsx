import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { UIProvider } from '@/contexts/UIContext'
import AppRouter from '@/routes/AppRouter'

const App = () => (
  <>
    <Toaster
      position="top-right"
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
  </>
)

export default App
