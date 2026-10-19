# Importação dos dados bancários reais — preparação

Esta pasta **prepara** a troca do orçamento fictício da V2 pelos dados reais do
Itaú. Nesta etapa nada real é importado: não há extrato aqui, e nenhum extrato
pode entrar no repositório. Produção (Docker no Windows, porta 5006, dados em
`C:\Users\diego\DiegoFinance\dados`, backups em `D:\DiegoFinance\backups`) não é
tocada por nada desta pasta.

| Arquivo        | Para quê                                                             |
| -------------- | -------------------------------------------------------------------- |
| `importar.mjs` | validar, planejar, aplicar e conferir (Node 24, sem dependências)    |
| `modelos/`     | modelo de CSV e de `controles.json`, só com linhas fictícias         |
| `exemplo/`     | conjunto fictício completo usado na simulação                        |
| `SIMULACAO.md` | comandos e resultados da simulação isolada                           |
| `BACKLOG.md`   | ideias futuras (SMS do Itaú, comprovantes); nada implementado        |
| `.gitignore`   | barra `dados/`, `entrada/`, `saida/`, OFX, PDF, imagens e CSVs reais |

## 1. Estratégia

### Contas

| Conta                         | Tipo no Actual              | Saldo                                |
| ----------------------------- | --------------------------- | ------------------------------------ |
| **Itaú Conta Corrente**       | conta no orçamento          | positivo; tem de bater com o extrato |
| **Itaú Personnalité Crédito** | conta no orçamento (cartão) | **negativo** = dívida ainda não paga |
| Nubank                        | depois                      | entra numa próxima rodada            |

O cartão segue o jeito do Actual: é uma conta dentro do orçamento cujo saldo é a
dívida.

- **Compra no cartão** = transação **negativa na conta do cartão**, com
  categoria. A despesa é contada ali, no dia da compra.
- **Pagamento da fatura** = **transferência** da conta corrente para o cartão.
  Os dois lados usam o favorecido de transferência do Actual e **nenhum tem
  categoria**. Assim o gasto não é contado duas vezes (uma na compra, outra no
  pagamento).
- Estorno = positivo no cartão, com a categoria da compra original.
- O lançamento "PAGAMENTO EFETUADO" que aparece na fatura é o **outro lado** da
  mesma transferência: o script o usa só para conferir o par e **não** o
  importa (o Actual cria a contrapartida sozinho).

### Faturas como controle, não como transação

Os totais das faturas são **controles de conferência**, nunca lançamentos:

| Fatura (mês) | Situação  | Total de controle                   |
| ------------ | --------- | ----------------------------------- |
| 2026-08      | fechada   | informado pelo Diego (fora do repo) |
| 2026-09      | fechada   | idem                                |
| 2026-10      | fechada   | idem                                |
| 2026-11      | aberta    | idem (compras conhecidas por print) |
| 2026-12      | projetada | idem (soma das parcelas futuras)    |

Esses números ficam só no `controles.json` real, **fora do repositório**. O
`validar` soma as linhas de cartão de cada fatura (compras, parcelas, estornos,
tarifas, IOF; sem o pagamento) e exige que `−soma == total`. Diferença de um
centavo bloqueia o `planejar` e o `aplicar`.

**Ciclo da fatura — premissas a confirmar com o Diego:**

- a coluna `fatura` (AAAA-MM) é o **mês de vencimento** da fatura em que a linha
  aparece, copiado da própria fatura, e não deduzido da data;
- cada fatura tem data de **fechamento** e de **vencimento**; uma compra entra
  na fatura cujo fechamento é o primeiro ≥ data da compra. Compras feitas no dia
  do fechamento ou no fim de semana podem cair na fatura seguinte: por isso a
  coluna manda, e o script só **avisa** quando a data sai do ciclo declarado;
- o total da fatura pode incluir saldo anterior, juros, multa, IOF ou anuidade.
  Esses itens viram linhas próprias (`tarifa`); saldo anterior não pago não é
  compra nova e precisa ser tratado à parte (pergunta em aberto);
- o saldo inicial do cartão (`saldo_inicial` no `controles.json`) é a dívida que
  já existia antes da primeira fatura importada. Se a fatura de 2026-07 foi paga
  dentro do período do extrato, esse pagamento precisa de um saldo inicial
  correspondente no cartão.

### Parcelas

- **Parcela que já caiu numa fatura** = transação real no cartão, valor da
  parcela, `parcela` = `k/n`, notas "Parcela k/n". Data recomendada: o dia da
  compra original no mês da fatura (compra em 10/06 em 3x → parcela 2/3 em
  2026-07-10), e a data original vai em `observacao`.
- **Parcela futura** (`tipo = parcela_futura`, ex.: as de dezembro) **nunca** é
  lançada como transação já ocorrida. O `aplicar` cria um **agendamento** do
  Actual por parcela, com data e valor, **sem lançamento automático**
  (`posts_transaction = false`). O agendamento aparece em "Próximos", não mexe
  no saldo e é casado com a transação real quando a fatura chegar. Quem preferir
  não usar agendamentos roda com `--sem-agendamentos`; as projeções continuam
  no `plano.json`.
- O controle de 2026-12 (projetada) é comparado com a soma das parcelas futuras.

### Pix

Pix **nunca** vira despesa automaticamente.

- `pix` com `categoria` preenchida pelo Diego → entra com essa categoria;
- `pix` sem categoria → entra **sem categoria** e vai para a fila de revisão;
- Pix para conta própria (`transferencia_propria`): `favorecido` = nome da
  outra conta. Se ela estiver na importação, vira transferência; se não estiver
  (Nubank, por enquanto), entra sem categoria, com nota "REVISAR", e é
  convertida em transferência à mão quando o Nubank existir. Nunca recebe
  categoria de despesa.

### Fila de revisão

O `planejar` grava `revisao.csv` com cada linha que precisa de decisão humana:
Pix sem classificação, compra sem categoria, transferência própria sem par,
"PAGAMENTO EFETUADO" sem saída correspondente e descrições genéricas
(`PAG*…`, `PIX …`, `TED`, `SAQUE`, textos de até 4 caracteres). A lista de
padrões pode ser trocada em `controles.json` (`padroes_ambiguos`). Nada nessa
fila é categorizado por adivinhação.

### Idempotência

Cada transação recebe um `imported_id` determinístico:

```
dfi1-<primeiros 32 hex de sha256(conta | data | centavos | descrição normalizada | sequência)>
```

- descrição normalizada: sem acento, maiúscula, só letras, números, `*` e
  espaço;
- sequência: 0, 1, 2… para linhas idênticas no mesmo dia (duas padarias de
  R$ 25,00 no mesmo dia são duas compras, e o `validar` avisa para confirmar);
- o `importTransactions` do Actual ignora o que já tem o mesmo `imported_id`
  na conta. Rodar o `aplicar` de novo importa **0** transações novas.

Mudar a descrição, a data ou o valor de uma linha muda o `imported_id`: corrija
os CSVs **antes** do primeiro `aplicar` real, não depois.

## 2. Formato de entrada

CSV **UTF-8, separador `;`** (o padrão do Excel em português), cabeçalho
obrigatório. Modelo em `modelos/transacoes.csv`.

| Coluna       | Obrigatória            | Formato / regra                                                                                                |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `conta`      | sim                    | nome exato de uma conta declarada em `controles.json`                                                          |
| `data`       | sim                    | `AAAA-MM-DD`                                                                                                   |
| `descricao`  | sim                    | texto do extrato/fatura, como está                                                                             |
| `valor`      | sim                    | **decimal brasileiro com duas casas**: `-1.234,56` ou `-1234,56`; negativo = saída da conta                    |
| `categoria`  | não                    | nome da categoria no orçamento; proibida em transferências                                                     |
| `favorecido` | não                    | em transferência: **nome da conta de destino**                                                                 |
| `parcela`    | não                    | `k/n`                                                                                                          |
| `tipo`       | sim                    | `compra`, `pagamento_fatura`, `pix`, `transferencia_propria`, `estorno`, `tarifa`, `receita`, `parcela_futura` |
| `fatura`     | sim em linha de cartão | `AAAA-MM` (mês de vencimento)                                                                                  |
| `observacao` | não                    | vai para as notas                                                                                              |

Valor em decimal brasileiro, e não em centavos, porque é o que aparece no
extrato e na fatura: a transcrição é literal e a conferência visual é direta. O
script converte para centavos inteiros sem passar por ponto flutuante. `12.50`
ou `-10,5` são recusados de propósito. Texto com `;` precisa de aspas.

Sinais exigidos: `compra`, `tarifa`, `parcela_futura` negativos; `estorno`,
`receita` positivos; `pagamento_fatura` negativo na conta corrente e positivo no
cartão.

`controles.json` (modelo em `modelos/controles.json`) declara as contas, o saldo
inicial e final da conta corrente e os totais de cada fatura:

```json
{
  "contas": {
    "Itaú Conta Corrente": {
      "tipo": "corrente",
      "saldo_inicial": { "data": "AAAA-MM-DD", "valor": "0,00" },
      "saldo_final": { "data": "AAAA-MM-DD", "valor": "0,00" }
    },
    "Itaú Personnalité Crédito": {
      "tipo": "cartao",
      "saldo_inicial": { "data": "AAAA-MM-DD", "valor": "0,00" }
    }
  },
  "faturas": {
    "Itaú Personnalité Crédito": {
      "AAAA-MM": {
        "total": "0,00",
        "situacao": "fechada|aberta|projetada",
        "fechamento": "AAAA-MM-DD",
        "vencimento": "AAAA-MM-DD"
      }
    }
  }
}
```

No caso real: saldo final da conta corrente = o saldo do extrato em **2026-10-14** (valor só no `controles.json` real); o
saldo inicial é o do extrato no dia anterior ao primeiro lançamento (2026-07-15).

## 3. O script

```bash
node deploy/importacao/importar.mjs validar  --controles <json> [--data-corte AAAA-MM-DD] <csv...>
node deploy/importacao/importar.mjs planejar --controles <json> --saida <pasta fora do repo> <csv...>
node deploy/importacao/importar.mjs aplicar  --controles <json> --data-dir <pasta isolada> \
     --orcamento "<nome novo>" --confirmar [--criar-categorias] [--sem-agendamentos] \
     [--exportar <arquivo.zip>] [--api <index.js do @actual-app/api>] <csv...>
node deploy/importacao/importar.mjs conferir --controles <json> --data-dir <pasta isolada> \
     --orcamento "<nome>" [--api ...] <csv...>
```

- **validar** — cabeçalho, datas, valores, tipos, sinais, conta conhecida,
  linha de cartão sem fatura, data posterior à data de corte (padrão: hoje) sem
  ser `parcela_futura`, `parcela_futura` já vencida, categoria em transferência,
  duplicatas no mesmo dia, Pix sem classificação, soma por fatura × controle e
  saldo final da conta corrente × declarado. Sai com código 1 se houver erro.
- **planejar** — simulação: grava `plano.json` (contas, transações com
  `imported_id`, pares de transferência, agendamentos, linhas não importadas) e
  `revisao.csv`. Recusa pasta de saída dentro do repositório.
- **aplicar** — usa o `@actual-app/api` **localmente** (sem servidor). Recusa
  rodar sem `--confirmar`, sem `--data-dir`, com `--data-dir` que contenha
  `dados`, `DiegoFinance\dados`, `server-files` ou `user-files`, dentro do
  repositório ou inexistente. O caminho é conferido também depois de resolver
  links simbólicos (`realpath`), e um `--data-dir` que seja ele mesmo um link é
  recusado. A primeira aplicação exige uma pasta **vazia** e grava nela
  `.diego-finance-importacao.json`; as seguintes só aceitam pasta com esse
  marcador. O orçamento é reaberto pelo id guardado no marcador — nunca
  escolhido pelo nome —, e uma pasta com orçamento que o fluxo não criou é
  recusada. Cria contas e categorias que faltam (categorias só
  com `--criar-categorias`), importa por conta com dedupe por `imported_id`,
  cria os agendamentos das parcelas futuras e, com `--exportar`, gera o `.zip`
  do orçamento para abrir no aplicativo. O ruído do núcleo do Actual vai para
  `<data-dir>/importar.log`.
- **conferir** — somente leitura: saldo de cada conta × esperado pelo plano,
  saldo da conta corrente × declarado, despesa categorizada × soma das linhas
  categorizadas (prova que o pagamento da fatura não virou despesa), cada
  transferência com contrapartida e sem categoria, agendamentos presentes.

**API compilada.** O `aplicar` precisa do pacote do `@actual-app/api` compilado
pelo vite (um `index.js` único). Neste container, `packages/api/dist/index.js`
estava sobrescrito pela saída do `tsc` e não roda sozinho; o script detecta e
recusa. Ver em `SIMULACAO.md` como o pacote foi gerado numa pasta fora do
repositório, sem mexer em dependências, e passado com `--api`. É preciso
`NODE_PATH=<repo>/node_modules` para o `better-sqlite3`.

## 4. Roteiro da execução real (futura, com o Diego)

Nada disto acontece nesta etapa.

1. **Juntar os arquivos** (lista na seção 5) em
   `C:\Users\diego\DiegoFinance\importacao\` — fora do repositório e fora da
   pasta de dados do servidor. Subpastas: `entrada\` (originais do banco),
   `csv\` (transcrições), `saida\` (planos e relatórios), `orcamento-local\`
   (pasta de dados isolada do `aplicar`).
2. **Backup antes de tudo**, com o servidor parado, pelas convenções de
   `deploy/backup.sh`:
   `DF_COMPOSE_DIR=<pasta do compose> ./backup.sh C:\Users\diego\DiegoFinance\dados D:\DiegoFinance\backups`.
   Conferir o `.sha256` e copiar para fora da máquina.
3. **Exportar o orçamento fictício atual** no aplicativo (Configurações →
   Export data) e guardar o `.zip` junto do backup.
4. **Transcrever** extrato e faturas para os CSVs do modelo; criar o
   `controles.json` real com os totais da tabela acima e o saldo de 14/10.
5. `validar` até zerar os erros; resolver cada linha de `revisao.csv` (preencher
   categoria ou decidir conscientemente deixar sem).
6. `planejar` e revisar o `plano.json` com o Diego.
7. `aplicar --confirmar` numa pasta **vazia e isolada**, criando um **orçamento
   novo** (ex.: "Diego Finance Real"). O fictício não é apagado.
8. `aplicar` de novo: tem de mostrar **0 novas** em todas as contas.
9. `conferir`: saldos, faturas, despesa e pares sem falha. Conferir também no
   aplicativo: saldo da conta corrente = saldo do extrato em 14/10; saldo do cartão
   = −(compras ainda não pagas).
10. `aplicar ... --exportar real.zip` e, no aplicativo da V2, **importar esse
    arquivo como orçamento novo** (o Actual sobe ao servidor como arquivo
    separado). O orçamento fictício continua lá até o Diego decidir.
11. **Aceite do Diego**: abre o orçamento novo no computador e no iPhone,
    confere saldos e algumas faturas, e só então passa a lançar nele.
12. **Reversão**: se algo estiver errado, basta não usar (ou apagar no
    aplicativo) o orçamento novo; o fictício está intacto. Se o servidor tiver
    sido afetado, `deploy/restore.sh` com o backup do passo 2. Corrigir os CSVs
    e repetir a partir do passo 5 numa pasta isolada nova.

## 5. O que o Diego precisa fornecer depois

Tudo em `C:\Users\diego\DiegoFinance\importacao\entrada\`, **nunca** no
repositório:

1. **Extrato da conta corrente Itaú** de 16/07/2026 a 14/10/2026, de
   preferência **OFX** ou **CSV** exportado do internet banking (PDF serve, mas
   exige transcrição), com o saldo do dia 15/07 e do dia 14/10.
2. **Fatura do Itaú Personnalité** de **agosto**, **setembro** e **outubro** de
   2026 (PDF ou CSV detalhado), com datas de fechamento e vencimento.
3. **Fatura de novembro (aberta)**: as capturas de tela das compras, já
   **transcritas** para o modelo CSV (`fatura = 2026-11`).
4. **Lista das parcelas de dezembro**: descrição, `k/n`, valor e data
   (`tipo = parcela_futura`, `fatura = 2026-12`).
5. **`controles.json` real**: totais das cinco faturas, saldo inicial e final da
   conta corrente, e a dívida do cartão antes da fatura de agosto.
6. Nubank: em outra rodada, com os mesmos arquivos equivalentes.

## 6. Perguntas em aberto para o Diego

- Datas de fechamento e vencimento do cartão em cada mês? A coluna `fatura`
  deve ser o mês de vencimento (proposta) ou o de fechamento?
- Alguma fatura teve saldo anterior não pago, juros, IOF ou anuidade?
- A fatura de julho (compras de junho/julho) foi paga antes de 16/07? Se foi
  depois, qual era a dívida do cartão em 15/07?
- Há cartões adicionais ou virtuais dentro da mesma fatura? Ficam numa conta só?
- Quais Pix são para contas próprias (Nubank, poupança, investimentos)?
- Investimentos/aplicação automática do Itaú: ficam fora do orçamento?
- Categorias: usar as da V2 atual ou uma lista nova? Nomes exatos.
- Agendamentos para parcelas futuras estão bons, ou prefere só a projeção em
  arquivo?
- Nome do orçamento novo e quando aposentar o fictício.

## 7. Limitações

- Leitura de OFX e PDF não está implementada: a entrada é o CSV do modelo.
- O `aplicar` só grava em pasta local isolada; envio ao servidor é pelo
  aplicativo (importar o `.zip`), de propósito.
- Fuzzy matching do Actual: transação nova sem `imported_id` igual pode ser
  casada com uma existente de mesmo valor e data próxima. Em orçamento novo
  isso não ocorre; não rode o `aplicar` sobre um orçamento com lançamentos
  manuais.
- Corrigir uma linha depois de importada gera outro `imported_id`; a correção
  deve ser feita no aplicativo.
