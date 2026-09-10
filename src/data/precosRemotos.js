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

export function aplicarPrecos(produtosBase, dados) {
  if (!dados) return produtosBase

  const mapaModelo = new Map(
    (dados.porModelo || []).map(p => [`${p.modelo}|${p.armazenamento}`, p])
  )
  const mapaCor = new Map(
    (dados.porCor || []).map(p => [`${p.id}|${p.armazenamento}`, p])
  )

  return produtosBase.map(variante => {
    const chaveModelo = modeloId(variante)
    return {
      ...variante,
      opcoes: variante.opcoes.map(opcao => {
        const padrao = mapaModelo.get(`${chaveModelo}|${opcao.armazenamento}`)
        const excecao = mapaCor.get(`${variante.id}|${opcao.armazenamento}`)

        const preco = excecao?.preco || padrao?.preco
        const parcelas = excecao?.parcelas || padrao?.parcelas || null
        const valorParcela = excecao?.valorParcela || padrao?.valorParcela || null
        // Disponibilidade é sempre por cor — não tem "padrão de modelo" aqui.
        const disponivel = excecao ? excecao.disponivel : opcao.disponivel

        return {
          ...opcao,
          preco: Number(preco) || opcao.preco,
          disponivel,
          parcelas,
          valorParcela,
        }
      }),
    }
  })
}
