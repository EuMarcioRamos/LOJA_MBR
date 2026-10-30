import { useEffect, useRef } from 'react'
import { detalhesDoItem, linkWhatsApp, mensagemDoCarrinho } from '../mensagemWhatsApp'

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Carrinho em modal (<dialog> nativo com showModal): no celular sobe de baixo
// como uma folha, no computador entra pela direita como uma gaveta, e o resto
// do site fica escurecido atrás. O navegador cuida de prender o foco dentro
// dele e de fechar com Esc (e com o "voltar" do Android); aqui fica fechar no
// X, tocando no fundo e devolver o foco pro botão que abriu.
export default function CarrinhoFlutuante({ aberto, carrinho, onRemover, onLimpar, onFechar }) {
  const dialogoRef = useRef(null)
  const voltarPara = useRef(null)
  const toqueComecouNoFundo = useRef(false)

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (!dialogo) return
    if (aberto) {
      if (!dialogo.open) {
        voltarPara.current = document.activeElement
        dialogo.showModal()
      }
    } else {
      if (dialogo.open) dialogo.close()
      voltarPara.current?.focus?.({ preventScroll: true })
      voltarPara.current = null
    }
  }, [aberto])

  // O fundo escurecido é o próprio <dialog> (o conteúdo ocupa a caixa toda).
  // Só fecha se o toque começou e terminou no fundo: arrastar uma seleção de
  // texto de dentro pra fora não fecha
  const aoPressionar = (e) => { toqueComecouNoFundo.current = e.target === e.currentTarget }
  const aoClicar = (e) => {
    if (toqueComecouNoFundo.current && e.target === e.currentTarget) onFechar()
  }

  // O botão removido levava o foco junto (ele ia pro <body>): quem remove pelo
  // teclado segue no "remover" do item seguinte, ou no X se a lista acabou
  const remover = (id, indice) => {
    const tinhaFoco = document.activeElement?.classList.contains('carrinho-item-remover')
    onRemover(id)
    if (!tinhaFoco) return
    requestAnimationFrame(() => {
      const dialogo = dialogoRef.current
      const botoes = dialogo?.querySelectorAll('.carrinho-item-remover') ?? []
      ;(botoes[Math.min(indice, botoes.length - 1)] ?? dialogo?.querySelector('.carrinho-fechar'))?.focus()
    })
  }

  const vazio = carrinho.length === 0
  // Item que esgotou ou foi vendido depois de entrar continua na lista, pra
  // pessoa ver o que aconteceu, mas fica fora da mensagem
  const disponiveis = carrinho.filter(item => !item.indisponivel)
  const whatsappUrl = linkWhatsApp(mensagemDoCarrinho(disponiveis))

  return (
    <dialog
      ref={dialogoRef}
      className="carrinho-modal"
      aria-labelledby="carrinho-titulo"
      onClose={onFechar}
      onPointerDown={aoPressionar}
      onClick={aoClicar}
    >
      <div className="carrinho-modal-cabecalho">
        <div>
          <h2 id="carrinho-titulo" className="carrinho-modal-titulo">Seus produtos selecionados</h2>
          {!vazio && (
            <p className="carrinho-modal-contagem">
              {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
            </p>
          )}
        </div>
        <button className="carrinho-fechar" onClick={onFechar} aria-label="Fechar carrinho">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {vazio ? (
        <p className="carrinho-vazio">
          Sua seleção está vazia. Toque no ícone de carrinho em um produto para adicionar.
        </p>
      ) : (
        <>
          <ul className="carrinho-lista">
            {carrinho.map((item, indice) => {
              const nome = `${item.nome}${item.seminovo ? ' seminovo' : ''}`
              return (
                <li className={`carrinho-item${item.indisponivel ? ' carrinho-item--indisponivel' : ''}`} key={item.id}>
                  {item.imagem && <img src={item.imagem} alt="" className="carrinho-item-img" loading="lazy" />}
                  <div className="carrinho-item-info">
                    <p className="carrinho-item-nome">{item.nome}</p>
                    <p className="carrinho-item-detalhe">{detalhesDoItem(item).join(' · ')}</p>
                    {/* O selo vai na linha do preço, que sempre tem espaço: ao
                        lado do nome ele cortava o fim do modelo ("17 Pro ...").
                        Indisponível fica sem selo, só com o aviso */}
                    <div className="carrinho-item-linha-preco">
                      <p className="carrinho-item-preco">
                        {item.indisponivel ? 'Indisponível no momento' : formatarPreco(item.preco)}
                      </p>
                      {item.seminovo && !item.indisponivel && <span className="carrinho-item-selo">Seminovo</span>}
                    </div>
                  </div>
                  <button
                    className="carrinho-item-remover"
                    onClick={() => remover(item.id, indice)}
                    aria-label={`Remover ${nome} da seleção`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="carrinho-modal-rodape">
            <button className="carrinho-limpar" onClick={onLimpar}>Limpar seleção</button>
            {disponiveis.length > 0 ? (
              <a className="carrinho-enviar" href={whatsappUrl} target="_blank" rel="noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Enviar interesse via WhatsApp
              </a>
            ) : (
              <p className="carrinho-aviso">Nenhum item da seleção está disponível agora.</p>
            )}
          </div>
        </>
      )}
    </dialog>
  )
}
