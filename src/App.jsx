import { useState, useMemo, useEffect, useRef } from 'react'
import Header from './components/Header'
import Filtros from './components/Filtros'
import ModeloCard from './components/ModeloCard'
import HeroCarousel from './components/HeroCarousel'
import FaixaBeneficios from './components/FaixaBeneficios'
import ProvaSocial from './components/ProvaSocial'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import produtosBase from './data/produtos.json'
import { PLANILHA_PRECOS_URL } from './config'
import { buscarPrecosRemotos, aplicarPrecos, lerPrecosCache, salvarPrecosCache } from './data/precosRemotos'

const ORDEM_MODELOS = {
  iPhone: [
    'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17',
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14',
    'iPhone 13',
  ],
  iPad: [
    'iPad Pro M5', 'iPad Pro M4',
    'iPad Air M4', 'iPad Air M3',
    'iPad mini A17 Pro',
    'iPad 11 A16', 'iPad 10',
  ],
  'Apple Watch': [
    'Apple Watch Ultra 3', 'Apple Watch Ultra 2',
    'Apple Watch S11', 'Apple Watch S10',
    'Apple Watch SE 3ª', 'Apple Watch SE 2ª',
  ],
  AirPods: [
    'AirPods Pro 3', 'AirPods Pro 2',
    'AirPods 4 ANC', 'AirPods 4',
    'AirPods 3',
  ],
  MacBook: [
    'MacBook Pro M5', 'MacBook Pro M4',
    'MacBook Air',
    'MacBook Neo',
    'Mac mini M2',
  ],
}

// Aba "Destaque": mostra a linha topo de cada categoria, uma ao lado da outra.
const DESTAQUE_MODELOS = [
  { categoria: 'iPhone', modelo: 'iPhone 17 Pro Max' },
  { categoria: 'iPad', modelo: 'iPad Pro M5' },
  { categoria: 'Apple Watch', modelo: 'Apple Watch Ultra 3' },
  { categoria: 'MacBook', modelo: 'MacBook Pro M5' },
  { categoria: 'AirPods', modelo: 'AirPods Pro 3' },
]

// No filtro, o iPhone é exibido por linha (geração) — cada linha engloba
// as variantes Pro Max / Pro / Plus / base daquela geração.
const LINHAS_POR_CATEGORIA = {
  iPhone: [
    { linha: 'Linha 17', modelos: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17'] },
    { linha: 'Linha 16', modelos: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16'] },
    { linha: 'Linha 15', modelos: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15'] },
    { linha: 'Linha 14', modelos: ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14'] },
    { linha: 'Linha 13', modelos: ['iPhone 13'] },
  ],
}

const LIMITE_INICIAL = 3
const BREAKPOINT_DESKTOP = 767

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > BREAKPOINT_DESKTOP)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT_DESKTOP + 1}px)`)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

export default function App() {
  const [produtos, setProdutos] = useState(produtosBase)
  const [precosProntos, setPrecosProntos] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('Destaque')
  const [filtroModelo, setFiltroModelo] = useState('Todos')
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [carrinho, setCarrinho] = useState([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [carrinhoAnimKey, setCarrinhoAnimKey] = useState(0)

  const alternarCarrinho = (item) => {
    setCarrinho(atual => {
      const existe = atual.some(p => p.id === item.id)
      if (existe) return atual.filter(p => p.id !== item.id)
      setCarrinhoAnimKey(k => k + 1)
      return [...atual, item]
    })
  }

  const removerDoCarrinho = (id) => {
    setCarrinho(atual => atual.filter(p => p.id !== id))
  }

  const carrinhoIds = useMemo(() => carrinho.map(p => p.id), [carrinho])

  useEffect(() => {
    let cancelado = false

    const precosCache = lerPrecosCache()
    if (precosCache) {
      setProdutos(aplicarPrecos(produtosBase, precosCache))
      setPrecosProntos(true)
    }

    buscarPrecosRemotos(PLANILHA_PRECOS_URL)
      .then(precos => {
        if (!cancelado && precos) {
          setProdutos(aplicarPrecos(produtosBase, precos))
          salvarPrecosCache(precos)
        }
      })
      .catch(() => {
        // planilha fora do ar ou ainda não configurada: mantém os preços fixos do produtos.json
      })
      .finally(() => {
        if (!cancelado) setPrecosProntos(true)
      })
    return () => { cancelado = true }
  }, [])
  const isDesktop = useIsDesktop()
  const carouselRef = useRef(null)
  const filtrosRef = useRef(null)

  useEffect(() => {
    setMostrarTodos(false)
  }, [filtroCategoria, filtroModelo])

  const escolherCategoriaDoHero = (categoria) => {
    setFiltroCategoria(categoria)
    setFiltroModelo('Todos')
    filtrosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const rolarCarrossel = (direcao) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollBy({ left: direcao * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const ordemAtual = ORDEM_MODELOS[filtroCategoria] || []
  const linhasAtual = LINHAS_POR_CATEGORIA[filtroCategoria]

  const modelos = useMemo(() => {
    if (linhasAtual) {
      return linhasAtual
        .filter(l => l.modelos.some(m => produtos.some(p => p.modelo === m)))
        .map(l => l.linha)
    }
    return ordemAtual.filter(m => produtos.some(p => p.modelo === m))
  }, [filtroCategoria, produtos])

  const grupos = useMemo(() => {
    if (filtroCategoria === 'Destaque') {
      return DESTAQUE_MODELOS
        .map(({ modelo }) => ({ modelo, variantes: produtos.filter(p => p.modelo === modelo) }))
        .filter(g => g.variantes.length > 0)
    }
    const variantesFiltradas = produtos.filter(p => {
      const naCategoria = ordemAtual.includes(p.modelo)
      let okModelo = filtroModelo === 'Todos'
      if (!okModelo) {
        const linhaSel = linhasAtual?.find(l => l.linha === filtroModelo)
        okModelo = linhaSel ? linhaSel.modelos.includes(p.modelo) : p.modelo === filtroModelo
      }
      return naCategoria && okModelo
    })
    const map = {}
    variantesFiltradas.forEach(p => {
      if (!map[p.modelo]) map[p.modelo] = []
      map[p.modelo].push(p)
    })
    return ordemAtual.filter(m => map[m]).map(m => ({ modelo: m, variantes: map[m] }))
  }, [filtroCategoria, filtroModelo, produtos])

  const categoriaIndisponivel = filtroCategoria !== 'Destaque' && !ORDEM_MODELOS[filtroCategoria]
  const limitarLista = filtroModelo === 'Todos' && grupos.length > LIMITE_INICIAL && !mostrarTodos
  const gruposExibidos = limitarLista ? grupos.slice(0, LIMITE_INICIAL) : grupos

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header
        carrinhoCount={carrinho.length}
        carrinhoAnimKey={carrinhoAnimKey}
        onAbrirCarrinho={() => setCarrinhoAberto(a => !a)}
      />

      <HeroCarousel onEscolherCategoria={escolherCategoriaDoHero} />

      <div ref={filtrosRef}>
        <Filtros
          modelos={modelos}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          filtroModelo={filtroModelo}
          setFiltroModelo={setFiltroModelo}
        />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>
        {categoriaIndisponivel ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🔜</p>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{filtroCategoria}</p>
            <p style={{ fontSize: 15, color: '#606060' }}>Em breve disponível na MasterBR.</p>
          </div>
        ) : grupos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#606060' }}>
            <p style={{ fontSize: 16 }}>Nenhum produto encontrado.</p>
          </div>
        ) : isDesktop ? (
          <div style={{ position: 'relative' }}>
            {grupos.length > 4 && (
              <>
                <button
                  className="carousel-nav carousel-nav-left"
                  onClick={() => rolarCarrossel(-1)}
                  aria-label="Anterior"
                >‹</button>
                <button
                  className="carousel-nav carousel-nav-right"
                  onClick={() => rolarCarrossel(1)}
                  aria-label="Próximo"
                >›</button>
              </>
            )}
            <div className="produtos-carousel" ref={carouselRef}>
              {grupos.map(({ modelo, variantes }) => (
                <ModeloCard
                  key={modelo}
                  modelo={modelo}
                  variantes={variantes}
                  precosProntos={precosProntos}
                  carrinhoIds={carrinhoIds}
                  onAlternarCarrinho={alternarCarrinho}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="produtos-grid">
              {gruposExibidos.map(({ modelo, variantes }) => (
                <ModeloCard
                  key={modelo}
                  modelo={modelo}
                  variantes={variantes}
                  precosProntos={precosProntos}
                  carrinhoIds={carrinhoIds}
                  onAlternarCarrinho={alternarCarrinho}
                />
              ))}
            </div>
            {limitarLista && (
              <button
                className="btn-ver-mais"
                onClick={() => setMostrarTodos(true)}
              >
                Ver mais modelos ({grupos.length - LIMITE_INICIAL})
              </button>
            )}
          </>
        )}
      </div>

      <FaixaBeneficios />

      <ProvaSocial />

      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '24px', textAlign: 'center',
        color: '#404040', fontSize: 13,
      }}>
        © {new Date().getFullYear()} MasterBR — Assistência Especializada Apple
      </footer>

      <CarrinhoFlutuante
        aberto={carrinhoAberto}
        carrinho={carrinho}
        onRemover={removerDoCarrinho}
        onLimpar={() => {
          setCarrinho([])
          setCarrinhoAberto(false)
        }}
        onFechar={() => setCarrinhoAberto(false)}
      />
    </div>
  )
}
