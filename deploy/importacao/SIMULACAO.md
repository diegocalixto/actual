# Simulação isolada (dados fictícios) — 2026-10-15

Só o conjunto de `exemplo/`. Orçamento local numa pasta descartável fora do
repositório; nenhum servidor, nenhuma porta, nada de produção.

## Conjunto fictício

- Conta corrente: saldo inicial 5.000,00 (15/07), receita, tarifa, Pix sem
  classificação, **pagamento de fatura 400,00** (transferência), Pix para conta
  própria no Nubank (fora do orçamento), saldo declarado 7.250,00 em 30/09.
- Cartão: fatura 2026-08 (fechada, 400,00, inclui parcela 1/3) e fatura 2026-09
  (aberta, 500,00: parcela 2/3, compra 1/2, `PAG*EXEMPLO XYZ` ambígua, duas
  compras iguais no mesmo dia e o "PAGAMENTO EFETUADO" do lado do cartão).
- Parcelas futuras 3/3 e 2/2 (fatura 2026-10 projetada, 300,00).

## Pacote da API

`packages/api/dist/index.js` neste container é saída do `tsc` (importa
`@actual-app/core` em código-fonte) e não roda no Node. Gerei o pacote do vite
numa pasta do scratchpad, com a configuração do próprio `packages/api`, sem os
plugins que apagam `dist/` e `@types/`, sem instalar nada:

```bash
# vite.sim.config.mts: importa packages/api/vite.config.mts, troca outDir,
# remove clean-output-dirs / copy-node-runtime-assets / visualizer
yarn workspace @actual-app/api exec vite build --config <scratch>/vite.sim.config.mts
cp -r packages/loot-core/migrations <scratch>/api-bundle/
cp packages/api/dist/default-db.sqlite <scratch>/api-bundle/
export NODE_PATH=/workspaces/actual-v2/node_modules   # better-sqlite3
```

Alternativa na execução real: `yarn build:api` (reescreve `packages/api/dist`,
que é ignorado pelo git) e então dispensar `--api`.

## Comandos

```bash
E="--controles deploy/importacao/exemplo/controles.json --data-corte 2026-09-30"
F=deploy/importacao/exemplo/*.csv
SIM=<scratchpad>/importacao-sim
node deploy/importacao/importar.mjs validar  $E $F
node deploy/importacao/importar.mjs planejar $E --saida $SIM/saida $F
node deploy/importacao/importar.mjs aplicar  $E --api $SIM/../api-bundle/index.js \
     --data-dir $SIM/orcamento --orcamento "Simulacao Importacao" --confirmar --criar-categorias $F   # 2x
node deploy/importacao/importar.mjs conferir $E --api ... --data-dir $SIM/orcamento --orcamento "Simulacao Importacao" $F
```

## Resultados

| Etapa                      | Resultado                                                                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| validar                    | 17 linhas, 0 erros, 1 aviso (duas padarias iguais no dia), 4 na revisão; faturas 400,00 / 500,00 / 300,00 e saldo 7.250,00 batem                                                                                                                               |
| planejar                   | corrente 5 transações; cartão 9; 1 transferência pareada; 2 agendamentos; 1 linha não importada (lado do cartão do pagamento)                                                                                                                                  |
| aplicar (1ª)               | orçamento criado; 2 contas; corrente **5 novas**, cartão **9 novas**; 2 agendamentos                                                                                                                                                                           |
| aplicar (2ª)               | corrente **0 novas**, cartão **0 novas**, 0 atualizadas; agendamentos 0 criados, 2 existentes                                                                                                                                                                  |
| aplicar (3ª, `--exportar`) | 0 novas; `.zip` do orçamento gerado (17 KB)                                                                                                                                                                                                                    |
| conferir                   | corrente **7.250,00** = declarado; cartão **−500,00** = −(compras da fatura aberta); despesa categorizada −900,00 = soma das linhas categorizadas (o pagamento de 400,00 não entrou); 1 par de transferência com contrapartida e sem categoria; 2 agendamentos |

Recusas testadas: `aplicar` sem `--confirmar`; `--data-dir` terminando em
`/dados`; `C:\Users\diego\DiegoFinance\dados`; `--saida` dentro do
repositório; API compilada pelo `tsc`. Casos inválidos (data, valor `-10.5`,
tipo desconhecido, cartão sem fatura, data futura, categoria em pagamento,
conta não declarada, receita negativa) foram todos apontados pelo `validar`.

## Reforço após a revisão do Codex (Etapa 16)

O Codex apontou que a proteção de `--data-dir` era só textual. Agora: caminho
real (`realpath`) comparado com os padrões proibidos e com o repositório; link
simbólico recusado; primeira aplicação só em pasta vazia, que recebe o
marcador `.diego-finance-importacao.json`; reaplicação só com o marcador e
pelo id do orçamento guardado nele. Rodado de novo numa pasta nova
(`importacao-sim2`, dados fictícios): 1ª aplicação 5 + 9 novas e 2
agendamentos; 2ª aplicação 0 novas; `conferir` sem falha. Recusas testadas:
link simbólico, pasta não vazia sem marcador, marcador forjado (`{}` numa
pasta não vazia), `--orcamento` diferente do guardado na pasta. O marcador só
vale com exatamente os campos e tipos que o próprio fluxo grava.
