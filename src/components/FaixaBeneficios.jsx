import { WHATSAPP_NUMERO } from '../config'
import { revelar } from '../revelar'

function linkWhatsapp(mensagem) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`
}

const BENEFICIOS = [
  {
    emoji: '🛠️',
    titulo: 'Atendimento Especializado',
    texto: 'Da configuração aos reparos técnicos, conte com uma equipe especializada em produtos Apple.',
    mensagem: 'Olá! Quero saber mais sobre o atendimento especializado da MasterBR.',
  },
  {
    emoji: '📲',
    titulo: 'Recebemos seu iPhone',
    texto: 'Na compra de um aparelho, recebemos o seu iPhone atual como entrada e o valor dele é abatido do preço.',
    mensagem: 'Olá! Quero comprar um aparelho e dar o meu iPhone como entrada.',
  },
  {
    emoji: '🎁',
    titulo: 'Brindes',
    texto: 'Ao comprar um aparelho, ele acompanha capinha, película, carregador e fonte, tudo de brinde.',
    mensagem: 'Olá! Quero saber mais sobre os brindes na compra de um aparelho.',
  },
]

export default function FaixaBeneficios() {
  return (
    <section className="faixa-beneficios">
      <div className="faixa-beneficios-grid">
        {BENEFICIOS.map((item) => (
          <div className="beneficio-item revelar" ref={revelar} key={item.titulo}>
            <div className="beneficio-icone" aria-hidden="true">{item.emoji}</div>
            <h3 className="beneficio-titulo">{item.titulo}</h3>
            <p className="beneficio-texto">{item.texto}</p>
            <a
              className="beneficio-link"
              href={linkWhatsapp(item.mensagem)}
              target="_blank"
              rel="noreferrer"
            >
              Saiba mais <span aria-hidden="true">→</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
