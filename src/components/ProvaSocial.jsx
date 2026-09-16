import Depoimentos from './Depoimentos'

const CEO = {
  imagem: '/prova-social/cliente-1.jpg',
  alt: 'Lucas Ribeiro, CEO da MasterBR',
  texto:
    'Sou CEO da MasterBR. Entrei no mercado de celulares ainda jovem e logo me apaixonei pelo setor — hoje transformo essa paixão em propósito, aproximando a cidade de Patos da tecnologia Apple com produtos originais e um atendimento que faz a diferença na vida de cada cliente.',
  nome: 'Lucas Ribeiro',
  cargo: 'CEO da MasterBR',
}

const CLIENTES_MASTER = [
  '/clientes-master/cliente-master-1.webp',
  '/clientes-master/cliente-master-2.webp',
  '/clientes-master/cliente-master-3.webp',
  '/clientes-master/cliente-master-4.webp',
  '/clientes-master/cliente-master-5.webp',
  '/clientes-master/cliente-master-6.webp',
  '/clientes-master/cliente-master-7.webp',
]

export default function ProvaSocial() {
  return (
    <section className="prova-social">
      <div className="prova-social-cabecalho">
        <h2 className="prova-social-titulo">Sobre a MasterBR</h2>
        <p className="prova-social-subtitulo">
          Quem comanda a MasterBR e os clientes que já vivem essa experiência em Patos, Paraíba.
        </p>
      </div>

      <div className="prova-social-linhas">
        <div className="prova-social-row">
          <div className="prova-social-foto">
            <img src={CEO.imagem} alt={CEO.alt} loading="lazy" />
          </div>
          <div className="prova-social-conteudo">
            <div className="prova-social-ceo">
              <p className="prova-social-ceo-texto">&ldquo;{CEO.texto}&rdquo;</p>
              <p className="prova-social-ceo-assinatura">
                <span className="prova-social-ceo-nome">{CEO.nome}</span>
                <span className="prova-social-ceo-cargo">{CEO.cargo}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Depoimentos />

      <div className="clientes-master">
        <h3 className="clientes-master-titulo">Clientes Master</h3>
        <p className="clientes-master-subtitulo">
          Gente incrível que confia na MasterBR e vive a melhor experiência Apple em Patos.
        </p>
        <div className="clientes-master-marquee">
          <div className="clientes-master-trilho">
            {[...CLIENTES_MASTER, ...CLIENTES_MASTER].map((src, i) => (
              <div className="clientes-master-item" key={i}>
                <img src={src} alt="Cliente MasterBR com produto Apple" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
