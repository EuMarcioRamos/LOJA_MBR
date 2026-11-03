// A planilha guarda a garantia Apple do seminovo do jeito que o script resume
// a lista do WhatsApp: "até fev/2027" ou, com o dia, "até 08/12/26". No card
// ela aparece como o tempo que ainda resta, em verde ("3 meses", ou em dias
// quando falta pouco), com a validade embaixo ("até fev. 2027", ou
// "até 08/12/26" quando a lista traz o dia: o ano curto cabe ao lado do
// rótulo até no card mais estreito da grade, de 270px). Garantia que
// já venceu não aparece, pra o card não anunciar uma garantia que o aparelho
// não tem mais

const ABREVIADOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
// Como o mês aparece embaixo: abreviado com ponto, como no jornal ("maio" não abrevia)
const MES_CURTO = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
const DIA_MS = 24 * 60 * 60 * 1000
// Até 60 dias o tempo que resta aparece em dias; acima disso, em meses
const LIMITE_EM_DIAS = 60

const doisDigitos = (n) => String(n).padStart(2, '0')
const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

function tempoRestante(hoje, ultimoDia) {
  const dias = Math.round((inicioDoDia(ultimoDia) - inicioDoDia(hoje)) / DIA_MS)
  if (dias <= LIMITE_EM_DIAS) return dias === 0 ? 'Último dia' : dias === 1 ? '1 dia' : `${dias} dias`
  let meses = (ultimoDia.getFullYear() - hoje.getFullYear()) * 12 + (ultimoDia.getMonth() - hoje.getMonth())
  if (ultimoDia.getDate() < hoje.getDate()) meses--
  return meses === 1 ? '1 mês' : `${meses} meses`
}

// -> { vencida, restante, validade } ou null se não há garantia Apple.
// restante: "3 meses" / "35 dias" / null (sem data: o card mostra "Ativa")
export function validadeGarantiaApple(texto, hoje = new Date()) {
  const t = String(texto ?? '').trim().toLowerCase()
  if (!t) return null

  let ultimoDia
  let validade
  let m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/)
  if (m) {
    const dia = Number(m[1])
    const mes = Number(m[2]) - 1
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
    ultimoDia = new Date(ano, mes, dia)
    validade = `até ${doisDigitos(dia)}/${doisDigitos(mes + 1)}/${String(ano).slice(2)}`
  } else if ((m = t.match(/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\.?\s*(?:\/|de)?\s*(\d{4})\b/))) {
    const mes = ABREVIADOS.indexOf(m[1])
    const ano = Number(m[2])
    // vale até o último dia do mês
    ultimoDia = new Date(ano, mes + 1, 0)
    validade = `até ${MES_CURTO[mes]} ${ano}`
  } else {
    // sem data reconhecível: "ativa" (o script usa quando a lista não diz até
    // quando) fica sem a linha de baixo; outro texto aparece como veio
    return { vencida: false, restante: null, validade: t === 'ativa' ? null : t }
  }

  if (Number.isNaN(ultimoDia.getTime())) return { vencida: false, restante: null, validade: null }
  const vencida = inicioDoDia(ultimoDia) < inicioDoDia(hoje)
  return { vencida, restante: vencida ? null : tempoRestante(hoje, ultimoDia), validade }
}
