import { useEffect, useRef } from 'react'
import { WHATSAPP_NUMERO } from '../config'

// Giro do iPhone controlado pela rolagem (técnica das páginas da Apple):
// uma sequência de imagens em public/giro é desenhada num canvas, e a posição
// da rolagem dentro da seção escolhe qual imagem aparece.
// No celular usa a versão leve (metade dos frames, imagens menores).
const FRAMES_DESKTOP = 90
const FRAMES_CELULAR = 45
const BREAKPOINT_CELULAR = 899

// Trechos da rolagem (0 a 1) em que cada texto aparece
const TRECHOS = [
  { de: 0, ate: 0.22 },
  { de: 0.32, ate: 0.58 },
  { de: 0.72, ate: 1.01 },
]

function opacidadeNoTrecho(p, { de, ate }) {
  const borda = 0.06
  if (p < de - borda || p > ate + borda) return 0
  if (p < de) return (p - (de - borda)) / borda
  if (p > ate) return 1 - (p - ate) / borda
  return 1
}

const mensagemWhatsapp = encodeURIComponent('Olá! Tenho interesse no iPhone 18 Pro Max. Pode me passar as informações?')

export default function GiroIphone({ onVerProdutos, onEscolherCategoria }) {
  const secaoRef = useRef(null)
  const canvasRef = useRef(null)
  const textosRef = useRef([])
  const dicaRef = useRef(null)

  useEffect(() => {
    const celular = window.matchMedia(`(max-width: ${BREAKPOINT_CELULAR}px)`).matches
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pasta = celular ? '/giro/celular' : '/giro/desktop'
    const total = celular ? FRAMES_CELULAR : FRAMES_DESKTOP
    const urlDoFrame = (i) => `${pasta}/${String(i).padStart(4, '0')}.webp`

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imagens = new Array(total)
    let ultimoDesenhado = -1
    let agendado = false
    let desmontado = false

    const desenhar = (pos) => {
      // Se o frame ainda não chegou, usa o mais próximo que já carregou
      let alvo = pos
      while (alvo > 0 && !imagens[alvo]?.naturalWidth) alvo--
      const img = imagens[alvo]
      if (!img?.naturalWidth || alvo === ultimoDesenhado) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ultimoDesenhado = alvo
    }

    const progresso = () => {
      const secao = secaoRef.current
      const percurso = secao.offsetHeight - window.innerHeight
      return Math.min(1, Math.max(0, -secao.getBoundingClientRect().top / percurso))
    }

    const atualizar = () => {
      agendado = false
      if (desmontado) return
      if (semAnimacao) {
        desenhar(total - 1)
        return
      }
      const p = progresso()
      desenhar(Math.round(p * (total - 1)))
      textosRef.current.forEach((el, i) => {
        if (!el) return
        const o = opacidadeNoTrecho(p, TRECHOS[i])
        el.style.opacity = o
        el.style.transform = `translateY(${(1 - o) * 16}px)`
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      })
      if (dicaRef.current) dicaRef.current.style.opacity = p > 0.04 ? 0 : 1
    }

    const carregar = (pos) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = atualizar
      img.src = urlDoFrame(pos)
      imagens[pos] = img
    }

    // Primeiro frame na hora; o resto só depois que a página terminou de abrir,
    // para não disputar banda com o catálogo e os preços
    carregar(0)
    let idleId = null
    let timeoutId = null
    const carregarResto = () => {
      for (let p = 1; p < total; p++) carregar(p)
    }
    const agendarResto = () => {
      if ('requestIdleCallback' in window) idleId = requestIdleCallback(carregarResto)
      else timeoutId = setTimeout(carregarResto, 200)
    }
    if (semAnimacao) {
      carregar(total - 1)
    } else if (document.readyState === 'complete') {
      agendarResto()
    } else {
      window.addEventListener('load', agendarResto, { once: true })
    }

    const aoRolar = () => {
      if (!agendado) {
        agendado = true
        requestAnimationFrame(atualizar)
      }
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    atualizar()

    return () => {
      desmontado = true
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
      window.removeEventListener('load', agendarResto)
      if (idleId !== null) cancelIdleCallback(idleId)
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [])

  const guardarTexto = (i) => (el) => { textosRef.current[i] = el }

  return (
    <section className="giro" ref={secaoRef} aria-label="iPhone 18 Pro Max em destaque">
      <div className="giro-fixo">
        <div className="giro-conteudo">
          <div className="giro-textos">
            <div className="giro-texto" ref={guardarTexto(0)}>
              <p className="giro-eyebrow">Assistência especializada Apple · Patos, PB</p>
              <h1>iPhone 18 Pro Max</h1>
              <p className="giro-sub">Agora na MasterBR.</p>
              <div className="giro-ctas">
                <button className="giro-cta giro-cta-branco" onClick={onVerProdutos}>Ver produtos</button>
              </div>
            </div>

            <div className="giro-texto" ref={guardarTexto(1)}>
              <h2>Câmera tripla. Acabamento premium.</h2>
              <p className="giro-sub">Originais, com atendimento de quem entende de Apple.</p>
            </div>

            <div className="giro-texto" ref={guardarTexto(2)}>
              <h2>Até 12x no cartão.</h2>
              <p className="giro-sub">Garanta o seu e fale direto com a gente pelo WhatsApp.</p>
              <div className="giro-ctas">
                <button className="giro-cta giro-cta-branco" onClick={() => onEscolherCategoria('iPhone')}>Ver iPhones</button>
                <a
                  className="giro-cta giro-cta-verde"
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${mensagemWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} width="1000" height="1250" role="img" aria-label="iPhone 18 Pro Max girando" />
        </div>

        <div className="giro-dica" ref={dicaRef} aria-hidden="true">Role para girar<span /></div>
      </div>
    </section>
  )
}
