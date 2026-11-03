import { LOJA, WHATSAPP_NUMERO } from '../config'
import { linkWhatsApp } from '../mensagemWhatsApp'

// (83) 99128-1912, a partir do número com DDI que os links usam
const numero = WHATSAPP_NUMERO.replace(/^55/, '')
const telefone = `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`

// Link de busca do Google Maps (abre o app no celular), em vez de um mapa
// embutido, que pesaria no carregamento da página
const linkMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOJA.endereco}, ${LOJA.cidade}, ${LOJA.cep}`)}`

const IconeWhatsApp = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const IconeInstagram = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const IconeTikTok = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

const IconeRelogio = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const IconeLocal = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

const IconeEmail = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

const IconeDinheiro = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
)

// Símbolo oficial do Pix (desenho do Simple Icons, simple-icons@13.21.0)
const IconePix = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156" />
  </svg>
)

const IconeCartao = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </svg>
)

const REDES = [
  { nome: 'Instagram', usuario: `@${LOJA.instagram}`, link: `https://www.instagram.com/${LOJA.instagram}/`, icone: IconeInstagram },
  { nome: 'TikTok', usuario: `@${LOJA.tiktok}`, link: `https://www.tiktok.com/@${LOJA.tiktok}`, icone: IconeTikTok },
]

const PAGAMENTOS = [
  { icone: IconeDinheiro, nome: 'Dinheiro' },
  { icone: IconePix, nome: 'Pix' },
  { icone: IconeCartao, nome: 'Cartão em até 21x' },
]

// Rodapé: os dados da loja em colunas, que empilham no celular. Sem chamada
// própria pro WhatsApp: o site já tem várias
export default function Rodape() {
  return (
    <footer className="rodape">
      <div className="rodape-info">
        <div className="rodape-marca">
          <img className="rodape-logo" src="/logo.png" alt="MasterBR" loading="lazy" />
          <p className="rodape-frase">Assistência especializada Apple em Patos, PB.</p>
          <div className="rodape-redes">
            {REDES.map(rede => (
              <a
                key={rede.nome}
                className="rodape-rede"
                href={rede.link}
                target="_blank"
                rel="noreferrer"
                aria-label={`${rede.nome} da MasterBR: ${rede.usuario}`}
              >
                {rede.icone}
                <span>{rede.usuario}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="rodape-coluna">
          <h3 className="rodape-titulo">Atendimento</h3>
          <ul className="rodape-lista">
            <li>
              {IconeRelogio}
              <span>
                {LOJA.dias}<br />
                {LOJA.horario.join(' e ')}
              </span>
            </li>
            <li>
              {IconeLocal}
              <span>
                {LOJA.endereco}<br />
                {LOJA.cidade} · CEP {LOJA.cep}
              </span>
            </li>
          </ul>
          <a className="rodape-link" href={linkMapa} target="_blank" rel="noreferrer">
            Como chegar <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="rodape-coluna">
          <h3 className="rodape-titulo">Contato</h3>
          <ul className="rodape-lista">
            <li>
              {IconeWhatsApp}
              <a href={linkWhatsApp()} target="_blank" rel="noreferrer">{telefone}</a>
            </li>
            <li>
              {IconeEmail}
              <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>
            </li>
          </ul>
        </div>

        <div className="rodape-coluna">
          <h3 className="rodape-titulo">Pagamento</h3>
          <ul className="rodape-lista">
            {PAGAMENTOS.map(forma => (
              <li key={forma.nome}>
                {forma.icone}
                <span>{forma.nome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="rodape-legal">
        © {new Date().getFullYear()} MasterBR — Assistência Especializada Apple ·{' '}
        <span className="rodape-cnpj">CNPJ {LOJA.cnpj}</span>
      </p>
    </footer>
  )
}
