// Revelar ao rolar: o elemento é observado e ganha a classe "revelado" quando
// entra na tela — uma vez só. O CSS decide o que acontece (ex.: .revelar faz
// fade + leve subida). Uso: <div className="revelar" ref={revelar}>.
// Itens que entram juntos (ex.: uma linha inteira de cards) recebem um pequeno
// atraso em sequência, pra aparecerem um após o outro.
const ATRASO_ENTRE_ITENS = 0.08 // segundos

let observador = null

function obterObservador() {
  if (observador) return observador
  observador = new IntersectionObserver((entradas) => {
    entradas
      .filter(e => e.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left))
      .forEach((e, i) => {
        e.target.style.setProperty('--revelar-atraso', `${i * ATRASO_ENTRE_ITENS}s`)
        e.target.classList.add('revelado')
        observador.unobserve(e.target)
      })
  }, { rootMargin: '0px 0px -10% 0px' })
  return observador
}

export function revelar(el) {
  if (!el) return
  // Sem suporte, ou quem desativou animações no aparelho: mostra direto
  if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('revelado')
    return
  }
  const obs = obterObservador()
  obs.observe(el)
  return () => obs.unobserve(el)
}
