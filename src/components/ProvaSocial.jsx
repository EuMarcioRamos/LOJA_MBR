import { revelar } from '../revelar'

const CEO = {
  imagem: '/prova-social/cliente-1.jpg',
  alt: 'Lucas Ribeiro, CEO da MasterBR',
  texto:
    'Sou CEO da MasterBR. Entrei no mercado de celulares ainda jovem e logo me apaixonei pelo setor — hoje transformo essa paixão em propósito, aproximando a cidade de Patos da tecnologia Apple com produtos originais e um atendimento que faz a diferença na vida de cada cliente.',
  nome: 'Lucas Ribeiro',
  cargo: 'CEO da MasterBR',
}

export default function ProvaSocial() {
  return (
    <section className="prova-social">
      <div className="prova-social-sobre">
        <h2 className="prova-social-titulo revelar" ref={revelar}>Sobre a MasterBR</h2>

        <div className="prova-social-foto revelar" ref={revelar}>
          <img src={CEO.imagem} alt={CEO.alt} loading="lazy" />
        </div>

        <figure className="prova-social-citacao revelar" ref={revelar}>
          <blockquote>
            <p>&ldquo;{CEO.texto}&rdquo;</p>
          </blockquote>
          <figcaption>
            <span className="prova-social-nome">{CEO.nome}</span>
            <span className="prova-social-cargo">{CEO.cargo}</span>
          </figcaption>
        </figure>
      </div>

      {/* Depoimentos e o carrossel "Clientes Master" estão fora da página por
          enquanto. Pra voltar, é só importar e colocar aqui <Depoimentos /> e
          <ClientesMaster /> (componentes de mesmo nome nesta pasta). */}
    </section>
  )
}
