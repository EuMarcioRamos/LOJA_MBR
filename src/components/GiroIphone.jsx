import { useEffect, useRef } from 'react'
import { WHATSAPP_NUMERO } from '../config'

// Giro do iPhone controlado pela rolagem (técnica das páginas da Apple):
// uma sequência de imagens em public/giro é desenhada num canvas, e a posição
// da rolagem dentro da seção escolhe qual imagem aparece.
// No celular usa a versão leve (metade dos frames, imagens menores).
//
// Os frames só cobrem meia-volta (costas -> lado -> frente). Como não existe
// um conjunto real de 360°, a segunda metade da rolagem percorre os mesmos
// frames de novo, mas ao contrário: costas -> ... -> frente -> ... -> costas.
// Chegamos a testar espelhar os frames na volta pra fingir um giro contínuo
// numa única direção, mas o padrão da tela (o fundo animado) não é simétrico
// e ficava visivelmente invertido — por isso aqui é sempre a imagem original,
// sem espelho, mesmo que isso signifique o giro "voltando" no meio.
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
    // naturalWidth fica disponível antes da imagem estar de fato decodificada —
    // desenhar nesse momento força uma decodificação síncrona (trava visível).
    // Por isso só marcamos como "pronto" depois que img.decode() resolve.
    const prontos = new Array(total).fill(false)
    let ultimoDesenhado = -1
    let agendado = false
    let desmontado = false

    const desenhar = (pos) => {
      // Se o frame ainda não chegou, usa o já carregado mais próximo dele
      // (procurando pros dois lados, não só pra trás) pra reduzir saltos
      let alvo = pos
      if (!prontos[alvo]) {
        let abaixo = pos - 1
        let acima = pos + 1
        while (abaixo >= 0 || acima < total) {
          if (abaixo >= 0 && prontos[abaixo]) { alvo = abaixo; break }
          if (acima < total && prontos[acima]) { alvo = acima; break }
          abaixo--
          acima++
        }
      }
      const img = imagens[alvo]
      if (!prontos[alvo] || alvo === ultimoDesenhado) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ultimoDesenhado = alvo
    }

    // p=0: costas · p=0.5: frente · p=1: costas de novo — a segunda metade
    // percorre os mesmos frames ao contrário (sem espelhar), então o giro
    // "volta" no meio em vez de continuar sempre pro mesmo lado
    const quadroNoProgresso = (p) => {
      const meio = 0.5
      if (p <= meio) return Math.round(total - 1 - (p / meio) * (total - 1))
      return Math.round(((p - meio) / (1 - meio)) * (total - 1))
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
      desenhar(quadroNoProgresso(p))
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
      img.src = urlDoFrame(pos)
      imagens[pos] = img
      const marcarPronto = () => {
        prontos[pos] = true
        atualizar()
      }
      // decode() só resolve com o frame já decodificado e pronto pra desenhar
      // sem travar a thread principal na hora do drawImage. Se falhar, só marca
      // pronto se a imagem chegou mesmo: desenhar um frame quebrado lança erro e
      // congelava os textos do banner (o desenho usa o vizinho que carregou)
      if (img.decode) img.decode().then(marcarPronto).catch(() => { if (img.naturalWidth > 0) marcarPronto() })
      else img.onload = marcarPronto
    }

    // Primeiro frame (costas, é o que aparece em p=0) na hora; o resto só
    // depois que a página terminou de abrir, para não disputar banda com
    // o catálogo e os preços. Carrega de trás pra frente (total-2, total-3, ...)
    // porque é a ordem que a rolagem percorre primeiro a partir do frame
    // inicial — senão os frames vizinhos ainda não chegaram e o giro trava.
    carregar(total - 1)
    let idleId = null
    let timeoutId = null
    const carregarResto = () => {
      for (let p = total - 2; p >= 0; p--) carregar(p)
    }
    const agendarResto = () => {
      if ('requestIdleCallback' in window) idleId = requestIdleCallback(carregarResto)
      else timeoutId = setTimeout(carregarResto, 200)
    }
    if (semAnimacao) {
      // já carregado pela linha acima (mesmo frame de descanso)
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
              <h2>Até 21x no cartão.</h2>
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
