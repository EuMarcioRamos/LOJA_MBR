// Seminovos de modelos que a loja não vende lacrados (13 Pro, 12, 11, XR...):
// eles não estão no produtos.json, então a foto e o tom da cor vêm daqui.
// Sem foto cadastrada, o card mostra uma foto genérica.

// Foto por "Modelo|Cor", com os nomes iguais aos da planilha (CATALOGO_SEMINOVOS
// em docs/apps-script-precos.gs). Cores sem foto aqui ficam com a foto genérica.
// Nos arquivos, "proepromax" = a mesma foto serve pro Pro e pro Pro Max; a foto
// do 12 serve também pro 12 mini (mesmo visual).
const pares = (modelos, fotos) =>
  Object.fromEntries(modelos.flatMap(m => Object.entries(fotos).map(([cor, foto]) => [`${m}|${cor}`, foto])))

export const FOTOS_SEMINOVOS = {
  ...pares(['iPhone 15 Plus'], {
    'Preto': '/iphones/15/15plus-black.png',
    'Azul': '/iphones/15/15plus-blue.png',
    'Verde': '/iphones/15/15plus-green.png',
    'Amarelo': '/iphones/15/15plus-yellow.png',
    'Rosa': '/iphones/15/15plus-pink.png',
  }),
  ...pares(['iPhone 14 Plus'], {
    'Meia-noite': '/iphones/14/14plus-midnight.png',
    'Luz das Estrelas': '/iphones/14/14plus-starlight.png',
    'Azul': '/iphones/14/14plus-blue.png',
    'Roxo': '/iphones/14/14plus-purple.png',
    'Amarelo': '/iphones/14/14plus-yellow.png',
  }),
  ...pares(['iPhone 13 Pro Max'], {
    'Grafite': '/iphones/13/13promax-graphite.png',
    'Dourado': '/iphones/13/13promax-gold.png',
    'Prata': '/iphones/13/13promax-silver.png',
    'Azul-Sierra': '/iphones/13/13promax-sierrablue.png',
    'Verde-Alpino': '/iphones/13/13promax-alpinegreen.png',
  }),
  ...pares(['iPhone 13 Pro'], {
    'Grafite': '/iphones/13/13pro-graphite.png',
    'Dourado': '/iphones/13/13pro-gold.png',
    'Prata': '/iphones/13/13pro-silver.png',
    'Azul-Sierra': '/iphones/13/13pro-sierrablue.png',
    'Verde-Alpino': '/iphones/13/13pro-alpinegreen.png',
  }),
  ...pares(['iPhone 13 mini'], {
    'Meia-noite': '/iphones/13/13mini-midnight.png',
    'Luz das Estrelas': '/iphones/13/13mini-starlight.png',
    'Azul': '/iphones/13/13mini-blue.png',
    'Rosa': '/iphones/13/13mini-pink.png',
    'Verde': '/iphones/13/13mini-green.png',
  }),
  ...pares(['iPhone 12 Pro Max', 'iPhone 12 Pro'], {
    'Grafite': '/iphones/12/12proepromaxgrafite.webp',
    'Dourado': '/iphones/12/12proepromaxdourado.webp',
    'Prata': '/iphones/12/12proepromaxbranco.webp',
    'Azul-Pacífico': '/iphones/12/12proepromaxazul.webp',
  }),
  ...pares(['iPhone 12', 'iPhone 12 mini'], {
    'Preto': '/iphones/12/12preto.webp',
    'Branco': '/iphones/12/12branco.webp',
    'Azul': '/iphones/12/12azul.webp',
    'Verde': '/iphones/12/12verde.webp',
    'Roxo': '/iphones/12/12roxo.webp',
  }),
  ...pares(['iPhone 11 Pro Max', 'iPhone 11 Pro'], {
    'Cinza-espacial': '/iphones/11/11proepromaxcinza.webp',
    'Prata': '/iphones/11/11proepromaxprata.webp',
    'Dourado': '/iphones/11/11proepromaxdourado.webp',
    'Verde-meia-noite': '/iphones/11/11proepromaxverde.webp',
  }),
  ...pares(['iPhone 11'], {
    'Preto': '/iphones/11/11preto.webp',
    'Branco': '/iphones/11/11branco.webp',
    'Verde': '/iphones/11/11verde.webp',
    'Amarelo': '/iphones/11/11amarelo.webp',
    'Roxo': '/iphones/11/11roxo.webp',
    'Vermelho': '/iphones/11/11vermelho.webp',
  }),
  ...pares(['iPhone XR'], {
    'Preto': '/iphones/XR/XRpreto.webp',
    'Branco': '/iphones/XR/XRbranco.webp',
    'Azul': '/iphones/XR/XRazul.webp',
  }),
}

// Tom das cores que não existem no catálogo dos lacrados (as outras saem de lá)
export const CORES_SEMINOVOS = {
  'Grafite': '#54524F',
  'Azul-Sierra': '#9BB5CE',
  'Verde-Alpino': '#576856',
  'Azul-Pacífico': '#2F4452',
  'Verde-meia-noite': '#4E5851',
  'Cinza-espacial': '#535150',
  'Vermelho': '#BA0C2F',
  'Coral': '#EE7762',
  'Dourado': '#F4E8CE',
  'Prata': '#E3E4E5',
  'Branco': '#F5F5F0',
  'Preto': '#1F2020',
}
