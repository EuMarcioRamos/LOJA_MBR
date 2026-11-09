// Aviso em âmbar (o mesmo tom do selo "Reservado" e do "Indisponível no
// momento") de que preços e disponibilidade podem mudar: no começo da lista de
// produtos, onde a pessoa vê os valores, e no carrinho, antes de enviar o
// pedido pelo WhatsApp. Com tom="verde", é o aviso do a pedido (prazo e
// sinal), que aparece quando a chave "Pedido" da barra é ligada
export default function AvisoValores({ children, compacto = false, tom }) {
  const verde = tom === 'verde'
  return (
    <p className={`aviso-valores${compacto ? ' aviso-valores--compacto' : ''}${verde ? ' aviso-valores--verde' : ''}`} role="note">
      {verde ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 7h11v9H2z" />
          <path d="M13 10h4.5l3.5 3.5V16h-8" />
          <circle cx="6" cy="17.5" r="1.8" />
          <circle cx="17" cy="17.5" r="1.8" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5M12 16.5h.01" />
        </svg>
      )}
      <span>{children}</span>
    </p>
  )
}
