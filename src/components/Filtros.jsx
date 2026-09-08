import { useState, useEffect } from 'react'

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

export default function Filtros({ modelos, filtroCategoria, setFiltroCategoria, filtroModelo, setFiltroModelo }) {
  const [modelosVisiveis, setModelosVisiveis] = useState(modelos)
  const [categoriaVisivel, setCategoriaVisivel] = useState(filtroCategoria)
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (modelos.length > 0) {
      setModelosVisiveis(modelos)
      setCategoriaVisivel(filtroCategoria)
      setSaindo(false)
    } else if (modelosVisiveis.length > 0) {
      setSaindo(true)
    }
  }, [modelos, filtroCategoria])

  const aoTerminarAnimacao = () => {
    if (saindo) setModelosVisiveis([])
  }

  return (
    <div className="filtros-section">

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
                }
              }}
              className={`categoria-btn${filtroCategoria === cat.id ? ' ativo' : ''}${!cat.disponivel ? ' em-breve' : ''}`}
            >
              <span className="categoria-icon">{cat.icon}</span>
              <span className="categoria-label">{cat.label}</span>
              {!cat.disponivel && <span className="badge-breve">Em breve</span>}
            </button>
          ))}
        </div>
        <div className="filtros-fade-right" />
      </div>

      <div className="filtros-divider-h" />

      {/* ── Modelos (só quando há modelos) ── */}
      {modelosVisiveis.length > 0 && (
        <div
          className={`filtros-row filtros-modelo-anim${saindo ? ' saindo' : ''}`}
          key={categoriaVisivel}
          onAnimationEnd={aoTerminarAnimacao}
        >
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
  )
}
