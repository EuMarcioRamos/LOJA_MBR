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

// "https://wa.me/5583...?text=Olá" -> "whatsapp://send?phone=5583...&text=Ol%C3%A1"
export function enderecoNoApp(link) {
  const url = new URL(link)
  const telefone = url.pathname.replace(/\D/g, '')
  const texto = url.searchParams.get('text')
  return `whatsapp://send?phone=${telefone}${texto ? `&text=${encodeURIComponent(texto)}` : ''}`
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
