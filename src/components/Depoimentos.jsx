const DEPOIMENTOS = [
  { nome: 'Henzoo', texto: 'Muito obrigado pelo produto e atendimento!' },
  { nome: 'Cristiano Saulo', texto: 'Vocês são os melhores no que fazem! Continuem com essa energia e atendimento top.' },
  { nome: 'Joecy Guedes', texto: 'Obrigada pelo excelente atendimento!' },
  { nome: 'Chalana Farias', texto: 'Obrigada pelo excelente atendimento!' },
  { nome: 'Eduarda Morais', texto: 'Amei o atendimento! Vou indicar pro pessoal a loja.' },
  { nome: 'Mylena Medeiros', texto: 'Amei o atendimento e o produto. Já virei cliente fiel!' },
]

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(palavra => palavra[0].toUpperCase())
    .join('')
}

export default function Depoimentos() {
  return (
    <div className="depoimentos">
      <div className="depoimentos-cabecalho">
        <h3 className="depoimentos-titulo">O que nossos clientes dizem</h3>
        <p className="depoimentos-subtitulo">Depoimentos reais de clientes MasterBR</p>
        <div className="depoimentos-underline" />
      </div>

      <div className="depoimentos-grid">
        {DEPOIMENTOS.map(dep => (
          <div className="depoimento-card" key={dep.nome}>
            <span className="depoimento-aspas" aria-hidden="true">&ldquo;</span>
            <div className="depoimento-estrelas" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => <span key={i}>★</span>)}
            </div>
            <p className="depoimento-texto">{dep.texto}</p>
            <div className="depoimento-rodape">
              <div className="depoimento-avatar">{iniciais(dep.nome)}</div>
              <div>
                <p className="depoimento-nome">{dep.nome}</p>
                <p className="depoimento-cargo">Cliente MasterBR</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
