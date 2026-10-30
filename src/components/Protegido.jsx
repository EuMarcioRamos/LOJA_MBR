import { Component } from 'react'
import { WHATSAPP_NUMERO } from '../config'

// Se um pedaço da página quebra (por exemplo, um card com um dado inesperado
// da planilha), só esse pedaço some. Sem isso o React desmonta a página
// inteira e o site fica todo em branco
export default class Protegido extends Component {
  state = { quebrou: false }

  static getDerivedStateFromError() {
    return { quebrou: true }
  }

  render() {
    if (this.state.quebrou) return this.props.reserva ?? null
    return this.props.children
  }
}

// Último recurso, no lugar da página inteira: em vez da tela preta, um aviso
// com o caminho pro WhatsApp
export function AvisoDeFalha() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, padding: 24, textAlign: 'center',
    }}>
      <p style={{ fontSize: 20, fontWeight: 600 }}>Não foi possível carregar a página</p>
      <p style={{ fontSize: 14, color: '#8a8a8a', maxWidth: 360 }}>
        Recarregue para tentar de novo ou fale com a gente pelo WhatsApp.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button className="btn-ver-mais" style={{ margin: 0 }} onClick={() => window.location.reload()}>
          Recarregar
        </button>
        <a
          className="carrinho-enviar"
          href={`https://wa.me/${WHATSAPP_NUMERO}`}
          target="_blank"
          rel="noreferrer"
          style={{ padding: '13px 28px', borderRadius: 50 }}
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}
