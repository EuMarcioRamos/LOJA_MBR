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
// O canvas usa exatamente o tamanho dos frames de cada versão. Antes era sempre
// 1000×1250, e no celular (frames de 560×700) cada quadro era ampliado ~3x a
// cada passo da rolagem sem ganhar qualidade nenhuma — era o que travava
const TAMANHO_DESKTOP = [1000, 1250]
const TAMANHO_CELULAR = [560, 700]

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
    ;[canvas.width, canvas.height] = celular ? TAMANHO_CELULAR : TAMANHO_DESKTOP
    const ctx = canvas.getContext('2d')
    const imagens = new Array(total)
    // naturalWidth fica disponível antes da imagem estar de fato decodificada —
    // desenhar nesse momento força uma decodificação síncrona (trava visível).
    // Por isso só marcamos como "pronto" depois que img.decode() resolve.
    const prontos = new Array(total).fill(false)
    const pedidos = new Array(total).fill(false)
    let desmontado = false

    // ── Desenho ──
    // A posição no giro é contínua (ex.: 20.4 = entre os frames 20 e 21). Em
    // movimento, os dois frames vizinhos são misturados e a rotação fica
    // contínua, em vez de pular de frame em frame; parado, mostra só um frame,
    // nítido. Em aparelho lento (modoLeve) mostra sempre um frame só.
    let ultimoDesenho = ''
    let modoLeve = false

    // Se o frame ainda não chegou, usa o já carregado mais próximo dele
    // (procurando pros dois lados) pra reduzir saltos
    const prontoMaisProximo = (pos) => {
      if (prontos[pos]) return pos
      for (let d = 1; d < total; d++) {
        if (pos - d >= 0 && prontos[pos - d]) return pos - d
        if (pos + d < total && prontos[pos + d]) return pos + d
      }
      return -1
    }

    const desenhar = (pos, mistura) => {
      const a = Math.floor(pos)
      const b = Math.min(total - 1, a + 1)
      const { width: w, height: h } = canvas
      if (!modoLeve && mistura > 0.02 && mistura < 0.98 && prontos[a] && prontos[b]) {
        const chave = `${a}:${Math.round(mistura * 32)}`
        if (chave === ultimoDesenho) return
        ctx.clearRect(0, 0, w, h)
        ctx.globalAlpha = 1 - mistura
        ctx.drawImage(imagens[a], 0, 0, w, h)
        // 'lighter' soma os dois: a·(1-m) + b·m, a mistura certa pra frames com fundo transparente
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = mistura
        ctx.drawImage(imagens[b], 0, 0, w, h)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        ultimoDesenho = chave
        return
      }
      const alvo = prontoMaisProximo(mistura < 0.5 ? a : b)
      if (alvo < 0 || String(alvo) === ultimoDesenho) return
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(imagens[alvo], 0, 0, w, h)
      ultimoDesenho = String(alvo)
    }

    // p=0: costas · p=0.5: frente · p=1: costas de novo — a segunda metade
    // percorre os mesmos frames ao contrário (sem espelhar), então o giro
    // "volta" no meio em vez de continuar sempre pro mesmo lado
    const posicaoNoProgresso = (p) => {
      const meio = 0.5
      if (p <= meio) return (total - 1) * (1 - p / meio)
      return (total - 1) * ((p - meio) / (1 - meio))
    }

    // Posição da seção medida uma vez (e de novo ao redimensionar), em vez de
    // medir a página a cada quadro da rolagem
    let topoSecao = 0
    let percurso = 1
    const medirSecao = () => {
      const secao = secaoRef.current
      topoSecao = secao.getBoundingClientRect().top + window.scrollY
      percurso = Math.max(1, secao.offsetHeight - window.innerHeight)
    }
    medirSecao()

    const progresso = () => Math.min(1, Math.max(0, (window.scrollY - topoSecao) / percurso))

    // Os textos só são reescritos quando a opacidade muda; com a página rolada
    // além do giro (p parado em 1) nada é refeito
    let ultimoP = -1
    const ultimaOpacidade = []
    const atualizarTextos = (p) => {
      if (p === ultimoP) return
      ultimoP = p
      textosRef.current.forEach((el, i) => {
        if (!el) return
        const o = opacidadeNoTrecho(p, TRECHOS[i])
        if (o === ultimaOpacidade[i]) return
        ultimaOpacidade[i] = o
        el.style.opacity = o
        el.style.transform = `translateY(${(1 - o) * 16}px)`
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      })
      if (dicaRef.current) dicaRef.current.style.opacity = p > 0.04 ? 0 : 1
    }

    // ── Rolagem suavizada ──
    // A rotação "persegue" a posição da rolagem a cada quadro de tela (como o
    // Lenis/GSAP fazem nos sites 3D), em vez de pular junto com os eventos de
    // rolagem: no celular eles chegam em rajadas irregulares, o que parecia
    // travamento. O loop só roda enquanto há movimento.
    const SUAVIZACAO = 0.2 // fração do caminho que falta, percorrida por quadro (a 60fps)
    // passo de um frame em unidades de progresso; bem abaixo disso de velocidade
    // (quase parando), a mistura vai se acomodando no frame inteiro mais próximo
    const PASSO_FRAME = 0.5 / (total - 1)
    let alvoP = progresso()
    let atualP = alvoP
    let rodando = false
    let ultimoTempo = 0
    let mediaQuadro = 16.7

    const renderizar = (velocidade) => {
      if (semAnimacao) {
        desenhar(total - 1, 0)
        return
      }
      const pos = posicaoNoProgresso(atualP)
      const fracao = pos - Math.floor(pos)
      const inteiro = Math.round(fracao)
      const k = Math.min(1, velocidade / (PASSO_FRAME * 0.1))
      desenhar(pos, inteiro + (fracao - inteiro) * k)
      atualizarTextos(atualP)
    }

    const passo = (agora) => {
      if (desmontado) return
      const dt = ultimoTempo ? Math.min(100, agora - ultimoTempo) : 16.7
      ultimoTempo = agora
      // aparelho lento: se os quadros passam de ~28ms em média, desliga a mistura
      mediaQuadro += (dt - mediaQuadro) * 0.1
      if (mediaQuadro > 28) modoLeve = true
      const anterior = atualP
      atualP += (alvoP - atualP) * (1 - Math.pow(1 - SUAVIZACAO, dt / 16.7))
      const chegou = Math.abs(alvoP - atualP) < 0.0002
      if (chegou) atualP = alvoP
      // ao chegar, velocidade 0: termina sempre num frame nítido
      renderizar(chegou ? 0 : Math.abs(atualP - anterior) * (16.7 / dt))
      if (!chegou) {
        requestAnimationFrame(passo)
      } else {
        rodando = false
        ultimoTempo = 0
      }
    }

    function aoRolar() {
      if (semAnimacao) return
      alvoP = progresso()
      if (rodando || desmontado) return
      rodando = true
      requestAnimationFrame(passo)
    }

    // Quando um frame termina de carregar fora de um movimento, redesenha
    // (agrupando os que terminam em rajada num desenho por quadro de tela)
    let redesenhoAgendado = false
    const redesenhar = () => {
      if (rodando || redesenhoAgendado) return
      redesenhoAgendado = true
      requestAnimationFrame(() => {
        redesenhoAgendado = false
        if (!desmontado) renderizar(0)
      })
    }

    const carregar = (pos) => {
      if (pedidos[pos]) return
      pedidos[pos] = true
      const img = new Image()
      img.decoding = 'async'
      img.src = urlDoFrame(pos)
      imagens[pos] = img
      const marcarPronto = () => {
        prontos[pos] = true
        redesenhar()
      }
      // No celular o frame é guardado já decodificado (ImageBitmap): o navegador
      // pode jogar fora a decodificação de imagens que não estão na página e
      // refazê-la na hora do drawImage, travando a rolagem. No computador seriam
      // ~450MB (90 frames de 1000×1250), então lá fica a imagem comum
      const pronto = () => {
        if (!celular || !window.createImageBitmap) return marcarPronto()
        createImageBitmap(img).then((bitmap) => {
          if (desmontado) return bitmap.close()
          imagens[pos] = bitmap
          marcarPronto()
        }, marcarPronto)
      }
      // decode() só resolve com o frame já decodificado e pronto pra desenhar
      // sem travar a thread principal na hora do drawImage. Se falhar, só marca
      // pronto se a imagem chegou mesmo: desenhar um frame quebrado lança erro e
      // congelava os textos do banner (o desenho usa o vizinho que carregou)
      if (img.decode) img.decode().then(pronto).catch(() => { if (img.naturalWidth > 0) pronto() })
      else img.onload = pronto
    }

    // Carregamento progressivo: o frame inicial (costas, p=0) na hora e, logo
    // em seguida, um a cada 8 — a volta inteira fica coberta cedo, com poucos
    // KB. O resto vem depois que a página terminou de abrir (pra não disputar
    // banda com o catálogo e os preços), de 4 em 4, 2 em 2 e por fim todos.
    // Sempre de trás pra frente, que é a ordem que a rolagem percorre primeiro.
    const carregarDeTantoEmTanto = (saltos) => {
      for (const salto of saltos) {
        for (let p = total - 1; p >= 0; p -= salto) carregar(p)
      }
    }
    carregar(total - 1)
    let idleId = null
    let timeoutId = null
    const carregarResto = () => carregarDeTantoEmTanto([4, 2, 1])
    const agendarResto = () => {
      if ('requestIdleCallback' in window) idleId = requestIdleCallback(carregarResto)
      else timeoutId = setTimeout(carregarResto, 200)
    }
    if (semAnimacao) {
      // só o frame de descanso, já pedido acima
    } else {
      carregarDeTantoEmTanto([8])
      if (document.readyState === 'complete') agendarResto()
      else window.addEventListener('load', agendarResto, { once: true })
    }

    const aoRedimensionar = () => {
      medirSecao()
      aoRolar()
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRedimensionar)
    renderizar(0)

    return () => {
      desmontado = true
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRedimensionar)
      window.removeEventListener('load', agendarResto)
      if (idleId !== null) cancelIdleCallback(idleId)
      if (timeoutId !== null) clearTimeout(timeoutId)
      // libera a memória dos frames guardados como ImageBitmap (celular)
      imagens.forEach((frame) => frame?.close?.())
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
