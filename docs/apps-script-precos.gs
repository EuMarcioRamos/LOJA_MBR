/**
 * Cole este código em: dentro da planilha do Google -> Extensões -> Apps Script.
 * Depois publique como App da Web (Implantar -> Nova implantação -> App da Web).
 *
 * Estrutura de preços em duas camadas (preço quase nunca varia por cor):
 * - Aba "Precos por Modelo": o preço padrão de cada modelo+armazenamento,
 *   valendo pra todas as cores daquele produto. É aqui que 95% das
 *   alterações de preço acontecem.
 * - Aba "Precos" (por cor): controla a DISPONIBILIDADE de cada cor
 *   (isso sim varia peça a peça) e serve pra registrar uma EXCEÇÃO de
 *   preço quando uma cor específica precisa custar diferente do padrão
 *   do modelo — nesse caso preenche o Preço só naquela linha; senão,
 *   deixa em branco que ele usa o preço do modelo.
 */

const ABA_PRECOS = 'Precos'
const ABA_PRECOS_MODELO = 'Precos por Modelo'
const ABA_ATUALIZACAO = 'Atualizar em Massa'

// ────────────────────────────────────────────────────────────
// 1. API pública (lida pelo site) — não precisa mexer aqui
// ────────────────────────────────────────────────────────────
function doGet() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet()

  // Aba "Precos por Modelo": 0=Categoria 1=Modelo 2=Armazenamento
  // 3=Preco 4=Parcelas 5=ValorParcela
  const abaModelo = planilha.getSheetByName(ABA_PRECOS_MODELO)
  const porModelo = abaModelo
    ? abaModelo.getDataRange().getValues().slice(1)
        .filter(linha => linha[1])
        .map(linha => ({
          modelo: String(linha[1]).trim(),
          armazenamento: String(linha[2]).trim(),
          preco: Number(linha[3]) || null,
          parcelas: Number(linha[4]) || null,
          valorParcela: Number(linha[5]) || null,
        }))
    : []

  // Aba "Precos" (por cor): 0=Categoria 1=Modelo 2=Cor 3=Armazenamento
  // 4=Preco 5=Disponivel 6=ID 7=Parcelas 8=ValorParcela
  const abaCor = planilha.getSheetByName(ABA_PRECOS)
  const porCor = abaCor
    ? abaCor.getDataRange().getValues().slice(1)
        .filter(linha => linha[6])
        .map(linha => ({
          id: String(linha[6]).trim(),
          armazenamento: String(linha[3]).trim(),
          preco: Number(linha[4]) || null,
          disponivel: String(linha[5]).trim().toUpperCase() === 'SIM',
          parcelas: Number(linha[7]) || null,
          valorParcela: Number(linha[8]) || null,
        }))
    : []

  return ContentService
    .createTextOutput(JSON.stringify({ porModelo, porCor }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ────────────────────────────────────────────────────────────
// 2. Menu "Preços" — aparece toda vez que você abre a planilha
// ────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Preços')
    .addItem('Configurar Preços por Modelo (migração)', 'configurarPrecosPorModelo')
    .addItem('Aplicar atualização em massa', 'aplicarAtualizacaoEmMassa')
    .addItem('Reajustar todos os preços em %', 'aplicarReajustePercentual')
    .addToUi()
}

/**
 * Roda uma vez pra criar/atualizar a aba "Precos por Modelo" a partir do
 * que já está na aba "Precos": agrupa por Modelo+Armazenamento, pega o
 * preço (que hoje é igual em todas as cores) como padrão do modelo, e
 * limpa o Preço das linhas de cor que batem exatamente com esse padrão
 * — deixando só exceções reais preenchidas na aba "Precos".
 * Disponibilidade nunca é tocada.
 */
function configurarPrecosPorModelo() {
  const ui = SpreadsheetApp.getUi()
  const planilha = SpreadsheetApp.getActiveSpreadsheet()
  const abaPrecos = planilha.getSheetByName(ABA_PRECOS)
  if (!abaPrecos) {
    ui.alert(`Não encontrei a aba "${ABA_PRECOS}".`)
    return
  }

  const dados = abaPrecos.getDataRange().getValues()
  const linhas = dados.slice(1)

  // agrupa por Categoria+Modelo+Armazenamento
  const grupos = {}
  linhas.forEach((linha, idx) => {
    const [categoria, modelo, , armazenamento, preco] = linha
    if (!modelo) return
    const chave = modelo + '||' + armazenamento
    if (!grupos[chave]) grupos[chave] = { categoria, modelo, armazenamento, precos: [], linhas: [] }
    grupos[chave].precos.push(Number(preco) || 0)
    grupos[chave].linhas.push(idx)
  })

  // cria/limpa a aba "Precos por Modelo"
  let abaModelo = planilha.getSheetByName(ABA_PRECOS_MODELO)
  if (!abaModelo) {
    abaModelo = planilha.insertSheet(ABA_PRECOS_MODELO)
  } else {
    abaModelo.clear()
  }
  abaModelo.appendRow(['Categoria', 'Modelo', 'Armazenamento', 'Preco', 'Parcelas', 'Valor Parcela'])

  let linhasLimpasNaAbaPrecos = 0

  Object.values(grupos).forEach(grupo => {
    // preço padrão do modelo = o mais comum entre as cores (normalmente todas iguais)
    const contagem = {}
    grupo.precos.forEach(p => { contagem[p] = (contagem[p] || 0) + 1 })
    const precoPadrao = Number(Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])[0])

    abaModelo.appendRow([grupo.categoria, grupo.modelo, grupo.armazenamento, precoPadrao, '', ''])

    // limpa o preço das linhas de cor que batem com o padrão (mantém exceções reais)
    grupo.linhas.forEach(idx => {
      const precoDaLinha = Number(dados[idx + 1][4]) || 0
      if (precoDaLinha === precoPadrao) {
        abaPrecos.getRange(idx + 2, 5).setValue('') // coluna Preco em branco
        linhasLimpasNaAbaPrecos++
      }
    })
  })

  ui.alert(
    `Aba "${ABA_PRECOS_MODELO}" criada/atualizada com ${Object.keys(grupos).length} modelos.\n` +
    `${linhasLimpasNaAbaPrecos} linha(s) de cor tiveram o preço limpo por já baterem com o padrão do modelo (agora usam o preço do modelo automaticamente).`
  )
}

/**
 * Lê a aba "Atualizar em Massa" e aplica os valores. O "Identificador"
 * de cada linha pode ser:
 * - o nome de um Modelo (ex.: "iPhone 17 Pro Max") -> aplica em
 *   "Precos por Modelo", valendo pra todas as cores.
 * - o ID de uma cor específica (ex.: "17promax-silver") -> aplica em
 *   "Precos", só naquela cor (útil pra exceção de preço ou pra mexer
 *   na disponibilidade).
 *
 * Colunas: Identificador | Armazenamento (opcional) | Novo Preco (opcional)
 * | Novo Disponivel (opcional, só vale se o Identificador for uma cor)
 * | Novas Parcelas (opcional) | Novo Valor Parcela (opcional)
 */
function aplicarAtualizacaoEmMassa() {
  const ui = SpreadsheetApp.getUi()
  const planilha = SpreadsheetApp.getActiveSpreadsheet()
  const abaAtualizacao = planilha.getSheetByName(ABA_ATUALIZACAO)
  const abaPrecos = planilha.getSheetByName(ABA_PRECOS)
  const abaModelo = planilha.getSheetByName(ABA_PRECOS_MODELO)

  if (!abaAtualizacao) {
    ui.alert(`Não encontrei a aba "${ABA_ATUALIZACAO}". Crie essa aba primeiro (veja docs/planilha-de-precos.md).`)
    return
  }

  const listaAtualizacoes = abaAtualizacao.getDataRange().getValues().slice(1)
    .filter(linha => linha[0])

  if (listaAtualizacoes.length === 0) {
    ui.alert('A aba "Atualizar em Massa" está vazia. Nada foi alterado.')
    return
  }

  let linhasAlteradas = 0

  const dadosModelo = abaModelo ? abaModelo.getDataRange().getValues() : []
  const dadosPrecos = abaPrecos.getDataRange().getValues()

  listaAtualizacoes.forEach(atualizacao => {
    const [identificador, armazenamentoAlvo, novoPreco, novoDisponivel, novasParcelas, novoValorParcela] = atualizacao
    const alvo = String(identificador).trim()

    // tenta achar como Modelo primeiro
    for (let i = 1; i < dadosModelo.length; i++) {
      const linha = dadosModelo[i]
      if (String(linha[1]).trim() !== alvo) continue
      if (armazenamentoAlvo && String(linha[2]).trim() !== String(armazenamentoAlvo).trim()) continue

      let mudou = false
      if (novoPreco !== '' && novoPreco != null) { abaModelo.getRange(i + 1, 4).setValue(Number(novoPreco)); mudou = true }
      if (novasParcelas !== '' && novasParcelas != null) { abaModelo.getRange(i + 1, 5).setValue(Number(novasParcelas)); mudou = true }
      if (novoValorParcela !== '' && novoValorParcela != null) { abaModelo.getRange(i + 1, 6).setValue(Number(novoValorParcela)); mudou = true }
      if (mudou) linhasAlteradas++
    }

    // tenta achar como ID de cor
    for (let i = 1; i < dadosPrecos.length; i++) {
      const linha = dadosPrecos[i]
      if (String(linha[6]).trim() !== alvo) continue
      if (armazenamentoAlvo && String(linha[3]).trim() !== String(armazenamentoAlvo).trim()) continue

      let mudou = false
      if (novoPreco !== '' && novoPreco != null) { abaPrecos.getRange(i + 1, 5).setValue(Number(novoPreco)); mudou = true }
      if (novoDisponivel !== '' && novoDisponivel != null) { abaPrecos.getRange(i + 1, 6).setValue(String(novoDisponivel).toUpperCase()); mudou = true }
      if (novasParcelas !== '' && novasParcelas != null) { abaPrecos.getRange(i + 1, 8).setValue(Number(novasParcelas)); mudou = true }
      if (novoValorParcela !== '' && novoValorParcela != null) { abaPrecos.getRange(i + 1, 9).setValue(Number(novoValorParcela)); mudou = true }
      if (mudou) linhasAlteradas++
    }
  })

  ui.alert(`Atualização aplicada: ${linhasAlteradas} linha(s) alteradas.`)
}

/**
 * Multiplica TODOS os preços da aba "Precos por Modelo" por
 * (1 + porcentagem/100) — é aqui que fica o preço padrão de cada
 * produto, então um reajuste geral deve mexer nela, não na aba "Precos".
 */
function aplicarReajustePercentual() {
  const ui = SpreadsheetApp.getUi()
  const abaModelo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_PRECOS_MODELO)
  if (!abaModelo) {
    ui.alert(`Não encontrei a aba "${ABA_PRECOS_MODELO}". Rode "Configurar Preços por Modelo" primeiro.`)
    return
  }

  const resposta = ui.prompt(
    'Reajuste percentual',
    'Digite a porcentagem (ex.: 5 para aumentar 5%, -10 para reduzir 10%):',
    ui.ButtonSet.OK_CANCEL
  )
  if (resposta.getSelectedButton() !== ui.Button.OK) return

  const percentual = Number(resposta.getResponseText().replace(',', '.'))
  if (isNaN(percentual)) {
    ui.alert('Isso não é um número válido.')
    return
  }

  const confirmacao = ui.alert(
    'Confirmar reajuste',
    `Isso vai alterar TODOS os preços de "${ABA_PRECOS_MODELO}" em ${percentual}%. Não tem como desfazer automaticamente. Continuar?`,
    ui.ButtonSet.YES_NO
  )
  if (confirmacao !== ui.Button.YES) return

  const dados = abaModelo.getDataRange().getValues()
  const fator = 1 + percentual / 100

  for (let i = 1; i < dados.length; i++) {
    const precoAtual = Number(dados[i][3])
    if (!precoAtual) continue
    abaModelo.getRange(i + 1, 4).setValue(Math.round(precoAtual * fator))
  }

  ui.alert('Reajuste aplicado em todos os preços de "Precos por Modelo".')
}
