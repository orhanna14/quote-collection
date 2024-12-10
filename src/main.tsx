import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import QuoteCollection from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuoteCollection />
  </StrictMode>,
)
