import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Protegido, { AvisoDeFalha } from './components/Protegido.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Protegido reserva={<AvisoDeFalha />}>
      <App />
    </Protegido>
  </StrictMode>,
)
