import { useState, useMemo, useEffect, useRef } from 'react'
import Header from './components/Header'
import Filtros from './components/Filtros'
import ModeloCard from './components/ModeloCard'
import SeminovoCard from './components/SeminovoCard'
import GiroIphone from './components/GiroIphone'
import FaixaBeneficios from './components/FaixaBeneficios'
import ProvaSocial from './components/ProvaSocial'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import produtosBase from './data/produtos.json'
// Aparelhos de exemplo, usados só enquanto a planilha ainda não tem a aba
// "Seminovos" (script antigo, que não devolve o campo "seminovos")
import seminovosExemplo from './data/seminovos.json'
import { PLANILHA_PRECOS_URL } from './config'
import { buscarPrecosRemotos, aplicarPrecos, montarSeminovos, lerPrecosCache, salvarPrecosCache } from './data/precosRemotos'
import { revelar } from './revelar'

const CARRINHO_STORAGE_KEY = 'mbr-carrinho-v1'

function lerCarrinhoSalvo() {
  try {
    const bruto = localStorage.getItem(CARRINHO_STORAGE_KEY)
    const dados = bruto ? JSON.parse(bruto) : []
    return Array.isArray(dados) ? dados : []
  } catch {
    return []
  }
}

const ORDEM_MODELOS = {
  iPhone: [
    'iPhone 18 Pro Max', 'iPhone 18 Pro',
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

// Aba "Destaque": mostra a linha topo de cada categoria, uma ao lado da outra
// (no iPhone, o lançamento 18 Pro Max vem antes do 17 Pro Max).
const DESTAQUE_MODELOS = [
  { categoria: 'iPhone', modelo: 'iPhone 18 Pro Max' },
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
    { linha: 'Linha 18', modelos: ['iPhone 18 Pro Max', 'iPhone 18 Pro'] },
    { linha: 'Linha 17', modelos: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17'] },
    { linha: 'Linha 16', modelos: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16'] },
    { linha: 'Linha 15', modelos: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15'] },
    { linha: 'Linha 14', modelos: ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14'] },
    { linha: 'Linha 13', modelos: ['iPhone 13'] },
  ],
}

// Categoria do menu a que um modelo pertence (ex.: "iPhone 15 Pro" -> "iPhone")
function categoriaDoModelo(modelo) {
  return Object.keys(ORDEM_MODELOS).find(cat => ORDEM_MODELOS[cat].includes(modelo)) ?? null
}

// Posição do modelo na ordem do menu, pra os seminovos seguirem a mesma ordem dos lacrados
function ordemDoModelo(modelo) {
  const cat = categoriaDoModelo(modelo)
  const categorias = Object.keys(ORDEM_MODELOS)
  return cat ? categorias.indexOf(cat) * 100 + ORDEM_MODELOS[cat].indexOf(modelo) : 9999
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
  // null = a planilha ainda não respondeu ou não tem a aba "Seminovos"
  const [seminovosPlanilha, setSeminovosPlanilha] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('Destaque')
  const [filtroModelo, setFiltroModelo] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [condicao, setCondicao] = useState('lacrado')
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [carrinho, setCarrinho] = useState(lerCarrinhoSalvo)
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [carrinhoAnimKey, setCarrinhoAnimKey] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(carrinho))
    } catch {
      // localStorage indisponível (modo privado, cota cheia, etc.) — segue sem persistir
    }
  }, [carrinho])

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
    const aplicarSeminovos = (dados) => {
      if (Array.isArray(dados.seminovos)) setSeminovosPlanilha(montarSeminovos(dados.seminovos, produtosBase))
    }

    if (precosCache) {
      setProdutos(aplicarPrecos(produtosBase, precosCache))
      aplicarSeminovos(precosCache)
      setPrecosProntos(true)
    }

    buscarPrecosRemotos(PLANILHA_PRECOS_URL)
      .then(precos => {
        if (!cancelado && precos) {
          setProdutos(aplicarPrecos(produtosBase, precos))
          aplicarSeminovos(precos)
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
  const filtrosRef = useRef(null)

  useEffect(() => {
    setMostrarTodos(false)
  }, [filtroCategoria, filtroModelo, busca, condicao])

  // Rola até a lista, deixando o começo dela logo abaixo do Header (70px).
  // scrollTo com a posição calculada: o scrollIntoView parava antes no celular.
  // Devolve uma promessa que resolve quando a rolagem termina, pra quem precisa
  // mexer no layout só depois (ver abrirMenu em Filtros.jsx)
  const irParaProdutos = () => new Promise((resolve) => {
    const loja = filtrosRef.current
    if (!loja) return resolve()
    const destino = loja.getBoundingClientRect().top + window.scrollY - 70
    if (Math.abs(destino - window.scrollY) < 2) return resolve()
    let feito = false
    const terminar = () => {
      if (feito) return
      feito = true
      window.removeEventListener('scrollend', terminar)
      clearTimeout(limite)
      resolve()
    }
    window.addEventListener('scrollend', terminar)
    // navegador sem o evento scrollend: espera o tempo de uma rolagem suave
    const limite = setTimeout(terminar, 1000)
    window.scrollTo({ top: destino, behavior: 'smooth' })
  })

  const escolherCategoriaDoHero = (categoria) => {
    setFiltroCategoria(categoria)
    setFiltroModelo('Todos')
    setBusca('')
    irParaProdutos()
  }

  // Antes da planilha responder não mostra nada (nem o exemplo, pra não piscar
  // aparelho e preço que não existem)
  const usandoExemplo = seminovosPlanilha === null
  const seminovosBase = useMemo(
    () => seminovosPlanilha ?? (precosProntos ? montarSeminovos(seminovosExemplo, produtosBase) : []),
    [seminovosPlanilha, precosProntos]
  )

  const ordemAtual = ORDEM_MODELOS[filtroCategoria] || []
  const linhasAtual = LINHAS_POR_CATEGORIA[filtroCategoria]

  // Na linha de modelos do menu, só entram os que existem na condição escolhida
  const modelos = useMemo(() => {
    const fonte = condicao === 'seminovo' ? seminovosBase : produtos
    if (linhasAtual) {
      return linhasAtual
        .filter(l => l.modelos.some(m => fonte.some(p => p.modelo === m)))
        .map(l => l.linha)
    }
    return ordemAtual.filter(m => fonte.some(p => p.modelo === m))
  }, [filtroCategoria, produtos, condicao, seminovosBase])

  const termoBusca = busca.trim().toLowerCase()

  const grupos = useMemo(() => {
    if (termoBusca) {
      const variantesFiltradas = produtos.filter(p => p.modelo.toLowerCase().includes(termoBusca))
      const map = {}
      variantesFiltradas.forEach(p => {
        if (!map[p.modelo]) map[p.modelo] = []
        map[p.modelo].push(p)
      })
      return Object.keys(map).map(m => ({ modelo: m, variantes: map[m] }))
    }
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
  }, [filtroCategoria, filtroModelo, produtos, termoBusca])

  // Seminovos com os mesmos filtros da lista de lacrados (busca, categoria e
  // linha/modelo); no Destaque aparecem todos
  const seminovos = useMemo(() => {
    return seminovosBase
      .filter(s => {
        if (termoBusca) return s.modelo.toLowerCase().includes(termoBusca)
        if (filtroCategoria === 'Destaque') return true
        if (categoriaDoModelo(s.modelo) !== filtroCategoria) return false
        if (filtroModelo === 'Todos') return true
        const linhaSel = linhasAtual?.find(l => l.linha === filtroModelo)
        return linhaSel ? linhaSel.modelos.includes(s.modelo) : s.modelo === filtroModelo
      })
      .sort((a, b) => ordemDoModelo(a.modelo) - ordemDoModelo(b.modelo) || b.preco - a.preco)
  }, [filtroCategoria, filtroModelo, termoBusca, linhasAtual, seminovosBase])

  const emSeminovos = condicao === 'seminovo'
  const itensDaLista = emSeminovos ? seminovos : grupos
  const categoriaIndisponivel = !termoBusca && filtroCategoria !== 'Destaque' && !ORDEM_MODELOS[filtroCategoria]
  // No computador a grade mostra todos os modelos; no celular começa com poucos e um "Ver mais".
  const limitarLista = !isDesktop && (termoBusca || filtroModelo === 'Todos') && itensDaLista.length > LIMITE_INICIAL && !mostrarTodos
  const gruposExibidos = limitarLista ? grupos.slice(0, LIMITE_INICIAL) : grupos
  const seminovosExibidos = limitarLista ? seminovos.slice(0, LIMITE_INICIAL) : seminovos

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header
        carrinhoCount={carrinho.length}
        carrinhoAnimKey={carrinhoAnimKey}
        onAbrirCarrinho={() => setCarrinhoAberto(a => !a)}
      />

      <GiroIphone
        onVerProdutos={irParaProdutos}
        onEscolherCategoria={escolherCategoriaDoHero}
      />

      {/* Menu e grade na mesma seção: a barra do menu fica presa embaixo do
          header enquanto a lista está na tela e vai embora junto com ela */}
      <section className="loja" ref={filtrosRef} aria-label="Produtos">
        <Filtros
          modelos={modelos}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          filtroModelo={filtroModelo}
          setFiltroModelo={setFiltroModelo}
          busca={busca}
          setBusca={setBusca}
          condicao={condicao}
          setCondicao={setCondicao}
          onIrParaLista={irParaProdutos}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>
          {categoriaIndisponivel ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>🔜</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{filtroCategoria}</p>
              <p style={{ fontSize: 15, color: '#606060' }}>Em breve disponível na MasterBR.</p>
            </div>
          ) : emSeminovos ? (
            <>
              {usandoExemplo && precosProntos && (
                <p className="aviso-prototipo">Protótipo · aparelhos e preços de exemplo</p>
              )}
              {!precosProntos ? null : seminovos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a8a8a' }}>
                  <p style={{ fontSize: 16, marginBottom: 16 }}>Nenhum seminovo disponível nesse filtro agora.</p>
                  <button className="btn-ver-mais" style={{ marginTop: 0 }} onClick={() => setCondicao('lacrado')}>
                    Ver lacrados
                  </button>
                </div>
              ) : (
                <div className="produtos-grid">
                  {seminovosExibidos.map(aparelho => (
                    <div className="revelar" ref={revelar} key={aparelho.id}>
                      <SeminovoCard
                        aparelho={aparelho}
                        carrinhoIds={carrinhoIds}
                        onAlternarCarrinho={alternarCarrinho}
                      />
                    </div>
                  ))}
                </div>
              )}
              {limitarLista && (
                <button className="btn-ver-mais" onClick={() => setMostrarTodos(true)}>
                  Ver mais seminovos ({seminovos.length - LIMITE_INICIAL})
                </button>
              )}
            </>
          ) : grupos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#606060' }}>
              <p style={{ fontSize: 16 }}>Nenhum produto encontrado.</p>
            </div>
          ) : (
            <>
              <div className="produtos-grid">
                {gruposExibidos.map(({ modelo, variantes }) => (
                  // O aparecer fica num envoltório porque o card usa transform e
                  // transition inline no hover, que anulariam o efeito nele
                  <div className="revelar" ref={revelar} key={modelo}>
                    <ModeloCard
                      modelo={modelo}
                      variantes={variantes}
                      precosProntos={precosProntos}
                      carrinhoIds={carrinhoIds}
                      onAlternarCarrinho={alternarCarrinho}
                    />
                  </div>
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
      </section>

      <FaixaBeneficios />

      <ProvaSocial />

      <footer style={{
        background: 'linear-gradient(var(--bg-primary), var(--bg-elevado))',
        padding: '24px', textAlign: 'center',
        color: '#8a8a8a', fontSize: 13,
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
