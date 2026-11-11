import { useState, useEffect, useRef } from 'react'

// Troca de cor da foto num card: a nova só entra depois de carregada e dissolve
// por cima da anterior (que sai ao mesmo tempo), sem ficar um instante sem foto.
// Usado no card dos lacrados (ModeloCard) e no dos seminovos a pedido
// (SeminovoPedidoCard). Devolve a foto que está na tela, a que está saindo
// (null quando nenhuma) e a função pra chamar no fim da animação de saída
export default function useTrocaDeFoto(imagem) {
  const [fotoAtual, setFotoAtual] = useState(imagem)
  const [fotoAnterior, setFotoAnterior] = useState(null)
  const fotoAtualRef = useRef(imagem)
  useEffect(() => {
    const nova = imagem
    if (!nova || nova === fotoAtualRef.current) return
    let cancelado = false
    const img = new Image()
    img.src = nova
    const trocar = () => {
      if (cancelado) return
      setFotoAnterior(fotoAtualRef.current)
      fotoAtualRef.current = nova
      setFotoAtual(nova)
    }
    ;(img.decode ? img.decode() : Promise.resolve()).then(trocar, trocar)
    return () => { cancelado = true }
  }, [imagem])
  return { fotoAtual, fotoAnterior, saiu: () => setFotoAnterior(null) }
}
