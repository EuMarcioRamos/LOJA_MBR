## Como funciona a atualização de preços via planilha

O site guarda o catálogo (fotos, cores, nomes) em `src/data/produtos.json`,
que não muda com frequência. O **preço**, a **disponibilidade** e o
**parcelamento** de cada produto, porém, podem ser atualizados por fora
do código, através de uma planilha do Google.

### Duas camadas de preço

O preço quase nunca varia por cor — então a planilha separa isso em duas
abas:

- **`Precos por Modelo`** — o preço padrão de cada modelo+armazenamento
  (ex.: "iPhone 17 Pro Max, 256GB"), valendo pra **todas as cores** desse
  produto de uma vez. **É aqui que você mexe no dia a dia**, na
  imensa maioria dos casos.
- **`Precos`** (por cor) — controla a **disponibilidade** de cada cor
  (isso sim varia peça a peça — uma cor pode esgotar enquanto as outras
  não) e serve pra registrar uma **exceção** de preço, só quando uma cor
  específica realmente precisa custar diferente do padrão do modelo.
  Fora dessas exceções, o campo Preço dessa aba fica em branco.

### Passo a passo (feito uma única vez)

1. Crie uma planilha nova no Google Sheets, na sua conta Google normal.
2. Renomeie a primeira aba para `Precos` (sem acento, exatamente assim).
3. Importe o arquivo `precos-master-brpb.csv` (Arquivo → Importar → Fazer
   upload → substituir a planilha atual) — ele já vem com as 496 opções
   de preço/disponibilidade do catálogo.
4. Não apague nem edite a coluna **ID** — é ela que conecta cada linha
   com o produto certo no site.
5. Abra **Extensões → Apps Script**, apague o conteúdo padrão e cole o
   código de `docs/apps-script-precos.gs`.
6. Clique em **Implantar → Nova implantação**, escolha o tipo **App da Web**,
   em "Executar como" deixe **Eu (sua conta)**, em "Quem pode acessar"
   escolha **Qualquer pessoa**. Confirme.
7. O Google vai pedir para autorizar o script a acessar a planilha — isso
   acontece uma única vez. Clique em "Avançado" → "Acessar [nome do
   projeto] (não seguro)" se aparecer o aviso padrão do Google para scripts
   pessoais, e depois em "Permitir".
8. O Google te dá uma URL terminando em `/exec`. Copie essa URL e me envie
   — eu coloco em `src/config.js` (`PLANILHA_PRECOS_URL`) e o site passa a
   usar os preços da planilha a partir daí.
9. Feche e abra a planilha de novo — isso faz o menu **Preços** aparecer
   na barra de cima.
10. Menu **Preços → Configurar Preços por Modelo (migração)**. Isso cria
    a aba `Precos por Modelo` automaticamente a partir do que já está em
    `Precos`, e limpa o preço das linhas de cor que não são exceção
    (ficam controladas pelo modelo a partir daí). Só precisa rodar isso
    uma vez (ou de novo se algum dia quiser reconstruir do zero).

### No dia a dia

Pra mudar o preço de um produto (todas as cores de uma vez): abrir a aba
**`Precos por Modelo`**, achar a linha, mudar o número da coluna Preço.

Pra mudar o preço de **uma cor específica** (exceção) ou marcar uma cor
como indisponível: abrir a aba **`Precos`**, achar a linha daquela cor
exata, mexer em Preço e/ou Disponível ali.

O site pega a atualização na próxima vez que alguém carregar a página —
não precisa mexer em código, não precisa avisar ninguém.

Se a planilha cair ou a URL parar de responder por qualquer motivo, o
site volta sozinho a usar os preços fixos salvos em `produtos.json`,
sem quebrar.

---

## Atualizando muitos preços de uma vez (sem editar linha por linha)

### 1. Reajuste percentual em tudo

Quando o reajuste é geral (ex.: dólar subiu, todo o catálogo sobe 5%):

1. Menu **Preços → Reajustar todos os preços em %**.
2. Digite a porcentagem (ex.: `5` pra aumentar 5%, `-10` pra reduzir 10%).
3. Confirma. Todos os preços da aba **`Precos por Modelo`** são
   recalculados na hora (isso já vale pra todas as cores, já que o
   preço vem do modelo).

Não tem "desfazer" automático — se errar, é só rodar de novo com a
porcentagem inversa.

### 2. Atualização em massa por lista (pra mudanças específicas)

Você lista só o que mudou numa aba separada, e um clique aplica tudo de
uma vez. Cada linha pode mirar num **modelo inteiro** (todas as cores)
ou numa **cor específica**, dependendo do que você escrever no
Identificador.

1. Crie uma aba nova na mesma planilha chamada exatamente `Atualizar em Massa`.
2. Nessa aba nova, importe ou copie o modelo `atualizar-em-massa-modelo.csv`
   — formato: `Identificador | Armazenamento | Novo Preco | Novo Disponivel | Novas Parcelas | Novo Valor Parcela`.
3. No **Identificador**, escreva:
   - o **nome do Modelo** (ex.: `iPhone 17 Pro Max`, copiado da aba
     `Precos por Modelo`) → muda o preço padrão, valendo pra todas as
     cores desse produto.
   - o **ID de uma cor** (ex.: `17promax-deepblue`, copiado da aba
     `Precos`) → muda só aquela cor específica (preço-exceção e/ou
     disponibilidade).
4. Se preencher o **Armazenamento**, a mudança vale só pra aquela
   capacidade. Deixando em branco, vale pra todas as capacidades
   daquele Identificador.
5. Deixe os campos que não quer alterar em branco.
6. Menu **Preços → Aplicar atualização em massa**. Aparece um aviso
   dizendo quantas linhas foram alteradas.
7. Pode apagar as linhas da aba `Atualizar em Massa` depois de aplicar,
   ou deixar lá — ela não é lida pelo site, só serve como "lista de
   entrada" pro botão.

---

## Parcelamento com juros ("ou 12x de R$ X")

Como o parcelamento tem juros, o site **não calcula** o valor da parcela
sozinho — você informa o valor exato, **o mesmo número que sua
maquininha/banco já dá** quando simula o parcelamento daquele preço.

Duas colunas, tanto em `Precos por Modelo` quanto em `Precos`:

- **Parcelas** — em quantas vezes (ex.: `12`).
- **Valor Parcela** — o valor de cada parcela (ex.: `1416.58`).

As duas precisam estar preenchidas pro site mostrar a linha de
parcelamento (numa das duas abas — se preenchido no modelo, já vale pra
todas as cores; se preenchido também numa cor específica na aba
`Precos`, isso tem prioridade só naquela cor). Faltando uma das duas, o
produto mostra só o preço à vista, sem quebrar nada.

**Exemplo:** produto de R$ 14.999,00, parcelado em 12x pela maquininha
sai R$ 1.416,58 a parcela (com juros). Na aba `Precos por Modelo`:

```
Parcelas | Valor Parcela
12       | 1416.58
```

E o site mostra "ou 12x de R$ 1.416,58" embaixo do preço à vista, em
destaque (fonte maior e mais clara que o resto do texto do card).

---

## Atualizando o script depois de uma mudança

Sempre que eu avisar que o `docs/apps-script-precos.gs` mudou, o
processo é:

1. Abra **Extensões → Apps Script**, apague tudo e cole o conteúdo novo
   do arquivo.
2. Salve (Ctrl+S).
3. **Implantar → Gerenciar implantações**.
4. Clique no ícone de lápis (editar) na implantação existente.
5. Em **Versão**, troque para **Nova versão**.
6. Clique em **Implantar**.

Isso mantém a **mesma URL** de antes (não precisa me mandar nada de
novo) e já entra em vigor a partir da próxima vez que o site carregar a
planilha. Se em vez disso você criar uma **implantação nova** (em vez de
editar a existente), aí sim o Google gera uma URL diferente — nesse
caso me manda a URL nova que eu atualizo o `src/config.js`.

Feche e abra a planilha de novo depois — é isso que faz o menu "Preços"
aparecer atualizado na barra de cima.

---

## Seminovos (aba `Seminovos`)

Seminovo é sempre uma peça única: cada linha da aba é **um aparelho**,
identificado pelo **final do IMEI** que vem no anúncio. O site mostra a
foto oficial do modelo na cor escolhida (vem do catálogo), então não
precisa mandar foto.

### Configuração (uma vez só)

1. Atualize o script como em "Atualizando o script depois de uma mudança"
   (logo acima): colar o código novo, salvar e publicar uma **Nova versão**
   na implantação existente. A URL continua a mesma.
2. Feche e abra a planilha. Aparece um menu novo, **Seminovos**.
3. Menu **Seminovos → Criar / ajustar aba Seminovos**. Ela é criada com o
   cabeçalho, as listas suspensas e as cores por status. Se o Google pedir
   autorização de novo, é só permitir.

### No dia a dia: colar a lista do WhatsApp

1. Copie a mensagem do WhatsApp com o **estoque completo** de seminovos.
2. Menu **Seminovos → Importar lista do WhatsApp**, cole o texto e clique
   em **Conferir**. Nada é gravado ainda; aparece um resumo:
   - **Entram no site**: IMEIs que não estavam na planilha.
   - **Atualizados**: IMEIs que já estavam e mudaram (preço, bateria…),
     mostrando o antes e o depois.
   - **Saem do site**: IMEIs da planilha que não estão mais na lista
     (viram "Vendido").
   - **Precisam de revisão**: aparelhos que o script não entendeu (ex.:
     cor que não existe naquele modelo).
   - **Linhas que não entendi**: texto solto que foi ignorado (título da
     mensagem, recado no fim etc.).
3. Se estiver certo, clique em **Aplicar na planilha**. O site atualiza em
   instantes.

O formato esperado de cada aparelho é o que vocês já usam (os emojis são
ignorados, e as linhas de garantia Apple e de "COM CAIXA…" são opcionais):

```
IPHONE 17 PRO MAX 256GB
SILVER ⚪️
100%🔋
R$ 6.890,00💰
12X 650,11 💳
GARANTIA APPLE ATÉ MARÇO DE 2027
SEMI NOVO | GARANTIA 6 MESES MASTERBR
COM CAIXA E ACESSÓRIOS DE BRINDE 🎁
IMEI: 0651
```

O que importa: **modelo e armazenamento na primeira linha, cor logo
abaixo, e cada aparelho termina na linha do IMEI**. A cor pode vir em
inglês (SILVER, DEEP BLUE, NATURAL TITANIUM…) ou em português.

Também são lidos, mas ficam **só na planilha** (o site não mostra; essas
informações são passadas na conversa do WhatsApp):
- `🔄 185 CICLOS` → coluna **Ciclos**.
- Linhas com `⚠️` (ex.: `⚠️ TAMPA TRASEIRA SUBSTITUÍDA`) → coluna **Avisos**.

Separadores (`-`) e o título da mensagem são ignorados.

Dois aparelhos podem ter o mesmo final de IMEI se forem de modelos
diferentes: a identidade de cada um é **IMEI + modelo**.

### Modelos sem foto (13 Pro, 12, 11, XR…)

Os modelos que a loja não vende lacrados entram normalmente na planilha e
no site, mas aparecem com uma silhueta no lugar da foto até a foto ser
cadastrada em `src/data/seminovosExtras.js` (uma por modelo + cor).

### Status de cada aparelho

| Status | No site |
|---|---|
| **Disponível** | Aparece normalmente |
| **Reservado** | Aparece com o selo "Reservado" e o botão de compra travado. Marque à mão; a importação não tira o "Reservado" enquanto o aparelho estiver na lista |
| **Vendido** | Não aparece. A linha fica na planilha como histórico |
| **Revisar** | Não aparece. O script não entendeu o modelo ou a cor (a coluna Observação diz o motivo). Corrija Modelo/Cor pela lista suspensa e troque o Status para "Disponível"; nas próximas importações ele lembra da correção |

Também dá para editar qualquer linha à mão (preço, bateria etc.). Só
lembre que a próxima importação vale o que estiver na lista do WhatsApp.
