import { WHATSAPP_NUMERO } from './config'

// Mensagens de interesse que vão pro WhatsApp (painel do carrinho e botão
// "Comprar via" dos cards), no estilo da lista que a loja manda: um bloco por
// item, separados por uma linha em branco, com o nome em negrito, a condição
// (lacrado, ou seminovo com o IMEI pra loja saber qual aparelho) e o preço.
//
// Olá! 👋 Tenho interesse nesses produtos:
//
// 📱 *iPhone 17 Pro Max 256GB - Prata*
// Seminovo · IMEI: 0651
// 💰 R$ 6.890,00
//
// Ainda estão disponíveis? 😊

const emReais = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Tamanho, armazenamento e cor do item, sem o "Padrão" dos AirPods (que só
// existe pra preencher o campo de armazenamento)
export function detalhesDoItem(item) {
  return [item.tamanho, item.armazenamento === 'Padrão' ? null : item.armazenamento, item.cor].filter(Boolean)
}

function linhaCondicao(item) {
  if (!item.seminovo) return 'Lacrado'
  return item.imei ? `Seminovo · IMEI: ${item.imei}` : 'Seminovo'
}

// No card do seminovo a abertura já diz "seminovo": a linha fica só com o IMEI
function blocoDoItem(item, { soImei = false } = {}) {
  const titulo = [item.nome, ...detalhesDoItem({ ...item, cor: null })].join(' ')
  const linhas = [`📱 *${titulo}${item.cor ? ` - ${item.cor}` : ''}*`]
  if (!soImei) linhas.push(linhaCondicao(item))
  else if (item.imei) linhas.push(`IMEI: ${item.imei}`)
  if (Number.isFinite(item.preco)) linhas.push(`💰 ${emReais(item.preco)}`)
  return linhas.join('\n')
}

export function linkWhatsApp(texto) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`
}

export function mensagemDoCarrinho(itens) {
  const um = itens.length === 1
  return [
    `Olá! 👋 Tenho interesse ${um ? 'neste produto' : 'nesses produtos'}:`,
    ...itens.map(item => blocoDoItem(item)),
    um ? 'Ainda está disponível? 😊' : 'Ainda estão disponíveis? 😊',
  ].join('\n\n')
}

export function mensagemDoCard(item) {
  return [
    `Olá! 👋 Tenho interesse ${item.seminovo ? 'neste seminovo' : 'neste produto'}:`,
    blocoDoItem(item, { soImei: item.seminovo }),
    'Ainda está disponível? 😊',
  ].join('\n\n')
}
