/**
 * Cole este código em: dentro da planilha do Google -> Extensões -> Apps Script.
 * Depois publique como App da Web (Implantar -> Nova implantação -> App da Web).
 *
 * Ele lê a aba "Precos" e devolve os dados como JSON, para o site buscar.
 * Só leitura: este script nunca escreve nada na planilha.
 */
function doGet() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Precos')
  const dados = planilha.getDataRange().getValues()
  const linhas = dados.slice(1) // remove o cabeçalho

  // Ordem das colunas na planilha:
  // 0=Categoria 1=Modelo 2=Cor 3=Armazenamento 4=Preco 5=Disponivel 6=ID
  const precos = linhas
    .filter(linha => linha[6]) // ignora linhas sem ID (ex.: linhas em branco no fim)
    .map(linha => ({
      id: String(linha[6]).trim(),
      armazenamento: String(linha[3]).trim(),
      preco: Number(linha[4]) || 0,
      disponivel: String(linha[5]).trim().toUpperCase() === 'SIM',
    }))

  return ContentService
    .createTextOutput(JSON.stringify(precos))
    .setMimeType(ContentService.MimeType.JSON)
}
