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

Só isso: abrir a planilha (celular ou computador), achar a linha do
produto, mudar o número da coluna Preço. O site pega a atualização na
próxima vez que alguém carregar a página — não precisa mexer em código,
não precisa avisar ninguém.

Se a planilha cair ou a URL parar de responder por qualquer motivo, o
site volta sozinho a usar os preços fixos salvos em `produtos.json`,
sem quebrar.
