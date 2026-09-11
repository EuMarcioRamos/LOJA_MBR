const DEPOIMENTOS = [
  {
    imagem: '/prova-social/cliente-1.jpg',
    texto: 'Cliente retirando o iPhone novinho direto na loja física, em Patos - PB.',
  },
  {
    imagem: '/prova-social/cliente-2.jpg',
    texto: 'Atendimento pessoal no balcão da loja, com produtos originais Apple prontos para entrega.',
  },
  {
    imagem: '/prova-social/cliente-3.jpg',
    texto: 'Mais um cliente levando seu novo Mac pra casa, com a confiança de quem compra aqui.',
  },
]

export default function ProvaSocial() {
  return (
    <section className="prova-social">
      <div className="prova-social-cabecalho">
        <h2 className="prova-social-titulo">Momentos na loja</h2>
        <p className="prova-social-subtitulo">
          Clientes retirando seus produtos Apple direto na nossa loja em Patos, Paraíba.
        </p>
      </div>

      <div className="prova-social-linhas">
        {DEPOIMENTOS.map((item, i) => (
          <div
            className={`prova-social-row${i % 2 === 1 ? ' prova-social-row--inverso' : ''}`}
            key={item.imagem}
          >
            <div className="prova-social-foto">
              <img src={item.imagem} alt="Cliente na loja" loading="lazy" />
            </div>
            <div className="prova-social-conteudo">
              <p className="prova-social-texto">{item.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
