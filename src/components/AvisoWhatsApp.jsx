import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { abreWhatsAppDireto, enderecoNoApp } from '../mensagemWhatsApp'

// No celular, todo link do WhatsApp do site ("https://wa.me/...", nos cards,
// no carrinho, no topo...) abre o app direto pelo endereço whatsapp://. Antes
// ele carregava a página do WhatsApp na web numa aba nova e a pessoa saía do
// site; agora o site fica onde estava e mostra um aviso embaixo. Se o app não
// abrir em alguns segundos (celular sem WhatsApp, ou a pessoa cancelou a
// pergunta do iPhone), o aviso oferece abrir do jeito antigo, pela web.
// Os links continuam sendo links normais: no computador, em navegadores de
// dentro de apps e no "copiar link" nada muda.

const ESPERA_APP_MS = 2500
const AVISO_FALHOU_MS = 8000

// Em desenvolvimento (npm run dev) a abertura pode ser trocada por uma função
// de teste em window.__abrirWhatsApp, pra testar no navegador sem abrir o app
// de verdade. No build do site esse trecho nem existe (import.meta.env.DEV)
function abrirNoApp(endereco) {
  if (import.meta.env.DEV && typeof window.__abrirWhatsApp === 'function') {
    window.__abrirWhatsApp(endereco)
    return
  }
  window.location.href = endereco
}

const IconeWhatsApp = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export default function AvisoWhatsApp() {
  // { fase: 'abrindo' | 'falhou', link: o wa.me original, alvo: onde o aviso aparece }
  const [aviso, setAviso] = useState(null)
  const espera = useRef(null)

  useEffect(() => {
    if (!abreWhatsAppDireto()) return

    const aoClicar = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target.closest?.('a[href^="https://wa.me/"]')
      // o "Abrir de novo" do próprio aviso abre pela web, de propósito
      if (!link || link.hasAttribute('data-whatsapp-web')) return
      e.preventDefault()
      clearTimeout(espera.current)
      // Com o carrinho aberto (<dialog> modal), o resto da página fica por
      // baixo dele e sem resposta ao toque: o aviso vai pra dentro do dialog
      setAviso({ fase: 'abrindo', link: link.href, alvo: link.closest('dialog[open]') ?? document.body })
      espera.current = setTimeout(() => {
        setAviso(atual => atual && { ...atual, fase: 'falhou' })
      }, ESPERA_APP_MS)
      abrirNoApp(enderecoNoApp(link.href))
    }

    // O app abriu: o navegador foi pro fundo. Quem voltar acha o site sem aviso
    const aoSairDaTela = () => {
      if (!document.hidden) return
      clearTimeout(espera.current)
      setAviso(null)
    }

    document.addEventListener('click', aoClicar)
    document.addEventListener('visibilitychange', aoSairDaTela)
    return () => {
      document.removeEventListener('click', aoClicar)
      document.removeEventListener('visibilitychange', aoSairDaTela)
      clearTimeout(espera.current)
    }
  }, [])

  // O "não abriu" some sozinho depois de um tempo
  const falhou = aviso?.fase === 'falhou'
  useEffect(() => {
    if (!falhou) return
    const fechar = setTimeout(() => setAviso(null), AVISO_FALHOU_MS)
    return () => clearTimeout(fechar)
  }, [falhou])

  if (!aviso) return null
  const noCarrinho = aviso.alvo !== document.body
  return createPortal(
    <div className={`aviso-whatsapp${noCarrinho ? ' aviso-whatsapp--no-carrinho' : ''}`} role="status">
      {IconeWhatsApp}
      {/* "Não abriu?" curto pra caber numa linha ao lado dos botões até em
          celular de 360px; o ícone do WhatsApp do lado já diz do que se trata */}
      <span className="aviso-whatsapp-texto">{falhou ? 'Não abriu?' : 'Abrindo o WhatsApp…'}</span>
      {falhou && (
        <>
          <a
            className="aviso-whatsapp-acao"
            href={aviso.link}
            target="_blank"
            rel="noreferrer"
            data-whatsapp-web
            onClick={() => setAviso(null)}
          >
            Abrir de novo
          </a>
          <button className="aviso-whatsapp-fechar" onClick={() => setAviso(null)} aria-label="Fechar aviso">×</button>
        </>
      )}
    </div>,
    aviso.alvo,
  )
}
