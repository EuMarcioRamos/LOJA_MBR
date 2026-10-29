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
 *
 * Seminovos ficam numa aba à parte, "Seminovos": uma linha por aparelho,
 * identificado pelo final do IMEI. Ela é preenchida colando a lista do
 * WhatsApp no menu "Seminovos -> Importar lista do WhatsApp" (seção 3).
 */

const ABA_PRECOS = 'Precos'
const ABA_PRECOS_MODELO = 'Precos por Modelo'
const ABA_ATUALIZACAO = 'Atualizar em Massa'
const ABA_SEMINOVOS = 'Seminovos'

// ────────────────────────────────────────────────────────────
// 1. API pública (lida pelo site) — não precisa mexer aqui
// ────────────────────────────────────────────────────────────
// Cache de 3 minutos: evita reler a planilha inteira em chamadas repetidas
// (não reduz o tempo de despacho do próprio Apps Script como Web App, só
// o tempo gasto lendo/montando os dados a cada chamada).
const CACHE_SEGUNDOS = 180

function doGet() {
  const cache = CacheService.getScriptCache()
  const cacheKey = 'precos-json'
  const cacheado = cache.get(cacheKey)
  if (cacheado) {
    return ContentService
      .createTextOutput(cacheado)
      .setMimeType(ContentService.MimeType.JSON)
  }

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

  const resposta = JSON.stringify({ porModelo, porCor, seminovos: lerSeminovosParaSite(planilha) })
  cache.put(cacheKey, resposta, CACHE_SEGUNDOS)

  return ContentService
    .createTextOutput(resposta)
    .setMimeType(ContentService.MimeType.JSON)
}

/**
 * Roda automaticamente (via onEdit) sempre que alguém edita a planilha,
 * limpando o cache pra próxima chamada do site já vir com o valor novo,
 * em vez de esperar os 3 minutos do CACHE_SEGUNDOS expirarem sozinhos.
 */
function onEdit(e) {
  const nomeAba = e.range.getSheet().getName()
  if (nomeAba === ABA_PRECOS || nomeAba === ABA_PRECOS_MODELO || nomeAba === ABA_SEMINOVOS) {
    CacheService.getScriptCache().remove('precos-json')
  }
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

  SpreadsheetApp.getUi()
    .createMenu('Seminovos')
    .addItem('Importar lista do WhatsApp', 'abrirImportacaoSeminovos')
    .addSeparator()
    .addItem('Criar / ajustar aba Seminovos', 'criarAbaSeminovos')
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

// ────────────────────────────────────────────────────────────
// 3. Seminovos — uma linha por aparelho, preenchida pela lista do WhatsApp
// ────────────────────────────────────────────────────────────
// Cada aparelho é identificado pelo final do IMEI que vem na lista junto
// com o modelo (dois aparelhos de modelos diferentes podem ter o mesmo
// final de IMEI). Ao importar, a lista é tratada como o ESTOQUE COMPLETO:
// - IMEI novo -> entra como "Disponível";
// - IMEI que já estava -> atualiza preço, bateria etc.;
// - IMEI que está na planilha mas sumiu da lista -> vira "Vendido".
// O site mostra só "Disponível" e "Reservado" (esse com o botão travado).
// "Reservado" é marcado à mão e a importação não mexe nele.
// "Revisar" = aparelho que o script não conseguiu entender (modelo ou cor
// desconhecidos); fica fora do site até alguém corrigir a linha e trocar
// o Status pra "Disponível".

const COLUNAS_SEMINOVOS = [
  'IMEI (final)', 'Modelo', 'Cor', 'Armazenamento', 'Bateria (%)', 'Preço',
  'Parcelas', 'Valor Parcela', 'Garantia Apple', 'Garantia MasterBR',
  'Acompanha', 'Status', 'Atualizado em', 'Observação', 'Ciclos',
  'Avisos',
]
const CAMPOS_SEMINOVOS = [
  'imei', 'modelo', 'cor', 'armazenamento', 'bateria', 'preco',
  'parcelas', 'valorParcela', 'garantiaApple', 'garantiaLoja',
  'acompanha', 'status', 'atualizadoEm', 'observacao', 'ciclos', 'avisos',
]
const CAMPOS_NUMERICOS = ['bateria', 'preco', 'parcelas', 'valorParcela', 'ciclos']

const STATUS_SEMINOVO = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  revisar: 'Revisar',
}

// Modelos e cores com o nome EXATO do catálogo do site (src/data/produtos.json):
// é por esse nome que o site acha a foto certa. Modelo novo no site precisa
// entrar aqui também. Os modelos do fim (13 Pro, 12, 11, XR...) não são
// vendidos lacrados: a foto deles fica em src/data/seminovosExtras.js e,
// enquanto não tiver, o site mostra o card com uma foto genérica.
const CATALOGO_SEMINOVOS = {
  'iPhone 18 Pro Max': ['Bordô', 'Azul Glacial', 'Prata', 'Preto'],
  'iPhone 18 Pro': ['Bordô', 'Azul Glacial', 'Prata', 'Preto'],
  'iPhone 17 Pro Max': ['Prata', 'Azul Profundo', 'Laranja Cósmico'],
  'iPhone 17 Pro': ['Prata', 'Azul Profundo', 'Laranja Cósmico'],
  'iPhone 17': ['Preto', 'Branco', 'Lavanda', 'Sálvia', 'Azul Névoa'],
  'iPhone 16 Pro Max': ['Titânio Deserto', 'Titânio Preto', 'Titânio Branco', 'Titânio Natural'],
  'iPhone 16 Pro': ['Titânio Deserto', 'Titânio Preto', 'Titânio Branco', 'Titânio Natural'],
  'iPhone 16 Plus': ['Preto', 'Ultramarino', 'Azul-petróleo', 'Rosa', 'Branco'],
  'iPhone 16': ['Preto', 'Ultramarino', 'Azul-petróleo', 'Rosa', 'Branco'],
  'iPhone 15 Pro Max': ['Titânio Preto', 'Titânio Branco', 'Titânio Azul', 'Titânio Natural'],
  'iPhone 15 Pro': ['Titânio Preto', 'Titânio Branco', 'Titânio Azul', 'Titânio Natural'],
  'iPhone 15': ['Preto', 'Azul', 'Verde', 'Amarelo', 'Rosa'],
  'iPhone 14 Pro Max': ['Roxo Profundo', 'Dourado', 'Prata', 'Preto Espacial'],
  'iPhone 14 Pro': ['Roxo Profundo', 'Dourado', 'Prata', 'Preto Espacial'],
  'iPhone 14': ['Meia-noite', 'Luz das Estrelas', 'Azul', 'Roxo', 'Amarelo'],
  'iPhone 13': ['Meia-noite', 'Luz das Estrelas', 'Azul', 'Rosa', 'Verde'],
  'iPad 10': ['Azul', 'Rosa', 'Prateado', 'Amarelo'],
  'iPad 11 A16': ['Azul', 'Rosa', 'Prateado', 'Amarelo'],
  'iPad Air M3': ['Azul', 'Roxo', 'Starlight', 'Cinza Espacial'],
  'iPad Air M4': ['Azul', 'Roxo', 'Starlight', 'Cinza Espacial'],
  'iPad mini A17 Pro': ['Azul', 'Roxo', 'Starlight', 'Cinza Espacial'],
  'iPad Pro M4': ['Preto Espacial', 'Prateado'],
  'iPad Pro M5': ['Preto Espacial', 'Prateado'],
  'Apple Watch SE 2ª': ['Meia-Noite', 'Starlight', 'Prata'],
  'Apple Watch SE 3ª': ['Meia-Noite', 'Starlight'],
  'Apple Watch S10': ['Preto Jacto', 'Ouro Rosa', 'Prata'],
  'Apple Watch S11': ['Preto Jacto', 'Ouro Rosa', 'Prata'],
  'Apple Watch Ultra 2': ['Titânio Natural', 'Titânio Preto'],
  'Apple Watch Ultra 3': ['Titânio Natural', 'Titânio Preto'],
  'AirPods 3': ['Branco'],
  'AirPods Pro 2': ['Branco'],
  'AirPods Pro 3': ['Branco'],
  'AirPods 4': ['Branco'],
  'AirPods 4 ANC': ['Branco'],
  'Mac mini M2': ['Prateado'],
  'MacBook Neo': ['Rosa', 'Prata', 'Azul'],
  'MacBook Air': ['Dourado', 'Meia-noite', 'Starlight', 'Prata', 'Cinza-espacial', 'Sky Blue'],
  'MacBook Pro M4': ['Preto Espacial', 'Prata'],
  'MacBook Pro M5': ['Preto Espacial', 'Prata'],
  // Só seminovos
  'iPhone 15 Plus': ['Preto', 'Azul', 'Verde', 'Amarelo', 'Rosa'],
  'iPhone 14 Plus': ['Meia-noite', 'Luz das Estrelas', 'Azul', 'Roxo', 'Amarelo', 'Vermelho'],
  'iPhone 13 Pro Max': ['Grafite', 'Dourado', 'Prata', 'Azul-Sierra', 'Verde-Alpino'],
  'iPhone 13 Pro': ['Grafite', 'Dourado', 'Prata', 'Azul-Sierra', 'Verde-Alpino'],
  'iPhone 13 mini': ['Meia-noite', 'Luz das Estrelas', 'Azul', 'Rosa', 'Verde', 'Vermelho'],
  'iPhone 12 Pro Max': ['Grafite', 'Dourado', 'Prata', 'Azul-Pacífico'],
  'iPhone 12 Pro': ['Grafite', 'Dourado', 'Prata', 'Azul-Pacífico'],
  'iPhone 12': ['Preto', 'Branco', 'Azul', 'Verde', 'Roxo', 'Vermelho'],
  'iPhone 12 mini': ['Preto', 'Branco', 'Azul', 'Verde', 'Roxo', 'Vermelho'],
  'iPhone 11 Pro Max': ['Cinza-espacial', 'Prata', 'Dourado', 'Verde-meia-noite'],
  'iPhone 11 Pro': ['Cinza-espacial', 'Prata', 'Dourado', 'Verde-meia-noite'],
  'iPhone 11': ['Preto', 'Branco', 'Verde', 'Amarelo', 'Roxo', 'Vermelho'],
  'iPhone XR': ['Preto', 'Branco', 'Azul', 'Amarelo', 'Coral', 'Vermelho'],
}

// Como a cor costuma vir escrita na lista (inglês ou abreviada) -> cores do
// catálogo. Só vale a que existir no modelo do aparelho. A palavra
// "TITANIUM"/"TITÂNIO" é ignorada na comparação ("NATURAL TITANIUM" = "NATURAL").
const APELIDOS_COR = {
  'SILVER': ['Prata', 'Prateado'],
  'PRATA': ['Prata', 'Prateado'],
  'PRATEADO': ['Prata', 'Prateado'],
  'DEEP BLUE': ['Azul Profundo'],
  'COSMIC ORANGE': ['Laranja Cósmico'],
  'ORANGE': ['Laranja Cósmico'],
  'LARANJA': ['Laranja Cósmico'],
  'BURGUNDY': ['Bordô'],
  'GLACIER BLUE': ['Azul Glacial'],
  'BLACK': ['Preto', 'Preto Espacial', 'Titânio Preto', 'Preto Jacto', 'Meia-noite', 'Meia-Noite', 'Grafite', 'Cinza-espacial'],
  'PRETO': ['Preto', 'Preto Espacial', 'Titânio Preto', 'Preto Jacto', 'Meia-noite', 'Meia-Noite', 'Grafite', 'Cinza-espacial'],
  'GRAPHITE': ['Grafite'],
  // iPhone Pro "branco" é o Prata
  'WHITE': ['Branco', 'Titânio Branco', 'Luz das Estrelas', 'Starlight', 'Prata'],
  'BRANCO': ['Branco', 'Titânio Branco', 'Luz das Estrelas', 'Starlight', 'Prata'],
  'RED': ['Vermelho'],
  'PRODUCT RED': ['Vermelho'],
  'SIERRA BLUE': ['Azul-Sierra'],
  'ALPINE GREEN': ['Verde-Alpino'],
  'PACIFIC BLUE': ['Azul-Pacífico'],
  'MIDNIGHT GREEN': ['Verde-meia-noite'],
  'LAVENDER': ['Lavanda'],
  'SAGE': ['Sálvia'],
  'MIST BLUE': ['Azul Névoa'],
  'ULTRAMARINE': ['Ultramarino'],
  'TEAL': ['Azul-petróleo'],
  'PINK': ['Rosa'],
  'BLUE': ['Azul', 'Titânio Azul', 'Azul-Sierra', 'Azul-Pacífico'],
  'AZUL': ['Azul', 'Titânio Azul', 'Azul-Sierra', 'Azul-Pacífico'],
  'GREEN': ['Verde', 'Verde-Alpino', 'Verde-meia-noite'],
  'VERDE': ['Verde', 'Verde-Alpino', 'Verde-meia-noite'],
  'YELLOW': ['Amarelo'],
  'PURPLE': ['Roxo', 'Roxo Profundo'],
  'ROXO': ['Roxo', 'Roxo Profundo'],
  'DEEP PURPLE': ['Roxo Profundo'],
  'GOLD': ['Dourado'],
  'SPACE BLACK': ['Preto Espacial'],
  'SPACE GRAY': ['Cinza Espacial', 'Cinza-espacial'],
  'SPACE GREY': ['Cinza Espacial', 'Cinza-espacial'],
  'MIDNIGHT': ['Meia-noite', 'Meia-Noite'],
  'STARLIGHT': ['Luz das Estrelas', 'Starlight'],
  'ROSE GOLD': ['Ouro Rosa'],
  'JET BLACK': ['Preto Jacto'],
  'NATURAL': ['Titânio Natural'],
  'DESERT': ['Titânio Deserto'],
  'DESERTO': ['Titânio Deserto'],
}

const MESES_ABREV = {
  JANEIRO: 'jan', FEVEREIRO: 'fev', MARCO: 'mar', ABRIL: 'abr', MAIO: 'mai', JUNHO: 'jun',
  JULHO: 'jul', AGOSTO: 'ago', SETEMBRO: 'set', OUTUBRO: 'out', NOVEMBRO: 'nov', DEZEMBRO: 'dez',
}

// ── Leitura da lista (funções puras, sem mexer na planilha) ──

// Maiúsculas, sem acento, hífen vira espaço: "Azul-petróleo" -> "AZUL PETROLEO"
function normalizar(texto) {
  return String(texto == null ? '' : texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ªº°]/g, '')
    .toUpperCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function semTitanio(texto) {
  return texto.replace(/\bTITANI(O|UM)\b/g, '').replace(/\s+/g, ' ').trim()
}

function compacto(texto) {
  return normalizar(texto).replace(/\s+/g, '')
}

// Tira o "[29/10 14:32] Fulano:" que o WhatsApp põe ao copiar, os emojis
// e os asteriscos de negrito
// O ⚠️ vira a marca "[AVISO]" antes dos emojis saírem: essas linhas (peça
// trocada etc.) e os ciclos ficam só na planilha, pra consulta da loja; o
// site não mostra (são passados na conversa do WhatsApp)
function limparLinha(linha) {
  return String(linha)
    .replace(/\u26A0\uFE0F?/g, ' [AVISO] ')
    .replace(/^\[\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?,?\s+\d{1,2}:\d{2}(?::\d{2})?\]\s*[^:]{1,40}:\s*/, '')
    .replace(/^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*-\s*[^:]{1,40}:\s*/, '')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(\[AVISO\] ?)+/, '[AVISO] ')
}

// "6.890,00" -> 6890 | "650,11" -> 650.11 | "6.890" -> 6890
function numeroBR(texto) {
  let t = String(texto).replace(/[^\d.,]/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/\.\d{3}$/.test(t)) t = t.replace(/\./g, '')
  const n = Number(t)
  return isFinite(n) && n > 0 ? n : null
}

function resolverModelo(texto) {
  const c = normalizar(texto)
    .replace(/\b\d+\s*(GB|TB)\b/g, ' ')
    .replace(/\bSERIES\s+(\d+)/g, 'S$1')
    .replace(/\bSEMI\s*NOVO\b/g, ' ')
    .replace(/\s+/g, '')
  const modelos = Object.keys(CATALOGO_SEMINOVOS)
  const exato = modelos.find(m => compacto(m) === c)
  if (exato) return exato
  // iPhone só com o nome exato (senão "15 Plus" viraria "15"); nos outros,
  // aceita sobra no fim, ex.: "IPAD AIR M3 11 WIFI" -> "iPad Air M3"
  if (/^IPHONE/.test(c)) return null
  return modelos
    .filter(m => c.startsWith(compacto(m)))
    .sort((a, b) => compacto(b).length - compacto(a).length)[0] || null
}

function resolverCor(modelo, texto) {
  const cores = CATALOGO_SEMINOVOS[modelo] || []
  const t = normalizar(texto)
  const base = [t, semTitanio(t)].filter(Boolean)
  const tentativas = base.slice()
  base.forEach(x => (APELIDOS_COR[x] || []).forEach(c => tentativas.push(normalizar(c))))
  for (const x of tentativas) {
    const achou = cores.find(c => normalizar(c) === x)
    if (achou) return achou
  }
  for (const x of tentativas) {
    const achou = cores.find(c => semTitanio(normalizar(c)) === x)
    if (achou) return achou
  }
  return null
}

// "MARCO DE 2027" -> "até mar/2027" | "03/2027" -> "até mar/2027"
function garantiaAppleTexto(resto) {
  const meses = Object.keys(MESES_ABREV)
  const comDia = resto.match(new RegExp('\\b(\\d{1,2})\\s*(?:DE\\s*)?(' + meses.join('|') + ')\\s*(?:DE\\s*)?(\\d{4})'))
  if (comDia) {
    // ano com 2 dígitos pra caber no card: "até 08/12/26"
    return 'até ' + comDia[1].padStart(2, '0') + '/' + String(meses.indexOf(comDia[2]) + 1).padStart(2, '0') + '/' + comDia[3].slice(2)
  }
  const porNome = resto.match(new RegExp('(' + meses.join('|') + ')\\s*(?:DE\\s*)?(\\d{4})'))
  if (porNome) return 'até ' + MESES_ABREV[porNome[1]] + '/' + porNome[2]
  const porNumero = resto.match(/\b(\d{1,2})\s*\/\s*(\d{4})\b/)
  if (porNumero && Number(porNumero[1]) >= 1 && Number(porNumero[1]) <= 12) {
    return 'até ' + MESES_ABREV[meses[Number(porNumero[1]) - 1]] + '/' + porNumero[2]
  }
  return resto ? resto.toLowerCase() : 'ativa'
}

function garantiaLojaTexto(n) {
  const m = n.match(/(\d+)\s*(MESES|MES|ANOS|ANO|DIAS|DIA)\b/)
  if (!m) return ''
  const qtd = Number(m[1])
  const unidade = m[2].startsWith('MES') ? (qtd === 1 ? 'mês' : 'meses')
    : m[2].startsWith('ANO') ? (qtd === 1 ? 'ano' : 'anos')
    : (qtd === 1 ? 'dia' : 'dias')
  return qtd + ' ' + unidade
}

// "IPHONE 13 PRO 128GB" -> "IPHONE 13 PRO"
function modeloSemArmazenamento(texto) {
  return String(texto || '').replace(/\s*\b\d+\s*(GB|TB)\b/i, '').trim()
}

// Identidade do aparelho: final do IMEI + modelo
function chaveSeminovo(x) {
  return x.imei + '|' + compacto(modeloSemArmazenamento(x.modelo || x.textoModelo))
}

// "CÂMERA TRASEIRA GENUÍNA APPLE" -> "Câmera traseira genuína Apple"
function fraseNormal(texto) {
  const t = String(texto).trim().toLowerCase()
    .replace(/\bapple\b/g, 'Apple').replace(/\biphone\b/g, 'iPhone')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const RE_LINHA_MODELO = /^(IPHONE|IPAD|APPLE WATCH|AIRPODS|MACBOOK|MAC MINI)\b/

// Um aparelho = as linhas até o "IMEI: ..." (inclusive)
function lerBlocoSeminovo(linhas) {
  const ap = {
    imei: '', modelo: '', cor: '', armazenamento: '', bateria: null, preco: null,
    parcelas: null, valorParcela: null, garantiaApple: '', garantiaLoja: '', acompanha: '',
    ciclos: null, avisos: '', textoModelo: '', textoCor: '', problemas: [], ignoradas: [],
  }
  const avisos = []
  linhas.forEach(linha => {
    linha.split('|').map(s => s.trim()).filter(Boolean).forEach(seg => {
      if (/^\[AVISO\]/.test(seg)) {
        const t = seg.replace(/^\[AVISO\]\s*/, '')
        if (t) avisos.push(fraseNormal(t))
        return
      }
      const n = normalizar(seg)
      if (!/[A-Z0-9]/.test(n)) return // separadores como "-"
      let m
      if ((m = n.match(/^IMEI\s*:?\s*([0-9A-Z]+)/))) { ap.imei = m[1]; return }
      if (!ap.textoModelo && RE_LINHA_MODELO.test(n)) {
        ap.textoModelo = seg
        const arm = n.match(/\b(\d+)\s*(GB|TB)\b/)
        if (arm) ap.armazenamento = arm[1] + arm[2]
        return
      }
      if ((m = n.match(/^(\d{1,2})\s*X\b\s*(?:DE\s*)?(?:R\$\s*)?([\d.,]+)/))) {
        ap.parcelas = Number(m[1])
        ap.valorParcela = numeroBR(m[2])
        return
      }
      if ((m = n.match(/R\$\s*([\d.,]+)/)) && ap.preco == null) { ap.preco = numeroBR(m[1]); return }
      if ((m = n.match(/^(?:SAUDE (?:DA )?)?(?:BATERIA)?\s*:?\s*(\d{1,3})\s*%$/))) { ap.bateria = Number(m[1]); return }
      if ((m = n.match(/^(\d+)\s*CICLOS?$/))) { ap.ciclos = Number(m[1]); return }
      if (n.includes('GARANTIA') && n.includes('APPLE')) {
        ap.garantiaApple = garantiaAppleTexto(n.replace(/^.*APPLE\s*(?:ATE\s*)?/, '').trim())
        return
      }
      if (n.includes('GARANTIA') && garantiaLojaTexto(n)) { ap.garantiaLoja = garantiaLojaTexto(n); return }
      if (/^COM\s/.test(n)) {
        const t = seg.replace(/^com\s+/i, '').replace(/\s+de\s+brinde\s*$/i, '').trim().toLowerCase()
        ap.acompanha = t.charAt(0).toUpperCase() + t.slice(1)
        return
      }
      if (/^(SEMI ?NOVO|USADO)$/.test(n)) return
      // a cor é a primeira linha "solta" depois do modelo
      if (ap.textoModelo && !ap.textoCor) { ap.textoCor = seg; return }
      ap.ignoradas.push(seg)
    })
  })

  ap.avisos = avisos.join('; ')
  if (!ap.textoModelo) {
    ap.problemas.push({ tipo: 'modelo', msg: 'não achei a linha do modelo' })
  } else {
    ap.modelo = resolverModelo(ap.textoModelo) || ''
    if (!ap.modelo) ap.problemas.push({ tipo: 'modelo', msg: 'modelo "' + ap.textoModelo + '" não está no catálogo do site' })
  }
  if (ap.modelo) {
    if (!ap.textoCor) ap.problemas.push({ tipo: 'cor', msg: 'não achei a cor' })
    else {
      ap.cor = resolverCor(ap.modelo, ap.textoCor) || ''
      if (!ap.cor) ap.problemas.push({ tipo: 'cor', msg: 'cor "' + ap.textoCor + '" não existe no ' + ap.modelo })
    }
  }
  if (ap.preco == null) ap.problemas.push({ tipo: 'preco', msg: 'não achei o preço (R$)' })
  return ap
}

function lerListaWhatsApp(texto) {
  const blocos = []
  let atual = []
  String(texto || '').split(/\r?\n/).map(limparLinha).forEach(linha => {
    if (!linha) return
    atual.push(linha)
    if (/^IMEI\b/.test(normalizar(linha))) { blocos.push(atual); atual = [] }
  })

  const aparelhos = blocos.map(lerBlocoSeminovo)
  const ignoradas = []
  const vistos = {}
  aparelhos.forEach(ap => {
    ap.ignoradas.forEach(t => ignoradas.push(t))
    const chave = chaveSeminovo(ap)
    if (ap.imei && vistos[chave]) {
      ap.duplicado = true
      ap.problemas.push({ tipo: 'imei', msg: 'IMEI ' + ap.imei + ' aparece duas vezes na lista para o mesmo modelo' })
    }
    vistos[chave] = true
  })

  // Sobrou texto depois do último IMEI: se tem cara de aparelho, avisa
  const semImei = []
  if (atual.some(l => RE_LINHA_MODELO.test(normalizar(l)))) {
    const ap = lerBlocoSeminovo(atual)
    ap.problemas.push({ tipo: 'imei', msg: 'sem a linha "IMEI:" no fim' })
    semImei.push(ap)
  } else {
    atual.forEach(t => ignoradas.push(t))
  }
  return { aparelhos, semImei, ignoradas }
}

// ── Comparação com o que já está na planilha ──

function statusNormalizado(status) {
  return normalizar(status)
}

function corValida(modelo, cor) {
  return (CATALOGO_SEMINOVOS[modelo] || []).includes(cor)
}

const ROTULOS_CAMPOS = {
  modelo: 'modelo', cor: 'cor', armazenamento: 'armazenamento', bateria: 'bateria',
  preco: 'preço', parcelas: 'parcelas', valorParcela: 'valor da parcela',
  garantiaApple: 'garantia Apple', garantiaLoja: 'garantia MasterBR', acompanha: 'acompanha',
  ciclos: 'ciclos', avisos: 'avisos',
}

function formatarCampo(campo, valor) {
  if (valor === '' || valor == null) return '—'
  if (campo === 'preco' || campo === 'valorParcela') {
    return 'R$ ' + Number(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  if (campo === 'bateria') return valor + '%'
  return String(valor)
}

function compararSeminovo(atual, ap) {
  const mudancas = []
  Object.keys(ROTULOS_CAMPOS).forEach(campo => {
    const antes = atual[campo]
    const depois = ap[campo]
    const igual = CAMPOS_NUMERICOS.includes(campo)
      ? (Number(antes) || 0) === (Number(depois) || 0)
      : String(antes || '').trim() === String(depois || '').trim()
    if (!igual) mudancas.push(ROTULOS_CAMPOS[campo] + ' ' + formatarCampo(campo, antes) + ' → ' + formatarCampo(campo, depois))
  })
  const st = statusNormalizado(atual.status)
  if (st !== 'DISPONIVEL' && st !== 'RESERVADO') mudancas.push('volta a ficar disponível')
  return mudancas
}

function planejarSeminovos(lidos, linhasPlanilha) {
  const porChave = {}
  linhasPlanilha.forEach(l => { if (l.imei) porChave[chaveSeminovo(l)] = l })

  const plano = { novos: [], atualizados: [], iguais: 0, vendidos: [], revisar: [], mantidos: [], duplicados: [] }
  const naLista = {}

  lidos.aparelhos.forEach(ap => {
    if (ap.duplicado) { plano.duplicados.push(ap); return }
    naLista[chaveSeminovo(ap)] = true
    const atual = porChave[chaveSeminovo(ap)]
    let final = ap
    if (ap.problemas.length) {
      // Modelo/cor não reconhecidos, mas alguém já corrigiu essa linha na
      // planilha: usa o modelo e a cor de lá e atualiza o resto normalmente
      const soNome = ap.problemas.every(p => p.tipo === 'modelo' || p.tipo === 'cor')
      if (atual && soNome && corValida(atual.modelo, atual.cor)) {
        final = Object.assign({}, ap, { modelo: atual.modelo, cor: atual.cor, problemas: [] })
      } else if (atual) {
        plano.mantidos.push(ap)
        return
      } else {
        plano.revisar.push(ap)
        return
      }
    }
    if (!atual) { plano.novos.push(final); return }
    const mudancas = compararSeminovo(atual, final)
    if (mudancas.length) plano.atualizados.push({ atual, ap: final, mudancas })
    else plano.iguais++
  })

  linhasPlanilha.forEach(l => {
    if (l.imei && !naLista[chaveSeminovo(l)] && statusNormalizado(l.status) !== 'VENDIDO') plano.vendidos.push(l)
  })
  plano.prontos = plano.novos.length + plano.atualizados.length + plano.iguais
  return plano
}

function descreverSeminovo(x) {
  return [x.modelo || modeloSemArmazenamento(x.textoModelo), x.armazenamento, x.cor || x.textoCor].filter(Boolean).join(' ') +
    ' · IMEI ' + (x.imei || '?')
}

function resumoDoPlano(plano, lidos) {
  const msgs = ap => ap.problemas.map(p => p.msg).join('; ')
  return {
    prontos: plano.prontos,
    iguais: plano.iguais,
    novos: plano.novos.map(descreverSeminovo),
    atualizados: plano.atualizados.map(a => descreverSeminovo(a.ap) + ': ' + a.mudancas.join('; ')),
    vendidos: plano.vendidos.map(descreverSeminovo),
    revisar: []
      .concat(plano.revisar.map(ap => descreverSeminovo(ap) + ': ' + msgs(ap) + ' (entra como "Revisar", fora do site)'))
      .concat(plano.mantidos.map(ap => descreverSeminovo(ap) + ': ' + msgs(ap) + ' (linha da planilha fica como está)'))
      .concat(plano.duplicados.map(ap => descreverSeminovo(ap) + ': ' + msgs(ap) + ' (ignorado)'))
      .concat(lidos.semImei.map(ap => descreverSeminovo(ap) + ': ' + msgs(ap) + ' (não importado)')),
    ignoradas: lidos.ignoradas,
  }
}

// ── Planilha ──

function camposDoAparelho(ap) {
  const campos = {}
  Object.keys(ROTULOS_CAMPOS).forEach(c => { campos[c] = ap[c] == null ? '' : ap[c] })
  campos.imei = ap.imei
  return campos
}

function lerLinhasSeminovos(aba) {
  const intervalo = aba.getDataRange()
  const valores = intervalo.getValues()
  const exibidos = intervalo.getDisplayValues()
  const linhas = []
  for (let i = 1; i < valores.length; i++) {
    const l = {}
    CAMPOS_SEMINOVOS.forEach((campo, col) => {
      if (CAMPOS_NUMERICOS.includes(campo)) {
        const n = Number(valores[i][col])
        l[campo] = valores[i][col] === '' || isNaN(n) ? null : n
      } else if (campo === 'atualizadoEm') {
        l[campo] = valores[i][col]
      } else {
        l[campo] = String(exibidos[i][col] == null ? '' : exibidos[i][col]).trim()
      }
    })
    linhas.push(l)
  }
  return linhas
}

function linhaParaPlanilha(l) {
  return CAMPOS_SEMINOVOS.map(campo => {
    const v = l[campo]
    if (campo === 'imei') return v ? "'" + v : ''
    if (v == null) return ''
    return v
  })
}

function lerSeminovosParaSite(planilha) {
  const aba = planilha.getSheetByName(ABA_SEMINOVOS)
  if (!aba) return []
  return lerLinhasSeminovos(aba)
    .filter(l => {
      const st = statusNormalizado(l.status)
      return (st === 'DISPONIVEL' || st === 'RESERVADO') && l.imei && l.modelo && l.preco
    })
    .map(l => ({
      imei: l.imei,
      modelo: l.modelo,
      cor: l.cor,
      armazenamento: l.armazenamento,
      bateria: l.bateria,
      preco: l.preco,
      parcelas: l.parcelas,
      valorParcela: l.valorParcela,
      garantiaApple: l.garantiaApple,
      garantiaLoja: l.garantiaLoja,
      acompanha: l.acompanha,
      reservado: statusNormalizado(l.status) === 'RESERVADO',
    }))
}

/**
 * Cria a aba "Seminovos" (ou reaplica a formatação, se ela já existir, sem
 * apagar nada): cabeçalho, listas suspensas, formatos e cores por status.
 */
function criarAbaSeminovos(silencioso) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet()
  let aba = planilha.getSheetByName(ABA_SEMINOVOS)
  const criada = !aba
  if (!aba) aba = planilha.insertSheet(ABA_SEMINOVOS)

  const total = COLUNAS_SEMINOVOS.length
  aba.getRange(1, 1, 1, total).setValues([COLUNAS_SEMINOVOS])
    .setFontWeight('bold').setBackground('#1f1f1f').setFontColor('#ffffff')
  aba.setFrozenRows(1)

  const coluna = letra => aba.getRange(letra + '2:' + letra)
  ;['A', 'B', 'C', 'D', 'I', 'J', 'K', 'L', 'N', 'P'].forEach(l => coluna(l).setNumberFormat('@'))
  ;['E', 'G', 'O'].forEach(l => coluna(l).setNumberFormat('0'))
  ;['F', 'H'].forEach(l => coluna(l).setNumberFormat('"R$" #,##0.00'))
  coluna('M').setNumberFormat('dd/mm/yyyy hh:mm')

  const todasAsCores = []
  Object.keys(CATALOGO_SEMINOVOS).forEach(m => CATALOGO_SEMINOVOS[m].forEach(c => {
    if (!todasAsCores.includes(c)) todasAsCores.push(c)
  }))
  coluna('B').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(CATALOGO_SEMINOVOS), true).setAllowInvalid(true).build())
  coluna('C').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(todasAsCores, true).setAllowInvalid(true).build())
  coluna('E').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100).setAllowInvalid(true).build())
  coluna('L').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(STATUS_SEMINOVO).map(k => STATUS_SEMINOVO[k]), true)
    .setAllowInvalid(false).build())

  const linhasTodas = aba.getRange(2, 1, aba.getMaxRows() - 1, total)
  const regra = (formula) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula).setRanges([linhasTodas])
  aba.setConditionalFormatRules([
    regra('=$L2="Vendido"').setFontColor('#9e9e9e').build(),
    regra('=$L2="Revisar"').setBackground('#fde7c8').build(),
    regra('=$L2="Reservado"').setBackground('#e3edfd').build(),
  ])

  const larguras = [95, 150, 130, 105, 85, 105, 70, 100, 120, 125, 150, 95, 125, 220, 70, 280]
  larguras.forEach((px, i) => aba.setColumnWidth(i + 1, px))

  if (silencioso !== true) {
    SpreadsheetApp.getUi().alert(criada
      ? 'Aba "Seminovos" criada. Use o menu Seminovos -> Importar lista do WhatsApp para preenchê-la.'
      : 'Aba "Seminovos" ajustada (cabeçalho, listas e formatos). Nenhum aparelho foi alterado.')
  }
  return aba
}

function abrirImportacaoSeminovos() {
  const html = HtmlService.createHtmlOutput(HTML_IMPORTACAO_SEMINOVOS).setWidth(680).setHeight(600)
  SpreadsheetApp.getUi().showModalDialog(html, 'Importar seminovos do WhatsApp')
}

// Chamado pela janela de importação: só confere, não grava nada
function previaSeminovos(texto) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_SEMINOVOS)
  const linhas = aba ? lerLinhasSeminovos(aba) : []
  const lidos = lerListaWhatsApp(texto)
  return resumoDoPlano(planejarSeminovos(lidos, linhas), lidos)
}

// Chamado pela janela de importação depois do "Conferir"
function aplicarSeminovos(texto) {
  const trava = LockService.getScriptLock()
  trava.waitLock(20000)
  try {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_SEMINOVOS) || criarAbaSeminovos(true)
    const linhas = lerLinhasSeminovos(aba)
    const lidos = lerListaWhatsApp(texto)
    const plano = planejarSeminovos(lidos, linhas)
    if (plano.prontos === 0) throw new Error('Nenhum aparelho reconhecido na lista. Nada foi alterado.')

    const agora = new Date()
    plano.atualizados.forEach(({ atual, ap }) => {
      Object.assign(atual, camposDoAparelho(ap))
      if (statusNormalizado(atual.status) !== 'RESERVADO') atual.status = STATUS_SEMINOVO.disponivel
      atual.atualizadoEm = agora
    })
    plano.vendidos.forEach(l => {
      l.status = STATUS_SEMINOVO.vendido
      l.atualizadoEm = agora
    })
    const novas = plano.novos.map(ap => Object.assign(camposDoAparelho(ap), {
      status: STATUS_SEMINOVO.disponivel, atualizadoEm: agora, observacao: '',
    })).concat(plano.revisar.map(ap => Object.assign(camposDoAparelho(ap), {
      modelo: ap.modelo || modeloSemArmazenamento(ap.textoModelo),
      cor: ap.cor || ap.textoCor,
      status: STATUS_SEMINOVO.revisar,
      atualizadoEm: agora,
      observacao: ap.problemas.map(p => p.msg).join('; '),
    })))

    const todas = linhas.concat(novas)
    if (todas.length) {
      aba.getRange(2, 1, todas.length, COLUNAS_SEMINOVOS.length).setValues(todas.map(linhaParaPlanilha))
    }
    CacheService.getScriptCache().remove('precos-json')

    const partes = [
      plano.novos.length + ' novo(s)',
      plano.atualizados.length + ' atualizado(s)',
      plano.vendidos.length + ' marcado(s) como vendido(s)',
    ]
    if (plano.revisar.length) partes.push(plano.revisar.length + ' para revisar (linhas em laranja)')
    return 'Pronto: ' + partes.join(', ') + '. O site atualiza em instantes.'
  } finally {
    trava.releaseLock()
  }
}

const HTML_IMPORTACAO_SEMINOVOS = `
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 0; }
  p { margin: 0 0 8px; line-height: 1.4; }
  textarea { width: 100%; height: 200px; box-sizing: border-box; padding: 8px; font-family: monospace; font-size: 12px; }
  .botoes { display: flex; gap: 8px; margin: 10px 0; }
  button { padding: 8px 14px; border: 1px solid #ccc; border-radius: 6px; background: #fff; font-size: 13px; cursor: pointer; }
  button.principal { background: #1a73e8; border-color: #1a73e8; color: #fff; }
  button:disabled { opacity: .5; cursor: default; }
  #resultado { max-height: 260px; overflow: auto; }
  h4 { margin: 12px 0 4px; font-size: 13px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 3px 0; }
  .ok { color: #188038; } .alerta { color: #b06000; } .erro { color: #c5221f; }
</style>
<p>Cole a mensagem com o <b>estoque completo</b> e clique em <b>Conferir</b>.
Nada muda na planilha até você clicar em <b>Aplicar</b>.</p>
<textarea id="texto" placeholder="IPHONE 17 PRO MAX 256GB&#10;SILVER&#10;100%&#10;R$ 6.890,00&#10;...&#10;IMEI: 0651"></textarea>
<div class="botoes">
  <button id="conferir" class="principal">Conferir</button>
  <button id="aplicar" disabled>Aplicar na planilha</button>
</div>
<div id="resultado"></div>
<script>
  var texto = document.getElementById('texto')
  var btnConferir = document.getElementById('conferir')
  var btnAplicar = document.getElementById('aplicar')
  var resultado = document.getElementById('resultado')

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }
  function secao(titulo, itens, classe) {
    if (!itens.length) return ''
    return '<h4 class="' + classe + '">' + esc(titulo) + ' (' + itens.length + ')</h4><ul>' +
      itens.map(function (i) { return '<li>' + esc(i) + '</li>' }).join('') + '</ul>'
  }
  function mostrar(p) {
    var h = p.prontos === 0
      ? '<p class="erro"><b>Nenhum aparelho reconhecido. Confira se colou a lista inteira.</b></p>'
      : '<p class="ok"><b>' + p.prontos + ' aparelho(s) lido(s) da lista.</b>' +
        (p.iguais ? ' ' + p.iguais + ' sem mudança.' : '') + '</p>'
    h += secao('Entram no site', p.novos, 'ok')
    h += secao('Atualizados', p.atualizados, '')
    h += secao('Saem do site (marcados como vendidos)', p.vendidos, 'alerta')
    h += secao('Precisam de revisão', p.revisar, 'erro')
    h += secao('Linhas que não entendi (ignoradas)', p.ignoradas, 'alerta')
    resultado.innerHTML = h
  }
  function falhou(e) {
    btnConferir.disabled = false
    resultado.innerHTML = '<p class="erro"><b>' + esc(e && e.message ? e.message : e) + '</b></p>'
  }

  texto.addEventListener('input', function () { btnAplicar.disabled = true })
  btnConferir.onclick = function () {
    btnConferir.disabled = true
    btnAplicar.disabled = true
    resultado.innerHTML = '<p>Conferindo…</p>'
    google.script.run
      .withSuccessHandler(function (p) {
        btnConferir.disabled = false
        btnAplicar.disabled = p.prontos === 0
        mostrar(p)
      })
      .withFailureHandler(falhou)
      .previaSeminovos(texto.value)
  }
  btnAplicar.onclick = function () {
    btnAplicar.disabled = true
    btnConferir.disabled = true
    resultado.innerHTML = '<p>Aplicando…</p>'
    google.script.run
      .withSuccessHandler(function (msg) {
        btnConferir.disabled = false
        resultado.innerHTML = '<p class="ok"><b>' + esc(msg) + '</b></p>'
      })
      .withFailureHandler(falhou)
      .aplicarSeminovos(texto.value)
  }
</script>
`
