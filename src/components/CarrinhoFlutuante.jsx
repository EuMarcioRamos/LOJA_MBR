import { linkWhatsApp, mensagemDoCarrinho } from '../mensagemWhatsApp'

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CarrinhoFlutuante({ aberto, carrinho, onRemover, onLimpar, onFechar }) {
  if (!aberto) return null

  const vazio = carrinho.length === 0
  // Item que esgotou ou foi vendido depois de entrar continua na lista, pra
  // pessoa ver o que aconteceu, mas fica fora do total e da mensagem
  const disponiveis = carrinho.filter(item => !item.indisponivel)
  const total = disponiveis.reduce((soma, item) => soma + item.preco, 0)
  const whatsappUrl = linkWhatsApp(mensagemDoCarrinho(disponiveis))

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
              <div className={`carrinho-item${item.indisponivel ? ' carrinho-item--indisponivel' : ''}`} key={item.id}>
                {item.imagem && <img src={item.imagem} alt={item.nome} className="carrinho-item-img" />}
                <div className="carrinho-item-info">
                  <p className="carrinho-item-nome">{item.nome}{item.seminovo ? ' (seminovo)' : ''}</p>
                  <p className="carrinho-item-detalhe">
                    {item.tamanho ? `${item.tamanho} · ` : ''}{item.armazenamento} · {item.cor}
                  </p>
                  <p className="carrinho-item-preco">
                    {item.indisponivel ? 'Indisponível no momento' : formatarPreco(item.preco)}
                  </p>
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
            {disponiveis.length > 0 ? (
              <a className="carrinho-enviar" href={whatsappUrl} target="_blank" rel="noreferrer">
                Enviar interesse via WhatsApp
              </a>
            ) : (
              <p className="carrinho-aviso">Nenhum item da seleção está disponível agora.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
