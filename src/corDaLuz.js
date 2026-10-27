// Luz atrás da foto, no tom da cor escolhida. Cores escuras ficam mais claras e
// um pouco mais vivas, senão a luz some no fundo escuro do card; cores neutras
// (preto, prata, branco) viram uma luz fraca e sem tom.
export function corDaLuz(hex) {
  const n = parseInt((hex || '#888888').slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  const neutra = s < 0.12
  const sat = neutra ? s : Math.min(1, s * 1.25 + 0.1)
  const alfa = neutra ? 0.2 : 0.38
  return `hsla(${Math.round(h)}, ${Math.round(sat * 100)}%, ${Math.round(Math.max(l, 0.45) * 100)}%, ${alfa})`
}
