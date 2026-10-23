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

export default function Filtros({ modelos, filtroCategoria, setFiltroCategoria, filtroModelo, setFiltroModelo, busca, setBusca, onIrParaLista }) {
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

  // Guarda os últimos modelos, pra linha poder recolher com eles ainda na tela
  if (modelos.length > 0 && modelos !== modelosVisiveis) {
    setModelosVisiveis(modelos)
    setCategoriaVisivel(filtroCategoria)
  }

  // A sentinela fica onde a barra começa: quando ela passa pra baixo do header,
  // a barra está presa
  useEffect(() => {
    const observador = new IntersectionObserver(([e]) => {
      setPresa(!e.isIntersecting && e.boundingClientRect.top < ALTURA_HEADER + 1)
    }, { rootMargin: `-${ALTURA_HEADER + 1}px 0px 0px 0px` })
    observador.observe(sentinelaRef.current)
    return () => observador.disconnect()
  }, [])

  const limparFiltro = () => {
    setFiltroCategoria('Destaque')
    setFiltroModelo('Todos')
    setBusca('')
  }

  const abrirMenu = () => {
    // Com a lista rolada, primeiro volta pro começo dela, onde o menu abre
    if (presa) onIrParaLista()
    setAberto(true)
    // No computador o cursor já vai pra busca. No celular não, pra o teclado
    // não subir por cima das categorias — é só tocar no campo pra digitar
    if (window.matchMedia('(pointer: fine)').matches) {
      buscaInputRef.current?.focus({ preventScroll: true })
    }
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
            {pilulaAberta && busca && (
              <button
                type="button"
                className="busca-pilula-acao busca-pilula-limpar"
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

          {!pilulaAberta && filtroAtivo && (
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
