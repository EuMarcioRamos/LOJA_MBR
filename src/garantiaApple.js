// A planilha guarda a garantia Apple do seminovo do jeito que o script resume
// a lista do WhatsApp: "até fev/2027" ou, com o dia, "até 08/12/26". No card
// ela aparece como "Ativa", com a validade por extenso embaixo ("Até fevereiro
// de 2027", "Até 08/12/2026"); garantia que já venceu não aparece, pra o card
// não anunciar uma garantia que o aparelho não tem mais

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const ABREVIADOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const doisDigitos = (n) => String(n).padStart(2, '0')

// -> { vencida, detalhe } ou null se não há garantia Apple
export function validadeGarantiaApple(texto, hoje = new Date()) {
  const t = String(texto ?? '').trim().toLowerCase()
  if (!t) return null

  let fim
  let detalhe
  let m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/)
  if (m) {
    const dia = Number(m[1])
    const mes = Number(m[2]) - 1
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
    fim = new Date(ano, mes, dia, 23, 59, 59)
    detalhe = `Até ${doisDigitos(dia)}/${doisDigitos(mes + 1)}/${ano}`
  } else if ((m = t.match(/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\.?\s*(?:\/|de)?\s*(\d{4})\b/))) {
    const mes = ABREVIADOS.indexOf(m[1])
    const ano = Number(m[2])
    // vale até o último dia do mês
    fim = new Date(ano, mes + 1, 0, 23, 59, 59)
    detalhe = `Até ${MESES[mes]} de ${ano}`
  } else {
    // sem data reconhecível: "ativa" (o script usa quando a lista não diz até
    // quando) fica sem detalhe; outro texto aparece como veio
    const livre = t === 'ativa' ? null : t.charAt(0).toUpperCase() + t.slice(1)
    return { vencida: false, detalhe: livre }
  }

  if (Number.isNaN(fim.getTime())) return { vencida: false, detalhe: null }
  return { vencida: fim < hoje, detalhe }
}
