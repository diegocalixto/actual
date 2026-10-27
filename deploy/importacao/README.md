# Importação dos dados bancários reais — preparação

Esta pasta **prepara** a troca do orçamento fictício da V2 pelos dados reais do
Itaú. Nesta etapa nada real é importado: não há extrato aqui, e nenhum extrato
pode entrar no repositório. Produção (Docker no Windows, porta 5006, dados em
`C:\Users\diego\DiegoFinance\dados`, backups em `D:\DiegoFinance\backups`) não é
tocada por nada desta pasta.

| Arquivo        | Para quê                                                             |
| -------------- | -------------------------------------------------------------------- |
| `importar.mjs` | validar, planejar, aplicar, conferir e atualizar (Node 24, sem deps) |
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

Isso vale para o orçamento local do `aplicar`. Depois que o orçamento está no
servidor, os lotes seguintes vão pelo `atualizar` (seção 3.1), que nunca
reenvia uma transação já existente.

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
node deploy/importacao/importar.mjs atualizar --controles <json> --servidor <url> --sync-id <id> \
     --orcamento "<nome>" --data-dir <pasta vazia> [--confirmar] [--importar-suspeitas] \
     [--aplicar-parcial] [--sem-agendamentos] [--api ...] <csv...>
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
  com `--criar-categorias`; o saldo inicial fica na data de `saldo_inicial`,
  não no dia da criação), importa por conta com dedupe por `imported_id`,
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

### 3.1 Atualização incremental (`atualizar`), depois da implantação

Quando o orçamento real já está no servidor e é editado no computador e no
iPhone, o `aplicar` não serve mais: a pasta local dele fica para trás, e
reenviar o lote faria o `importTransactions` do Actual (26.8.1) regravar
notas, categoria e "conferido" que o usuário apagou e reimportar o que ele
excluiu. O `atualizar` usa a sincronização da própria API:

1. confere no servidor que o **id de sincronização** (Configurações →
   Avançado) é do orçamento `--orcamento` e só então o baixa, numa pasta
   **vazia**, a cada execução; outro orçamento nunca é baixado nem aberto;
2. recusa se faltar conta (renomeada ou fechada no app) ou categoria; nunca
   cria nenhuma das duas. Com `--confirmar`, recusa também o lote que tenha
   conta **vinculada à sincronização bancária** (Pluggy etc.): ao casar o
   extrato do banco com o histórico, o Actual troca o `imported_id` `dfi1-…`
   pelo id do banco, e o lote sobreposto voltaria inteiro como "novo". A
   prévia marca essas contas com `VINCULADA`; `--importar-suspeitas` e
   `--aplicar-parcial` não liberam;
3. classifica cada linha contra o orçamento, inclusive o que foi excluído no
   app:

| Situação                                                                                   | O que acontece                                     |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| já importada: mesmo `imported_id`, data e valor                                            | nada; não é reenviada                              |
| equivalente: outro `id_origem`, mesma conta, data, valor e descrição, em trecho completo¹  | nada; um extrato novo renumera o `id_origem`       |
| excluída no app                                                                            | nada; não volta                                    |
| divergente: mesmo `imported_id`, outra data ou valor                                       | nada; mantido o do orçamento, listada para revisão |
| suspeita: parecida com uma já importada (mesmo valor em 7 dias, ou mesma data e descrição) | não entra; entra com `--importar-suspeitas`        |
| suspeita: igual a uma já importada, em trecho sem prova de lote completo¹                  | idem: pode ser outra compra idêntica               |
| nova                                                                                       | entra                                              |

¹ Trecho completo: na corrente, entre `saldo_inicial` e `saldo_final` do
`controles.json` (o `validar` exige que a soma feche); no cartão, fatura com
total no `controles.json`. Fora disso, o lote pode ser parcial. Uma transação
excluída no app nunca volta, nem quando reencontrada pelo conteúdo, nem com
`--importar-suspeitas`.

4. só as novas são enviadas. Antes, a prévia do próprio Actual (nada gravado)
   aponta as que casam com **lançamento manual** (mesmo valor, até 7 dias, sem
   `imported_id`): o manual recebe só o `imported_id` e a descrição do banco;
   favorecido, categoria, notas, data e "conferido" ficam como o usuário
   deixou;
5. sincroniza (só mensagens; o arquivo do servidor nunca é substituído) e
   confere: nenhum `imported_id` repetido, cada nova presente uma vez, saldo em
   `saldo_final.data` × previsto × declarado.

Sem `--confirmar` é só prévia. Com `--confirmar`, divergência ou suspeita sem
resolução **bloqueia o lote inteiro**: nada é gravado. Resolver é explícito:
corrigir o CSV ou o app e rodar de novo; ou, depois de revisar,
`--importar-suspeitas` (as suspeitas entram como novas) e/ou
`--aplicar-parcial` (entram só as novas; divergências e suspeitas ficam de
fora). Sai com código 1 se houver pendência, saldo diferente do declarado ou
falha na conferência. Reaplicar o mesmo lote não grava nada.

Não há atomicidade entre etapas: o Actual envia cada gravação ao servidor
cerca de 1 s depois de feita. Se der erro no meio, o importador fecha sem
sincronizar o que restou, mas parte do lote pode já estar no servidor; rodar
o mesmo comando de novo completa o lote sem duplicar (tudo é reconhecido pelo
id).

Também não há trava entre aparelhos: não edite no app enquanto o `atualizar`
roda, e abra antes o app no iPhone, com internet, para enviar lançamentos
feitos offline. Um lançamento manual que chegue ao servidor durante a
execução, ou depois dela, não é casado com o extrato e pode ficar em dobro.

- `controles.json` do lote: só as faturas que estão no lote; `saldo_inicial` e
  `saldo_final` da corrente tirados do próprio extrato.
- Comece o extrato novo **pelo menos 7 dias antes** do último dia já
  importado: a sobreposição é reconhecida e evita suspeitas falsas.
- Depois da implantação, categoria, favorecido e notas se decidem no app;
  mudar a categoria de uma linha já importada no CSV não tem efeito.
- Divergência e suspeita somem quando orçamento e extrato concordam: ajuste no
  app (por exemplo, a data de um lançamento manual) ou corrija o CSV.
- A senha vai só pelo ambiente e só para `https`, ou para `http` em endereço
  local (`localhost`, `127.0.0.1`, `[::1]`, `host.docker.internal`). Do
  contêiner de desenvolvimento, o servidor do host é
  `http://host.docker.internal:5006`:

```powershell
$s = Read-Host 'Senha do Diego Finance' -AsSecureString
$env:DF_SENHA_SERVIDOR = [Net.NetworkCredential]::new('', $s).Password
docker exec -e DF_SENHA_SERVIDOR df-v2-dev sh -c "cd /workspaces/actual-v2 && NODE_PATH=/workspaces/actual-v2/node_modules node deploy/importacao/importar.mjs atualizar --servidor http://host.docker.internal:5006 --sync-id <id> --orcamento 'Diego Finance Real' ..."
Remove-Item Env:DF_SENHA_SERVIDOR
```

### 3.2 Ancoragem antes do vínculo Pluggy (`ancorar.mjs`)

Ao vincular à Pluggy uma conta que já tem o histórico do importador, o Actual
casa cada lançamento do banco com um existente de mesmo valor em ±7 dias, um a
um, na ordem em que o banco os entrega. No ensaio com dados reais (26/10) isso
casou Pix repetidos em cascata (o Pix novo de 18/10 tomou a linha de 13/10,
que empurrou as outras: saldo e contagem fecham, o mês não) e deixou em dobro
o IOF, que o importador tem somado por fatura e a Pluggy traz por compra.
`ancorar.mjs` resolve os dois **antes** do vínculo, com prévia:

```
node deploy/importacao/ancorar.mjs prever  --servidor <url> --sync-id <id> --orcamento <nome> \
     --data-dir <pasta vazia> --api <index.js> --saida <pasta> \
     --conta "Itaú Conta Corrente=<id Pluggy>" --conta "Itaú Personnalité Crédito=<id Pluggy>"
node deploy/importacao/ancorar.mjs aplicar  (mesmas opções) --confirmar [--regras]
```

1. abre o orçamento do servidor como o `atualizar` (id de sincronização +
   nome, pasta vazia, senha em `DF_SENHA_SERVIDOR`) e pede ao servidor os
   lançamentos que o adaptador Pluggy entregaria na sincronização (mesmas
   datas e valores que o Actual vai ver);
2. casa existente × banco por **mesmo valor**, do par de datas mais próximo
   para o mais distante (`--tolerancia`, padrão 5 dias), semelhança de
   descrição no desempate, **um par só** por lançamento de cada lado. Linha do
   importador (`dfi1-…`) só casa com lançamento do banco até a **data de
   corte** do lote (a última data `dfi1-` da conta, ou `--corte`); depois dela,
   só lançamento manual pode casar. Lançamento já conciliado nunca é tocado;
3. **IOF agregado**: quando as linhas de IOF do banco do mesmo cartão (final
   impresso na descrição) e da mesma fatura somam exatamente a linha agregada,
   propõe apagar a agregada — o banco traz as partes — e uma regra que dá às
   partes a categoria da agregada. Soma que não fecha: nada é proposto;
4. a prévia lista as âncoras com data diferente ou descrição pouco parecida, o
   histórico da janela sem par no banco, e o que o banco traz **até o corte**
   sem par (entraria como novo no período do histórico: conferir). Sai com
   código 1 se houver algo a conferir;
5. `aplicar --confirmar` grava só o `imported_id` do banco nas âncoras e
   apaga as agregadas comprovadas (`--regras` cria as regras), confere no
   orçamento e sincroniza. Depois disso o vínculo é feito no aplicativo (ou
   pelo condutor do ensaio): o Actual casa pelo id, sem fuzzy, e preserva
   categoria, nota, favorecido, data e transferências.

Resultado no ensaio (cópia da base de 21/10, 26/10): 134 + 83 âncoras, 5
agregadas de IOF apagadas, cartão igual ao banco (Δ 0,00; sem ancoragem era
−230,74), corrente Δ −0,24 (rendimento da aplicação automática, que o banco não
lança), nenhum campo sensível alterado nos casados, duas sincronizações
seguintes com 0 novos e as 5 edições de teste preservadas.

Depois do vínculo, ligue **`reimport-deleted=false`** em cada conta vinculada
(configurações de sincronização da conta, "reimportar excluídos"): com o padrão
ligado, um lançamento apagado no app volta na sincronização seguinte.

**Transferências entre contas vinculadas.** O banco entrega os dois lados de um
pagamento de fatura ou de um Pix entre contas próprias como lançamentos soltos
(gasto numa conta, receita na outra):

```
node deploy/importacao/ancorar.mjs transferencias (opções de servidor) --saida <pasta> \
     --par "Itaú Conta Corrente=Itaú Personnalité Crédito" [--par ...] [--tolerancia 3] [--confirmar]
```

pareia saída e entrada de mesmo valor em até 3 dias e só propõe ligar quando há
**prova**: "pagamento de fatura" × "pagamento recebido", ou o CPF do titular
**nos dois lados** do Pix — a saída nomeia o titular da conta de destino como
recebedor e a entrada nomeia o titular da conta de origem como pagador (lidos
do dado cru da sincronização). Par com categoria em algum lado é só listado;
par sem prova idem. `--confirmar` liga os
pares provados como transferência (o "Tornar transferência" da tela: nenhum
lançamento novo, categoria zerada nos dois lados).

**Adaptador Pluggy do fork** (`packages/sync-server/src/app-pluggyai/`): o dia do
lançamento é lido no fuso de Brasília (`ACTUAL_PLUGGYAI_TIMEZONE`, padrão
`America/Sao_Paulo`; o upstream usa UTC e jogava para o dia seguinte o que foi
feito depois das 21h); parcela que já vem datada pelo banco (anuidade k/12) não
é deslocada k−1 meses; favorecido nunca é CPF — vale a contraparte nomeada,
depois a descrição do extrato sem o rótulo da operação ("Pix enviado",
"Pagamento de boleto"…) e sem o contador de parcela, por fim o merchant.

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
- O `aplicar` só grava em pasta local isolada; o primeiro envio ao servidor é
  pelo aplicativo (importar o `.zip`), de propósito. Os lotes seguintes vão
  pelo `atualizar`.
- Fuzzy matching do Actual: transação nova sem `imported_id` igual pode ser
  casada com uma existente de mesmo valor e data próxima. Em orçamento novo
  isso não ocorre; não rode o `aplicar` sobre um orçamento com lançamentos
  manuais. O `atualizar` mostra esses casamentos na prévia e só grava o
  `imported_id` no lançamento manual.
- Corrigir uma linha depois de importada gera outro `imported_id`: no
  `atualizar` ela aparece como suspeita, não como nova; a correção deve ser
  feita no aplicativo.
- O `api.updateTransaction` do Actual 26.8.1 devolve antes de gravar; o
  importador usa o handler `transaction-update`, o mesmo do app.
