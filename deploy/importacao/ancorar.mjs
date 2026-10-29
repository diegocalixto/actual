#!/usr/bin/env node
// Diego Finance V2 — ancoragem do histórico ao banco ANTES de vincular uma
// conta à Pluggy, e conciliação de transferências entre contas vinculadas.
//
//   node deploy/importacao/ancorar.mjs prever  --servidor <url> --sync-id <id> --orcamento <nome>
//        --data-dir <pasta vazia> --api <index.js> --saida <pasta>
//        --conta "<conta no Actual>=<id da conta na Pluggy>" [--conta ...]
//        [--tolerancia 5] [--corte "<conta>=AAAA-MM-DD"]
//   node deploy/importacao/ancorar.mjs aplicar  (as mesmas opções) --confirmar [--regras]
//   node deploy/importacao/ancorar.mjs transferencias --servidor ... --saida <pasta>
//        --par "<conta A>=<conta B>" [--par ...] [--tolerancia 3] [--confirmar]
//
// Por quê. Ao vincular uma conta que já tem histórico, o Actual casa cada
// lançamento do banco com um lançamento existente de mesmo valor em ±7 dias,
// um a um, na ordem em que o banco os entrega. Com Pix repetidos de mesmo
// valor isso casa em cascata (o Pix novo de 18/10 toma a linha de 13/10, que
// empurra as outras) e deixa o mês errado mesmo com saldo e contagem certos.
// A ancoragem resolve o casamento ANTES, de forma determinística e com prévia:
// mesmo valor, menor distância de datas primeiro, um par só por lançamento,
// semelhança de descrição no desempate, e a regra que o Actual não conhece —
// o histórico do importador termina na data de corte do lote, então um
// lançamento do banco posterior a ela só pode casar com lançamento manual.
// Cada par recebe o `imported_id` do banco; ao vincular, o Actual casa pelo id
// (sem fuzzy) e preserva categoria, nota, favorecido e transferências.
//
// Também trata o IOF agregado: o importador lançou, por fatura e por cartão,
// uma linha com a soma do IOF; a Pluggy traz uma linha por compra. Quando as
// linhas do banco do mesmo cartão e da mesma fatura somam exatamente a linha
// agregada, a prévia propõe apagar a agregada (o banco vai trazer as partes) e
// uma regra que dá às partes a mesma categoria. Soma que não fecha: nada é
// proposto, só relatado.
//
// `transferencias` é para depois do vínculo: o banco entrega os dois lados de
// um pagamento de fatura ou de um Pix entre contas próprias como dois
// lançamentos soltos, que contariam como gasto e como receita. O comando pareia
// saída e entrada de mesmo valor em contas diferentes (até `--tolerancia` dias)
// quando há prova — "pagamento de fatura" × "pagamento recebido", ou o mesmo
// CPF do titular nos dois lados do Pix — e, com `--confirmar`, liga os dois como
// transferência (o "Tornar transferência" da tela), sem criar lançamento novo.
// Par em que algum lado já tem categoria é só listado: a decisão é humana.
//
// `prever` e `transferencias` sem `--confirmar` não gravam nada. Senha em
// DF_SENHA_SERVIDOR. Detalhes em deploy/importacao/README.md, seção 3.2.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const PREFIXO_IMPORTADOR = 'dfi1-';
const JANELA_PADRAO_DIAS = 89; // o Actual pede ao banco de hoje−89 em diante
const TOLERANCIA_PADRAO = { prever: 5, aplicar: 5, transferencias: 3 };
const IOF = /\bIOF\b/i;
const PAGAMENTO_FATURA = /pagamento de fatura|fatura paga/i;
const PAGAMENTO_RECEBIDO = /pagamento recebido|pagamento efetuado/i;

const out = (...a) => process.stdout.write(`${a.join(' ')}\n`);
function sair(msg, code = 2) {
  process.stderr.write(`${msg}\n`);
  process.exit(code);
}

// ------------------------------------------------------------------ opções

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { conta: [], corte: [], par: [] };
  const flags = new Set(['confirmar', 'regras', 'verbose']);
  const listas = new Set(['conta', 'corte', 'par']);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) {
      sair(`argumento inesperado: ${a}`);
    }
    const nome = a.slice(2);
    if (flags.has(nome)) {
      opts[nome] = true;
      continue;
    }
    const v = rest[++i];
    if (v === undefined) {
      sair(`--${nome} precisa de um valor`);
    }
    if (listas.has(nome)) {
      opts[nome].push(v);
    } else {
      opts[nome] = v;
    }
  }
  return { cmd, opts };
}

function separarPar(texto, uso) {
  const i = texto.lastIndexOf('=');
  if (i <= 0 || i === texto.length - 1) {
    sair(`"${texto}": use ${uso}`);
  }
  return [texto.slice(0, i).trim(), texto.slice(i + 1).trim()];
}

function verificarOpcoes(cmd, opts) {
  for (const o of [
    'servidor',
    'sync-id',
    'orcamento',
    'data-dir',
    'api',
    'saida',
  ]) {
    if (!opts[o]) {
      sair(`${cmd} exige --${o}`);
    }
  }
  if (cmd === 'transferencias') {
    if (!opts.par.length) {
      sair('transferencias exige ao menos um --par "<conta A>=<conta B>"');
    }
    opts.pares = opts.par.map(p => {
      const [a, b] = separarPar(p, '"<conta A>=<conta B>"');
      if (a === b) {
        sair(`--par "${p}": as contas precisam ser diferentes`);
      }
      return { a, b };
    });
  } else {
    if (!opts.conta.length) {
      sair(`${cmd} exige ao menos um --conta "<conta>=<id Pluggy>"`);
    }
    opts.mapa = opts.conta.map(par => {
      const [nome, pluggy] = separarPar(
        par,
        '"<conta no Actual>=<id da conta na Pluggy>"',
      );
      return { nome, pluggy };
    });
    opts.cortes = Object.fromEntries(
      opts.corte.map(par => {
        const [nome, d] = separarPar(par, '"<conta>=AAAA-MM-DD"');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          sair(`--corte "${par}": use "<conta>=AAAA-MM-DD"`);
        }
        return [nome, d];
      }),
    );
    if (cmd === 'aplicar' && !opts.confirmar) {
      sair('aplicar exige --confirmar (rode prever antes e revise a prévia)');
    }
  }
  const url = URL.canParse(opts.servidor) ? new URL(opts.servidor) : null;
  const local = ['localhost', '127.0.0.1', '[::1]', 'host.docker.internal'];
  if (
    !url ||
    url.username ||
    url.password ||
    !(
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && local.includes(url.hostname))
    )
  ) {
    sair(
      `--servidor: use https, ou http só em ${local.join(', ')}; sem usuário ou senha na URL`,
    );
  }
  if (!process.env.DF_SENHA_SERVIDOR) {
    sair(
      'defina a senha do servidor em DF_SENHA_SERVIDOR (nunca na linha de comando)',
    );
  }
  const tol = Number(opts.tolerancia ?? TOLERANCIA_PADRAO[cmd]);
  if (!Number.isInteger(tol) || tol < 0 || tol > 7) {
    sair('--tolerancia: inteiro de 0 a 7 dias');
  }
  opts.tolerancia = tol;
  const dir = path.resolve(opts['data-dir']);
  if (dir === REPO_ROOT || dir.startsWith(`${REPO_ROOT}${path.sep}`)) {
    sair('--data-dir dentro do repositório');
  }
  fs.mkdirSync(dir, { recursive: true });
  if (fs.readdirSync(dir).length) {
    sair(
      `--data-dir ${dir} precisa estar vazia: o orçamento é baixado do servidor a cada execução`,
    );
  }
  opts.dataDir = dir;
  const saida = path.resolve(opts.saida);
  if (saida === REPO_ROOT || saida.startsWith(`${REPO_ROOT}${path.sep}`)) {
    sair('--saida dentro do repositório');
  }
  fs.mkdirSync(saida, { recursive: true });
  opts.saidaDir = saida;
}

function carregarApi(caminho) {
  const req = createRequire(import.meta.url);
  const alvo = path.resolve(caminho);
  if (!fs.existsSync(alvo)) {
    sair(`--api ${alvo} não existe (compile com yarn build:api)`);
  }
  return req(alvo);
}

/** O núcleo do Actual escreve muito no console; vai para um arquivo. */
function silenciarConsole(arquivo, verbose) {
  if (verbose) {
    return () => undefined;
  }
  const fd = fs.openSync(arquivo, 'a');
  const orig = {};
  for (const m of ['log', 'info', 'debug', 'warn', 'error', 'trace']) {
    orig[m] = console[m];
    console[m] = (...a) =>
      fs.writeSync(
        fd,
        `${a.map(x => (typeof x === 'string' ? x : JSON.stringify(x)?.slice(0, 2000))).join(' ')}\n`,
      );
  }
  return () => {
    Object.assign(console, orig);
    fs.closeSync(fd);
  };
}

// ------------------------------------------------------------------ datas

const hoje = () => new Date().toISOString().slice(0, 10);
const diaUtc = d => new Date(`${d}T00:00:00Z`);
const somarDias = (d, n) =>
  new Date(diaUtc(d).getTime() + n * 864e5).toISOString().slice(0, 10);
const entreDias = (a, b) => Math.round((diaUtc(a) - diaUtc(b)) / 864e5);
const fmt = c =>
  (c / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ------------------------------------------------------------------ texto

function normalizar(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Palavras com 3+ letras em comum, sobre as palavras do lado menor (0..1). */
function semelhanca(a, b) {
  const pa = new Set(
    normalizar(a)
      .split(' ')
      .filter(p => p.length >= 3),
  );
  const pb = new Set(
    normalizar(b)
      .split(' ')
      .filter(p => p.length >= 3),
  );
  if (!pa.size || !pb.size) {
    return 0;
  }
  let comuns = 0;
  for (const p of pa) {
    if (pb.has(p)) comuns++;
  }
  return comuns / Math.min(pa.size, pb.size);
}

const curto = (s, n = 40) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);
const soDigitos = s => String(s ?? '').replace(/\D/g, '');

// ------------------------------------------------------------------ servidor

async function abrirOrcamentoServidor(api, opts) {
  const lib = await api.init({
    dataDir: opts.dataDir,
    serverURL: opts.servidor,
    password: process.env.DF_SENHA_SERVIDOR,
  });
  const noServidor = (await api.getBudgets()).find(
    b => b.state === 'remote' && b.groupId === opts['sync-id'],
  );
  if (noServidor?.name !== opts.orcamento) {
    throw new Error(
      `o id de sincronização ${opts['sync-id']} é do orçamento "${noServidor?.name ?? '?'}" no servidor, não de "${opts.orcamento}"; nada foi baixado`,
    );
  }
  await api.downloadBudget(opts['sync-id']);
  const baixado = (await api.getBudgets()).find(
    b => b.id && b.groupId === opts['sync-id'],
  );
  if (baixado?.name !== opts.orcamento) {
    throw new Error(
      `o id de sincronização ${opts['sync-id']} é do orçamento "${baixado?.name ?? '?'}", não de "${opts.orcamento}"`,
    );
  }
  return { lib, cloudFileId: baixado.cloudFileId };
}

async function tokenServidor(opts) {
  const r = await fetch(`${opts.servidor}/account/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: process.env.DF_SENHA_SERVIDOR }),
  }).then(x => x.json());
  if (!r.data?.token) {
    throw new Error('login no servidor falhou');
  }
  return r.data.token;
}

/** O que o adaptador Pluggy do servidor entregaria ao Actual numa sincronização. */
async function lancamentosDoBanco(
  opts,
  token,
  cloudFileId,
  contaPluggy,
  desde,
) {
  const r = await fetch(`${opts.servidor}/pluggyai/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ACTUAL-TOKEN': token,
      'X-Actual-File-Id': cloudFileId,
    },
    body: JSON.stringify({ accountId: contaPluggy, startDate: desde }),
  }).then(x => x.json());
  if (r.status !== 'ok' || r.data?.error || !r.data?.transactions) {
    throw new Error(
      `o servidor não devolveu os lançamentos da conta ${contaPluggy}: ${r.data?.error ?? r.reason ?? JSON.stringify(r).slice(0, 200)}`,
    );
  }
  return r.data.transactions.all.map(t => ({
    id: t.transactionId,
    data: t.date,
    data_original: t.originalDate,
    centavos: Math.round(t.transactionAmount.amount * 100),
    descricao: t.payeeName || t.notes || '',
    notas: t.notes ?? '',
    pendente: !t.booked,
    cartao: t['creditCardMetadata.cardNumber'] ?? null,
    fatura: t['creditCardMetadata.billForecastDate'] ?? null,
  }));
}

async function contasDaPluggy(lib) {
  const r = await lib.send('pluggyai-accounts');
  if (r?.error_code || r?.error) {
    throw new Error(
      `pluggyai-accounts: ${r.reason ?? r.error ?? r.error_code}`,
    );
  }
  return r.accounts;
}

// ------------------------------------------------------------------ orçamento

async function lancamentosExistentes(api, contaId) {
  const { data } = await api.aqlQuery(
    api
      .q('transactions')
      .filter({ account: contaId })
      .select([
        'id',
        'date',
        'amount',
        'imported_id',
        'imported_payee',
        'notes',
        'cleared',
        'reconciled',
        'is_parent',
        'starting_balance_flag',
        'transfer_id',
        'raw_synced_data',
        'payee.name',
        'payee.transfer_acct',
        'category.name',
      ])
      .options({ splits: 'none' }),
  );
  return data
    .filter(t => !t.starting_balance_flag)
    .map(t => ({
      id: t.id,
      data: t.date,
      centavos: t.amount,
      imported_id: t.imported_id ?? null,
      descricao: t.imported_payee || t['payee.name'] || '',
      favorecido: t['payee.name'] ?? null,
      transferencia: Boolean(t['payee.transfer_acct'] || t.transfer_id),
      categoria: t['category.name'] ?? null,
      notas: t.notes ?? '',
      conferido: Boolean(t.cleared),
      conciliado: Boolean(t.reconciled),
      divisao: Boolean(t.is_parent),
      bruto: lerBruto(t.raw_synced_data),
    }));
}

function lerBruto(texto) {
  if (!texto) {
    return null;
  }
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

const origem = t =>
  t.imported_id == null
    ? 'manual'
    : t.imported_id.startsWith(PREFIXO_IMPORTADOR)
      ? 'importador'
      : 'banco';

/**
 * Contas com os campos de sincronização bancária. O `getAccounts` da API
 * devolve só id, nome, fechada e fora do orçamento; `account_sync_source` e
 * `account_id` (o id da conta na Pluggy) vêm pela consulta.
 */
async function contasDoOrcamento(api) {
  const { data } = await api.aqlQuery(
    api
      .q('accounts')
      .select([
        'id',
        'name',
        'closed',
        'offbudget',
        'account_sync_source',
        'account_id',
      ]),
  );
  return data;
}

function acharConta(contas, nome) {
  const achadas = contas.filter(a => a.name === nome && !a.closed);
  if (achadas.length !== 1) {
    throw new Error(
      `conta "${nome}" ${achadas.length ? 'repetida' : 'inexistente, renomeada ou fechada'} no orçamento`,
    );
  }
  return achadas[0];
}

// ------------------------------------------------------------------ casamento

/**
 * Pares (existente, banco) de mesmo valor em até `tol` dias, escolhidos do
 * mais próximo para o mais distante, um par só por lançamento de cada lado.
 * Linha do importador só casa com lançamento do banco até o corte + tol;
 * depois do corte só lançamento manual pode casar.
 */
function casar(existentes, banco, tol, corte) {
  const elegiveis = existentes.filter(
    t => origem(t) !== 'banco' && !t.conciliado,
  );
  const candidatos = [];
  const porValor = Map.groupBy(banco, b => b.centavos);
  for (const e of elegiveis) {
    for (const b of porValor.get(e.centavos) ?? []) {
      const d = Math.abs(entreDias(b.data, e.data));
      if (d > tol) {
        continue;
      }
      if (
        origem(e) === 'importador' &&
        corte &&
        b.data > somarDias(corte, tol)
      ) {
        continue;
      }
      candidatos.push({ e, b, d, s: semelhanca(e.descricao, b.descricao) });
    }
  }
  candidatos.sort(
    (x, y) =>
      x.d - y.d ||
      y.s - x.s ||
      x.b.data.localeCompare(y.b.data) ||
      x.e.data.localeCompare(y.e.data) ||
      x.e.id.localeCompare(y.e.id) ||
      x.b.id.localeCompare(y.b.id),
  );
  const usadosE = new Set();
  const usadosB = new Set();
  const pares = [];
  for (const c of candidatos) {
    if (usadosE.has(c.e.id) || usadosB.has(c.b.id)) {
      continue;
    }
    usadosE.add(c.e.id);
    usadosB.add(c.b.id);
    pares.push(c);
  }
  return { pares, usadosE, usadosB };
}

/**
 * IOF agregado do importador (uma linha por fatura e cartão) × IOF por compra
 * da Pluggy: o conjunto do mesmo cartão e da mesma fatura precisa somar
 * exatamente a linha agregada, com as datas até 35 dias antes dela.
 */
function agregadosIof(existentes, banco, usadosE, usadosB) {
  const resultado = [];
  const agregadas = existentes.filter(
    t =>
      origem(t) === 'importador' &&
      !usadosE.has(t.id) &&
      IOF.test(`${t.descricao} ${t.notas}`),
  );
  const partes = banco.filter(
    b => !usadosB.has(b.id) && IOF.test(`${b.descricao} ${b.notas}`),
  );
  const grupos = Map.groupBy(
    partes,
    b => `${b.cartao ?? '?'}|${b.fatura ?? '?'}`,
  );
  for (const a of agregadas) {
    const final =
      /final\s+(\d{4})/i.exec(`${a.descricao} ${a.notas}`)?.[1] ?? null;
    const compativeis = [...grupos.entries()].filter(([chave, ts]) => {
      const [cartao] = chave.split('|');
      if (final && cartao !== final) {
        return false;
      }
      const soma = ts.reduce((s, t) => s + t.centavos, 0);
      if (soma !== a.centavos) {
        return false;
      }
      return ts.every(
        t => entreDias(a.data, t.data) >= -7 && entreDias(a.data, t.data) <= 35,
      );
    });
    if (compativeis.length === 1) {
      const [chave, ts] = compativeis[0];
      for (const t of ts) {
        usadosB.add(t.id);
      }
      usadosE.add(a.id);
      grupos.delete(chave);
      resultado.push({
        agregada: a,
        conjunto: ts,
        acao: 'apagar agregada; o banco traz as partes',
      });
    } else {
      resultado.push({
        agregada: a,
        conjunto: [],
        acao: compativeis.length
          ? 'ambíguo: mais de um conjunto fecha a soma; nada proposto'
          : 'nenhum conjunto do banco fecha a soma; nada proposto',
      });
    }
  }
  return resultado;
}

function analisarConta(conta, existentes, banco, opts) {
  const importador = existentes.filter(t => origem(t) === 'importador');
  const corte =
    opts.cortes[conta.nome] ??
    (importador.length
      ? importador
          .map(t => t.data)
          .sort((a, b) => a.localeCompare(b))
          .at(-1)
      : null);
  const { pares, usadosE, usadosB } = casar(
    existentes,
    banco,
    opts.tolerancia,
    corte,
  );
  const agregados = agregadosIof(existentes, banco, usadosE, usadosB);
  const inicio =
    banco.map(b => b.data).sort((a, b) => a.localeCompare(b))[0] ?? null;
  const historicoSemPar = existentes.filter(
    t =>
      origem(t) !== 'banco' &&
      !usadosE.has(t.id) &&
      inicio &&
      t.data >= inicio &&
      (!corte || t.data <= corte),
  );
  const bancoSemPar = banco.filter(b => !usadosB.has(b.id));
  const ateCorte = corte ? bancoSemPar.filter(b => b.data <= corte) : [];
  const depoisDoCorte = corte
    ? bancoSemPar.filter(b => b.data > corte)
    : bancoSemPar;
  return {
    conta: conta.nome,
    id: conta.id,
    pluggy: conta.pluggy,
    janela: { desde: conta.desde, ate: hoje() },
    corte,
    existentes: existentes.length,
    por_origem: Object.fromEntries(
      Map.groupBy(existentes, origem)
        .entries()
        .map(([k, v]) => [k, v.length]),
    ),
    banco: banco.length,
    ancoras: pares.map(p => ({
      id: p.e.id,
      imported_id_atual: p.e.imported_id,
      imported_id_novo: p.b.id,
      data: p.e.data,
      data_banco: p.b.data,
      delta_dias: entreDias(p.b.data, p.e.data),
      centavos: p.e.centavos,
      descricao: p.e.descricao,
      descricao_banco: p.b.descricao,
      semelhanca: Number(p.s.toFixed(2)),
      categoria: p.e.categoria,
      transferencia: p.e.transferencia,
      pendente_no_banco: p.b.pendente,
    })),
    agregados: agregados.map(g => ({
      id: g.agregada.id,
      data: g.agregada.data,
      centavos: g.agregada.centavos,
      descricao: g.agregada.descricao,
      categoria: g.agregada.categoria,
      acao: g.acao,
      conjunto: g.conjunto.map(t => ({
        id: t.id,
        data: t.data,
        centavos: t.centavos,
        descricao: t.descricao,
        cartao: t.cartao,
        fatura: t.fatura,
      })),
    })),
    historico_sem_par: historicoSemPar.map(t => ({
      id: t.id,
      data: t.data,
      centavos: t.centavos,
      descricao: t.descricao,
      origem: origem(t),
      categoria: t.categoria,
      transferencia: t.transferencia,
    })),
    banco_sem_par_ate_corte: ateCorte.map(b => ({
      id: b.id,
      data: b.data,
      centavos: b.centavos,
      descricao: b.descricao,
      pendente: b.pendente,
    })),
    banco_sem_par_depois_do_corte: depoisDoCorte.map(b => ({
      id: b.id,
      data: b.data,
      centavos: b.centavos,
      descricao: b.descricao,
      pendente: b.pendente,
    })),
  };
}

function regrasSugeridas(analises, categorias) {
  const regras = [];
  for (const a of analises) {
    const porCategoria = Map.groupBy(
      a.agregados.filter(g => g.conjunto.length && g.categoria),
      g => g.categoria,
    );
    for (const [categoria, grupos] of porCategoria) {
      const cat = categorias.find(c => c.name === categoria);
      if (!cat) {
        continue;
      }
      regras.push({
        conta: a.conta,
        descricao: `IOF por compra do cartão ${a.conta} → ${categoria}`,
        agregadas: grupos.length,
        regra: {
          stage: null,
          conditionsOp: 'and',
          conditions: [
            { field: 'account', op: 'is', value: a.id },
            { field: 'imported_payee', op: 'contains', value: 'IOF' },
          ],
          actions: [{ field: 'category', op: 'set', value: cat.id }],
        },
      });
    }
  }
  return regras;
}

// ------------------------------------------------------------------ transferências

const docContraparte = (bruto, lado) =>
  soDigitos(bruto?.[`paymentData.${lado}.documentNumber.value`]);

/**
 * Prova de que saída em A e entrada em B são a mesma transferência:
 * pagamento de fatura (textos dos dois lados) ou Pix entre contas do mesmo
 * titular (o CPF do titular da outra conta aparece como contraparte nos dois
 * lados). Sem prova, o par é só "mesmo valor e data": listado, nunca ligado.
 */
function provaDeTransferencia(saida, entrada, docSaida, docEntrada) {
  const textoS = `${saida.descricao} ${saida.notas}`;
  const textoE = `${entrada.descricao} ${entrada.notas}`;
  if (PAGAMENTO_FATURA.test(textoS) && PAGAMENTO_RECEBIDO.test(textoE)) {
    return 'pagamento de fatura';
  }
  // Prova nos DOIS lados: a saída nomeia o titular da conta de destino como
  // recebedor e a entrada nomeia o titular da conta de origem como pagador.
  // Faltando qualquer um dos quatro documentos, não há prova: o par é só
  // listado.
  const recebedor = docContraparte(saida.bruto, 'receiver');
  const pagador = docContraparte(entrada.bruto, 'payer');
  if (
    docSaida &&
    docEntrada &&
    recebedor &&
    pagador &&
    recebedor === docEntrada &&
    pagador === docSaida
  ) {
    return 'Pix entre contas do titular (mesmo CPF nos dois lados)';
  }
  return null;
}

function parearTransferencias(contaA, lancA, contaB, lancB, docA, docB, tol) {
  const soltos = ts => ts.filter(t => !t.transferencia && !t.divisao);
  const candidatos = [];
  for (const [de, para, docDe, docPara] of [
    [
      { conta: contaA, ts: soltos(lancA) },
      { conta: contaB, ts: soltos(lancB) },
      docA,
      docB,
    ],
    [
      { conta: contaB, ts: soltos(lancB) },
      { conta: contaA, ts: soltos(lancA) },
      docB,
      docA,
    ],
  ]) {
    const porValor = Map.groupBy(
      para.ts.filter(t => t.centavos > 0),
      t => t.centavos,
    );
    for (const s of de.ts.filter(t => t.centavos < 0)) {
      for (const e of porValor.get(-s.centavos) ?? []) {
        const d = Math.abs(entreDias(e.data, s.data));
        if (d > tol) {
          continue;
        }
        candidatos.push({
          saida: s,
          entrada: e,
          de: de.conta,
          para: para.conta,
          d,
          prova: provaDeTransferencia(s, e, docDe, docPara),
        });
      }
    }
  }
  candidatos.sort(
    (x, y) =>
      Number(!x.prova) - Number(!y.prova) ||
      x.d - y.d ||
      x.saida.data.localeCompare(y.saida.data) ||
      x.saida.id.localeCompare(y.saida.id),
  );
  const usados = new Set();
  const pares = [];
  for (const c of candidatos) {
    if (usados.has(c.saida.id) || usados.has(c.entrada.id)) {
      continue;
    }
    usados.add(c.saida.id);
    usados.add(c.entrada.id);
    pares.push(c);
  }
  return pares.map(c => ({
    de: c.de.name,
    para: c.para.name,
    saida: {
      id: c.saida.id,
      data: c.saida.data,
      centavos: c.saida.centavos,
      descricao: c.saida.descricao,
      categoria: c.saida.categoria,
    },
    entrada: {
      id: c.entrada.id,
      data: c.entrada.data,
      centavos: c.entrada.centavos,
      descricao: c.entrada.descricao,
      categoria: c.entrada.categoria,
    },
    delta_dias: entreDias(c.entrada.data, c.saida.data),
    prova: c.prova,
    com_categoria: Boolean(c.saida.categoria || c.entrada.categoria),
    ligar: Boolean(c.prova) && !c.saida.categoria && !c.entrada.categoria,
  }));
}

// ------------------------------------------------------------------ saída

function imprimirAncoragem(previa) {
  out(
    `\nANCORAGEM — ${previa.orcamento} (${previa.modo}; tolerância ±${previa.tolerancia} d)`,
  );
  for (const a of previa.contas) {
    out(
      `\n${a.conta} ← Pluggy ${a.pluggy.slice(0, 8)}…  janela ${a.janela.desde}..${a.janela.ate}  corte do lote ${a.corte ?? '-'}`,
    );
    out(
      `  existentes ${a.existentes} ${JSON.stringify(a.por_origem)} | banco ${a.banco}`,
    );
    out(
      `  âncoras: ${a.ancoras.length} (data igual ${a.ancoras.filter(x => x.delta_dias === 0).length}, data diferente ${a.ancoras.filter(x => x.delta_dias !== 0).length}, transferências ${a.ancoras.filter(x => x.transferencia).length})`,
    );
    for (const x of a.ancoras
      .filter(x => x.delta_dias !== 0 || x.semelhanca < 0.5)
      .slice(0, 60)) {
      out(
        `    ~ ${x.data} ${fmt(x.centavos)} "${curto(x.descricao)}" ↔ banco ${x.data_banco} "${curto(x.descricao_banco)}" (Δ ${x.delta_dias} d, sem. ${x.semelhanca})`,
      );
    }
    out(`  IOF agregado: ${a.agregados.length}`);
    for (const g of a.agregados) {
      out(
        `    ${g.data} ${fmt(g.centavos)} "${curto(g.descricao, 55)}" [${g.categoria ?? 'sem categoria'}] → ${g.acao}${g.conjunto.length ? `: ${g.conjunto.map(t => `${t.data} ${fmt(t.centavos)}`).join(', ')}` : ''}`,
      );
    }
    out(
      `  histórico na janela sem par no banco: ${a.historico_sem_par.length}`,
    );
    for (const t of a.historico_sem_par.slice(0, 40)) {
      out(
        `    − ${t.data} ${fmt(t.centavos)} "${curto(t.descricao)}" ${t.origem}${t.transferencia ? ' [transf.]' : ''}${t.categoria ? ` [${t.categoria}]` : ''}`,
      );
    }
    out(
      `  banco sem par até o corte (entrariam como novos no período do histórico — conferir): ${a.banco_sem_par_ate_corte.length}`,
    );
    for (const t of a.banco_sem_par_ate_corte.slice(0, 40)) {
      out(
        `    + ${t.data} ${fmt(t.centavos)} "${curto(t.descricao)}"${t.pendente ? ' (pendente)' : ''}`,
      );
    }
    out(
      `  banco depois do corte (novos esperados): ${a.banco_sem_par_depois_do_corte.length}, soma ${fmt(a.banco_sem_par_depois_do_corte.reduce((s, t) => s + t.centavos, 0))}`,
    );
  }
  out(`\nregras sugeridas: ${previa.regras_sugeridas.length}`);
  for (const r of previa.regras_sugeridas) {
    out(`  ${r.descricao} (${r.agregadas} agregada(s))`);
  }
  if (previa.aplicado) {
    out(
      `\nAPLICADO: ${previa.aplicado.ancoras} imported_id gravados, ${previa.aplicado.apagadas} agregadas apagadas, ${previa.aplicado.regras} regras criadas`,
    );
  } else {
    out('\nnada foi gravado no orçamento (prévia)');
  }
}

function imprimirTransferencias(previa) {
  out(
    `\nTRANSFERÊNCIAS — ${previa.orcamento} (tolerância ±${previa.tolerancia} d)`,
  );
  for (const p of previa.pares_de_contas) {
    out(`\n${p.a} ↔ ${p.b}: ${p.pares.length} par(es) de mesmo valor`);
    for (const x of p.pares) {
      const marca = x.ligar
        ? 'LIGAR'
        : x.prova
          ? 'com categoria: decidir à mão'
          : 'sem prova: só listado';
      out(
        `  ${marca}: ${x.de} ${x.saida.data} ${fmt(x.saida.centavos)} "${curto(x.saida.descricao, 30)}"${x.saida.categoria ? ` [${x.saida.categoria}]` : ''} → ${x.para} ${x.entrada.data} "${curto(x.entrada.descricao, 30)}"${x.entrada.categoria ? ` [${x.entrada.categoria}]` : ''} (Δ ${x.delta_dias} d; ${x.prova ?? 'mesmo valor e data'})`,
      );
    }
  }
  if (previa.aplicado) {
    out(`\nAPLICADO: ${previa.aplicado.ligadas} transferência(s) ligada(s)`);
  } else {
    out('\nnada foi gravado no orçamento (prévia)');
  }
}

// ------------------------------------------------------------------ comandos

async function ancorar(cmd, opts, api, lib, cloudFileId) {
  const token = await tokenServidor(opts);
  const contasApi = await contasDoOrcamento(api);
  const categorias = await api.getCategories();
  const contasPluggy = await contasDaPluggy(lib);
  const contas = opts.mapa.map(m => {
    const conta = acharConta(contasApi, m.nome);
    if (conta.account_sync_source) {
      throw new Error(
        `conta "${m.nome}" já está vinculada (${conta.account_sync_source}); a ancoragem é para antes do vínculo`,
      );
    }
    const p = contasPluggy.find(c => c.id === m.pluggy);
    if (!p) {
      throw new Error(
        `a Pluggy não devolveu a conta ${m.pluggy} (para "${m.nome}")`,
      );
    }
    return { ...m, id: conta.id, tipoPluggy: `${p.type}/${p.subtype}` };
  });

  const analises = [];
  for (const conta of contas) {
    const existentes = await lancamentosExistentes(api, conta.id);
    const maisAntiga = existentes
      .map(t => t.data)
      .filter(d => d <= hoje())
      .sort((a, b) => a.localeCompare(b))[0];
    conta.desde = [somarDias(hoje(), -JANELA_PADRAO_DIAS), maisAntiga]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .at(-1);
    const banco = await lancamentosDoBanco(
      opts,
      token,
      cloudFileId,
      conta.pluggy,
      conta.desde,
    );
    analises.push(analisarConta(conta, existentes, banco, opts));
  }
  const previa = {
    orcamento: opts.orcamento,
    servidor: opts.servidor,
    sync_id: opts['sync-id'],
    modo: cmd,
    gerado_em: new Date().toISOString(),
    tolerancia: opts.tolerancia,
    contas: analises,
    regras_sugeridas: regrasSugeridas(analises, categorias),
    aplicado: null,
  };

  if (cmd === 'aplicar') {
    const aplicado = { ancoras: 0, apagadas: 0, regras: 0 };
    for (const a of analises) {
      const updated = a.ancoras.map(x => ({
        id: x.id,
        imported_id: x.imported_id_novo,
      }));
      for (let i = 0; i < updated.length; i += 100) {
        await lib.send('transactions-batch-update', {
          updated: updated.slice(i, i + 100),
          runTransfers: false,
          learnCategories: false,
        });
      }
      aplicado.ancoras += updated.length;
      for (const g of a.agregados.filter(g => g.conjunto.length)) {
        await lib.send('transaction-delete', { id: g.id });
        aplicado.apagadas++;
      }
    }
    if (opts.regras) {
      for (const r of previa.regras_sugeridas) {
        const res = await lib.send('rule-add', r.regra);
        if (res?.error) {
          throw new Error(
            `regra "${r.descricao}": ${JSON.stringify(res.error)}`,
          );
        }
        aplicado.regras++;
      }
    }
    // Confere no próprio orçamento o que ficou gravado antes de sincronizar.
    for (const a of analises) {
      const depois = await lancamentosExistentes(api, a.id);
      const porId = new Map(depois.map(t => [t.id, t]));
      const faltando = a.ancoras.filter(
        x => porId.get(x.id)?.imported_id !== x.imported_id_novo,
      );
      if (faltando.length) {
        throw new Error(
          `${faltando.length} âncora(s) de "${a.conta}" não ficaram gravadas`,
        );
      }
    }
    await api.sync();
    previa.aplicado = aplicado;
  }
  return previa;
}

async function transferencias(opts, api, lib) {
  const contasApi = await contasDoOrcamento(api);
  const payees = await api.getPayees();
  const contasPluggy = await contasDaPluggy(lib).catch(() => []);
  const docDe = conta => {
    const p = contasPluggy.find(c => c.id === conta.account_id);
    return soDigitos(p?.taxNumber ?? p?.owner ?? '');
  };
  const payeeTransf = conta => {
    const p = payees.find(x => x.transfer_acct === conta.id);
    if (!p) {
      throw new Error(`conta "${conta.name}" sem favorecido de transferência`);
    }
    return p.id;
  };

  const resultado = [];
  for (const par of opts.pares) {
    const a = acharConta(contasApi, par.a);
    const b = acharConta(contasApi, par.b);
    const [lancA, lancB] = [
      await lancamentosExistentes(api, a.id),
      await lancamentosExistentes(api, b.id),
    ];
    const docA = docDe(a);
    const docB = docDe(b);
    resultado.push({
      a: a.name,
      b: b.name,
      mesmo_titular: Boolean(docA && docB && docA === docB),
      pares: parearTransferencias(
        a,
        lancA,
        b,
        lancB,
        docA,
        docB,
        opts.tolerancia,
      ),
      contas: { a, b },
    });
  }
  const previa = {
    orcamento: opts.orcamento,
    servidor: opts.servidor,
    sync_id: opts['sync-id'],
    modo: 'transferencias',
    gerado_em: new Date().toISOString(),
    tolerancia: opts.tolerancia,
    pares_de_contas: resultado.map(({ contas: _c, ...r }) => r),
    aplicado: null,
  };
  if (opts.confirmar) {
    let ligadas = 0;
    for (const r of resultado) {
      const contaPorNome = { [r.a]: r.contas.a, [r.b]: r.contas.b };
      for (const x of r.pares.filter(x => x.ligar)) {
        // O "Tornar transferência" da tela: liga dois lançamentos que já
        // existem, sem criar contrapartida.
        await lib.send('transactions-batch-update', {
          updated: [
            {
              id: x.saida.id,
              category: null,
              payee: payeeTransf(contaPorNome[x.para]),
              transfer_id: x.entrada.id,
            },
            {
              id: x.entrada.id,
              category: null,
              payee: payeeTransf(contaPorNome[x.de]),
              transfer_id: x.saida.id,
            },
          ],
          runTransfers: false,
          learnCategories: false,
        });
        ligadas++;
      }
    }
    await api.sync();
    previa.aplicado = { ligadas };
  }
  return previa;
}

// ------------------------------------------------------------------ principal

async function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  if (!['prever', 'aplicar', 'transferencias'].includes(cmd)) {
    out(
      'Uso: ancorar.mjs prever|aplicar|transferencias --servidor <url> --sync-id <id> --orcamento <nome> --data-dir <pasta vazia> --api <index.js> --saida <pasta> ...',
    );
    out(
      '  prever|aplicar: --conta "<conta>=<id Pluggy>" [...] [--tolerancia 5] [--corte "<conta>=AAAA-MM-DD"]; aplicar exige --confirmar [--regras]',
    );
    out(
      '  transferencias: --par "<conta A>=<conta B>" [...] [--tolerancia 3] [--confirmar]',
    );
    out('Veja deploy/importacao/README.md, seção 3.2.');
    process.exit(cmd ? 2 : 0);
  }
  verificarOpcoes(cmd, opts);
  const api = carregarApi(opts.api);
  const restaurar = silenciarConsole(
    path.join(opts.saidaDir, 'ancorar.log'),
    opts.verbose,
  );
  let previa;
  let lib;
  try {
    const aberto = await abrirOrcamentoServidor(api, opts);
    lib = aberto.lib;
    previa =
      cmd === 'transferencias'
        ? await transferencias(opts, api, lib)
        : await ancorar(cmd, opts, api, lib, aberto.cloudFileId);
  } finally {
    if (lib && !previa) {
      await lib.send('close-budget').catch(() => undefined);
    } else {
      await api.shutdown().catch(() => undefined);
    }
    restaurar();
  }
  const arquivo = path.join(
    opts.saidaDir,
    `ancoragem-${cmd}-${previa.gerado_em.replace(/[-:]/g, '').slice(0, 15)}.json`,
  );
  fs.writeFileSync(arquivo, `${JSON.stringify(previa, null, 2)}\n`);
  if (cmd === 'transferencias') {
    imprimirTransferencias(previa);
  } else {
    imprimirAncoragem(previa);
  }
  out(`\ngravado: ${arquivo}`);
  if (cmd === 'prever') {
    const atencao = previa.contas.some(
      a =>
        a.banco_sem_par_ate_corte.length ||
        a.agregados.some(g => !g.conjunto.length),
    );
    if (atencao) {
      process.exit(1);
    }
  }
  if (
    cmd === 'transferencias' &&
    previa.pares_de_contas.some(p => p.pares.some(x => !x.ligar))
  ) {
    process.exit(1);
  }
}

main().catch(e => {
  process.stderr.write(`${e?.stack ?? e}\n`);
  process.exit(1);
});
