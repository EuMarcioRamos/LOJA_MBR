const WHATSAPP_NUMERO = '5583991281912'

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function montarMensagem(itens) {
  const linhas = itens.map((item, i) => {
    const tamanho = item.tamanho ? `${item.tamanho} ` : ''
    return `${i + 1}. ${item.nome} ${tamanho}${item.armazenamento} - ${item.cor} (${formatarPreco(item.preco)})`
  })
  return encodeURIComponent(
    `Olá! Tenho interesse nesses produtos:\n${linhas.join('\n')}\n\nAinda estão disponíveis?`
  )
}

export default function CarrinhoFlutuante({ aberto, carrinho, onRemover, onLimpar, onFechar }) {
  if (!aberto) return null

  const vazio = carrinho.length === 0
  const total = carrinho.reduce((soma, item) => soma + item.preco, 0)
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${montarMensagem(carrinho)}`

  return (
    <div className="carrinho-painel">
      <div className="carrinho-painel-cabecalho">
        <p className="carrinho-painel-titulo">Seus produtos selecionados</p>
        <button className="carrinho-fechar" onClick={onFechar} aria-label="Fechar">×</button>
      </div>

      {vazio ? (
        <p className="carrinho-vazio">
          Sua seleção está vazia. Toque no ícone de carrinho em um produto para adicionar.
        </p>
      ) : (
        <>
          <div className="carrinho-lista">
            {carrinho.map(item => (
              <div className="carrinho-item" key={item.id}>
                {item.imagem && <img src={item.imagem} alt={item.nome} className="carrinho-item-img" />}
                <div className="carrinho-item-info">
                  <p className="carrinho-item-nome">{item.nome}</p>
                  <p className="carrinho-item-detalhe">
                    {item.tamanho ? `${item.tamanho} · ` : ''}{item.armazenamento} · {item.cor}
                  </p>
                  <p className="carrinho-item-preco">{formatarPreco(item.preco)}</p>
                </div>
                <button
                  className="carrinho-item-remover"
                  onClick={() => onRemover(item.id)}
                  aria-label={`Remover ${item.nome}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="carrinho-painel-rodape">
            <div className="carrinho-total">
              <span>Total</span>
              <strong>{formatarPreco(total)}</strong>
            </div>
            <button className="carrinho-limpar" onClick={onLimpar}>Limpar seleção</button>
            <a className="carrinho-enviar" href={whatsappUrl} target="_blank" rel="noreferrer">
              Enviar interesse via WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  )
}
