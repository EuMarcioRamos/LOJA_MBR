// Busca preços atualizados na planilha do Google (via Apps Script) e mescla
// com o catálogo fixo do produtos.json — sem alterar cor, imagem ou nome do
// modelo, só o preço e a disponibilidade de cada opção de armazenamento.

export async function buscarPrecosRemotos(url) {
  if (!url) return null
  const resposta = await fetch(url)
  if (!resposta.ok) throw new Error(`Planilha respondeu ${resposta.status}`)
  const precos = await resposta.json()
  if (!Array.isArray(precos)) throw new Error('Formato inesperado da planilha')
  return precos
}

export function aplicarPrecos(produtosBase, precos) {
  if (!precos || precos.length === 0) return produtosBase

  const mapa = new Map(precos.map(p => [`${p.id}|${p.armazenamento}`, p]))

  return produtosBase.map(variante => ({
    ...variante,
    opcoes: variante.opcoes.map(opcao => {
      const atualizado = mapa.get(`${variante.id}|${opcao.armazenamento}`)
      if (!atualizado) return opcao
      return {
        ...opcao,
        preco: Number(atualizado.preco) || opcao.preco,
        disponivel: atualizado.disponivel,
      }
    }),
  }))
}
