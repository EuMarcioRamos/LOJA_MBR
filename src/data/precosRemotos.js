// Busca preços atualizados na planilha do Google (via Apps Script) e mescla
// com o catálogo fixo do produtos.json — sem alterar cor, imagem ou nome do
// modelo.
//
// O preço quase nunca varia por cor, então a planilha trata isso em duas
// camadas:
// 1. "Precos por Modelo" — o preço padrão de cada modelo+armazenamento,
//    valendo pra todas as cores daquele produto.
// 2. "Precos" (por cor) — só usada quando uma cor específica precisa de
//    um preço diferente do padrão (exceção), e sempre pra controlar a
//    disponibilidade de cada cor (isso sim varia peça a peça).

import { FOTOS_SEMINOVOS, CORES_SEMINOVOS } from './seminovosExtras'

export function modeloId(variante) {
  return [variante.modelo, variante.chip, variante.tamanho].filter(Boolean).join(' ')
}

export async function buscarPrecosRemotos(url) {
  if (!url) return null
  const resposta = await fetch(url)
  if (!resposta.ok) throw new Error(`Planilha respondeu ${resposta.status}`)
  const dados = await resposta.json()
  if (!dados || !Array.isArray(dados.porModelo) || !Array.isArray(dados.porCor)) {
    throw new Error('Formato inesperado da planilha')
  }
  return dados
}

// Cache local (por navegador) da última resposta da planilha, só pra evitar
// mostrar o esqueleto de novo em visitas repetidas dentro de poucos minutos.
// Nunca é a fonte da verdade — o fetch ao vivo sempre roda por cima e
// atualiza tanto a tela quanto o cache.
const CHAVE_CACHE_PRECOS = 'mbr-precos-cache-v1'
const CACHE_PRECOS_TTL_MS = 5 * 60 * 1000 // 5 minutos

// idadeMaxima maior serve de reserva quando a planilha não responde: a última
// cópia dela, mesmo antiga, é mais fiel que os preços fixos do produtos.json
export function lerPrecosCache(idadeMaxima = CACHE_PRECOS_TTL_MS) {
  try {
    const bruto = localStorage.getItem(CHAVE_CACHE_PRECOS)
    if (!bruto) return null
    const { timestamp, precos } = JSON.parse(bruto)
    if (!timestamp || !precos) return null
    if (Date.now() - timestamp > idadeMaxima) return null
    return precos
  } catch {
    return null
  }
}

export function salvarPrecosCache(precos) {
  try {
    localStorage.setItem(CHAVE_CACHE_PRECOS, JSON.stringify({ timestamp: Date.now(), precos }))
  } catch {
    // localStorage indisponível (modo privado, cota cheia, etc.) — segue sem cache
  }
}

// Número de verdade ou null (vazio, texto e NaN viram null)
const numeroOuNulo = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : null)

// Parcela só aparece se fechar com o preço: a soma das parcelas nunca fica
// abaixo do preço à vista. Na planilha há linhas com um valor padrão que não
// foi recalculado (ex.: R$ 10.999 "ou 12x de R$ 164"); corrigindo lá, a
// parcela volta a aparecer sozinha
function parcelasQueFecham(preco, parcelas, valorParcela) {
  if (!parcelas || !valorParcela || parcelas * valorParcela < preco * 0.99) {
    return { parcelas: null, valorParcela: null }
  }
  return { parcelas, valorParcela }
}

// Avisos de peça do seminovo: a planilha manda um texto só, com os avisos
// separados por ";" ("Tampa traseira substituída; Câmera traseira genuína
// Apple") ou um por linha, se alguém editar a célula à mão. Vira uma lista
// (cada aviso é uma linha da ficha); vazio ou qualquer outra coisa vira lista vazia
function listaDeAvisos(valor) {
  const itens = Array.isArray(valor) ? valor : typeof valor === 'string' ? valor.split(/[;\n]/) : []
  return itens.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
}

// Seminovos vêm da aba "Seminovos" (uma linha por aparelho, identificado pelo
// final do IMEI + modelo). A planilha só traz modelo e cor; a foto e o tom da
// cor saem do catálogo, do lacrado de mesmo modelo e cor, ou do
// seminovosExtras.js nos modelos que não são vendidos lacrados
export function montarSeminovos(lista, produtosBase) {
  return lista
    // Sem modelo ou sem preço o aparelho não entra: um seminovo sem preço
    // derrubava a página inteira. O script da planilha já tira essas linhas;
    // aqui é a garantia do lado do site
    .filter(aparelho => typeof aparelho?.modelo === 'string' && aparelho.modelo && numeroOuNulo(aparelho.preco) > 0)
    .map(aparelho => {
      const variante = produtosBase.find(p => p.modelo === aparelho.modelo && p.cor === aparelho.cor)
      const mesmaCor = produtosBase.find(p => p.cor === aparelho.cor)
      const slug = aparelho.modelo.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return {
        ...aparelho,
        bateria: numeroOuNulo(aparelho.bateria),
        ciclos: numeroOuNulo(aparelho.ciclos),
        avisos: listaDeAvisos(aparelho.avisos),
        ...parcelasQueFecham(aparelho.preco, numeroOuNulo(aparelho.parcelas), numeroOuNulo(aparelho.valorParcela)),
        reservado: aparelho.reservado === true,
        id: `semi-${aparelho.imei}-${slug}`,
        imagem: variante?.imagem || FOTOS_SEMINOVOS[`${aparelho.modelo}|${aparelho.cor}`] || null,
        corHex: variante?.corHex || CORES_SEMINOVOS[aparelho.cor] || mesmaCor?.corHex || '#8a8a8a',
      }
    })
}

const textoOuVazio = (valor) => (typeof valor === 'string' ? valor.trim() : '')

// "iPhone 15 Pro Max" -> "iphone-15-pro-max"; "Titânio Natural" -> "titanio-natural"
const slugDe = (texto) => String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Fotos de cada cor do modelo: do catálogo dos lacrados ou, nos modelos que a
// loja não vende lacrados, do seminovosExtras.js. Só entram cores com foto
function coresComFoto(modelo, produtosBase) {
  const vistas = new Set()
  const doCatalogo = []
  produtosBase.forEach(v => {
    if (v.modelo === modelo && v.imagem && !vistas.has(v.cor)) {
      vistas.add(v.cor)
      doCatalogo.push({ cor: v.cor, corHex: v.corHex, imagem: v.imagem })
    }
  })
  if (doCatalogo.length) return doCatalogo
  return Object.entries(FOTOS_SEMINOVOS)
    .filter(([chave]) => chave.startsWith(`${modelo}|`))
    .map(([chave, imagem]) => {
      const cor = chave.slice(modelo.length + 1)
      const mesmaCor = produtosBase.find(p => p.cor === cor)
      return { cor, corHex: CORES_SEMINOVOS[cor] || mesmaCor?.corHex || '#8a8a8a', imagem }
    })
}

// Seminovos a pedido: a tabela fixa da loja (aba "Seminovos Pedido"), com um
// preço por modelo e armazenamento, às vezes por cor (linha 17). Cada modelo
// vira um card: a pessoa escolhe a cor e o armazenamento, e o preço sai da
// linha que vale pra essa combinação. Com alguma linha valendo pra qualquer
// cor, todas as cores do modelo entram; senão, só as citadas na tabela
export function montarSeminovosPedido(tabela, produtosBase) {
  const linhas = (Array.isArray(tabela) ? tabela : []).filter(l =>
    typeof l?.modelo === 'string' && l.modelo &&
    typeof l.armazenamento === 'string' && l.armazenamento &&
    numeroOuNulo(l.preco) > 0)
  return [...new Set(linhas.map(l => l.modelo))]
    .map(modelo => {
      const precos = linhas.filter(l => l.modelo === modelo).map(l => ({
        armazenamento: l.armazenamento,
        cores: Array.isArray(l.cores) ? l.cores.filter(c => typeof c === 'string' && c) : [],
        preco: l.preco,
        ...parcelasQueFecham(l.preco, numeroOuNulo(l.parcelas), numeroOuNulo(l.valorParcela)),
        bateria: textoOuVazio(l.bateria),
        garantia: textoOuVazio(l.garantia),
        brindes: textoOuVazio(l.brindes),
      }))
      const citadas = new Set(precos.flatMap(p => p.cores))
      const qualquerCor = precos.some(p => !p.cores.length)
      const todas = coresComFoto(modelo, produtosBase)
      return {
        id: `semi-pedido-${slugDe(modelo)}`,
        modelo,
        tabela: true,
        cores: qualquerCor ? todas : todas.filter(c => citadas.has(c.cor)),
        armazenamentos: [...new Set(precos.map(p => p.armazenamento))],
        precos,
        // O menor preço do modelo: só pra ordenar a lista
        preco: Math.min(...precos.map(p => p.preco)),
      }
    })
    // Sem foto de nenhuma cor, só fica se tiver preço que vale pra qualquer cor
    .filter(m => m.cores.length || m.precos.some(p => !p.cores.length))
}

// A linha da tabela pra essa cor e armazenamento: a da cor, se houver; senão a
// que vale pra qualquer cor. null = não tem nessa combinação
export function precoSeminovoPedido(aparelho, cor, armazenamento) {
  const doArmazenamento = aparelho.precos.filter(p => p.armazenamento === armazenamento)
  return doArmazenamento.find(p => cor && p.cores.includes(cor)) || doArmazenamento.find(p => !p.cores.length) || null
}

// Id no carrinho: modelo + armazenamento + cor
// ("semi-pedido-iphone-15-pro-max-256gb-titanio-natural")
export function idSeminovoPedido(aparelho, cor, armazenamento) {
  return [aparelho.id, slugDe(armazenamento), cor ? slugDe(cor) : 'cor-a-combinar'].join('-')
}

// A pedido: a mesma regra da pronta entrega (a exceção da cor, senão o preço
// do modelo), nas abas "Pedido por Modelo" e "Pedido". Sem linha da cor vale
// como disponível (encomenda dá pra fazer em qualquer cor); a linha da cor
// com Disponível = NÃO tira só aquela cor. Sem preço nenhum: null (não tem a pedido)
function precoAPedido(padrao, excecao) {
  const fonte = [excecao, padrao].find(linha => Number(linha?.preco) > 0)
  if (!fonte) return null
  const preco = Number(fonte.preco)
  return {
    preco,
    disponivel: excecao ? excecao.disponivel === true : true,
    ...parcelasQueFecham(preco, numeroOuNulo(fonte.parcelas), numeroOuNulo(fonte.valorParcela)),
  }
}

export function aplicarPrecos(produtosBase, dados) {
  if (!dados) return produtosBase

  const mapaModelo = new Map(
    (dados.porModelo || []).map(p => [`${p.modelo}|${p.armazenamento}`, p])
  )
  const mapaCor = new Map(
    (dados.porCor || []).map(p => [`${p.id}|${p.armazenamento}`, p])
  )
  const pedidoModelo = new Map(
    (Array.isArray(dados.pedidoPorModelo) ? dados.pedidoPorModelo : []).map(p => [`${p.modelo}|${p.armazenamento}`, p])
  )
  const pedidoCor = new Map(
    (Array.isArray(dados.pedidoPorCor) ? dados.pedidoPorCor : []).map(p => [`${p.id}|${p.armazenamento}`, p])
  )

  return produtosBase.map(variante => {
    const chaveModelo = modeloId(variante)
    return {
      ...variante,
      opcoes: variante.opcoes.map(opcao => {
        const padrao = mapaModelo.get(`${chaveModelo}|${opcao.armazenamento}`)
        const excecao = mapaCor.get(`${variante.id}|${opcao.armazenamento}`)
        // O preço a pedido vai junto em cada opção (null quando não tem);
        // os campos de sempre (preco, disponivel...) continuam sendo a pronta entrega
        const pedido = precoAPedido(
          pedidoModelo.get(`${chaveModelo}|${opcao.armazenamento}`),
          pedidoCor.get(`${variante.id}|${opcao.armazenamento}`),
        )

        // Preço e parcelas saem sempre da mesma linha da planilha (a exceção
        // da cor, senão o padrão do modelo). Antes cada campo vinha de onde
        // houvesse valor, e um preço de uma linha saía com a parcela de outra
        // (ex.: iPhone 14 512GB com o preço fixo de R$ 4.999 "ou 12x de R$ 164",
        // a parcela de uma linha sem preço da planilha).
        const fonte = [excecao, padrao].find(linha => Number(linha?.preco) > 0)
        // Sem preço em nenhuma das duas, a loja não tem preço pra essa opção:
        // ela fica indisponível (não dá pra escolher no card) e o preço fixo do
        // produtos.json nunca aparece no lugar
        if (!fonte) return { ...opcao, preco: null, disponivel: false, parcelas: null, valorParcela: null, pedido }

        const preco = Number(fonte.preco)
        // Disponibilidade é sempre por cor — não tem "padrão de modelo" aqui.
        const disponivel = excecao ? excecao.disponivel : opcao.disponivel

        return {
          ...opcao,
          preco,
          disponivel,
          ...parcelasQueFecham(preco, fonte.parcelas, fonte.valorParcela),
          pedido,
        }
      }),
    }
  })
}
