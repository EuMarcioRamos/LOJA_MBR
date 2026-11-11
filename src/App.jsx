import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import Header from './components/Header'
import Filtros from './components/Filtros'
import ModeloCard from './components/ModeloCard'
import SeminovoCard from './components/SeminovoCard'
import SeminovoPedidoCard from './components/SeminovoPedidoCard'
import GiroIphone from './components/GiroIphone'
import FaixaBeneficios from './components/FaixaBeneficios'
import ProvaSocial from './components/ProvaSocial'
import Rodape from './components/Rodape'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import AvisoWhatsApp from './components/AvisoWhatsApp'
import AvisoValores from './components/AvisoValores'
import Protegido from './components/Protegido'
import produtosBase from './data/produtos.json'
// Aparelhos de exemplo, usados só enquanto a planilha ainda não tem a aba
// "Seminovos" (script antigo, que não devolve o campo "seminovos")
import seminovosExemplo from './data/seminovos.json'
import { PLANILHA_PRECOS_URL } from './config'
import { buscarPrecosRemotos, aplicarPrecos, montarSeminovos, montarSeminovosPedido, precoSeminovoPedido, idSeminovoPedido, lerPrecosCache, salvarPrecosCache } from './data/precosRemotos'
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
function situacaoDosItens(produtos, seminovos, seminovosPedido) {
  const situacao = new Map()
  for (const variante of produtos) {
    for (const opcao of variante.opcoes) {
      situacao.set(`${variante.id}-${opcao.armazenamento}`, { preco: opcao.preco, disponivel: opcao.disponivel })
      // O mesmo aparelho a pedido é outro item (id com "-pedido")
      if (opcao.pedido) {
        situacao.set(`${variante.id}-${opcao.armazenamento}-pedido`, { preco: opcao.pedido.preco, disponivel: opcao.pedido.disponivel })
      }
    }
  }
  for (const aparelho of seminovos || []) {
    situacao.set(aparelho.id, { preco: aparelho.preco, disponivel: !aparelho.reservado, imei: aparelho.imei })
  }
  // Seminovo a pedido: um item por modelo + armazenamento + cor, com o preço da tabela
  for (const aparelho of seminovosPedido || []) {
    const cores = aparelho.cores.length ? aparelho.cores.map(c => c.cor) : [null]
    for (const armazenamento of aparelho.armazenamentos) {
      for (const cor of cores) {
        const linha = precoSeminovoPedido(aparelho, cor, armazenamento)
        if (linha) situacao.set(idSeminovoPedido(aparelho, cor, armazenamento), { preco: linha.preco, disponivel: true })
      }
    }
  }
  return situacao
}

const ORDEM_MODELOS = {
  iPhone: [
    'iPhone 18 Pro Max', 'iPhone 18 Pro',
    'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17', 'iPhone 17e',
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 16e',
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
    'Apple Watch Ultra 4', 'Apple Watch Ultra 3', 'Apple Watch Ultra 2',
    'Apple Watch S12', 'Apple Watch S11', 'Apple Watch S10',
    'Apple Watch SE 3ª', 'Apple Watch SE 2ª',
  ],
  AirPods: [
    'AirPods Pro 3', 'AirPods Pro 2',
    'AirPods 5',
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

// Aba "Destaque" dos lacrados: no iPhone, as linhas 18 e 17 (Pro Max e Pro), o
// 17 e o 16; das outras categorias, um modelo de cada. Modelo sem aparelho na
// chave escolhida fica de fora sozinho
const DESTAQUE_MODELOS = [
  { categoria: 'iPhone', modelo: 'iPhone 18 Pro Max' },
  { categoria: 'iPhone', modelo: 'iPhone 18 Pro' },
  { categoria: 'iPhone', modelo: 'iPhone 17 Pro Max' },
  { categoria: 'iPhone', modelo: 'iPhone 17 Pro' },
  { categoria: 'iPhone', modelo: 'iPhone 17' },
  { categoria: 'iPhone', modelo: 'iPhone 16' },
  { categoria: 'iPad', modelo: 'iPad 11 A16' },
  { categoria: 'Apple Watch', modelo: 'Apple Watch Ultra 3' },
  { categoria: 'MacBook', modelo: 'MacBook Neo' },
  { categoria: 'AirPods', modelo: 'AirPods Pro 3' },
]

// Com a chave "Pedido" ligada, o destaque mostra as linhas 18 e 17 inteiras
// (Pro Max e Pro); das outras categorias, o mesmo da pronta entrega
const DESTAQUE_MODELOS_PEDIDO = [
  { categoria: 'iPhone', modelo: 'iPhone 18 Pro Max' },
  { categoria: 'iPhone', modelo: 'iPhone 18 Pro' },
  { categoria: 'iPhone', modelo: 'iPhone 17 Pro Max' },
  { categoria: 'iPhone', modelo: 'iPhone 17 Pro' },
  ...DESTAQUE_MODELOS.filter(d => d.categoria !== 'iPhone'),
]

// No filtro, o iPhone é exibido por linha (geração) — cada linha engloba
// as variantes Pro Max / Pro / Plus / base daquela geração (o iPhone Air
// saiu junto com o 17 e entra na linha dele; os "e" na linha do número).
const LINHAS_POR_CATEGORIA = {
  iPhone: [
    { linha: 'Linha 18', modelos: ['iPhone 18 Pro Max', 'iPhone 18 Pro'] },
    { linha: 'Linha 17', modelos: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17', 'iPhone 17e'] },
    { linha: 'Linha 16', modelos: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 16e'] },
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
  // Seminovos a pedido: a tabela da aba "Seminovos Pedido", um item por modelo
  // (null = a planilha ainda não respondeu ou o script ainda não manda a tabela)
  const [seminovosPedidoTabela, setSeminovosPedidoTabela] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('Destaque')
  const [filtroModelo, setFiltroModelo] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [condicao, setCondicao] = useState('lacrado')
  // Chave "Pedido" da barra: começa desligada (só pronta entrega)
  const [pedido, setPedido] = useState(false)
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
      if (Array.isArray(dados.tabelaSeminovosPedido)) {
        setSeminovosPedidoTabela(montarSeminovosPedido(dados.tabelaSeminovosPedido, produtosBase))
      }
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
    const situacao = situacaoDosItens(produtos, seminovosPlanilha, seminovosPedidoTabela)
    return carrinho.map(item => {
      // Sem a lista real de seminovos (planilha fora do ar) não dá pra saber
      // se o aparelho ainda existe: fica como foi salvo. O a pedido vem da
      // tabela ("Seminovos Pedido")
      const listaDoSeminovo = item.id.startsWith('semi-pedido-') ? seminovosPedidoTabela : seminovosPlanilha
      if (item.id.startsWith('semi-') && !listaDoSeminovo) return item
      const agora = situacao.get(item.id)
      if (!agora?.disponivel) return { ...item, indisponivel: true }
      return { ...item, preco: agora.preco, ...(agora.imei && { imei: agora.imei }) }
    })
  }, [carrinho, produtos, seminovosPlanilha, seminovosPedidoTabela, precosProntos])

  const isDesktop = useIsDesktop()
  const filtrosRef = useRef(null)

  useEffect(() => {
    setMostrarTodos(false)
  }, [filtroCategoria, filtroModelo, busca, condicao, pedido])

  // Trocou o filtro (Lacrados/Seminovos, categoria, modelo, busca) com a lista
  // já rolada: o conteúdo novo pode ser bem mais curto (29 seminovos -> 6
  // lacrados do destaque) e a página ficava lá embaixo, já na seção seguinte
  // ("Sobre a MasterBR"). Volta pro começo da lista antes de pintar a tela
  // (useLayoutEffect), sem animação, como quem troca de aba. Se o começo da
  // lista já está na tela, nada se mexe
  const filtrosJaMontados = useRef(false)
  useLayoutEffect(() => {
    if (!filtrosJaMontados.current) {
      filtrosJaMontados.current = true
      return
    }
    const loja = filtrosRef.current
    if (!loja) return
    const topo = loja.getBoundingClientRect().top
    if (topo < 69) window.scrollTo(0, topo + window.scrollY - 70)
  }, [filtroCategoria, filtroModelo, busca, condicao, pedido])

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

  // A pedido: a chave "Pedido" aparece junto com o resto da barra, sem esperar
  // a planilha (que leva de 2 a 5 s pra responder). Se ela responder sem nada a
  // pedido (abas "Pedido por Modelo"/"Pedido" e "Seminovos Pedido" vazias), a
  // chave some e o site fica exatamente como antes
  const temLacradoPedido = useMemo(() => produtos.some(v => v.opcoes.some(o => o.pedido)), [produtos])
  const temSeminovoPedido = (seminovosPedidoTabela?.length ?? 0) > 0
  const temPedido = temLacradoPedido || temSeminovoPedido
  const mostrarChavePedido = temPedido || !precosProntos
  const pedidoLigado = mostrarChavePedido && pedido

  // Chave "Pedido": desligada, só o que tem pronta entrega (some o que só existe
  // a pedido); ligada, só o que tem a pedido. Sem nada a pedido na planilha,
  // a chave nem aparece e a lista fica como sempre
  const produtosVisiveis = useMemo(
    () => (pedidoLigado
      ? produtos.filter(v => v.opcoes.some(o => o.pedido))
      : produtos.filter(v => !v.opcoes.every(o => o.preco == null && o.pedido))),
    [produtos, pedidoLigado]
  )
  // Pronta entrega ou a pedido nos cards de lacrados (null = como sempre)
  const entregaDosCards = temPedido ? (pedidoLigado ? 'pedido' : 'pronta') : null

  const seminovosBase = useMemo(() => {
    const prontos = seminovosPlanilha ?? (usandoExemplo ? montarSeminovos(seminovosExemplo, produtosBase) : [])
    return pedidoLigado ? (seminovosPedidoTabela || []) : prontos
  }, [seminovosPlanilha, usandoExemplo, pedidoLigado, seminovosPedidoTabela])
  const seminovosCarregados = seminovosPlanilha !== null || usandoExemplo

  const ordemAtual = ORDEM_MODELOS[filtroCategoria] || []
  const linhasAtual = LINHAS_POR_CATEGORIA[filtroCategoria]

  // Na linha de modelos do menu, só entram os que existem na condição escolhida
  const modelos = useMemo(() => {
    const fonte = condicao === 'seminovo' ? seminovosBase : produtosVisiveis
    if (linhasAtual) {
      return linhasAtual
        .filter(l => l.modelos.some(m => fonte.some(p => p.modelo === m)))
        .map(l => l.linha)
    }
    return ordemAtual.filter(m => fonte.some(p => p.modelo === m))
  }, [filtroCategoria, produtosVisiveis, condicao, seminovosBase])

  // Categorias do menu com algum aparelho na condição (Lacrados/Seminovos) e na
  // chave "Pedido" escolhidas: as outras ficam indisponíveis (riscadas, sem
  // clique), como o armazenamento sem estoque no card. null = a planilha ainda
  // não respondeu e todas ficam liberadas, pra nada piscar riscado no começo
  const categoriasComProduto = useMemo(() => {
    const emSemi = condicao === 'seminovo'
    const carregou = emSemi && !pedidoLigado ? seminovosCarregados : precosProntos
    if (!carregou) return null
    const fonte = emSemi ? seminovosBase : produtosVisiveis
    return new Set(fonte.map(p => categoriaDoModelo(p.modelo)).filter(Boolean))
  }, [condicao, pedidoLigado, seminovosCarregados, precosProntos, seminovosBase, produtosVisiveis])

  const termoBusca = busca.trim().toLowerCase()

  const grupos = useMemo(() => {
    if (termoBusca) {
      const variantesFiltradas = produtosVisiveis.filter(p => p.modelo.toLowerCase().includes(termoBusca))
      const map = {}
      variantesFiltradas.forEach(p => {
        if (!map[p.modelo]) map[p.modelo] = []
        map[p.modelo].push(p)
      })
      return Object.keys(map).map(m => ({ modelo: m, variantes: map[m] }))
    }
    if (filtroCategoria === 'Destaque') {
      return (pedidoLigado ? DESTAQUE_MODELOS_PEDIDO : DESTAQUE_MODELOS)
        .map(({ modelo }) => ({ modelo, variantes: produtosVisiveis.filter(p => p.modelo === modelo) }))
        .filter(g => g.variantes.length > 0)
    }
    const variantesFiltradas = produtosVisiveis.filter(p => {
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
  }, [filtroCategoria, filtroModelo, produtosVisiveis, termoBusca, pedidoLigado])

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
      // No mesmo modelo, primeiro os aparelhos da loja e depois o card a pedido
      .sort((a, b) => ordemDoModelo(a.modelo) - ordemDoModelo(b.modelo) || Number(!!a.tabela) - Number(!!b.tabela) || b.preco - a.preco)
  }, [filtroCategoria, filtroModelo, termoBusca, linhasAtual, seminovosBase])

  const emSeminovos = condicao === 'seminovo'
  const itensDaLista = emSeminovos ? seminovos : grupos
  const categoriaIndisponivel = !termoBusca && filtroCategoria !== 'Destaque' && !ORDEM_MODELOS[filtroCategoria]
  // No computador a grade mostra todos os modelos; no celular começa com poucos e um "Ver mais".
  const limitarLista = !isDesktop && (termoBusca || filtroModelo === 'Todos') && itensDaLista.length > LIMITE_INICIAL && !mostrarTodos
  const gruposExibidos = limitarLista ? grupos.slice(0, LIMITE_INICIAL) : grupos
  const seminovosExibidos = limitarLista ? seminovos.slice(0, LIMITE_INICIAL) : seminovos

  // No lugar da lista enquanto a planilha não responde (ou se ela falhou)
  const avisoCarregando = (
    <p style={{ textAlign: 'center', padding: '60px 0', color: '#8a8a8a', fontSize: 15 }}>
      {planilhaFalhou ? 'Não foi possível carregar os aparelhos. Tente recarregar a página.' : 'Carregando aparelhos…'}
    </p>
  )

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
          mostrarChavePedido={mostrarChavePedido}
          categoriasComProduto={categoriasComProduto}
          pedido={pedido}
          setPedido={setPedido}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>
          {/* Entra com o mesmo aparecer dos cards (fade + leve subida), antes deles */}
          {!categoriaIndisponivel && (
            <div className="revelar" ref={revelar}>
              <AvisoValores>
                Preços e disponibilidade sujeitos a alteração sem aviso prévio. O valor final é confirmado no atendimento via WhatsApp.
              </AvisoValores>
              {/* Aviso verde do a pedido: aparece ao ligar a chave "Pedido" */}
              {pedidoLigado && (
                <div className="aviso-entrando">
                  <AvisoValores tom="verde">
                    iPhones a pedido chegam em até 7 a 8 dias úteis. Para encomendar, pedimos um sinal de 10% do valor.
                  </AvisoValores>
                </div>
              )}
            </div>
          )}
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
                avisoCarregando
              ) : seminovos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a8a8a' }}>
                  <p style={{ fontSize: 16, marginBottom: 16 }}>
                    {pedidoLigado ? 'Nenhum seminovo a pedido nesse filtro agora.' : 'Nenhum seminovo disponível nesse filtro agora.'}
                  </p>
                  <div className="lista-vazia-botoes">
                    {(!pedidoLigado || temLacradoPedido) && (
                      <button className="btn-ver-mais" style={{ marginTop: 0 }} onClick={() => setCondicao('lacrado')}>
                        {pedidoLigado ? 'Ver lacrados a pedido' : 'Ver lacrados'}
                      </button>
                    )}
                    {pedidoLigado && (
                      <button className="btn-ver-mais" style={{ marginTop: 0 }} onClick={() => setPedido(false)}>
                        Ver pronta entrega
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="produtos-grid">
                  {seminovosExibidos.map(aparelho => (
                    <Protegido key={aparelho.id}>
                      <div className="revelar" ref={revelar}>
                        {aparelho.tabela ? (
                          <SeminovoPedidoCard
                            aparelho={aparelho}
                            carrinhoIds={carrinhoIds}
                            onAlternarCarrinho={alternarCarrinho}
                          />
                        ) : (
                          <SeminovoCard
                            aparelho={aparelho}
                            carrinhoIds={carrinhoIds}
                            onAlternarCarrinho={alternarCarrinho}
                          />
                        )}
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
          ) : pedidoLigado && !precosProntos ? (
            // Chave "Pedido" ligada antes de a planilha responder: ainda não dá
            // pra saber quais aparelhos são a pedido
            avisoCarregando
          ) : grupos.length === 0 ? (
            pedidoLigado ? (
              // Chave "Pedido" ligada e nada a pedido nesse filtro: atalhos pros
              // seminovos a pedido (se houver) e de volta pra pronta entrega
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a8a8a' }}>
                <p style={{ fontSize: 16, marginBottom: 16 }}>Nenhum lacrado a pedido nesse filtro agora.</p>
                <div className="lista-vazia-botoes">
                  {temSeminovoPedido && (
                    <button className="btn-ver-mais" style={{ marginTop: 0 }} onClick={() => setCondicao('seminovo')}>
                      Ver seminovos a pedido
                    </button>
                  )}
                  <button className="btn-ver-mais" style={{ marginTop: 0 }} onClick={() => setPedido(false)}>
                    Ver pronta entrega
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#606060' }}>
                <p style={{ fontSize: 16 }}>Nenhum produto encontrado.</p>
              </div>
            )
          ) : (
            <>
              <div className="produtos-grid">
                {gruposExibidos.map(({ modelo, variantes }) => (
                  // O aparecer fica num envoltório porque o card usa transform e
                  // transition inline no hover, que anulariam o efeito nele.
                  // Protegido por fora: um card que quebrar some sem deixar buraco
                  <Protegido key={`${modelo}-${entregaDosCards}`}>
                    <div className="revelar" ref={revelar}>
                      <ModeloCard
                        modelo={modelo}
                        variantes={variantes}
                        precosProntos={precosProntos}
                        planilhaFalhou={planilhaFalhou}
                        carrinhoIds={carrinhoIds}
                        onAlternarCarrinho={alternarCarrinho}
                        entrega={entregaDosCards}
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

      <Rodape />

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
