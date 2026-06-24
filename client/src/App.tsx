import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { UIProvider } from '@/contexts/UIContext'
import AppRouter from '@/routes/AppRouter'

const App = () => (
  <AuthProvider>
    <UIProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </UIProvider>
  </AuthProvider>
)

export default App
