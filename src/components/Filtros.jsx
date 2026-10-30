import { useState, useEffect, useRef } from 'react'

const CATEGORIAS = [
  {
    id: 'Destaque',
    label: 'Destaque',
    disponivel: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
      </svg>
    ),
  },
  {
    id: 'iPhone',
    label: 'iPhone',
    disponivel: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3"/>
        <circle cx="12" cy="17.5" r="1"/>
        <line x1="9" y1="5.5" x2="15" y2="5.5"/>
      </svg>
    ),
  },
  {
    id: 'iPad',
    label: 'iPad',
    disponivel: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="18" height="20" rx="3"/>
        <circle cx="12" cy="17.5" r="1"/>
      </svg>
    ),
  },
  {
    id: 'Apple Watch',
    label: 'Apple Watch',
    disponivel: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="6" width="12" height="12" rx="3"/>
        <path d="M9 3h6M9 21h6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    id: 'MacBook',
    label: 'MacBook',
    disponivel: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="13" rx="2"/>
        <path d="M1 20h22"/>
      </svg>
    ),
  },
  {
    id: 'AirPods',
    label: 'AirPods',
    disponivel: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 18c0 1.1-.9 2-2 2s-2-.9-2-2v-4c0-3.3 2.7-6 6-6s6 2.7 6 6v4c0 1.1-.9 2-2 2s-2-.9-2-2"/>
        <line x1="8" y1="14" x2="8" y2="18"/>
        <line x1="16" y1="14" x2="16" y2="18"/>
      </svg>
    ),
  },
]

// Fora do iPhone, encurta o rótulo do botão removendo o nome do produto
// que já é óbvio pelo contexto (ex.: "iPad Pro M5" -> "Pro M5").
function rotuloCurto(modelo) {
  if (modelo.startsWith('iPhone')) return modelo
  for (const prefixo of ['iPad ', 'Apple Watch ', 'AirPods ', 'MacBook ']) {
    if (modelo.startsWith(prefixo)) return modelo.slice(prefixo.length)
  }
  return modelo
}

// Resumo do filtro em uso, mostrado na barra do menu (com × pra limpar).
// Com um modelo escolhido, o ícone da categoria substitui o nome dela, pra
// caber ao lado do botão no celular (ex.: [ícone do iPhone] Linha 17).
function resumoDoFiltro(termo, categoria, modelo) {
  if (termo) return { texto: `“${termo}”`, completo: `busca “${termo}”` }
  if (categoria === 'Destaque') return null
  const cat = CATEGORIAS.find(c => c.id === categoria)
  const nome = cat?.label ?? categoria
  // ao lado do ícone, "Apple Watch" pode virar só "Watch"
  if (modelo === 'Todos') return { icone: cat?.icon, texto: nome.replace(/^Apple /, ''), completo: nome }
  return { icone: cat?.icon, texto: rotuloCurto(modelo), completo: `${nome} · ${rotuloCurto(modelo)}` }
}

// A barra do menu gruda logo abaixo do Header, que tem essa altura
const ALTURA_HEADER = 70

const IconeLupa = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconeSeta = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// Lacrados (catálogo) ou seminovos (aparelhos avulsos, cada um com seu estado),
// com ícone como as categorias do menu: caixa fechada e setas de renovação
const CONDICOES = [
  {
    id: 'lacrado',
    label: 'Lacrados',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5M16 5.25l-8 4.5" />
      </svg>
    ),
  },
  {
    id: 'seminovo',
    label: 'Seminovos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
      </svg>
    ),
  },
]

export default function Filtros({ modelos, filtroCategoria, setFiltroCategoria, filtroModelo, setFiltroModelo, busca, setBusca, condicao, setCondicao, onIrParaLista }) {
  const [modelosVisiveis, setModelosVisiveis] = useState(modelos)
  const [categoriaVisivel, setCategoriaVisivel] = useState(filtroCategoria)
  const [aberto, setAberto] = useState(false)
  const [presa, setPresa] = useState(false)
  const [digitando, setDigitando] = useState(false)
  const sentinelaRef = useRef(null)
  const botaoRef = useRef(null)
  const buscaInputRef = useRef(null)
  const termo = busca.trim()
  const filtroAtivo = resumoDoFiltro(termo, filtroCategoria, filtroModelo)
  const mostrarModelos = !termo && modelos.length > 0
  // Com a barra presa no topo, o menu aberto ficou lá em cima, fora da tela:
  // a pílula volta a ser botão (a não ser que a pessoa esteja digitando)
  const pilulaAberta = aberto && (!presa || digitando)

  // Ao recolher, a pílula encolhe animando (100% -> 200px, 0,45s no CSS da
  // .busca-pilula) e o resumo do filtro ("ipad" ×) só entra depois. Antes ele
  // aparecia junto, não cabia ao lado da pílula ainda larga e quebrava pra uma
  // linha nova por um instante: com a barra presa, ela crescia 42px e empurrava
  // a página, e o toque que tirou o foco da busca (num card, no "Ver mais"...)
  // caía fora do botão e se perdia. Ajustado durante a renderização, como os
  // modelos visíveis abaixo, pra o resumo não aparecer nem no primeiro quadro
  const [pilulaAntes, setPilulaAntes] = useState(pilulaAberta)
  const [recolhendo, setRecolhendo] = useState(false)
  if (pilulaAntes !== pilulaAberta) {
    setPilulaAntes(pilulaAberta)
    setRecolhendo(!pilulaAberta)
  }
  useEffect(() => {
    if (!recolhendo) return
    const espera = setTimeout(() => setRecolhendo(false), 450)
    return () => clearTimeout(espera)
  }, [recolhendo])

  // Guarda os últimos modelos, pra linha poder recolher com eles ainda na tela
  if (modelos.length > 0 && modelos !== modelosVisiveis) {
    setModelosVisiveis(modelos)
    setCategoriaVisivel(filtroCategoria)
  }

  // A sentinela fica onde a barra começa: quando ela passa pra baixo do header,
  // a barra está presa. Medida a cada rolagem (um cálculo por quadro de tela),
  // e não com IntersectionObserver: numa rolagem rápida a sentinela de 1px
  // pulava de baixo pra cima da tela sem nunca "aparecer", o observador não
  // avisava e a barra seguia como solta mesmo presa no topo
  useEffect(() => {
    let agendado = false
    const medir = () => {
      agendado = false
      const sentinela = sentinelaRef.current
      if (sentinela) setPresa(sentinela.getBoundingClientRect().top < ALTURA_HEADER + 1)
    }
    const aoRolar = () => {
      if (agendado) return
      agendado = true
      requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
    }
  }, [])

  const limparFiltro = () => {
    setFiltroCategoria('Destaque')
    setFiltroModelo('Todos')
    setBusca('')
  }

  const abrirAgora = () => {
    setAberto(true)
    // No computador o cursor já vai pra busca. No celular não, pra o teclado
    // não subir por cima das categorias — é só tocar no campo pra digitar
    if (window.matchMedia('(pointer: fine)').matches) {
      buscaInputRef.current?.focus({ preventScroll: true })
    }
  }

  const abrirMenu = () => {
    // Com a lista rolada, primeiro volta pro começo dela, onde o menu abre, e só
    // abre quando a rolagem termina: o menu crescendo no meio da rolagem fazia o
    // navegador reajustar a posição da página (scroll anchoring), a rolagem
    // parava no meio do caminho e a busca ficava cortada na tela
    if (presa) onIrParaLista().then(abrirAgora)
    else abrirAgora()
  }

  const fecharMenu = () => {
    // Presa no topo, o menu está fora da tela: fechar ali faria a página pular,
    // então só recolhe a pílula (sai do campo)
    if (presa) {
      buscaInputRef.current?.blur()
      return
    }
    setAberto(false)
    botaoRef.current?.focus({ preventScroll: true })
  }

  const aoTeclarNoMenu = (e) => {
    if (e.key === 'Escape' && aberto) fecharMenu()
  }

  return (
    <>
      <div className="filtros-sentinela" ref={sentinelaRef} aria-hidden="true" />

      {/* ── Barra (fica presa embaixo do header ao rolar a lista) ── */}
      <div className="filtros-barra">
        <div className="filtros-barra-conteudo">
          <div className={`busca-pilula${pilulaAberta ? ' busca-pilula--aberta' : ''}`} onKeyDown={aoTeclarNoMenu}>
            {/* Brilho girando na borda (a camada interna gira pela placa de vídeo) */}
            <span className="busca-pilula-anel" aria-hidden="true">
              <span className="busca-pilula-anel-luz" />
            </span>
            <span className="busca-pilula-lupa">{IconeLupa}</span>
            <input
              ref={buscaInputRef}
              type="text"
              className="busca-pilula-input"
              placeholder="Digite o modelo, ex.: iPhone 17 Pro"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setDigitando(true)}
              onBlur={() => setDigitando(false)}
              aria-label="Buscar produto"
              tabIndex={pilulaAberta ? 0 : -1}
            />
            {/* onMouseDown evita que o campo perca o foco ao clicar: com a barra
                presa, perder o foco recolhe a pílula e o botão sumia antes do clique */}
            {pilulaAberta && busca && (
              <button
                type="button"
                className="busca-pilula-acao busca-pilula-limpar"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setBusca(''); buscaInputRef.current?.focus() }}
                aria-label="Limpar busca"
              >
                ×
              </button>
            )}
            {pilulaAberta && (
              <button
                type="button"
                className="busca-pilula-acao busca-pilula-fechar"
                onMouseDown={(e) => e.preventDefault()}
                onClick={fecharMenu}
                aria-label="Fechar menu"
              >
                {IconeSeta}
              </button>
            )}
            {/* Fechada, a pílula inteira é um botão; ao clicar, ela vira o campo de busca */}
            <button
              ref={botaoRef}
              type="button"
              className="busca-pilula-botao"
              onClick={abrirMenu}
              aria-expanded={pilulaAberta}
              aria-controls="filtros-painel"
              tabIndex={pilulaAberta ? -1 : 0}
              aria-hidden={pilulaAberta || undefined}
            >
              <span className="busca-pilula-rotulo">Buscar produto</span>
              <span className="busca-pilula-seta">{IconeSeta}</span>
            </button>
          </div>

          {/* Chave Lacrados | Seminovos: fica na barra presa, sempre à mão.
              No celular desce pra uma linha própria, abaixo da pílula */}
          <div
            className={`condicao-chave${condicao === 'seminovo' ? ' condicao-chave--seminovo' : ''}`}
            role="radiogroup"
            aria-label="Condição do aparelho"
          >
            {/* O fundo branco do escolhido é um só e desliza de um lado pro outro */}
            <span className="condicao-trilho" aria-hidden="true" />
            {CONDICOES.map(c => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={condicao === c.id}
                className={`condicao-opcao${condicao === c.id ? ' condicao-opcao--ativa' : ''}`}
                onClick={() => setCondicao(c.id)}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>

          {!pilulaAberta && !recolhendo && filtroAtivo && (
            <button
              type="button"
              className="filtros-ativo"
              onClick={limparFiltro}
              aria-label={`Limpar filtro: ${filtroAtivo.completo}`}
            >
              {filtroAtivo.icone && <span className="filtros-ativo-icone" aria-hidden="true">{filtroAtivo.icone}</span>}
              <span className="filtros-ativo-texto">{filtroAtivo.texto}</span>
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Menu (abre no lugar, empurrando os produtos pra baixo) ── */}
      <div
        id="filtros-painel"
        className={`filtros-painel${aberto ? ' filtros-painel--aberto' : ''}`}
        inert={!aberto}
        onKeyDown={aoTeclarNoMenu}
      >
        <div className="filtros-painel-conteudo">

          {/* ── Categorias ── */}
          <div className="filtros-row">
            <div className="filtros-scroll categorias-scroll">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.id}
                  disabled={!cat.disponivel}
                  onClick={() => {
                    if (cat.disponivel) {
                      setFiltroCategoria(cat.id)
                      setFiltroModelo('Todos')
                      setBusca('')
                    }
                  }}
                  className={`categoria-btn${!termo && filtroCategoria === cat.id ? ' ativo' : ''}${!cat.disponivel ? ' em-breve' : ''}`}
                >
                  <span className="categoria-icon">{cat.icon}</span>
                  <span className="categoria-label">{cat.label}</span>
                  {!cat.disponivel && <span className="badge-breve">Em breve</span>}
                </button>
              ))}
            </div>
            <div className="filtros-fade-right" />
          </div>

          {/* ── Modelos (só quando há modelos e nenhuma busca ativa). Abre e
              recolhe animando a altura, pros cards descerem e subirem suaves ── */}
          <div
            className={`filtros-modelos${mostrarModelos ? ' filtros-modelos--visivel' : ''}`}
            inert={!mostrarModelos}
          >
            <div className="filtros-modelos-conteudo">
              {modelosVisiveis.length > 0 && (
                <div className="filtros-row filtros-modelo-anim" key={categoriaVisivel}>
                  <p className="filtros-label">Modelo</p>
                  <div className="filtros-scroll">
                    <button
                      className={`filtro-btn${filtroModelo === 'Todos' ? ' ativo' : ''}`}
                      onClick={() => setFiltroModelo('Todos')}
                    >
                      Todos
                    </button>
                    {modelosVisiveis.map(m => (
                      <button
                        key={m}
                        className={`filtro-btn${filtroModelo === m ? ' ativo' : ''}`}
                        onClick={() => setFiltroModelo(m)}
                      >
                        {rotuloCurto(m)}
                      </button>
                    ))}
                  </div>
                  <div className="filtros-fade-right" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
