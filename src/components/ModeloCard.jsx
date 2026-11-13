import { useState, useRef } from 'react'
import useTrocaDeFoto from '../useTrocaDeFoto'
import { corDaLuz } from '../corDaLuz'
import { linkWhatsApp, mensagemDoCard } from '../mensagemWhatsApp'

export default function ModeloCard({ modelo, variantes, precosProntos = true, planilhaFalhou = false, carrinhoIds = [], onAlternarCarrinho, entrega = null }) {
  // Chips do mais novo pro mais antigo (MacBook Air: M5, M4... M1), e o card
  // abre no mais novo. Na mesma geração fica a ordem do catálogo (MacBook Pro:
  // M5, M5 Pro, M5 Max)
  const geracao = (chip) => Number((chip.match(/\d+/) || [0])[0])
  const chips = [...new Set(variantes.map(v => v.chip).filter(Boolean))].sort((a, b) => geracao(b) - geracao(a))
  const temChips = chips.length > 1

  const [chipSel, setChipSel] = useState(chips[0] || null)

  const varsPorChip = temChips
    ? variantes.filter(v => v.chip === chipSel)
    : variantes

  const tamanhos = [...new Set(varsPorChip.map(v => v.tamanho).filter(Boolean))]
  const temTamanhos = tamanhos.length > 1

  const [tamanhoSel, setTamanhoSel] = useState(tamanhos[0] || null)
  // A pedido (chave "Pedido" ligada): o card começa na primeira cor e na
  // primeira opção que dá pra encomendar. Na pronta entrega, como sempre
  const noModoPedido = entrega === 'pedido'
  const encomendavel = (op) => !!op.pedido?.disponivel
  const opcaoInicial = (v) => (noModoPedido && v ? Math.max(0, v.opcoes.findIndex(encomendavel)) : 0)
  const varsIniciais = tamanhos.length > 1 ? varsPorChip.filter(v => v.tamanho === tamanhos[0]) : varsPorChip
  const [indice, setIndice] = useState(() => (noModoPedido ? Math.max(0, varsIniciais.findIndex(v => v.opcoes.some(encomendavel))) : 0))
  const [opcaoIdx, setOpcaoIdx] = useState(() => opcaoInicial(varsIniciais[Math.max(0, varsIniciais.findIndex(v => v.opcoes.some(encomendavel)))]))
  const [hover, setHover] = useState(false)

  const varsFiltradas = temTamanhos
    ? varsPorChip.filter(v => v.tamanho === tamanhoSel)
    : varsPorChip

  const safeIdx = Math.max(0, Math.min(indice, varsFiltradas.length - 1))
  const atual = varsFiltradas[safeIdx] ?? varsPorChip[0] ?? variantes[0]
  const safeOpcaoIdx = Math.max(0, Math.min(opcaoIdx, atual.opcoes.length - 1))
  const opcaoAtual = atual.opcoes[safeOpcaoIdx]

  // Pronta entrega ou a pedido: quem decide é a chave "Pedido" da barra (o App
  // manda "pronta" ou "pedido"; null = a planilha não tem nada a pedido e o
  // card fica como sempre). Ligada, o card mostra só o preço a pedido
  const modoEntrega = entrega
  const noPedido = modoEntrega === 'pedido'
  // { preco, disponivel, parcelas, valorParcela } do tipo que está na tela
  const precoAtual = noPedido ? opcaoAtual.pedido : opcaoAtual
  const disponivelAgora = !!precoAtual?.disponivel

  // Troca de cor da foto: a nova dissolve por cima da anterior (useTrocaDeFoto.js)
  const { fotoAtual, fotoAnterior, saiu: fotoSaiu } = useTrocaDeFoto(atual.imagem)

  // Baixa as fotos das outras cores quando a pessoa mostra que vai trocar
  // (mouse no card, toque ou foco nas cores), pra a troca não esperar a rede.
  // Não baixa tudo de cara: no celular pesaria (as fotos do iPhone 18 têm ~300KB)
  const coresPreCarregadas = useRef(false)
  const preCarregarCores = () => {
    if (coresPreCarregadas.current) return
    coresPreCarregadas.current = true
    variantes.forEach(v => { if (v.imagem) new Image().src = v.imagem })
  }

  const irPara = (novoIdx) => {
    setIndice(novoIdx)
    setOpcaoIdx(opcaoInicial(varsFiltradas[novoIdx]))
  }

  const selecionarChip = (c) => {
    setChipSel(c)
    const doChip = variantes.filter(v => v.chip === c)
    const tamanhosDoChip = [...new Set(doChip.map(v => v.tamanho).filter(Boolean))]
    setTamanhoSel(tamanhosDoChip[0] || null)
    setIndice(0)
    setOpcaoIdx(opcaoInicial(tamanhosDoChip.length > 1 ? doChip.find(v => v.tamanho === tamanhosDoChip[0]) : doChip[0]))
  }

  const selecionarTamanho = (t) => {
    setTamanhoSel(t)
    const doTamanho = varsPorChip.filter(v => v.tamanho === t)
    setOpcaoIdx(opcaoInicial(doTamanho[Math.min(indice, doTamanho.length - 1)]))
  }

  // Opção sem preço na planilha vem sem valor (e indisponível): fica um traço
  const preco = precoAtual?.preco == null
    ? '—'
    : precoAtual.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const parcelamento = precoAtual?.parcelas && precoAtual?.valorParcela
    ? `ou ${precoAtual.parcelas}x de ${precoAtual.valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
    : null
  const linhaBase = modelo.replace(/ M\d+$/, '')
  const nomeCompleto = atual.chip ? `${linhaBase} ${atual.chip}` : atual.modelo
  const eyebrow = temChips ? linhaBase : 'Apple'
  const titulo = temChips ? chipSel : modelo
  // O a pedido é outro item no carrinho (id com "-pedido"); a pronta entrega
  // mantém o id de sempre, pra os carrinhos já salvos continuarem valendo
  const itemCarrinhoId = `${atual.id}-${opcaoAtual.armazenamento}${noPedido ? '-pedido' : ''}`
  const noCarrinho = carrinhoIds.includes(itemCarrinhoId)
  // Só entra no carrinho com o preço da planilha na tela: antes dela responder,
  // o preço do item seria o fixo do produtos.json
  const podeAdicionar = disponivelAgora && precosProntos
  const itemCarrinho = {
    id: itemCarrinhoId,
    nome: nomeCompleto,
    tamanho: atual.tamanho || null,
    armazenamento: opcaoAtual.armazenamento,
    cor: atual.cor,
    imagem: atual.imagem,
    preco: precoAtual?.preco ?? null,
    ...(modoEntrega && { entrega: modoEntrega }),
  }
  const whatsappUrl = linkWhatsApp(mensagemDoCard(itemCarrinho))

  // Selecionado: o branco de sempre, um pouco transparente (--vidro-branco em index.css)
  const btnSelector = (sel, disabled = false) => ({
    border: sel ? '1.5px solid transparent' : disabled ? '1.5px solid #2a2a2a' : '1.5px solid #666',
    background: sel ? 'var(--vidro-branco)' : 'transparent',
    color: disabled ? '#2e2e2e' : sel ? '#000' : '#e0e0e0',
    fontWeight: sel ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: disabled ? 'line-through' : 'none',
  })

  return (
    <div
      className="modelo-card"
      onMouseEnter={() => { setHover(true); preCarregarCores() }}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1e1e1e' : '#161616',
        border: `1px solid ${hover ? '#333' : '#222'}`,
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 16px 48px rgba(0,0,0,0.5)' : 'none',
        position: 'relative',
      }}
    >
      {/* Imagem */}
      <div className="modelo-card-imagem" style={{
        position: 'relative',
        background: 'radial-gradient(ellipse at 50% 65%, #2e2e32 0%, #131313 100%)',
      }}>
        {/* Luz no tom da cor escolhida (intensidade em --luz-da-cor, no index.css) */}
        <div className="modelo-card-luz" style={{ '--luz-cor': corDaLuz(atual.corHex) }} />
        {atual.imagem ? (
          <>
            {fotoAnterior && (
              <img
                key={fotoAnterior}
                className="modelo-card-foto modelo-card-foto--saindo"
                src={fotoAnterior}
                alt=""
                aria-hidden="true"
                onAnimationEnd={fotoSaiu}
              />
            )}
            <img
              key={fotoAtual}
              className="modelo-card-foto modelo-card-foto--entrando"
              src={fotoAtual}
              alt={`${atual.modelo} ${atual.cor}`}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : modelo.startsWith('iPad') ? (
          <svg
            key={atual.id}
            viewBox="0 0 110 140"
            fill="none"
            style={{ width: '70%', height: 'auto', animation: 'fadeIn 0.25s ease' }}
          >
            <rect x="2" y="2" width="106" height="136" rx="12" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="10" y="16" width="90" height="108" rx="4" fill={atual.corHex} opacity="0.85"/>
            <circle cx="55" cy="131" r="4" fill="#2a2a2a"/>
            <circle cx="6" cy="70" r="2.5" fill="#2a2a2a"/>
          </svg>
        ) : modelo.startsWith('Apple Watch') ? (
          <svg
            key={atual.id}
            viewBox="0 0 80 110"
            fill="none"
            style={{ width: '45%', height: 'auto', animation: 'fadeIn 0.25s ease' }}
          >
            <rect x="22" y="0" width="36" height="22" rx="5" fill="#222" stroke="#333" strokeWidth="1.2"/>
            <rect x="22" y="88" width="36" height="22" rx="5" fill="#222" stroke="#333" strokeWidth="1.2"/>
            <rect x="8" y="18" width="64" height="74" rx="18" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="13" y="23" width="54" height="64" rx="14" fill={atual.corHex} opacity="0.9"/>
            <rect x="70" y="36" width="7" height="16" rx="3.5" fill="#2a2a2a" stroke="#333" strokeWidth="1"/>
          </svg>
        ) : (
          <svg
            key={atual.id}
            viewBox="0 0 64 110"
            fill="none"
            style={{ width: '38%', height: 'auto', animation: 'fadeIn 0.25s ease' }}
          >
            <rect x="2" y="2" width="60" height="106" rx="14" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="8" y="14" width="48" height="78" rx="4" fill={atual.corHex} opacity="0.85"/>
            <circle cx="32" cy="98" r="4.5" fill="#2a2a2a"/>
            <rect x="22" y="6" width="20" height="3.5" rx="1.75" fill="#2a2a2a"/>
          </svg>
        )}
        {/* Selo "A pedido" na foto; a pronta entrega fica sem selo */}
        {noPedido && precoAtual?.preco != null && (
          <span className="selo-seminovo">A pedido</span>
        )}
      </div>

      {/* Pontos de cor */}
      {varsFiltradas.length > 1 && (
        <div
          style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
          onTouchStart={preCarregarCores}
          onFocus={preCarregarCores}
        >
          {varsFiltradas.map((v, i) => (
            <button
              key={v.id}
              onClick={() => irPara(i)}
              title={v.cor}
              className="cor-dot-btn"
            >
              <span
                className={`cor-dot${i === safeIdx ? ' cor-dot--ativo' : ''}`}
                style={{ background: v.corHex }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{
            fontSize: temChips ? 13 : 10,
            color: temChips ? '#fff' : '#555',
            fontWeight: temChips ? 700 : 400,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            marginBottom: temChips ? 4 : 3,
          }}>
            {eyebrow}
          </p>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>
            {titulo}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: atual.corHex,
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: '#888' }}>{atual.cor}</span>
          </div>
        </div>

        {/* Seletor de chip */}
        {temChips && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--rotulo-card)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
              Chip
            </p>
            <div className="btn-selector-row">
              {chips.map(c => (
                <button
                  key={c}
                  className="btn-selector"
                  onClick={() => selecionarChip(c)}
                  style={btnSelector(c === chipSel)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seletor de tamanho */}
        {temTamanhos && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--rotulo-card)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
              Tamanho
            </p>
            <div className="btn-selector-row">
              {tamanhos.map(t => (
                <button
                  key={t}
                  className="btn-selector"
                  onClick={() => selecionarTamanho(t)}
                  style={btnSelector(t === tamanhoSel)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seletor de armazenamento / conectividade */}
        <div>
          <p style={{ fontSize: 10, color: 'var(--rotulo-card)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
            {modelo.startsWith('Apple Watch')
              ? 'Conectividade'
              : modelo.startsWith('MacBook') || modelo.startsWith('Mac mini')
                ? 'Configuração'
                // AirPods: o estojo de recarga ("Padrão" ou "Indução")
                : modelo.startsWith('AirPods')
                  ? 'Estojo'
                  : 'Armazenamento'}
          </p>
          <div className="btn-selector-row">
            {atual.opcoes.map((op, i) => {
              const sel = i === safeOpcaoIdx
              // Com a chave "Pedido" ligada, vale o que dá pra encomendar
              const indis = noPedido ? !encomendavel(op) : !op.disponivel
              return (
                <button
                  key={op.armazenamento}
                  className="btn-selector"
                  onClick={() => !indis && setOpcaoIdx(i)}
                  title={indis ? 'Indisponível' : op.armazenamento}
                  style={btnSelector(sel, indis)}
                >
                  {op.armazenamento}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preço + CTA */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ fontSize: 10, color: 'var(--rotulo-card)', marginBottom: 1 }}>Preço</p>
          {precosProntos ? (
            <>
              <p style={{
                fontSize: 24, fontWeight: 700,
                color: disponivelAgora ? '#fff' : '#444',
                letterSpacing: '-0.5px',
              }}>
                {preco}
              </p>
              {parcelamento && disponivelAgora && (
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ddd', marginTop: 4 }}>
                  {parcelamento}
                </p>
              )}
              {/* Prazo do a pedido embaixo do preço; a pronta entrega fica sem nota */}
              {noPedido && disponivelAgora && (
                <p className="entrega-nota entrega-nota--pedido">Chega em até 7 a 8 dias úteis · sinal de 10%</p>
              )}
            </>
          ) : planilhaFalhou ? (
            // Nunca o preço fixo do produtos.json no lugar: ele está desatualizado
            <p style={{ fontSize: 15, fontWeight: 600, color: '#9a9a9a', marginTop: 4 }}>
              Não foi possível carregar
            </p>
          ) : (
            <div className="preco-skeleton">
              <div className="preco-skeleton-linha preco-skeleton-linha--preco" />
              <div className="preco-skeleton-linha preco-skeleton-linha--parcela" />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={disponivelAgora ? whatsappUrl : undefined}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: disponivelAgora ? 'var(--vidro-verde)' : '#1a1a1a',
              color: disponivelAgora ? '#fff' : '#3a3a3a',
              padding: '11px 0',
              borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              cursor: disponivelAgora ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s',
              border: disponivelAgora ? 'none' : '1px solid #222',
            }}
          >
            {disponivelAgora ? (
              <>
                Comprar via
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </>
            ) : 'Indisponível'}
          </a>

          <button
            className="carrinho-toggle-btn"
            onClick={() => podeAdicionar && onAlternarCarrinho?.(itemCarrinho)}
            disabled={!podeAdicionar}
            title={noCarrinho ? 'Remover da seleção' : 'Adicionar à seleção'}
            aria-label={noCarrinho ? 'Remover da seleção' : 'Adicionar à seleção'}
            style={{
              width: 46,
              flexShrink: 0,
              background: !podeAdicionar ? 'transparent' : noCarrinho ? 'rgba(37,211,102,0.14)' : 'transparent',
              color: !podeAdicionar ? '#3a3a3a' : 'var(--whatsapp)',
              border: `1.5px solid ${!podeAdicionar ? '#222' : noCarrinho ? 'var(--whatsapp)' : '#444'}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !podeAdicionar ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {noCarrinho ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
