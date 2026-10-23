import { revelar } from '../revelar'

const CLIENTES_MASTER = [
  '/clientes-master/cliente-master-1.webp',
  '/clientes-master/cliente-master-2.webp',
  '/clientes-master/cliente-master-3.webp',
  '/clientes-master/cliente-master-4.webp',
  '/clientes-master/cliente-master-5.webp',
  '/clientes-master/cliente-master-6.webp',
  '/clientes-master/cliente-master-7.webp',
]

export default function ClientesMaster() {
  return (
    <div className="clientes-master revelar" ref={revelar}>
      <h3 className="clientes-master-titulo">Clientes Master</h3>
      <p className="clientes-master-subtitulo">
        Gente incrível que confia na MasterBR e vive a melhor experiência Apple em Patos.
      </p>
      <div className="clientes-master-marquee">
        <div className="clientes-master-trilho">
          {[...CLIENTES_MASTER, ...CLIENTES_MASTER].map((src, i) => (
            <div className="clientes-master-item" key={i}>
              <img src={src} alt="Cliente MasterBR com produto Apple" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
