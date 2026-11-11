import { useRef, useState } from 'react'
import useTrocaDeFoto from '../useTrocaDeFoto'
import { corDaLuz } from '../corDaLuz'
import { linkWhatsApp, mensagemDoCard } from '../mensagemWhatsApp'
import { precoSeminovoPedido, idSeminovoPedido } from '../data/precosRemotos'

// Card de um modelo de seminovo a pedido (aba "Seminovos Pedido"): não é um
// aparelho com IMEI, é o preço da tabela da loja. A pessoa escolhe a cor e o
// armazenamento; quando a tabela separa preço por cor (linha 17), o preço muda
// com a cor. A ficha traz a bateria em faixa (ex.: 80% a 90%), a garantia e
// os brindes da linha da tabela. Mesmo visual do SeminovoCard

const icone = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const IconeBateria = (
  <svg {...icone}>
    <rect x="2" y="7" width="17" height="10" rx="2.5" />
    <path d="M22 11v2" />
    <path d="M6 10.5v3M9.5 10.5v3" />
  </svg>
)

const IconeGarantia = (
  <svg {...icone}>
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const IconePresente = (
  <svg {...icone}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8h14v-8M12 8v12" />
    <path d="M12 8c-1.5-3-5-3.5-5-1.5S10 8 12 8zM12 8c1.5-3 5-3.5 5-1.5S14 8 12 8z" />
  </svg>
)

// Modelo sem foto de nenhuma cor: silhueta de iPhone (a mesma do SeminovoCard)
const FotoGenerica = (
  <svg className="seminovo-foto-generica" viewBox="0 0 60 120" aria-hidden="true">
    <rect x="2" y="2" width="56" height="116" rx="11" />
    <rect x="22" y="7" width="16" height="4" rx="2" />
  </svg>
)

function LinhaEstado({ icone: Icone, rotulo, quebra = false, children }) {
  return (
    <div className="seminovo-estado-linha">
      <span className="seminovo-estado-icone">{Icone}</span>
      <span className="seminovo-estado-rotulo">{rotulo}</span>
      <span className={`seminovo-estado-valor${quebra ? ' seminovo-estado-valor--quebra' : ''}`}>{children}</span>
    </div>
  )
}

const emReais = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Mesmo botão de opção do ModeloCard: o que não existe nessa cor fica riscado
const btnSelector = (sel, disabled = false) => ({
  border: sel ? '1.5px solid transparent' : disabled ? '1.5px solid #2a2a2a' : '1.5px solid #666',
  background: sel ? 'var(--vidro-branco)' : 'transparent',
  color: disabled ? '#2e2e2e' : sel ? '#000' : '#e0e0e0',
  fontWeight: sel ? 600 : 400,
  cursor: disabled ? 'not-allowed' : 'pointer',
  textDecoration: disabled ? 'line-through' : 'none',
})

export default function SeminovoPedidoCard({ aparelho, carrinhoIds = [], onAlternarCarrinho }) {
  const [hover, setHover] = useState(false)
  const { modelo, cores, armazenamentos } = aparelho
  const [corIdx, setCorIdx] = useState(0)
  const [armIdx, setArmIdx] = useState(() => {
    const i = armazenamentos.findIndex(a => precoSeminovoPedido(aparelho, cores[0]?.cor ?? null, a))
    return Math.max(0, i)
  })
  const corAtual = cores[Math.min(corIdx, cores.length - 1)] ?? null
  const armazenamento = armazenamentos[Math.min(armIdx, armazenamentos.length - 1)]
  const linha = precoSeminovoPedido(aparelho, corAtual?.cor ?? null, armazenamento)
  const disponivel = !!linha

  // Trocou de cor e o armazenamento escolhido não existe nela: vai pro
  // primeiro que existe (ex.: uma cor que a tabela só tem em 256GB)
  const escolherCor = (i) => {
    setCorIdx(i)
    const cor = cores[i]?.cor ?? null
    if (!precoSeminovoPedido(aparelho, cor, armazenamento)) {
      const outro = armazenamentos.findIndex(a => precoSeminovoPedido(aparelho, cor, a))
      if (outro >= 0) setArmIdx(outro)
    }
  }

  // Troca de cor da foto: a nova dissolve por cima da anterior, como nos
  // lacrados (useTrocaDeFoto.js)
  const { fotoAtual, fotoAnterior, saiu: fotoSaiu } = useTrocaDeFoto(corAtual?.imagem ?? null)

  // Baixa as fotos das outras cores quando a pessoa mostra que vai trocar
  const coresPreCarregadas = useRef(false)
  const preCarregarCores = () => {
    if (coresPreCarregadas.current) return
    coresPreCarregadas.current = true
    cores.forEach(c => { if (c.imagem) new Image().src = c.imagem })
  }

  const bateria = linha?.bateria || ''
  const minimoBateria = Number((bateria.match(/\d+/) || [])[0])
  // A cor fica "sujeita à disponibilidade" quando o preço vale pra qualquer cor
  // (a tabela não garante a cor); na linha 17 a tabela já diz quais cores há
  const corSujeita = !!linha && !linha.cores.length
  const parcelamento = linha?.parcelas && linha?.valorParcela ? `ou ${linha.parcelas}x de ${emReais(linha.valorParcela)}` : null

  const itemCarrinhoId = idSeminovoPedido(aparelho, corAtual?.cor ?? null, armazenamento)
  const noCarrinho = carrinhoIds.includes(itemCarrinhoId)
  const itemCarrinho = {
    id: itemCarrinhoId,
    nome: modelo,
    seminovo: true,
    tamanho: null,
    armazenamento,
    cor: corAtual?.cor ?? null,
    imagem: corAtual?.imagem ?? null,
    preco: linha?.preco ?? null,
    entrega: 'pedido',
    ...(bateria && { bateria }),
  }
  const whatsappUrl = linkWhatsApp(mensagemDoCard(itemCarrinho))

  return (
    <div
      className="modelo-card"
      onMouseEnter={() => { setHover(true); preCarregarCores() }}
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
        <div className="modelo-card-luz" style={{ '--luz-cor': corDaLuz(corAtual?.corHex ?? '#8a8a8a') }} />
        {corAtual?.imagem ? (
          <>
            {fotoAnterior && (
              <img
                key={fotoAnterior}
                className="modelo-card-foto modelo-card-foto--saindo"
                src={fotoAnterior}
                alt=""
                aria-hidden="true"
                onAnimationEnd={fotoSaiu}
              />
            )}
            <img
              key={fotoAtual}
              className="modelo-card-foto modelo-card-foto--entrando"
              src={fotoAtual}
              alt={`${modelo} ${corAtual.cor} seminovo`}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : FotoGenerica}
        <span className="selo-seminovo">Seminovo · A pedido</span>
      </div>

      {/* Pontos de cor */}
      {cores.length > 1 && (
        <div
          style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
          onTouchStart={preCarregarCores}
          onFocus={preCarregarCores}
        >
          {cores.map((c, i) => (
            <button key={c.cor} onClick={() => escolherCor(i)} title={c.cor} className="cor-dot-btn">
              <span className={`cor-dot${c === corAtual ? ' cor-dot--ativo' : ''}`} style={{ background: c.corHex }} />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 3 }}>
            Apple
          </p>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>
            {modelo}
          </h3>
          {corAtual ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: corAtual.corHex,
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: '#888' }}>
                {corAtual.cor}{corSujeita && ' · sujeita à disponibilidade'}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: '#888' }}>Cor combinada no atendimento</span>
          )}
        </div>

        {/* Armazenamento */}
        <div>
          <p style={{ fontSize: 10, color: 'var(--rotulo-card)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7 }}>
            Armazenamento
          </p>
          <div className="btn-selector-row">
            {armazenamentos.map((a, i) => {
              const existe = !!precoSeminovoPedido(aparelho, corAtual?.cor ?? null, a)
              return (
                <button
                  key={a}
                  className="btn-selector"
                  onClick={() => existe && setArmIdx(i)}
                  title={existe ? a : 'Não tem nessa cor'}
                  style={btnSelector(a === armazenamento, !existe)}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </div>

        {/* Ficha: bateria, garantia e brindes da linha da tabela */}
        {linha && (bateria || linha.garantia || linha.brindes) && (
          <div className="seminovo-estado">
            {bateria && (
              <LinhaEstado icone={IconeBateria} rotulo="Bateria">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {minimoBateria > 0 && (
                    <span className="seminovo-pilha" style={{ color: 'var(--whatsapp)' }} aria-hidden="true">
                      <span style={{ width: `${Math.min(minimoBateria, 100)}%` }} />
                    </span>
                  )}
                  <span style={{ color: 'var(--whatsapp)' }}>{bateria}</span>
                </span>
              </LinhaEstado>
            )}
            {linha.garantia && <LinhaEstado icone={IconeGarantia} rotulo="Garantia MasterBR">{linha.garantia}</LinhaEstado>}
            {linha.brindes && <LinhaEstado icone={IconePresente} rotulo="Brindes" quebra>{linha.brindes}</LinhaEstado>}
          </div>
        )}
      </div>

      {/* Preço + CTA */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <p style={{ fontSize: 10, color: 'var(--rotulo-card)', marginBottom: 1 }}>Preço</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: disponivel ? '#fff' : '#444', letterSpacing: '-0.5px' }}>
            {linha ? emReais(linha.preco) : '—'}
          </p>
          {parcelamento && (
            <p style={{ fontSize: 14, fontWeight: 600, color: '#ddd', marginTop: 4 }}>
              {parcelamento}
            </p>
          )}
          {disponivel && (
            <p className="entrega-nota entrega-nota--pedido">Chega em até 7 a 8 dias úteis · sinal de 10%</p>
          )}
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
            ) : 'Indisponível'}
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
