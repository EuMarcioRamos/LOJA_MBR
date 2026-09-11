const WHATSAPP_NUMERO = '5583991281912'
const ENDERECO = 'R. Geraldo Cabral, 106B - São Sebastião, Patos - PB, 58706-300'

function linkWhatsapp(mensagem) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`
}

function linkMaps(endereco) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
}

const ItemAtendimento = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 18v-1a4 4 0 0 1 4-4h1" />
    <circle cx="8.5" cy="8" r="2.6" />
    <path d="M13 18v-1.2a3.3 3.3 0 0 1 3.3-3.3h.4a3.3 3.3 0 0 1 3.3 3.3V18" />
    <circle cx="16.7" cy="7.3" r="2.2" />
  </svg>
)

const ItemParcelamento = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.75" y="5.5" width="18.5" height="13" rx="2" />
    <line x1="2.75" y1="10" x2="21.25" y2="10" />
    <line x1="6" y1="14.5" x2="10.5" y2="14.5" />
  </svg>
)

const ItemLocalizacao = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21.5s7-6.42 7-12A7 7 0 0 0 5 9.5c0 5.58 7 12 7 12Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

const BENEFICIOS = [
  {
    icone: ItemAtendimento,
    titulo: 'Atendimento Especializado',
    texto: 'Da configuração aos reparos técnicos, conte com uma equipe especializada em produtos Apple.',
    mensagem: 'Olá! Quero saber mais sobre o atendimento especializado da MasterBR.',
  },
  {
    icone: ItemParcelamento,
    titulo: 'Parcelamento Facilitado',
    texto: 'Parcele sua compra no cartão com condições facilitadas. Simule sem compromisso pelo WhatsApp.',
    mensagem: 'Olá! Quero saber mais sobre as opções de parcelamento.',
  },
  {
    icone: ItemLocalizacao,
    titulo: 'Localização',
    texto: `Loja localizada em Patos, Paraíba. Endereço: ${ENDERECO}.`,
    link: linkMaps(ENDERECO),
    textoLink: 'Ver no mapa',
  },
]

export default function FaixaBeneficios() {
  return (
    <section className="faixa-beneficios">
      <div className="faixa-beneficios-grid">
        {BENEFICIOS.map((item) => (
          <div className="beneficio-item" key={item.titulo}>
            <div className="beneficio-icone">{item.icone}</div>
            <h3 className="beneficio-titulo">{item.titulo}</h3>
            <p className="beneficio-texto">{item.texto}</p>
            <a
              className="beneficio-link"
              href={item.link ?? linkWhatsapp(item.mensagem)}
              target="_blank"
              rel="noreferrer"
            >
              {item.textoLink ?? 'Saiba mais'} <span aria-hidden="true">→</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
