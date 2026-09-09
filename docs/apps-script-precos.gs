/**
 * Cole este código em: dentro da planilha do Google -> Extensões -> Apps Script.
 * Depois publique como App da Web (Implantar -> Nova implantação -> App da Web).
 *
 * Este arquivo faz duas coisas:
 * 1. doGet() — devolve os preços em JSON pro site ler. Só leitura, nunca escreve.
 * 2. Um menu "Preços" dentro da própria planilha, com ferramentas pra
 *    atualizar muitos preços de uma vez, sem editar linha por linha.
 */

const ABA_PRECOS = 'Precos'
const ABA_ATUALIZACAO = 'Atualizar em Massa'

// ────────────────────────────────────────────────────────────
// 1. API pública (lida pelo site) — não precisa mexer aqui
// ────────────────────────────────────────────────────────────
function doGet() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_PRECOS)
  const dados = planilha.getDataRange().getValues()
  const linhas = dados.slice(1) // remove o cabeçalho

  // Ordem das colunas na aba "Precos":
  // 0=Categoria 1=Modelo 2=Cor 3=Armazenamento 4=Preco 5=Disponivel 6=ID 7=Parcelas
  const precos = linhas
    .filter(linha => linha[6])
    .map(linha => ({
      id: String(linha[6]).trim(),
      armazenamento: String(linha[3]).trim(),
      preco: Number(linha[4]) || 0,
      disponivel: String(linha[5]).trim().toUpperCase() === 'SIM',
      parcelas: Number(linha[7]) || null,
    }))

  return ContentService
    .createTextOutput(JSON.stringify(precos))
    .setMimeType(ContentService.MimeType.JSON)
}

// ────────────────────────────────────────────────────────────
// 2. Menu "Preços" — aparece toda vez que você abre a planilha
// ────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Preços')
    .addItem('Aplicar atualização em massa', 'aplicarAtualizacaoEmMassa')
    .addItem('Reajustar todos os preços em %', 'aplicarReajustePercentual')
    .addToUi()
}

/**
 * Lê a aba "Atualizar em Massa" e aplica os valores na aba "Precos".
 * Colunas dessa aba: ID | Armazenamento (opcional) | Novo Preço (opcional)
 * | Novo Disponível (opcional, SIM/NAO) | Novas Parcelas (opcional)
 *
 * Deixar "Armazenamento" em branco aplica o novo preço em TODAS as
 * capacidades daquele ID. Deixar um campo em branco significa "não mexe
 * nesse campo".
 */
function aplicarAtualizacaoEmMassa() {
  const ui = SpreadsheetApp.getUi()
  const planilhaAtiva = SpreadsheetApp.getActiveSpreadsheet()
  const abaAtualizacao = planilhaAtiva.getSheetByName(ABA_ATUALIZACAO)
  const abaPrecos = planilhaAtiva.getSheetByName(ABA_PRECOS)

  if (!abaAtualizacao) {
    ui.alert(`Não encontrei a aba "${ABA_ATUALIZACAO}". Crie essa aba primeiro (veja docs/planilha-de-precos.md).`)
    return
  }

  const listaAtualizacoes = abaAtualizacao.getDataRange().getValues().slice(1)
    .filter(linha => linha[0]) // precisa ter ID preenchido

  if (listaAtualizacoes.length === 0) {
    ui.alert('A aba "Atualizar em Massa" está vazia. Nada foi alterado.')
    return
  }

  const dadosPrecos = abaPrecos.getDataRange().getValues()
  let linhasAlteradas = 0

  for (let i = 1; i < dadosPrecos.length; i++) {
    const linha = dadosPrecos[i]
    const id = String(linha[6]).trim()
    const armazenamento = String(linha[3]).trim()

    listaAtualizacoes.forEach(atualizacao => {
      const [idAlvo, armazenamentoAlvo, novoPreco, novoDisponivel, novasParcelas] = atualizacao
      if (String(idAlvo).trim() !== id) return
      if (armazenamentoAlvo && String(armazenamentoAlvo).trim() !== armazenamento) return

      let mudou = false
      if (novoPreco !== '' && novoPreco != null) {
        abaPrecos.getRange(i + 1, 5).setValue(Number(novoPreco))
        mudou = true
      }
      if (novoDisponivel !== '' && novoDisponivel != null) {
        abaPrecos.getRange(i + 1, 6).setValue(String(novoDisponivel).toUpperCase())
        mudou = true
      }
      if (novasParcelas !== '' && novasParcelas != null) {
        abaPrecos.getRange(i + 1, 8).setValue(Number(novasParcelas))
        mudou = true
      }
      if (mudou) linhasAlteradas++
    })
  }

  ui.alert(`Atualização aplicada: ${linhasAlteradas} linha(s) de preço alteradas.`)
}

/**
 * Multiplica TODOS os preços da aba "Precos" por (1 + porcentagem/100).
 * Pede a porcentagem numa caixinha: digite 5 para aumentar 5%, -10 para
 * reduzir 10%.
 */
function aplicarReajustePercentual() {
  const ui = SpreadsheetApp.getUi()
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
    `Isso vai alterar TODOS os preços em ${percentual}%. Não tem como desfazer automaticamente (só editando de novo). Continuar?`,
    ui.ButtonSet.YES_NO
  )
  if (confirmacao !== ui.Button.YES) return

  const abaPrecos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_PRECOS)
  const dados = abaPrecos.getDataRange().getValues()
  const fator = 1 + percentual / 100

  for (let i = 1; i < dados.length; i++) {
    const precoAtual = Number(dados[i][4])
    if (!precoAtual) continue
    const novoPreco = Math.round(precoAtual * fator)
    abaPrecos.getRange(i + 1, 5).setValue(novoPreco)
  }

  ui.alert('Reajuste aplicado em todos os preços.')
}
