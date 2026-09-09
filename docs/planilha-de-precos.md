## Como funciona a atualização de preços via planilha

O site guarda o catálogo (fotos, cores, nomes) em `src/data/produtos.json`,
que não muda com frequência. O **preço** e a **disponibilidade** de cada
opção de armazenamento, porém, podem ser atualizados por fora do código,
através de uma planilha do Google.

### Passo a passo (feito uma única vez)

1. Crie uma planilha nova no Google Sheets, na sua conta Google normal.
2. Renomeie a primeira aba para `Precos` (sem acento, exatamente assim).
3. Importe o arquivo `precos-master-brpb.csv` (Arquivo → Importar → Fazer
   upload → substituir a planilha atual) — ele já vem com todas as 496
   opções de preço do catálogo, prontas para editar.
4. Não apague nem edite a coluna **ID** — é ela que conecta cada linha da
   planilha com o produto certo no site. Edite livremente **Preço** e
   **Disponível** (SIM/NAO).
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

### No dia a dia

Pra mudar um preço só: abrir a planilha, achar a linha do produto, mudar
o número da coluna Preço. O site pega a atualização na próxima vez que
alguém carregar a página — não precisa mexer em código, não precisa
avisar ninguém.

Se a planilha cair ou a URL parar de responder por qualquer motivo, o
site volta sozinho a usar os preços fixos salvos em `produtos.json`,
sem quebrar.

---

## Atualizando muitos preços de uma vez (sem editar linha por linha)

Se já tem o script atualizado (versão com o menu "Preços" — veja se ele
aparece na barra de menu lá em cima quando você abre a planilha), você
tem duas ferramentas pra evitar o trabalho de editar 400 linhas na mão:

### 1. Reajuste percentual em tudo

Quando o reajuste é geral (ex.: dólar subiu, todo o catálogo sobe 5%):

1. Menu **Preços → Reajustar todos os preços em %**.
2. Digite a porcentagem (ex.: `5` pra aumentar 5%, `-10` pra reduzir 10%).
3. Confirma. Todos os preços da aba `Precos` são recalculados na hora.

Não tem "desfazer" automático — se errar, é só rodar de novo com a
porcentagem inversa, ou refazer a partir do CSV original.

### 2. Atualização em massa por lista (pra mudanças específicas)

Isso resolve o "enviar uma lista e isso ser atualizado": em vez de abrir
a aba `Precos` e caçar linha por linha, você lista só o que mudou numa
aba separada, e um clique aplica tudo de uma vez.

1. Crie uma aba nova na mesma planilha chamada exatamente `Atualizar em Massa`
   (clique no `+` no rodapé da planilha, do lado das abas).
2. Nessa aba nova, importe ou copie o modelo `atualizar-em-massa-modelo.csv`
   — ele mostra o formato: `ID | Armazenamento | Novo Preco | Novo Disponivel | Novas Parcelas`.
3. Preencha uma linha pra cada mudança:
   - Se preencher o **Armazenamento**, a mudança vale só pra aquela
     capacidade específica (ex.: só o 256GB daquele produto).
   - Se **deixar o Armazenamento em branco**, a mudança vale pra
     **todas** as capacidades daquele ID de uma vez (útil quando o
     preço de um produto inteiro muda, e ele tem várias opções de
     armazenamento).
   - Pode deixar Preço, Disponível ou Parcelas em branco se não quiser
     mexer naquele campo específico.
4. Menu **Preços → Aplicar atualização em massa**. Aparece um aviso
   dizendo quantas linhas foram alteradas.
5. Pode apagar as linhas da aba `Atualizar em Massa` depois de aplicar,
   ou deixar lá — ela não é lida pelo site, só serve como "lista de
   entrada" pro botão.

O **ID** de cada produto é a mesma coluna que já existe na aba `Precos`
— copie de lá pra saber o ID certo do produto que quer mudar.

---

## Parcelamento ("ou 12x de R$ X sem juros")

Cada linha da aba `Precos` agora tem uma coluna extra, **Parcelas**. Se
você preencher um número ali (ex.: `12`), o site calcula sozinho o valor
da parcela (preço ÷ parcelas) e mostra "ou 12x de R$ ... sem juros" embaixo
do preço daquele produto. Deixar em branco = não mostra parcelamento
nenhum pra aquele item (é o padrão hoje, já que nenhuma linha tem isso
preenchido ainda).

Se a sua conta já tinha a aba `Precos` criada antes dessa coluna existir,
adicione a coluna manualmente: clique na primeira célula vazia depois da
coluna ID (deve ser a coluna H) e escreva `Parcelas` no cabeçalho.

**Importante:** depois de colar a versão nova do script (a que tem o
menu "Preços"), você precisa **atualizar a implantação existente** pra
essa coluna passar a ser lida pelo site — veja a próxima seção.

---

## Atualizando o script depois de uma mudança

Sempre que eu avisar que o `docs/apps-script-precos.gs` mudou (como
agora, com o menu novo e a coluna Parcelas), o processo é:

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
aparecer na barra de cima (ele é criado quando a planilha é aberta).
