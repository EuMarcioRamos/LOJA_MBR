// Aviso em âmbar (o mesmo tom do selo "Reservado" e do "Indisponível no
// momento") de que preços e disponibilidade podem mudar: no começo da lista de
// produtos, onde a pessoa vê os valores, e no carrinho, antes de enviar o
// pedido pelo WhatsApp
export default function AvisoValores({ children, compacto = false }) {
  return (
    <p className={`aviso-valores${compacto ? ' aviso-valores--compacto' : ''}`} role="note">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16.5h.01" />
      </svg>
      <span>{children}</span>
    </p>
  )
}
