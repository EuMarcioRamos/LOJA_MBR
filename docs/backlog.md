## Backlog — coisas a implementar

Lista viva de melhorias pedidas, pra não perder o controle conforme o
site cresce. Marco cada item como feito quando aplicado.

### Entrada 1 — 2026-09-09

- [x] **Reduzir o tempo de recarga das imagens** — comprimidas/redimensionadas
      as fotos de produto e do topo do site (de ~32MB pra ~21MB nas
      referenciadas, com os MacBooks caindo de até 3.1MB pra ~300-700KB
      cada). Adicionado `loading="lazy"` nos cards de produto.
- [x] **Reduzir um pouco o tamanho dos cards no celular** — padding e
      espaçamento reduzidos, área da imagem um pouco mais compacta,
      só no mobile (abaixo de 480px).
- [x] **Parcelamento abaixo do preço à vista** — já implementado e
      testado (coluna "Parcelas" na planilha → mostra "ou Nx de R$X sem
      juros" no card). Só falta preencher a coluna pros produtos que
      terão parcelamento.
- [ ] **Conferir as opções de configuração do MacBook Pro (M4 e M5)** —
      verificar se os pares chip/tamanho/armazenamento disponíveis no
      site batem com o que a Apple realmente vende.
- [ ] **Aparelhos seminovos** — adicionar 2 opções por produto:
      "Modelo Lacrado" e "Modelo Semi-novo", em todos os modelos do
      catálogo. **Precisa de definição antes de começar** (ver
      pergunta em aberto abaixo).

#### Pergunta em aberto — seminovos

Isso dobra a tabela de preços inteira (cada combinação de cor/tamanho/
armazenamento passaria a ter um preço Lacrado E um preço Semi-novo).
Preciso saber:
- O desconto do semi-novo é uma **porcentagem fixa** sobre o preço
  lacrado (ex.: sempre 15% mais barato), ou varia produto a produto e
  precisa ser cadastrado à mão na planilha?
- Ainda vale pra tudo, mesmo os que a Apple nunca vendeu usado (ex.:
  MacBook Neo, lançado recentemente)?
- Como funciona a disponibilidade de estoque do semi-novo — é sempre
  "sob consulta" (não tem stock fixo, depende do que chega na loja), ou
  tem uma quantidade real que precisa refletir no site?
