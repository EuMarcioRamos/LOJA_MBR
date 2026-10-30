import { useState, useMemo, useEffect, useRef } from 'react'
import Header from './components/Header'
import Filtros from './components/Filtros'
import ModeloCard from './components/ModeloCard'
import SeminovoCard from './components/SeminovoCard'
import GiroIphone from './components/GiroIphone'
import FaixaBeneficios from './components/FaixaBeneficios'
import ProvaSocial from './components/ProvaSocial'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import AvisoWhatsApp from './components/AvisoWhatsApp'
import Protegido from './components/Protegido'
import produtosBase from './data/produtos.json'
// Aparelhos de exemplo, usados só enquanto a planilha ainda não tem a aba
// "Seminovos" (script antigo, que não devolve o campo "seminovos")
import seminovosExemplo from './data/seminovos.json'
import { PLANILHA_PRECOS_URL } from './config'
import { buscarPrecosRemotos, aplicarPrecos, montarSeminovos, lerPrecosCache, salvarPrecosCache } from './data/precosRemotos'
import { revelar } from './revelar'

const CARRINHO_STORAGE_KEY = 'mbr-carrinho-v1'

// O Google costuma responder em 1,5 a 3,5 s. Passou disso aqui, a lista não
// fica mais esperando (ver desistir); se a resposta chegar depois, os preços
// se atualizam sozinhos
const ESPERA_MAXIMA_PLANILHA_MS = 10000

function lerCarrinhoSalvo() {
  try {
    const bruto = localStorage.getItem(CARRINHO_STORAGE_KEY)
    const dados = bruto ? JSON.parse(bruto) : []
    // Só itens completos: um item sem preço (salvo com defeito ou mexido à mão)
    // quebrava o painel do carrinho e, com ele, a página inteira
    if (!Array.isArray(dados)) return []
    return dados
      .filter(item => typeof item?.id === 'string' && typeof item.nome === 'string' && Number.isFinite(item.preco))
      // Seminovo salvo antes de o item levar a marca "seminovo" (o nome vinha
      // com "(seminovo)" no fim); o IMEI vem da lista atual (situacaoDosItens)
      .map(item => item.id.startsWith('semi-') && !item.seminovo
        ? { ...item, seminovo: true, nome: item.nome.replace(/ \(seminovo\)$/, '') }
        : item)
  } catch {
    return []
  }
}

// Preço e disponibilidade de agora de tudo que pode estar no carrinho, pelo
// mesmo id que os cards usam ao adicionar (lacrado: variante + armazenamento)
function situacaoDosItens(produtos, seminovos) {
  const situacao = new Map()
  for (const variante of produtos) {
    for (const opcao of variante.opcoes) {
      situacao.set(`${variante.id}-${opcao.armazenamento}`, { preco: opcao.preco, disponivel: opcao.disponivel })
    }
  }
  for (const aparelho of seminovos || []) {
    situacao.set(aparelho.id, { preco: aparelho.preco, disponivel: !aparelho.reservado, imei: aparelho.imei })
  }
  return situacao
}

const ORDEM_MODELOS = {
  iPhone: [
    'iPhone 18 Pro Max', 'iPhone 18 Pro',
    'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17',
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
    // só seminovos
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
    'iPhone XR',
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
    { linha: 'Linha 15', modelos: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'] },
    { linha: 'Linha 14', modelos: ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14'] },
    { linha: 'Linha 13', modelos: ['iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini'] },
    // as linhas abaixo só aparecem no menu dos seminovos (não há lacrado delas)
    { linha: 'Linha 12', modelos: ['iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini'] },
    { linha: 'Linha 11', modelos: ['iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11'] },
    { linha: 'iPhone XR', modelos: ['iPhone XR'] },
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
  // A planilha não respondeu (erro ou demora): sem uma cópia salva dela, os
  // cards mostram "Não foi possível carregar" no lugar do preço
  const [planilhaFalhou, setPlanilhaFalhou] = useState(false)
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
    let respondeu = false

    const precosCache = lerPrecosCache()
    const aplicarSeminovos = (dados) => {
      if (Array.isArray(dados.seminovos)) setSeminovosPlanilha(montarSeminovos(dados.seminovos, produtosBase))
    }

    if (precosCache) {
      setProdutos(aplicarPrecos(produtosBase, precosCache))
      aplicarSeminovos(precosCache)
      setPrecosProntos(true)
    }

    // A planilha não respondeu (fora do ar ou demorando demais): quem já
    // visitou o site vê a última cópia dela salva neste navegador, mesmo
    // antiga; quem nunca visitou vê "Não foi possível carregar" no lugar do
    // preço. Nunca os preços fixos do produtos.json, que estão desatualizados.
    // Os seminovos de uma cópia antiga não entram: aparelho já vendido
    // continuaria na lista
    const desistir = () => {
      if (cancelado || respondeu) return
      const copia = lerPrecosCache(Infinity)
      if (copia) {
        setProdutos(aplicarPrecos(produtosBase, copia))
        setPrecosProntos(true)
      }
      setPlanilhaFalhou(true)
    }
    const espera = setTimeout(desistir, ESPERA_MAXIMA_PLANILHA_MS)

    const buscar = () => buscarPrecosRemotos(PLANILHA_PRECOS_URL)
    buscar()
      // Um erro passageiro do Google não vira aviso na hora: tenta de novo 2 s depois
      .catch(() => new Promise(r => setTimeout(r, 2000)).then(() => (cancelado ? null : buscar())))
      .then(precos => {
        if (cancelado) return
        // Sem planilha configurada (config.js vazio) valem os preços fixos
        const atualizados = precos ? aplicarPrecos(produtosBase, precos) : produtosBase
        respondeu = true
        setProdutos(atualizados)
        setPrecosProntos(true)
        setPlanilhaFalhou(false)
        if (precos) {
          salvarPrecosCache(precos)
          aplicarSeminovos(precos)
        }
      })
      .catch(desistir)
      .finally(() => clearTimeout(espera))
    return () => {
      cancelado = true
      clearTimeout(espera)
    }
  }, [])

  // O carrinho fica salvo no navegador com o preço do dia em que cada item
  // entrou. No painel e na mensagem do WhatsApp vale o preço de agora; o que
  // esgotou, foi reservado ou vendido continua na lista, marcado como
  // indisponível e fora do total
  const carrinhoAtual = useMemo(() => {
    if (!precosProntos) return carrinho
    const situacao = situacaoDosItens(produtos, seminovosPlanilha)
    return carrinho.map(item => {
      // Sem a lista real de seminovos (planilha fora do ar) não dá pra saber
      // se o aparelho ainda existe: fica como foi salvo
      if (item.id.startsWith('semi-') && !seminovosPlanilha) return item
      const agora = situacao.get(item.id)
      if (!agora?.disponivel) return { ...item, indisponivel: true }
      return { ...item, preco: agora.preco, ...(agora.imei && { imei: agora.imei }) }
    })
  }, [carrinho, produtos, seminovosPlanilha, precosProntos])

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

  // Os aparelhos de exemplo só aparecem quando a planilha respondeu sem a aba
  // "Seminovos". Antes de ela responder, ou se ela falhou, não mostra nenhum
  // (nem o exemplo, pra não mostrar aparelho e preço que não existem)
  const usandoExemplo = seminovosPlanilha === null && precosProntos && !planilhaFalhou
  const seminovosBase = useMemo(
    () => seminovosPlanilha ?? (usandoExemplo ? montarSeminovos(seminovosExemplo, produtosBase) : []),
    [seminovosPlanilha, usandoExemplo]
  )
  const seminovosCarregados = seminovosPlanilha !== null || usandoExemplo

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
        onAbrirCarrinho={() => setCarrinhoAberto(true)}
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
              {usandoExemplo && (
                <p className="aviso-prototipo">Protótipo · aparelhos e preços de exemplo</p>
              )}
              {!seminovosCarregados ? (
                <p style={{ textAlign: 'center', padding: '60px 0', color: '#8a8a8a', fontSize: 15 }}>
                  {planilhaFalhou ? 'Não foi possível carregar os aparelhos. Tente recarregar a página.' : 'Carregando aparelhos…'}
                </p>
              ) : seminovos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a8a8a' }}>
                  <p style={{ fontSize: 16, marginBottom: 16 }}>Nenhum seminovo disponível nesse filtro agora.</p>
                  <button className="btn-ver-mais" style={{ marginTop: 0 }} onClick={() => setCondicao('lacrado')}>
                    Ver lacrados
                  </button>
                </div>
              ) : (
                <div className="produtos-grid">
                  {seminovosExibidos.map(aparelho => (
                    <Protegido key={aparelho.id}>
                      <div className="revelar" ref={revelar}>
                        <SeminovoCard
                          aparelho={aparelho}
                          carrinhoIds={carrinhoIds}
                          onAlternarCarrinho={alternarCarrinho}
                        />
                      </div>
                    </Protegido>
                  ))}
                </div>
              )}
              {limitarLista && (
                <button className="btn-ver-mais btn-ver-mais--expandir" onClick={() => setMostrarTodos(true)}>
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
                  // transition inline no hover, que anulariam o efeito nele.
                  // Protegido por fora: um card que quebrar some sem deixar buraco
                  <Protegido key={modelo}>
                    <div className="revelar" ref={revelar}>
                      <ModeloCard
                        modelo={modelo}
                        variantes={variantes}
                        precosProntos={precosProntos}
                        planilhaFalhou={planilhaFalhou}
                        carrinhoIds={carrinhoIds}
                        onAlternarCarrinho={alternarCarrinho}
                      />
                    </div>
                  </Protegido>
                ))}
              </div>
              {limitarLista && (
                <button
                  className="btn-ver-mais btn-ver-mais--expandir"
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
        carrinho={carrinhoAtual}
        onRemover={removerDoCarrinho}
        onLimpar={() => {
          setCarrinho([])
          setCarrinhoAberto(false)
        }}
        onFechar={() => setCarrinhoAberto(false)}
      />

      <AvisoWhatsApp />
    </div>
  )
}
