import { useState, useEffect, useRef } from 'react'

const SLIDES = [
  {
    tipo: 'mascote',
    imagem: '/mascote.png',
    eyebrow: 'Assistência Especializada Apple',
    titulo: 'Master BRPB',
    subtitulo: 'o point Apple da Paraíba',
    texto: 'Escolha o modelo, a cor e o armazenamento ideal. Fale conosco direto pelo WhatsApp.',
  },
  {
    tipo: 'produto',
    imagem: '/hero/iphone18-teaser.png',
    eyebrow: 'Em breve',
    titulo: 'iPhone 18 está chegando',
    texto: 'A nova geração já tem data marcada pela Apple. Enquanto isso, as linhas 17, 16 e 15 já estão disponíveis na Master BRPB.',
    categoria: 'iPhone',
    cta: 'Ver iPhones disponíveis',
  },
  {
    tipo: 'produto',
    imagem: '/hero/ipad-mini-finish-unselect-gallery-1-202410.png',
    eyebrow: 'iPad',
    titulo: 'iPads pra todo tipo de uso',
    texto: 'Pro, Air, mini ou o iPad tradicional — encontre o ideal pra você na Master BRPB.',
    categoria: 'iPad',
    cta: 'Ver iPads',
  },
  {
    tipo: 'produto',
    imagem: '/hero/macbook-neo-hero.png',
    eyebrow: 'Novidade',
    titulo: 'MacBook Neo já disponível',
    texto: 'O notebook mais acessível da Apple chegou em várias cores. E também temos MacBook Air e Pro em diversas configurações.',
    categoria: 'MacBook',
    cta: 'Ver MacBooks',
  },
]

const INTERVALO_MS = 6500

function TextoSlide({ slide, onEscolherCategoria, corEyebrow = '#ccc', corTexto = '#d5d5d5', comSombra = false }) {
  const sombra = comSombra ? { textShadow: '0 2px 16px rgba(0,0,0,0.6)' } : {}
  const sombraTexto = comSombra ? { textShadow: '0 1px 10px rgba(0,0,0,0.7)' } : {}
  return (
    <>
      <p style={{ fontSize: 11, color: corEyebrow, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>
        {slide.eyebrow}
      </p>
      <h1 style={{
        fontSize: 'clamp(22px, 4vw, 42px)',
        fontWeight: 700, color: '#fff',
        letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 12,
        ...sombra,
      }}>
        {slide.titulo}
      </h1>
      <p style={{ fontSize: 14.5, color: corTexto, maxWidth: 460, margin: '0 auto 18px', ...sombraTexto }}>
        {slide.texto}
      </p>
      {slide.categoria && (
        <button
          onClick={() => onEscolherCategoria?.(slide.categoria)}
          style={{
            background: '#fff', color: '#000', border: 'none',
            borderRadius: 50, padding: '10px 24px',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {slide.cta}
        </button>
      )}
    </>
  )
}

export default function HeroCarousel({ onEscolherCategoria }) {
  const [indice, setIndice] = useState(0)
  const timerRef = useRef(null)

  const iniciarAutoplay = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndice(i => (i + 1) % SLIDES.length)
    }, INTERVALO_MS)
  }

  useEffect(() => {
    iniciarAutoplay()
    return () => clearInterval(timerRef.current)
  }, [])

  const selecionar = (i) => {
    setIndice(i)
    iniciarAutoplay()
  }

  return (
    <div style={{
      position: 'relative',
      height: 'clamp(460px, 62vw, 620px)',
      overflow: 'hidden',
      background: '#0a0a0a',
    }}>
      {SLIDES.map((slide, i) => {
        const ativo = i === indice
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: ativo ? 1 : 0,
              transition: 'opacity 0.7s ease',
              pointerEvents: ativo ? 'auto' : 'none',
            }}
          >
            {slide.tipo === 'mascote' && (
              <div style={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={slide.imagem}
                  alt="Master BRPB"
                  style={{ height: '86%', marginTop: '-4%', width: 'auto', display: 'block', objectFit: 'contain' }}
                />
                <div style={{
                  position: 'absolute', top: '63%', left: 0, right: 0,
                  textAlign: 'center', padding: '0 32px',
                }}>
                  <p style={{ fontSize: 11, color: '#8a8a8a', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8 }}>
                    {slide.eyebrow}
                  </p>
                  <h1 style={{
                    fontSize: 'clamp(26px, 4.6vw, 56px)',
                    fontWeight: 700, color: '#fff',
                    letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 10,
                    textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                  }}>
                    {slide.titulo}<br />
                    <span style={{ color: '#aaa', fontSize: '0.55em' }}>{slide.subtitulo}</span>
                  </h1>
                  <p style={{ fontSize: 14, color: '#a0a0a0', maxWidth: 420, margin: '0 auto', textShadow: '0 1px 10px rgba(0,0,0,0.9)' }}>
                    {slide.texto}
                  </p>
                </div>
              </div>
            )}

            {slide.tipo === 'produto' && (
              <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 80% 60% at 50% 38%, #1e1e22 0%, #0a0a0a 72%)',
                }} />
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '58%',
                  padding: 'clamp(16px, 4vw, 36px) clamp(24px, 6vw, 64px) 0',
                  boxSizing: 'border-box',
                }}>
                  <img
                    src={slide.imagem}
                    alt={slide.titulo}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                      filter: 'drop-shadow(0 22px 44px rgba(0,0,0,0.55))',
                    }}
                  />
                </div>
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  padding: '0 32px 48px', textAlign: 'center',
                }}>
                  <TextoSlide slide={slide} onEscolherCategoria={onEscolherCategoria} />
                </div>
              </div>
            )}

            {slide.tipo === 'foto' && (
              <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                <img
                  src={slide.imagem}
                  alt={slide.titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 32%, rgba(10,10,10,0.1) 62%, transparent 100%)',
                }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  padding: '0 32px 68px', textAlign: 'center',
                }}>
                  <TextoSlide slide={slide} onEscolherCategoria={onEscolherCategoria} comSombra />
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 8, zIndex: 3,
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => selecionar(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === indice ? 22 : 8, height: 8, borderRadius: 4,
              border: 'none', padding: 0, cursor: 'pointer',
              background: i === indice ? '#fff' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
