import { createRoot } from 'react-dom/client'
import './index.css'
import QuoteCollection from './QuoteCollection'
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <QuoteCollection />
  </AuthProvider>,
)
