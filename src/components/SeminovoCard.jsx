import { useState } from 'react'
import { WHATSAPP_NUMERO } from '../config'
import { corDaLuz } from '../corDaLuz'

// Card de um aparelho seminovo. Mesmo visual do ModeloCard, mas é uma unidade
// só (cor e armazenamento já definidos), então no lugar dos seletores entra o
// estado do aparelho: bateria, conservação e garantia da loja.

// Bateria a partir de 90% em verde; abaixo, em branco (sem alarde, ainda é boa)
const corDaBateria = (pct) => (pct >= 90 ? 'var(--whatsapp)' : '#e0e0e0')

const rotulo = { fontSize: 10, color: 'var(--rotulo-card)', textTransform: 'uppercase', letterSpacing: '1px' }

export default function SeminovoCard({ aparelho, carrinhoIds = [], onAlternarCarrinho }) {
  const [hover, setHover] = useState(false)
  const { modelo, cor, corHex, imagem, armazenamento, preco, bateria, estado, garantia, disponivel } = aparelho

  const precoTexto = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no ${modelo} ${armazenamento} ${cor} seminovo (bateria ${bateria}%, estado ${estado.toLowerCase()}). Ainda está disponível?`
  )
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensagem}`

  const itemCarrinhoId = aparelho.id
  const noCarrinho = carrinhoIds.includes(itemCarrinhoId)
  const itemCarrinho = {
    id: itemCarrinhoId,
    nome: `${modelo} (seminovo)`,
    tamanho: null,
    armazenamento,
    cor,
    imagem,
    preco,
  }

  return (
    <div
      className="modelo-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1e1e1e' : '#161616',
        border: `1px solid ${hover ? '#333' : '#222'}`,
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 16px 48px rgba(0,0,0,0.5)' : 'none',
        position: 'relative',
      }}
    >
      {/* Imagem */}
      <div className="modelo-card-imagem" style={{
        position: 'relative',
        background: 'radial-gradient(ellipse at 50% 65%, #2e2e32 0%, #131313 100%)',
      }}>
        <div className="modelo-card-luz" style={{ '--luz-cor': corDaLuz(corHex) }} />
        <img
          className="modelo-card-foto modelo-card-foto--entrando"
          src={imagem}
          alt={`${modelo} ${cor} seminovo`}
          loading="lazy"
          decoding="async"
        />
        <span className="selo-seminovo">Seminovo</span>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 3 }}>
            Apple
          </p>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>
            {modelo}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: corHex,
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: '#888' }}>{cor} · {armazenamento}</span>
          </div>
        </div>

        {/* Estado do aparelho, um item por linha (rótulo à esquerda, valor à direita) */}
        <div className="seminovo-estado">
          <div>
            <div className="seminovo-estado-linha">
              <span style={rotulo}>Bateria</span>
              <span className="seminovo-estado-valor" style={{ color: corDaBateria(bateria) }}>{bateria}%</span>
            </div>
            <div className="seminovo-bateria" aria-hidden="true">
              <span style={{ width: `${bateria}%`, background: corDaBateria(bateria) }} />
            </div>
          </div>
          <div className="seminovo-estado-linha">
            <span style={rotulo}>Estado</span>
            <span className="seminovo-estado-valor">{estado}</span>
          </div>
          <div className="seminovo-estado-linha">
            <span style={rotulo}>Garantia</span>
            <span className="seminovo-estado-valor">{garantia}</span>
          </div>
        </div>
      </div>

      {/* Preço + CTA */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ fontSize: 10, color: 'var(--rotulo-card)', marginBottom: 1 }}>Preço</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: disponivel ? '#fff' : '#444', letterSpacing: '-0.5px' }}>
            {precoTexto}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={disponivel ? whatsappUrl : undefined}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: disponivel ? 'var(--vidro-verde)' : '#1a1a1a',
              color: disponivel ? '#fff' : '#3a3a3a',
              padding: '11px 0',
              borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              cursor: disponivel ? 'pointer' : 'not-allowed',
              border: disponivel ? 'none' : '1px solid #222',
            }}
          >
            {disponivel ? (
              <>
                Comprar via
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </>
            ) : 'Vendido'}
          </a>

          <button
            className="carrinho-toggle-btn"
            onClick={() => disponivel && onAlternarCarrinho?.(itemCarrinho)}
            disabled={!disponivel}
            title={noCarrinho ? 'Remover da seleção' : 'Adicionar à seleção'}
            aria-label={noCarrinho ? 'Remover da seleção' : 'Adicionar à seleção'}
            style={{
              width: 46,
              flexShrink: 0,
              background: !disponivel ? 'transparent' : noCarrinho ? 'rgba(37,211,102,0.14)' : 'transparent',
              color: !disponivel ? '#3a3a3a' : 'var(--whatsapp)',
              border: `1.5px solid ${!disponivel ? '#222' : noCarrinho ? 'var(--whatsapp)' : '#444'}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !disponivel ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {noCarrinho ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
