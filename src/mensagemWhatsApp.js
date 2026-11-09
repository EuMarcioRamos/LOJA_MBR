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

// Pronta entrega ou a pedido: só aparece quando o site mostra os dois tipos
// (item.entrega vem do card); sem isso a mensagem fica como sempre foi
export const TEXTO_A_PEDIDO = 'A pedido (chega em até 7 a 8 dias úteis)'
function textoEntrega(item) {
  if (item.entrega === 'pedido') return TEXTO_A_PEDIDO
  if (item.entrega === 'pronta') return 'Pronta entrega'
  return null
}

function linhaCondicao(item) {
  const condicao = !item.seminovo ? 'Lacrado' : item.imei ? `Seminovo · IMEI: ${item.imei}` : 'Seminovo'
  return [condicao, textoEntrega(item)].filter(Boolean).join(' · ')
}

// No card do seminovo a abertura já diz "seminovo": a linha fica só com o IMEI
// (e, no a pedido, o aviso do prazo)
function blocoDoItem(item, { soImei = false } = {}) {
  const titulo = [item.nome, ...detalhesDoItem({ ...item, cor: null })].join(' ')
  const linhas = [`📱 *${titulo}${item.cor ? ` - ${item.cor}` : ''}*`]
  if (!soImei) linhas.push(linhaCondicao(item))
  else {
    if (item.imei) linhas.push(`IMEI: ${item.imei}`)
    if (item.entrega === 'pedido') linhas.push(TEXTO_A_PEDIDO)
  }
  if (Number.isFinite(item.preco)) linhas.push(`💰 ${emReais(item.preco)}`)
  return linhas.join('\n')
}

// Navegadores de dentro de outros apps (Instagram, Facebook, TikTok...) às
// vezes bloqueiam abrir o WhatsApp direto: neles o link segue abrindo a
// página do WhatsApp na web, como sempre
const NAVEGADOR_DE_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp/i

// No celular (e no iPad, que se apresenta como Mac com tela de toque) o link
// abre o app do WhatsApp direto, sem passar pela página dele na web, que
// tirava a pessoa do site. No computador nada muda: o link abre numa aba nova
export function abreWhatsAppDireto(ua = navigator.userAgent, plataforma = navigator.platform, toques = navigator.maxTouchPoints) {
  if (NAVEGADOR_DE_APP.test(ua)) return false
  return /Android|iPhone|iPad|iPod/i.test(ua) || (plataforma === 'MacIntel' && toques > 1)
}

// Os links do WhatsApp do site (os wa.me também, se algum aparecer)
export const SELETOR_LINK_WHATSAPP = 'a[href^="https://api.whatsapp.com/send"], a[href^="https://wa.me/"]'

// "https://api.whatsapp.com/send/?phone=5583...&text=Olá" (ou wa.me/5583...?text=Olá)
// -> "whatsapp://send?phone=5583...&text=Ol%C3%A1"
export function enderecoNoApp(link) {
  const url = new URL(link)
  const telefone = (url.searchParams.get('phone') || url.pathname).replace(/\D/g, '')
  const texto = url.searchParams.get('text')
  return `whatsapp://send?phone=${telefone}${texto ? `&text=${encodeURIComponent(texto)}` : ''}`
}

// Link do WhatsApp da loja, com ou sem mensagem pronta. Vai direto pro
// api.whatsapp.com/send, o endereço pra onde o wa.me redireciona: nesse
// redirecionamento o wa.me troca cada emoji por "�" e a mensagem chegava com
// "?" no lugar deles (os acentos passavam). Os parâmetros são os mesmos que o
// próprio wa.me põe. Use sempre esta função, nunca um link wa.me
export function linkWhatsApp(texto) {
  const mensagem = texto ? `&text=${encodeURIComponent(texto)}` : ''
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMERO}${mensagem}&type=phone_number&app_absent=0`
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
