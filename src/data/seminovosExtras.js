// Seminovos de modelos que a loja não vende lacrados (13 Pro, 12, 11, XR...):
// eles não estão no produtos.json, então a foto e o tom da cor vêm daqui.
// Sem foto cadastrada, o card mostra uma foto genérica.

// Foto por "Modelo|Cor", com os nomes iguais aos da planilha.
// Ex.: 'iPhone 13 Pro Max|Dourado': '/iphones/13/13promax-gold.png'
export const FOTOS_SEMINOVOS = {}

// Tom das cores que não existem no catálogo dos lacrados (as outras saem de lá)
export const CORES_SEMINOVOS = {
  'Grafite': '#54524F',
  'Azul-Sierra': '#9BB5CE',
  'Verde-Alpino': '#576856',
  'Azul-Pacífico': '#2F4452',
  'Verde-meia-noite': '#4E5851',
  'Vermelho': '#BA0C2F',
  'Coral': '#EE7762',
  'Dourado': '#F4E8CE',
  'Prata': '#E3E4E5',
  'Branco': '#F5F5F0',
  'Preto': '#1F2020',
}
