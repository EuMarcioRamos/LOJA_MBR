import { useState } from 'react'

export default function ModeloCard({ modelo, variantes }) {
  const chips = [...new Set(variantes.map(v => v.chip).filter(Boolean))]
  const temChips = chips.length > 1

  const [chipSel, setChipSel] = useState(chips[0] || null)

  const varsPorChip = temChips
    ? variantes.filter(v => v.chip === chipSel)
    : variantes

  const tamanhos = [...new Set(varsPorChip.map(v => v.tamanho).filter(Boolean))]
  const temTamanhos = tamanhos.length > 1

  const [tamanhoSel, setTamanhoSel] = useState(tamanhos[0] || null)
  const [indice, setIndice] = useState(0)
  const [opcaoIdx, setOpcaoIdx] = useState(0)
  const [hover, setHover] = useState(false)

  const varsFiltradas = temTamanhos
    ? varsPorChip.filter(v => v.tamanho === tamanhoSel)
    : varsPorChip

  const safeIdx = Math.max(0, Math.min(indice, varsFiltradas.length - 1))
  const atual = varsFiltradas[safeIdx] ?? varsPorChip[0] ?? variantes[0]
  const safeOpcaoIdx = Math.max(0, Math.min(opcaoIdx, atual.opcoes.length - 1))
  const opcaoAtual = atual.opcoes[safeOpcaoIdx]

  const irPara = (novoIdx) => {
    setIndice(novoIdx)
    setOpcaoIdx(0)
  }

  const selecionarChip = (c) => {
    setChipSel(c)
    const tamanhosDoChip = [...new Set(variantes.filter(v => v.chip === c).map(v => v.tamanho).filter(Boolean))]
    setTamanhoSel(tamanhosDoChip[0] || null)
    setIndice(0)
    setOpcaoIdx(0)
  }

  const selecionarTamanho = (t) => {
    setTamanhoSel(t)
    setOpcaoIdx(0)
  }

  const prev = () => irPara((safeIdx - 1 + varsFiltradas.length) % varsFiltradas.length)
  const next = () => irPara((safeIdx + 1) % varsFiltradas.length)

  const preco = opcaoAtual.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const parcelamento = opcaoAtual.parcelas
    ? `ou ${opcaoAtual.parcelas}x de ${(opcaoAtual.preco / opcaoAtual.parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem juros`
    : null
  const tamanhoMsg = atual.tamanho ? `${atual.tamanho} ` : ''
  const linhaBase = modelo.replace(/ M\d+$/, '')
  const nomeCompleto = atual.chip ? `${linhaBase} ${atual.chip}` : atual.modelo
  const eyebrow = temChips ? linhaBase : 'Apple'
  const titulo = temChips ? chipSel : modelo
  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no ${nomeCompleto} ${tamanhoMsg}${opcaoAtual.armazenamento} ${atual.cor}. Ainda está disponível?`
  )
  const whatsappUrl = `https://wa.me/5583991281912?text=${mensagem}`
  const temDestaque = variantes.some(v => v.destaque)

  const btnNav = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '50%',
    width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#ccc', fontSize: 18,
    transition: 'all 0.2s', zIndex: 1,
    lineHeight: 1, padding: 0,
  }

  const btnSelector = (sel, disabled = false) => ({
    border: sel ? '1.5px solid #fff' : '1.5px solid #2a2a2a',
    background: sel ? '#fff' : 'transparent',
    color: disabled ? '#2e2e2e' : sel ? '#000' : '#888',
    fontWeight: sel ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: disabled ? 'line-through' : 'none',
  })

  return (
    <div
      className="modelo-card-anim"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1e1e1e' : '#161616',
        border: `1px solid ${hover ? '#333' : '#222'}`,
        borderRadius: 16,
        padding: '20px 20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 16px 48px rgba(0,0,0,0.5)' : 'none',
        position: 'relative',
      }}
    >
      {temDestaque && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: '#fff', color: '#000',
          fontSize: 9, fontWeight: 700,
          padding: '3px 9px', borderRadius: 50,
          letterSpacing: '0.8px', textTransform: 'uppercase', zIndex: 3,
        }}>
          Destaque
        </div>
      )}

      {/* Imagem */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 65%, #2e2e32 0%, #131313 100%)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {varsFiltradas.length > 1 && (
          <>
            <button onClick={prev} style={{ ...btnNav, left: 6 }}>‹</button>
            <button onClick={next} style={{ ...btnNav, right: 6 }}>›</button>
          </>
        )}

        {atual.imagem ? (
          <img
            key={atual.id}
            src={atual.imagem}
            alt={`${atual.modelo} ${atual.cor}`}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'center center',
              animation: 'fadeIn 0.25s ease',
              display: 'block',
              filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.07)) drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
            }}
          />
        ) : modelo.startsWith('iPad') ? (
          <svg
            key={atual.id}
            viewBox="0 0 110 140"
            fill="none"
            style={{ width: '70%', height: 'auto', animation: 'fadeIn 0.25s ease' }}
          >
            <rect x="2" y="2" width="106" height="136" rx="12" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="10" y="16" width="90" height="108" rx="4" fill={atual.corHex} opacity="0.85"/>
            <circle cx="55" cy="131" r="4" fill="#2a2a2a"/>
            <circle cx="6" cy="70" r="2.5" fill="#2a2a2a"/>
          </svg>
        ) : modelo.startsWith('Apple Watch') ? (
          <svg
            key={atual.id}
            viewBox="0 0 80 110"
            fill="none"
            style={{ width: '45%', height: 'auto', animation: 'fadeIn 0.25s ease' }}
          >
            <rect x="22" y="0" width="36" height="22" rx="5" fill="#222" stroke="#333" strokeWidth="1.2"/>
            <rect x="22" y="88" width="36" height="22" rx="5" fill="#222" stroke="#333" strokeWidth="1.2"/>
            <rect x="8" y="18" width="64" height="74" rx="18" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="13" y="23" width="54" height="64" rx="14" fill={atual.corHex} opacity="0.9"/>
            <rect x="70" y="36" width="7" height="16" rx="3.5" fill="#2a2a2a" stroke="#333" strokeWidth="1"/>
          </svg>
        ) : (
          <svg
            key={atual.id}
            viewBox="0 0 64 110"
            fill="none"
            style={{ width: '38%', height: 'auto', animation: 'fadeIn 0.25s ease' }}
          >
            <rect x="2" y="2" width="60" height="106" rx="14" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="8" y="14" width="48" height="78" rx="4" fill={atual.corHex} opacity="0.85"/>
            <circle cx="32" cy="98" r="4.5" fill="#2a2a2a"/>
            <rect x="22" y="6" width="20" height="3.5" rx="1.75" fill="#2a2a2a"/>
          </svg>
        )}
      </div>

      {/* Pontos de cor */}
      {varsFiltradas.length > 1 && (
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {varsFiltradas.map((v, i) => (
            <button
              key={v.id}
              onClick={() => irPara(i)}
              title={v.cor}
              style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 0,
                flexShrink: 0,
              }}
            >
              <span style={{
                display: 'block',
                width: i === safeIdx ? 13 : 9,
                height: i === safeIdx ? 13 : 9,
                borderRadius: '50%',
                background: v.corHex,
                border: i === safeIdx ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.12)',
                outline: i === safeIdx ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
                outlineOffset: '1px',
                transition: 'all 0.2s',
              }} />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{
            fontSize: temChips ? 13 : 10,
            color: temChips ? '#fff' : '#555',
            fontWeight: temChips ? 700 : 400,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            marginBottom: temChips ? 4 : 3,
          }}>
            {eyebrow}
          </p>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>
            {titulo}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: atual.corHex,
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: '#888' }}>{atual.cor}</span>
          </div>
        </div>

        {/* Seletor de chip */}
        {temChips && (
          <div>
            <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
              Chip
            </p>
            <div className="btn-selector-row">
              {chips.map(c => (
                <button
                  key={c}
                  className="btn-selector"
                  onClick={() => selecionarChip(c)}
                  style={btnSelector(c === chipSel)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seletor de tamanho */}
        {temTamanhos && (
          <div>
            <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
              Tamanho
            </p>
            <div className="btn-selector-row">
              {tamanhos.map(t => (
                <button
                  key={t}
                  className="btn-selector"
                  onClick={() => selecionarTamanho(t)}
                  style={btnSelector(t === tamanhoSel)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seletor de armazenamento / conectividade */}
        <div>
          <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
            {modelo.startsWith('Apple Watch')
              ? 'Conectividade'
              : modelo.startsWith('MacBook') || modelo.startsWith('Mac mini')
                ? 'Configuração'
                : 'Armazenamento'}
          </p>
          <div className="btn-selector-row">
            {atual.opcoes.map((op, i) => {
              const sel = i === safeOpcaoIdx
              const indis = !op.disponivel
              return (
                <button
                  key={op.armazenamento}
                  className="btn-selector"
                  onClick={() => !indis && setOpcaoIdx(i)}
                  title={indis ? 'Indisponível' : op.armazenamento}
                  style={btnSelector(sel, indis)}
                >
                  {op.armazenamento}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preço + CTA */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ fontSize: 10, color: '#555', marginBottom: 1 }}>Preço</p>
          <p style={{
            fontSize: 24, fontWeight: 700,
            color: opcaoAtual.disponivel ? '#fff' : '#444',
            letterSpacing: '-0.5px',
          }}>
            {preco}
          </p>
          {parcelamento && opcaoAtual.disponivel && (
            <p style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>
              {parcelamento}
            </p>
          )}
        </div>

        <a
          href={opcaoAtual.disponivel ? whatsappUrl : undefined}
          target="_blank"
          rel="noreferrer"
          style={{
            background: opcaoAtual.disponivel ? '#25D366' : '#1a1a1a',
            color: opcaoAtual.disponivel ? '#fff' : '#3a3a3a',
            padding: '11px 0',
            borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            cursor: opcaoAtual.disponivel ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
            border: opcaoAtual.disponivel ? 'none' : '1px solid #222',
          }}
        >
          {opcaoAtual.disponivel ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Comprar via WhatsApp
            </>
          ) : 'Indisponível'}
        </a>
      </div>
    </div>
  )
}
