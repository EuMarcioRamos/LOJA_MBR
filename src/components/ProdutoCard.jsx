import { useState } from 'react'

export default function ProdutoCard({ produto }) {
  const [hover, setHover] = useState(false)

  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no ${produto.modelo} ${produto.armazenamento} ${produto.cor}. Ainda está disponível?`
  )
  const whatsappUrl = `https://wa.me/5583991281912?text=${mensagem}`

  const preco = produto.preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1e1e1e' : '#161616',
        border: `1px solid ${hover ? '#333' : '#222'}`,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {produto.destaque && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: '#fff',
          color: '#000',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 50,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          zIndex: 3,
        }}>
          Destaque
        </div>
      )}

      {!produto.disponivel && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <span style={{ color: '#a0a0a0', fontWeight: 600, fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Indisponível
          </span>
        </div>
      )}

      {/* Imagem do produto */}
      <div style={{
        background: produto.imagem ? 'transparent' : '#0a0a0a',
        borderRadius: 12,
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {produto.imagem ? (
          <img
            src={produto.imagem}
            alt={`${produto.modelo} ${produto.cor}`}
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'contain',
              transition: 'transform 0.3s ease',
              transform: hover ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <svg width="64" height="100" viewBox="0 0 64 100" fill="none">
            <rect x="2" y="2" width="60" height="96" rx="14" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
            <rect x="8" y="12" width="48" height="72" rx="4" fill={produto.corHex} opacity="0.9"/>
            <circle cx="32" cy="89" r="4" fill="#2a2a2a"/>
            <rect x="22" y="5" width="20" height="3" rx="1.5" fill="#2a2a2a"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div>
        <p style={{ fontSize: 11, color: '#606060', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
          Apple
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px', marginBottom: 10 }}>
          {produto.modelo}
        </h3>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#0d0d0d',
            padding: '5px 10px',
            borderRadius: 50,
            border: '1px solid #2a2a2a',
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: produto.corHex,
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: '#a0a0a0' }}>{produto.cor}</span>
          </div>

          <div style={{
            background: '#0d0d0d',
            padding: '5px 10px',
            borderRadius: 50,
            border: '1px solid #2a2a2a',
            fontSize: 12,
            color: '#a0a0a0',
          }}>
            {produto.armazenamento}
          </div>
        </div>
      </div>

      {/* Preço e botão */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: '#606060', marginBottom: 2 }}>A partir de</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{preco}</p>
        </div>

        <a
          href={produto.disponivel ? whatsappUrl : undefined}
          target="_blank"
          rel="noreferrer"
          style={{
            background: produto.disponivel ? '#25D366' : '#2a2a2a',
            color: produto.disponivel ? '#fff' : '#606060',
            padding: '12px 0',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: produto.disponivel ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {produto.disponivel ? 'Comprar via WhatsApp' : 'Indisponível'}
        </a>
      </div>
    </div>
  )
}
