const DEPOIMENTOS = [
  {
    imagem: '/prova-social/cliente-1.jpg',
    alt: 'Lucas Ribeiro, CEO da MasterBR',
    destaque: true,
    texto:
      'Sou CEO da MasterBR. Entrei no mercado de celulares ainda jovem e logo me apaixonei pelo setor — hoje transformo essa paixão em propósito, aproximando a cidade de Patos da tecnologia Apple com produtos originais e um atendimento que faz a diferença na vida de cada cliente.',
    nome: 'Lucas Ribeiro',
    cargo: 'CEO da MasterBR',
  },
  {
    imagem: '/prova-social/cliente-2.jpg',
    alt: 'Cliente na loja',
    texto: 'Cada produto passa por conferência antes da entrega, garantindo autenticidade e procedência Apple em todas as compras.',
  },
  {
    imagem: '/prova-social/cliente-3.jpg',
    alt: 'Cliente na loja',
    texto: 'Um espaço pensado para você testar, escolher e sair satisfeito, com o suporte de quem entende do assunto.',
  },
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
        {DEPOIMENTOS.map((item, i) => (
          <div
            className={`prova-social-row${i % 2 === 1 ? ' prova-social-row--inverso' : ''}`}
            key={item.imagem}
          >
            <div className="prova-social-foto">
              <img src={item.imagem} alt={item.alt} loading="lazy" />
            </div>
            <div className="prova-social-conteudo">
              {item.destaque ? (
                <div className="prova-social-ceo">
                  <p className="prova-social-ceo-texto">&ldquo;{item.texto}&rdquo;</p>
                  <p className="prova-social-ceo-assinatura">
                    <span className="prova-social-ceo-nome">{item.nome}</span>
                    <span className="prova-social-ceo-cargo">{item.cargo}</span>
                  </p>
                </div>
              ) : (
                <p className="prova-social-texto">{item.texto}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
