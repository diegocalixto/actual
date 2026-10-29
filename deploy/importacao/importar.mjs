#!/usr/bin/env node
// Diego Finance V2 — preparação da importação de dados bancários.
//
//   node deploy/importacao/importar.mjs validar  --controles <json> [--data-corte AAAA-MM-DD] <csv...>
//   node deploy/importacao/importar.mjs planejar --controles <json> --saida <pasta> [...] <csv...>
//   node deploy/importacao/importar.mjs aplicar  --controles <json> --data-dir <pasta> --orcamento <nome>
//                                                --confirmar [--criar-categorias] [--sem-agendamentos]
//                                                [--exportar <arquivo.zip>] [--api <index.js>] <csv...>
//   node deploy/importacao/importar.mjs conferir --controles <json> --data-dir <pasta> --orcamento <nome>
//                                                [--api <index.js>] <csv...>
//   node deploy/importacao/importar.mjs atualizar --controles <json> --servidor <url> --sync-id <id>
//                                                 --orcamento <nome> --data-dir <pasta vazia>
//                                                 [--confirmar] [--importar-suspeitas] [--aplicar-parcial]
//                                                 [--sem-agendamentos] [--api <index.js>] <csv...>
//
// Sem dependências. Só `aplicar`, `conferir` e `atualizar` carregam o
// @actual-app/api. `aplicar` e `conferir` trabalham numa pasta de dados local
// e isolada, nunca no servidor nem na pasta de produção. `atualizar` acrescenta
// um lote ao orçamento que já está no servidor, pela sincronização da própria
// API (senha em DF_SENHA_SERVIDOR). Detalhes em deploy/importacao/README.md.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');

const COLUNAS = [
  'conta',
  'data',
  'descricao',
  'valor',
  'categoria',
  'favorecido',
  'parcela',
  'tipo',
  'fatura',
  'observacao',
];
// Opcional. Quando preenchida, é ela que dá o `imported_id` da linha: um
// identificador estável do extrato ou da fatura de origem, que não depende da
// ordem das linhas nem de o lote trazer todas as ocorrências iguais do dia.
// Ausente, nada muda: o `imported_id` continua vindo da sequência.
const COLUNAS_OPCIONAIS = ['id_origem'];
const TIPOS = new Set([
  'compra',
  'pagamento_fatura',
  'pix',
  'transferencia_propria',
  'estorno',
  'tarifa',
  'receita',
  'parcela_futura',
]);
// Sinal esperado por tipo, do ponto de vista da conta da linha.
const SINAL = {
  compra: -1,
  tarifa: -1,
  parcela_futura: -1,
  estorno: 1,
  receita: 1,
};
const TIPOS_TRANSFERENCIA = new Set([
  'pagamento_fatura',
  'transferencia_propria',
]);
const PADROES_AMBIGUOS_PADRAO = [
  '^PAG\\*',
  '^PIX\\b',
  '^TED\\b',
  '^DOC\\b',
  '^SAQUE\\b',
  '^DIVERSOS\\b',
  '^COMPRA CARTAO\\b',
  '^[A-Z0-9 ]{1,4}$',
];

// ---------------------------------------------------------------- utilidades

function sair(msg, code = 2) {
  process.stderr.write(`ERRO: ${msg}\n`);
  process.exit(code);
}

function out(msg = '') {
  process.stdout.write(`${msg}\n`);
}

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { arquivos: [] };
  const flags = new Set([
    'aplicar-parcial',
    'confirmar',
    'criar-categorias',
    'importar-suspeitas',
    'sem-agendamentos',
    'verbose',
  ]);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const nome = a.slice(2);
      if (flags.has(nome)) {
        opts[nome] = true;
      } else {
        const v = rest[++i];
        if (v === undefined) sair(`--${nome} precisa de um valor`);
        opts[nome] = v;
      }
    } else {
      opts.arquivos.push(a);
    }
  }
  return { cmd, opts };
}

/** "1.234,56" | "-1234,56" -> centavos (inteiro). null se inválido. */
function parseValor(txt) {
  const s = String(txt ?? '').trim();
  const m = /^(-?)(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})$/.exec(s);
  if (!m) return null;
  const inteiro = Number(m[2].replaceAll('.', ''));
  const cents = inteiro * 100 + Number(m[3]);
  return m[1] === '-' ? -cents : cents;
}

function fmt(cents) {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const reais = String(Math.trunc(abs / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );
  return `${neg ? '-' : ''}${reais},${String(abs % 100).padStart(2, '0')}`;
}

function dataValida(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s ?? '')) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function diasEntre(a, b) {
  return Math.abs(
    (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000,
  );
}

function normalizarDescricao(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9* ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarCaminho(p) {
  return path.resolve(p).replaceAll('\\', '/').toLowerCase();
}

function dentroDe(filho, pai) {
  const rel = path.relative(path.resolve(pai), path.resolve(filho));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** CSV com ';', aspas duplas opcionais, UTF-8 com ou sem BOM. */
function lerCsv(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, '');
  const linhas = [];
  let campo = '';
  let linha = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        aspas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      aspas = true;
    } else if (c === ';') {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  if (campo !== '' || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  const naoVazias = linhas
    .map((l, idx) => ({ l, n: idx + 1 }))
    .filter(({ l }) => l.some(c => c.trim() !== ''));
  if (!naoVazias.length) return { cabecalho: [], registros: [] };
  const cabecalho = naoVazias[0].l.map(c => c.trim());
  const registros = naoVazias.slice(1).map(({ l, n }) => {
    const r = {
      _arquivo: path.basename(arquivo),
      _linha: n,
      _extra: l.length > cabecalho.length,
    };
    cabecalho.forEach((col, i) => (r[col] = (l[i] ?? '').trim()));
    return r;
  });
  return { cabecalho, registros };
}

function lerControles(arquivo) {
  if (!arquivo) sair('informe --controles <arquivo.json>');
  try {
    const c = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    c.contas ??= {};
    c.faturas ??= {};
    return c;
  } catch (e) {
    sair(`não consegui ler ${arquivo}: ${e.message}`);
  }
}

function hoje() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---------------------------------------------------------------- validação

function validar(arquivos, controles, dataCorte) {
  const erros = [];
  const avisos = [];
  const revisao = [];
  const linhas = [];
  const loc = r => `${r._arquivo}:${r._linha}`;
  const contas = controles.contas;
  const padroes = (controles.padroes_ambiguos ?? PADROES_AMBIGUOS_PADRAO).map(
    p => new RegExp(p, 'i'),
  );

  if (!arquivos.length) erros.push('nenhum arquivo CSV informado');
  for (const arq of arquivos) {
    if (!fs.existsSync(arq)) {
      erros.push(`${arq}: arquivo não encontrado`);
      continue;
    }
    const { cabecalho, registros } = lerCsv(arq);
    const faltando = COLUNAS.filter(c => !cabecalho.includes(c));
    const sobrando = cabecalho.filter(
      c => !COLUNAS.includes(c) && !COLUNAS_OPCIONAIS.includes(c),
    );
    if (faltando.length) {
      erros.push(
        `${path.basename(arq)}: colunas ausentes no cabeçalho: ${faltando.join(', ')}`,
      );
      continue;
    }
    if (sobrando.length) {
      avisos.push(
        `${path.basename(arq)}: colunas ignoradas: ${sobrando.join(', ')}`,
      );
    }
    linhas.push(...registros);
  }

  const validas = [];
  for (const r of linhas) {
    const e0 = erros.length;
    if (r._extra) {
      erros.push(
        `${loc(r)}: mais campos que o cabeçalho (';' dentro de texto sem aspas?)`,
      );
    }
    for (const c of ['conta', 'data', 'descricao', 'valor', 'tipo']) {
      if (!r[c]) erros.push(`${loc(r)}: campo obrigatório vazio: ${c}`);
    }
    const conta = contas[r.conta];
    if (r.conta && !conta) {
      erros.push(
        `${loc(r)}: conta "${r.conta}" não declarada em controles.json`,
      );
    }
    if (r.data && !dataValida(r.data)) {
      erros.push(`${loc(r)}: data inválida "${r.data}" (use AAAA-MM-DD)`);
    }
    r.centavos = parseValor(r.valor);
    if (r.valor && r.centavos === null) {
      erros.push(
        `${loc(r)}: valor inválido "${r.valor}" (use -1.234,56 ou -1234,56; duas casas)`,
      );
    }
    if (r.centavos === 0) erros.push(`${loc(r)}: valor zero`);
    if (r.tipo && !TIPOS.has(r.tipo)) {
      erros.push(`${loc(r)}: tipo desconhecido "${r.tipo}"`);
    }
    if (erros.length > e0) continue;

    const ehCartao = conta.tipo === 'cartao';
    if (ehCartao && !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.fatura)) {
      erros.push(`${loc(r)}: linha de cartão sem fatura AAAA-MM`);
    }
    if (!ehCartao && r.fatura) {
      avisos.push(
        `${loc(r)}: fatura preenchida em conta que não é cartão (ignorada)`,
      );
    }
    if (!ehCartao && r.tipo === 'parcela_futura') {
      erros.push(`${loc(r)}: parcela_futura só existe em conta de cartão`);
    }

    if (r.parcela) {
      const m = /^(\d{1,2})\/(\d{1,2})$/.exec(r.parcela);
      if (!m || +m[1] < 1 || +m[1] > +m[2]) {
        erros.push(`${loc(r)}: parcela inválida "${r.parcela}" (use k/n)`);
      }
    }
    if (r.tipo === 'parcela_futura' && !r.parcela) {
      erros.push(`${loc(r)}: parcela_futura sem parcela k/n`);
    }

    if (r.tipo === 'parcela_futura' && r.data <= dataCorte) {
      erros.push(
        `${loc(r)}: parcela_futura com data ${r.data} <= data de corte ${dataCorte}: se já caiu na fatura, é "compra" com parcela`,
      );
    }
    if (r.tipo !== 'parcela_futura' && r.data > dataCorte) {
      erros.push(
        `${loc(r)}: data futura ${r.data} (> ${dataCorte}) em linha que não é parcela_futura`,
      );
    }

    const sinal = SINAL[r.tipo];
    if (sinal && Math.sign(r.centavos) !== sinal) {
      erros.push(
        `${loc(r)}: ${r.tipo} deve ser ${sinal < 0 ? 'negativo (saída)' : 'positivo (entrada)'}`,
      );
    }
    if (r.tipo === 'pagamento_fatura') {
      const esperado = ehCartao ? 1 : -1;
      if (Math.sign(r.centavos) !== esperado) {
        erros.push(
          `${loc(r)}: pagamento_fatura deve ser ${ehCartao ? 'positivo no cartão' : 'negativo na conta corrente'}`,
        );
      }
      if (!ehCartao) {
        const destino = r.favorecido || soCartao(contas);
        if (!destino || contas[destino]?.tipo !== 'cartao') {
          erros.push(
            `${loc(r)}: pagamento_fatura precisa de favorecido = nome da conta do cartão`,
          );
        } else {
          r.contaDestino = destino;
        }
      }
    }
    if (TIPOS_TRANSFERENCIA.has(r.tipo) && r.categoria) {
      erros.push(
        `${loc(r)}: ${r.tipo} é transferência e não pode ter categoria (contaria em dobro)`,
      );
    }

    if (r.tipo === 'transferencia_propria') {
      if (contas[r.favorecido]) {
        r.contaDestino = r.favorecido;
      } else {
        revisao.push(
          item(
            r,
            `transferência própria para "${r.favorecido || '?'}", conta fora desta importação: entra sem categoria; vira transferência quando a outra conta existir`,
          ),
        );
      }
    }
    if (r.tipo === 'pix' && !r.categoria) {
      revisao.push(
        item(
          r,
          'Pix sem classificação explícita: entra sem categoria (nunca vira despesa automaticamente)',
        ),
      );
    }
    if (r.tipo === 'compra' && !r.categoria) {
      revisao.push(item(r, 'compra sem categoria'));
    }
    if (['compra', 'pix', 'tarifa', 'estorno', 'receita'].includes(r.tipo)) {
      const nd = normalizarDescricao(r.descricao);
      if (
        padroes.some(p => p.test(nd)) &&
        !(r.tipo === 'pix' && !r.categoria)
      ) {
        revisao.push(item(r, 'descrição ambígua (padrão genérico)'));
      }
    }
    validas.push(r);
  }

  // Sequência para linhas idênticas no mesmo dia e imported_id determinístico.
  const vistos = new Map();
  const origens = new Map();
  for (const r of validas) {
    const chave = [
      r.conta,
      r.data,
      r.centavos,
      normalizarDescricao(r.descricao),
    ].join('|');
    const seq = vistos.get(chave) ?? 0;
    vistos.set(chave, seq + 1);
    r.seq = seq;
    if (r.id_origem) {
      // Duas compras legítimas iguais têm id_origem diferentes, então um lote
      // posterior parcial não colide com o que já foi importado.
      const k = `${r.conta}|${r.id_origem}`;
      if (origens.has(k)) {
        erros.push(
          `${loc(r)}: id_origem "${r.id_origem}" repetido na conta "${r.conta}" (já usado em ${origens.get(k)})`,
        );
      }
      origens.set(k, loc(r));
      r.importedId = `dfi1-${createHash('sha256').update(`id_origem|${k}`).digest('hex').slice(0, 32)}`;
    } else {
      r.importedId = `dfi1-${createHash('sha256').update(`${chave}|${seq}`).digest('hex').slice(0, 32)}`;
    }
    if (seq > 0) {
      avisos.push(
        `${loc(r)}: linha idêntica a outra do mesmo dia (sequência ${seq}); confirme que são duas operações reais`,
      );
    }
  }

  // Pares de transferência: só o lado de saída é importado.
  const pares = [];
  const entradas = validas.filter(
    r => TIPOS_TRANSFERENCIA.has(r.tipo) && r.centavos > 0,
  );
  const usadas = new Set();
  for (const s of validas.filter(
    r => TIPOS_TRANSFERENCIA.has(r.tipo) && r.centavos < 0 && r.contaDestino,
  )) {
    const e = entradas.find(
      x =>
        !usadas.has(x) &&
        x.conta === s.contaDestino &&
        x.tipo === s.tipo &&
        x.centavos === -s.centavos &&
        diasEntre(x.data, s.data) <= 5,
    );
    if (e) usadas.add(e);
    s.par = e ?? null;
    pares.push({ saida: s, entrada: e ?? null });
    if (!e && contas[s.contaDestino]?.tipo === 'cartao') {
      avisos.push(
        `${loc(s)}: pagamento sem a linha correspondente no cartão (a transferência é criada mesmo assim)`,
      );
    }
  }
  for (const e of entradas) {
    if (usadas.has(e)) {
      e.cobertaPor = true;
    } else {
      e.semPar = true;
      revisao.push(
        item(
          e,
          `entrada de ${e.tipo} sem saída correspondente em outra conta importada: não é importada; confira de onde veio o dinheiro`,
        ),
      );
    }
  }

  // Controles de fatura.
  const somas = {};
  for (const r of validas) {
    if (contas[r.conta].tipo !== 'cartao' || r.tipo === 'pagamento_fatura') {
      continue;
    }
    const k = `${r.conta}|${r.fatura}`;
    somas[k] ??= { conta: r.conta, fatura: r.fatura, centavos: 0, n: 0 };
    somas[k].centavos += r.centavos;
    somas[k].n++;
  }
  const conferencias = [];
  for (const [conta, faturas] of Object.entries(controles.faturas)) {
    for (const [mes, ctl] of Object.entries(faturas)) {
      const soma = somas[`${conta}|${mes}`] ?? { centavos: 0, n: 0 };
      const total = parseValor(ctl.total);
      if (total === null) {
        erros.push(`controles: total inválido em ${conta} ${mes}`);
        continue;
      }
      const ok = -soma.centavos === total;
      conferencias.push({
        conta,
        fatura: mes,
        situacao: ctl.situacao ?? '?',
        linhas: soma.n,
        soma: -soma.centavos,
        controle: total,
        ok,
      });
      if (!ok) {
        erros.push(
          `fatura ${conta} ${mes}: soma das linhas ${fmt(-soma.centavos)} ≠ controle ${fmt(total)} (diferença ${fmt(-soma.centavos - total)})`,
        );
      }
      if (ctl.fechamento && dataValida(ctl.fechamento)) {
        const anterior = faturas[mesAnterior(mes)]?.fechamento;
        for (const r of validas.filter(
          x =>
            x.conta === conta &&
            x.fatura === mes &&
            x.tipo !== 'pagamento_fatura' &&
            x.tipo !== 'parcela_futura',
        )) {
          const fora =
            r.data > ctl.fechamento || (anterior && r.data <= anterior);
          if (fora && !r.parcela) {
            avisos.push(
              `${loc(r)}: data ${r.data} fora do ciclo da fatura ${mes} (fechamento ${ctl.fechamento}); confira a fatura`,
            );
          }
        }
      }
    }
  }
  for (const s of Object.values(somas)) {
    if (!controles.faturas[s.conta]?.[s.fatura]) {
      avisos.push(
        `fatura ${s.conta} ${s.fatura} sem total de controle em controles.json`,
      );
    }
  }

  // Saldo da conta corrente.
  for (const [nome, c] of Object.entries(contas)) {
    if (!c.saldo_final) continue;
    const ini = parseValor(c.saldo_inicial?.valor ?? '0,00');
    const fim = parseValor(c.saldo_final.valor);
    if (ini === null || fim === null || !dataValida(c.saldo_final.data)) {
      erros.push(`controles: saldo inválido em ${nome}`);
      continue;
    }
    const soma = validas
      .filter(
        r =>
          r.conta === nome &&
          r.data <= c.saldo_final.data &&
          r.tipo !== 'parcela_futura' &&
          !r.cobertaPor &&
          !r.semPar,
      )
      .reduce((a, r) => a + r.centavos, 0);
    const calc = ini + soma;
    conferencias.push({
      conta: nome,
      saldo: true,
      data: c.saldo_final.data,
      calculado: calc,
      controle: fim,
      ok: calc === fim,
    });
    if (calc !== fim) {
      erros.push(
        `saldo ${nome} em ${c.saldo_final.data}: calculado ${fmt(calc)} ≠ declarado ${fmt(fim)} (diferença ${fmt(calc - fim)})`,
      );
    }
  }

  return { erros, avisos, revisao, linhas: validas, pares, conferencias };
}

function soCartao(contas) {
  const cartoes = Object.entries(contas).filter(([, c]) => c.tipo === 'cartao');
  return cartoes.length === 1 ? cartoes[0][0] : null;
}

function mesAnterior(mes) {
  const [a, m] = mes.split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
}

function item(r, motivo) {
  return {
    arquivo: r._arquivo,
    linha: r._linha,
    conta: r.conta,
    data: r.data,
    descricao: r.descricao,
    valor: r.valor,
    tipo: r.tipo,
    motivo,
  };
}

function imprimirValidacao(v) {
  for (const c of v.conferencias) {
    if (c.saldo) {
      out(
        `  [${c.ok ? 'ok' : 'DIVERGE'}] saldo ${c.conta} em ${c.data}: calculado ${fmt(c.calculado)} / declarado ${fmt(c.controle)}`,
      );
    } else {
      out(
        `  [${c.ok ? 'ok' : 'DIVERGE'}] fatura ${c.conta} ${c.fatura} (${c.situacao}, ${c.linhas} linhas): ${fmt(c.soma)} / controle ${fmt(c.controle)}`,
      );
    }
  }
  out(
    `linhas válidas: ${v.linhas.length} | erros: ${v.erros.length} | avisos: ${v.avisos.length} | revisão: ${v.revisao.length}`,
  );
  for (const e of v.erros) out(`  ERRO   ${e}`);
  for (const a of v.avisos) out(`  AVISO  ${a}`);
  for (const r of v.revisao) {
    out(
      `  REVISAR ${r.arquivo}:${r.linha} ${r.descricao} ${r.valor} — ${r.motivo}`,
    );
  }
}

// ---------------------------------------------------------------- plano

function montarPlano(v, controles) {
  const contas = Object.entries(controles.contas)
    .filter(([, c]) => c.importar !== false)
    .map(([nome, c]) => ({
      nome,
      tipo: c.tipo,
      no_orcamento: c.fora_do_orcamento !== true,
      saldo_inicial: parseValor(c.saldo_inicial?.valor ?? '0,00'),
      data_saldo_inicial: c.saldo_inicial?.data ?? null,
    }));
  const transacoes = [];
  const agendamentos = [];
  const ignoradas = [];
  for (const r of v.linhas) {
    if (r.cobertaPor) {
      ignoradas.push({
        ...ref(r),
        motivo:
          'lado de entrada de transferência; criado automaticamente pelo lado de saída',
      });
      continue;
    }
    if (r.semPar) {
      ignoradas.push({
        ...ref(r),
        motivo: 'entrada de transferência sem par: fila de revisão',
      });
      continue;
    }
    const notas = [
      r.parcela && `Parcela ${r.parcela}`,
      r.observacao,
      r.tipo === 'transferencia_propria' &&
        !r.contaDestino &&
        'REVISAR: transferência própria',
      r.tipo === 'pix' && !r.categoria && 'REVISAR: Pix sem classificação',
    ]
      .filter(Boolean)
      .join(' · ');
    if (r.tipo === 'parcela_futura') {
      agendamentos.push({
        nome: `Parcela ${r.parcela} · ${r.descricao} · ${r.importedId.slice(5, 13)}`,
        conta: r.conta,
        data: r.data,
        centavos: r.centavos,
        favorecido: r.favorecido || r.descricao,
        fatura: r.fatura,
      });
      continue;
    }
    transacoes.push({
      conta: r.conta,
      data: r.data,
      centavos: r.centavos,
      imported_id: r.importedId,
      tipo: r.tipo,
      descricao: r.descricao,
      favorecido: r.contaDestino ? null : r.favorecido || r.descricao,
      transferir_para: r.contaDestino ?? null,
      categoria: r.categoria || null,
      categoria_receita: r.tipo === 'receita',
      notas: notas || null,
      fatura: r.fatura || null,
      origem: `${r._arquivo}:${r._linha}`,
    });
  }
  return {
    gerado_em: new Date().toISOString(),
    contas,
    transacoes,
    agendamentos,
    ignoradas,
    pares: v.pares.map(p => ({
      saida: ref(p.saida),
      entrada: p.entrada ? ref(p.entrada) : null,
    })),
    revisao: v.revisao,
    conferencias: v.conferencias,
  };
}

function ref(r) {
  return {
    origem: `${r._arquivo}:${r._linha}`,
    conta: r.conta,
    data: r.data,
    valor: r.valor,
    descricao: r.descricao,
    imported_id: r.importedId,
  };
}

function csvCampo(s) {
  const t = String(s ?? '');
  return /[;"\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
}

function prepararSaida(dir) {
  if (!dir) sair('informe --saida <pasta> (fora do repositório)');
  if (dentroDe(dir, REPO_ROOT)) {
    sair(`--saida ${dir} está dentro do repositório; use uma pasta fora dele`);
  }
  fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------- API

/** Marca que a pasta foi criada por este fluxo e guarda o orçamento dela. */
const MARCADOR = '.diego-finance-importacao.json';

const CRIADO_POR = 'deploy/importacao/importar.mjs';

function lerMarcador(dir) {
  const arq = path.join(dir, MARCADOR);
  if (!fs.existsSync(arq)) return null;
  let m;
  try {
    m = JSON.parse(fs.readFileSync(arq, 'utf8'));
  } catch {
    sair(`${arq} ilegível; recusado (não edite o marcador à mão)`);
  }
  // Só vale o marcador que este fluxo escreveu: objeto com exatamente estes
  // campos e tipos. Qualquer outra coisa recusa a pasta.
  const campos = ['criadoPor', 'criadoEm', 'orcamentoId', 'orcamentoNome'];
  const textoOuNulo = v => v === null || (typeof v === 'string' && v !== '');
  const valido =
    m !== null &&
    typeof m === 'object' &&
    !Array.isArray(m) &&
    Object.keys(m).length === campos.length &&
    campos.every(c => Object.hasOwn(m, c)) &&
    m.criadoPor === CRIADO_POR &&
    typeof m.criadoEm === 'string' &&
    !Number.isNaN(Date.parse(m.criadoEm)) &&
    textoOuNulo(m.orcamentoId) &&
    textoOuNulo(m.orcamentoNome) &&
    (m.orcamentoId === null) === (m.orcamentoNome === null);
  if (!valido) {
    sair(`${arq} não é um marcador válido deste fluxo; recusado`);
  }
  return m;
}

function gravarMarcador(dir, dados) {
  fs.writeFileSync(
    path.join(dir, MARCADOR),
    `${JSON.stringify(dados, null, 2)}\n`,
  );
}

/**
 * Só aceita uma pasta local, real (sem link simbólico) e isolada: fora do
 * repositório, sem nada que lembre a pasta de dados do servidor, e — na
 * primeira aplicação — vazia; depois disso, só com o marcador deste fluxo.
 * Não grava nada: o marcador é criado em `prepararDataDir`, depois do
 * `--confirmar`.
 */
function verificarDataDir(dir, cmd) {
  if (!dir) sair(`${cmd} exige --data-dir <pasta local e isolada>`);
  if (!fs.existsSync(dir)) {
    sair(`--data-dir ${dir} não existe; crie a pasta vazia de propósito antes`);
  }
  if (fs.lstatSync(dir).isSymbolicLink()) {
    sair(`--data-dir ${dir} é um link simbólico; recusado`);
  }
  if (!fs.statSync(dir).isDirectory()) {
    sair(`--data-dir ${dir} não é uma pasta`);
  }
  // O caminho real resolve links nos ancestrais: é ele que se compara.
  const real = fs.realpathSync(dir);
  const proibidos = [
    /diegofinance\/dados/,
    /(^|\/)dados(\/|$)/,
    /(^|\/)server-files(\/|$)/,
    /(^|\/)user-files(\/|$)/,
  ];
  for (const candidato of [normalizarCaminho(dir), normalizarCaminho(real)]) {
    if (proibidos.some(p => p.test(candidato))) {
      sair(
        `--data-dir ${dir} (${real}) parece pasta de produção (contém "dados", "server-files" ou "user-files"); recusado`,
      );
    }
  }
  if (dentroDe(dir, REPO_ROOT) || dentroDe(real, fs.realpathSync(REPO_ROOT))) {
    sair(`--data-dir ${dir} está dentro do repositório; recusado`);
  }
  for (const sub of ['server-files', 'user-files']) {
    if (fs.existsSync(path.join(real, sub))) {
      sair(
        `--data-dir ${dir} contém ${sub}/: isso é a pasta do servidor de sincronização; recusado`,
      );
    }
  }
  const marcador = lerMarcador(real);
  if (cmd === 'atualizar') {
    // A cópia local é descartável: o orçamento vem do servidor a cada vez.
    if (marcador || fs.readdirSync(real).length > 0) {
      sair(
        `--data-dir ${dir} precisa estar vazia: atualizar baixa o orçamento do servidor a cada execução`,
      );
    }
    return { real, marcador: null };
  }
  if (!marcador) {
    if (cmd !== 'aplicar') {
      sair(
        `--data-dir ${dir} não foi criada por este fluxo (sem ${MARCADOR}); rode aplicar numa pasta vazia primeiro`,
      );
    }
    if (fs.readdirSync(real).length > 0) {
      sair(
        `--data-dir ${dir} não está vazia e não tem ${MARCADOR}; a primeira aplicação exige uma pasta vazia`,
      );
    }
  }
  return { real, marcador };
}

/** Depois do `--confirmar`: cria o marcador na primeira aplicação. */
function prepararDataDir(verificado) {
  if (verificado.marcador) return verificado.marcador;
  const marcador = {
    criadoPor: CRIADO_POR,
    criadoEm: new Date().toISOString(),
    orcamentoId: null,
    orcamentoNome: null,
  };
  gravarMarcador(verificado.real, marcador);
  return marcador;
}

function carregarApi(caminho) {
  const req = createRequire(import.meta.url);
  const alvo = path.resolve(
    caminho ?? path.join(REPO_ROOT, 'packages/api/dist/index.js'),
  );
  if (!fs.existsSync(alvo)) {
    sair(`API não encontrada em ${alvo}; veja --api no README`);
  }
  const conteudo = fs.readFileSync(alvo, 'utf8');
  if (/^import .* from '@actual-app\/core/m.test(conteudo)) {
    sair(
      `${alvo} não é o pacote compilado pelo vite (é saída do tsc, importa o código-fonte); veja SIMULACAO.md`,
    );
  }
  return req(alvo);
}

/** O núcleo do Actual escreve muito no console; guardamos num arquivo. */
function silenciarConsole(arquivoLog, verbose) {
  if (verbose) return () => undefined;
  const orig = {};
  const fd = arquivoLog ? fs.openSync(arquivoLog, 'a') : null;
  for (const m of ['log', 'info', 'debug', 'warn', 'error', 'trace']) {
    orig[m] = console[m];
    console[m] = (...a) => {
      if (fd !== null) {
        fs.writeSync(
          fd,
          `${a.map(x => (typeof x === 'string' ? x : JSON.stringify(x)?.slice(0, 500))).join(' ')}\n`,
        );
      }
    };
  }
  return () => {
    Object.assign(console, orig);
    if (fd !== null) fs.closeSync(fd);
  };
}

/**
 * Abre o orçamento que este fluxo criou nesta pasta, pelo id guardado no
 * marcador — nunca escolhe um orçamento existente só pelo nome.
 */
async function abrirOrcamento(api, opts, criar, verificado, marcador) {
  if (!opts.orcamento) {
    sair('informe --orcamento <nome do arquivo de orçamento novo>');
  }
  const lib = await api.init({ dataDir: verificado.real });
  const orcamentos = await api.getBudgets();
  if (marcador.orcamentoId) {
    const meu = orcamentos.find(b => b.id === marcador.orcamentoId);
    if (!meu) {
      sair(
        `o orçamento ${marcador.orcamentoId} registrado em ${MARCADOR} não está mais em ${opts['data-dir']}; recusado`,
      );
    }
    if (meu.name !== opts.orcamento) {
      sair(
        `esta pasta guarda o orçamento "${meu.name}", não "${opts.orcamento}"; recusado`,
      );
    }
    await api.loadBudget(meu.id);
    return { lib, criado: false, id: meu.id };
  }
  if (!criar) {
    sair(`nenhum orçamento criado por este fluxo em ${opts['data-dir']}`);
  }
  if (orcamentos.some(b => b.id)) {
    sair(
      `${opts['data-dir']} já tem orçamento(s) que este fluxo não criou; recusado`,
    );
  }
  const r = await lib.send('create-budget', {
    budgetName: opts.orcamento,
    avoidUpload: true,
  });
  if (r?.error) throw new Error(`create-budget: ${r.error}`);
  const novo = (await api.getBudgets()).find(
    b => b.name === opts.orcamento && b.id,
  );
  if (!novo) throw new Error('o orçamento criado não apareceu na lista');
  gravarMarcador(verificado.real, {
    ...marcador,
    orcamentoId: novo.id,
    orcamentoNome: opts.orcamento,
  });
  return { lib, criado: true, id: novo.id };
}

/**
 * Grava só os campos dados e espera a gravação terminar, pelo mesmo handler
 * que o app usa ao salvar uma edição. O `api.updateTransaction` do Actual
 * 26.8.1 devolve antes de gravar.
 */
function atualizarTransacao(lib, id, campos) {
  return lib.send('transaction-update', { id, ...campos });
}

async function aplicar(plano, api, lib, opts) {
  const res = {
    contas_criadas: [],
    categorias_criadas: [],
    por_conta: {},
    agendamentos_criados: 0,
    agendamentos_existentes: 0,
  };
  // Contas
  const contasApi = await api.getAccounts();
  const ids = {};
  for (const c of plano.contas) {
    const ex = contasApi.find(a => a.name === c.nome && !a.closed);
    if (ex) {
      ids[c.nome] = ex.id;
    } else {
      ids[c.nome] = await api.createAccount(
        { name: c.nome, offbudget: !c.no_orcamento },
        c.saldo_inicial ?? 0,
      );
      // O Actual data o saldo inicial no dia em que a conta é criada; o saldo
      // declarado é o do extrato em `data_saldo_inicial`.
      if (c.saldo_inicial && c.data_saldo_inicial) {
        const abertura = (
          await api.getTransactions(ids[c.nome], '1900-01-01', '2999-12-31')
        ).find(t => t.starting_balance_flag);
        if (!abertura) throw new Error(`saldo inicial de ${c.nome} não achado`);
        await atualizarTransacao(lib, abertura.id, {
          date: c.data_saldo_inicial,
        });
      }
      res.contas_criadas.push(c.nome);
    }
  }
  const payees = await api.getPayees();
  const payeeTransfer = Object.fromEntries(
    Object.entries(ids).map(([n, id]) => [
      n,
      payees.find(p => p.transfer_acct === id)?.id,
    ]),
  );
  // Categorias
  const grupos = await api.getCategoryGroups();
  const cats = await api.getCategories();
  const catId = {};
  const necessarias = new Map();
  for (const t of plano.transacoes) {
    if (t.categoria) necessarias.set(t.categoria, t.categoria_receita);
  }
  const faltando = [...necessarias.keys()].filter(
    n => !cats.some(c => c.name === n),
  );
  if (faltando.length && !opts['criar-categorias']) {
    throw new Error(
      `categorias inexistentes no orçamento: ${faltando.join(', ')} (crie no app ou use --criar-categorias)`,
    );
  }
  let grupoImport = grupos.find(
    g => g.name === 'Importação' && !g.is_income,
  )?.id;
  const grupoReceita = grupos.find(g => g.is_income)?.id;
  for (const nome of faltando) {
    const receita = necessarias.get(nome);
    if (!receita && !grupoImport) {
      grupoImport = await api.createCategoryGroup({ name: 'Importação' });
    }
    await api.createCategory({
      name: nome,
      group_id: receita ? grupoReceita : grupoImport,
      is_income: receita,
    });
    res.categorias_criadas.push(nome);
  }
  for (const c of await api.getCategories()) catId[c.name] ??= c.id;

  // Transações, uma chamada por conta (dedupe por imported_id no núcleo).
  for (const c of plano.contas) {
    const txs = plano.transacoes
      .filter(t => t.conta === c.nome)
      .map(t => paraTransacaoApi(t, catId, payeeTransfer));
    if (!txs.length) continue;
    const r = await api.importTransactions(ids[c.nome], txs, {
      defaultCleared: true,
      dryRun: false,
    });
    if (r.errors?.length) {
      throw new Error(
        `importação ${c.nome}: ${JSON.stringify(r.errors).slice(0, 300)}`,
      );
    }
    res.por_conta[c.nome] = {
      enviadas: txs.length,
      novas: r.added.length,
      atualizadas: r.updated.length,
    };
  }

  if (!opts['sem-agendamentos']) {
    const existentes = new Set((await api.getSchedules()).map(s => s.name));
    await criarAgendamentos(api, plano, ids, existentes, res);
  }
  return res;
}

/** Linha do plano no formato do `importTransactions` do Actual. */
function paraTransacaoApi(t, catId, payeeTransfer) {
  return {
    date: t.data,
    amount: t.centavos,
    imported_id: t.imported_id,
    imported_payee: t.descricao,
    ...(t.transferir_para
      ? { payee: payeeTransfer[t.transferir_para] }
      : { payee_name: t.favorecido }),
    category: t.categoria ? catId[t.categoria] : null,
    notes: t.notas,
    cleared: true,
  };
}

/** Parcelas futuras: agendamentos sem lançamento automático. */
async function criarAgendamentos(api, plano, ids, existentes, res) {
  for (const a of plano.agendamentos) {
    if (existentes.has(a.nome)) {
      res.agendamentos_existentes++;
      continue;
    }
    let payee = (await api.getPayees()).find(p => p.name === a.favorecido)?.id;
    payee ??= await api.createPayee({ name: a.favorecido });
    await api.createSchedule({
      name: a.nome,
      posts_transaction: false,
      account: ids[a.conta],
      payee,
      amount: a.centavos,
      amountOp: 'is',
      date: a.data,
    });
    res.agendamentos_criados++;
  }
}

async function conferir(plano, api, controles) {
  const r = { contas: [], falhas: [] };
  const contas = await api.getAccounts();
  const transferAcct = Object.fromEntries(
    (await api.getPayees())
      .filter(p => p.transfer_acct)
      .map(p => [p.id, p.transfer_acct]),
  );
  const cats = Object.fromEntries(
    (await api.getCategories()).map(c => [c.id, c]),
  );
  let gastoCategorizado = 0;
  let paresOk = 0;
  for (const c of plano.contas) {
    const a = contas.find(x => x.name === c.nome);
    if (!a) {
      r.falhas.push(`conta ${c.nome} não existe`);
      continue;
    }
    const saldo = await api.getAccountBalance(a.id);
    const esperado =
      (c.saldo_inicial ?? 0) +
      plano.transacoes
        .filter(t => t.conta === c.nome)
        .reduce((s, t) => s + t.centavos, 0) -
      plano.transacoes
        .filter(t => t.transferir_para === c.nome)
        .reduce((s, t) => s + t.centavos, 0);
    r.contas.push({ nome: c.nome, saldo, esperado, ok: saldo === esperado });
    if (saldo !== esperado) {
      r.falhas.push(
        `saldo ${c.nome}: ${fmt(saldo)} ≠ esperado ${fmt(esperado)}`,
      );
    }
    const decl = controles.contas[c.nome]?.saldo_final;
    if (decl && saldo !== parseValor(decl.valor) && c.tipo !== 'cartao') {
      r.falhas.push(
        `saldo ${c.nome}: ${fmt(saldo)} ≠ saldo declarado ${decl.valor}`,
      );
    }
    const txs = await api.getTransactions(a.id, '1900-01-01', '2999-12-31');
    for (const t of txs) {
      if (transferAcct[t.payee]) {
        if (t.category) r.falhas.push(`transferência ${t.id} tem categoria`);
        if (!t.transfer_id) {
          r.falhas.push(`transferência ${t.id} sem contrapartida`);
        } else if (t.amount < 0) {
          paresOk++;
        }
      } else if (t.category && !cats[t.category]?.is_income && t.amount < 0) {
        gastoCategorizado += t.amount;
      }
    }
  }
  const esperadoGasto = plano.transacoes
    .filter(
      t =>
        t.categoria &&
        !t.categoria_receita &&
        !t.transferir_para &&
        t.centavos < 0,
    )
    .reduce((s, t) => s + t.centavos, 0);
  r.gasto_categorizado = gastoCategorizado;
  r.gasto_esperado = esperadoGasto;
  if (gastoCategorizado !== esperadoGasto) {
    r.falhas.push(
      `despesa categorizada ${fmt(gastoCategorizado)} ≠ esperada ${fmt(esperadoGasto)}`,
    );
  }
  const transferenciasPlano = plano.transacoes.filter(
    t => t.transferir_para,
  ).length;
  r.pares = paresOk;
  if (paresOk !== transferenciasPlano) {
    r.falhas.push(
      `pares de transferência: ${paresOk} ≠ ${transferenciasPlano}`,
    );
  }
  r.agendamentos = (await api.getSchedules()).filter(s =>
    plano.agendamentos.some(a => a.nome === s.name),
  ).length;
  return r;
}

// ---------------------------------------------------------------- servidor

function verificarServidor(opts) {
  for (const o of ['servidor', 'sync-id', 'orcamento']) {
    if (!opts[o]) sair(`atualizar exige --${o}`);
  }
  // A senha vai ao servidor no login: http só dentro desta máquina.
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
  if (opts['criar-categorias']) {
    sair('atualizar não cria categorias: crie no aplicativo');
  }
  if (!process.env.DF_SENHA_SERVIDOR) {
    sair(
      'defina a senha do servidor em DF_SENHA_SERVIDOR (nunca na linha de comando)',
    );
  }
}

/**
 * Abre o orçamento que já vive no servidor, pelo id de sincronização: a API
 * baixa uma cópia nesta pasta vazia e daí em diante só troca mensagens com o
 * servidor — nunca envia o arquivo inteiro. O nome tem de bater com
 * --orcamento antes de baixar: abrir já sincroniza, e outro orçamento nunca
 * deve ser aberto.
 */
async function abrirOrcamentoServidor(api, opts, verificado, sessao) {
  const lib = await api.init({
    dataDir: verificado.real,
    serverURL: opts.servidor,
    password: process.env.DF_SENHA_SERVIDOR,
  });
  sessao.lib = lib;
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
      `o id de sincronização ${opts['sync-id']} é do orçamento "${baixado?.name ?? '?'}", não de "${opts.orcamento}"; nada foi importado`,
    );
  }
  return lib;
}

/**
 * Separa as linhas do lote pelo que o orçamento do servidor já tem. O que já
 * está lá nunca é reenviado: ao reencontrar um `imported_id`, o
 * `importTransactions` do Actual regrava notas, categoria e "conferido" que o
 * usuário tenha apagado, e por padrão reimporta o que ele excluiu.
 *
 * - já importada: mesmo `imported_id`, mesma data e valor;
 * - divergente: mesmo `imported_id`, outra data ou valor; nunca é alterada;
 * - excluída: só existe como excluída no app; não volta;
 * - equivalente: outro `imported_id` (um extrato novo renumera o `id_origem`
 *   da conta corrente), mas mesma data, valor e descrição de uma já importada
 *   que o lote não traz pelo id — só onde o lote prova estar completo;
 * - suspeita: parecida com uma já importada que o lote não reconheceu (mesmo
 *   valor em até 7 dias, ou mesma data e descrição): pode ser a mesma
 *   transação alterada pelo banco; ou igual a uma já importada num trecho sem
 *   prova de lote completo: pode ser outra compra idêntica. Só entra com
 *   --importar-suspeitas;
 * - nova: o resto.
 */
async function classificar(api, plano, ids, controles) {
  const r = {
    por_conta: {},
    novas: [],
    divergentes: [],
    excluidas: [],
    suspeitas: [],
    ausentes: [],
  };
  const chave = (data, centavos, desc) =>
    `${data}|${centavos}|${normalizarDescricao(desc ?? '')}`;
  // Só o saldo da corrente ou o total da fatura, conferidos pelo `validar`,
  // provam que o lote traz todas as transações do trecho; num lote parcial,
  // uma linha igual a uma já importada pode ser outra compra idêntica.
  const completo = t => {
    const conta = controles.contas[t.conta];
    if (conta?.tipo === 'cartao') {
      return Boolean(controles.faturas[t.conta]?.[t.fatura]);
    }
    const ini = conta?.saldo_inicial?.data;
    const fim = conta?.saldo_final?.data;
    return Boolean(fim) && t.data <= fim && (!ini || t.data > ini);
  };
  for (const c of plano.contas) {
    const { data: existentes } = await api.aqlQuery(
      api
        .q('transactions')
        .filter({ account: ids[c.nome] })
        .select([
          'id',
          'imported_id',
          'date',
          'amount',
          'imported_payee',
          'tombstone',
        ])
        .options({ splits: 'all' })
        .withDead(),
    );
    const doLote = plano.transacoes.filter(t => t.conta === c.nome);
    const idsLote = new Set(doLote.map(t => t.imported_id));
    const porId = Map.groupBy(
      existentes.filter(e => e.imported_id),
      e => e.imported_id,
    );
    // Importadas por este fluxo que o lote não traz pelo id.
    const livres = existentes.filter(
      e => e.imported_id?.startsWith('dfi1-') && !idsLote.has(e.imported_id),
    );
    const porConteudo = Map.groupBy(livres, e =>
      chave(e.date, e.amount, e.imported_payee),
    );
    const usadas = new Set();
    const candidatas = [];
    const n = {
      lote: doLote.length,
      ja_importadas: 0,
      equivalentes: 0,
      excluidas: 0,
      divergentes: 0,
      suspeitas: 0,
      novas: 0,
    };
    for (const t of doLote) {
      const mesmoId = porId.get(t.imported_id) ?? [];
      const viva = mesmoId.find(e => !e.tombstone);
      const eq = mesmoId.length
        ? null
        : porConteudo
            .get(chave(t.data, t.centavos, t.descricao))
            ?.find(e => !usadas.has(e.id));
      if (eq) usadas.add(eq.id);
      if (viva && (viva.date !== t.data || viva.amount !== t.centavos)) {
        n.divergentes++;
        r.divergentes.push({ t, e: viva });
      } else if (viva) {
        n.ja_importadas++;
      } else if (mesmoId.length || eq?.tombstone) {
        // Excluída no app não volta, nem com --importar-suspeitas.
        n.excluidas++;
        r.excluidas.push({ t, e: mesmoId[0] ?? eq });
      } else if (eq && !completo(t)) {
        n.suspeitas++;
        r.suspeitas.push({ t, e: eq, igual: true });
      } else if (eq) {
        n.equivalentes++;
      } else {
        candidatas.push(t);
      }
    }
    const sobra = livres.filter(e => !e.tombstone && !usadas.has(e.id));
    const parecidas = new Set();
    for (const t of candidatas) {
      const nd = normalizarDescricao(t.descricao);
      const e = sobra.find(
        x =>
          (x.amount === t.centavos && diasEntre(x.date, t.data) <= 7) ||
          (x.date === t.data &&
            normalizarDescricao(x.imported_payee ?? '') === nd),
      );
      if (e) {
        parecidas.add(e);
        n.suspeitas++;
        r.suspeitas.push({ t, e });
      } else {
        n.novas++;
        r.novas.push(t);
      }
    }
    // Já importadas, dentro do período do lote, que o lote não traz: o banco
    // pode ter cancelado ou mudado a transação. Só informadas.
    const datas = doLote.map(t => t.data).sort();
    for (const e of sobra) {
      if (!parecidas.has(e) && e.date >= datas[0] && e.date <= datas.at(-1)) {
        r.ausentes.push({ conta: c.nome, e });
      }
    }
    r.por_conta[c.nome] = n;
  }
  return r;
}

async function atualizar(plano, api, lib, opts, controles) {
  // Contas e categorias têm de existir: atualizar não cria nenhuma. Uma conta
  // renomeada no app viraria outra conta, com o histórico todo duplicado.
  const contasApi = await api.getAccounts();
  const ids = {};
  for (const c of plano.contas) {
    const achadas = contasApi.filter(a => a.name === c.nome && !a.closed);
    if (achadas.length !== 1) {
      throw new Error(
        `conta "${c.nome}" ${achadas.length ? 'repetida' : 'inexistente, renomeada ou fechada'} no orçamento; atualizar não cria contas`,
      );
    }
    ids[c.nome] = achadas[0].id;
  }
  // Conta vinculada à sincronização bancária (Pluggy etc.): ao casar o extrato
  // do banco com o histórico, o Actual troca o `imported_id` dfi1-… pelo id do
  // banco, e o lote sobreposto voltaria inteiro como "novo". A prévia avisa;
  // `--confirmar` recusa o lote.
  const { data: contasSync } = await api.aqlQuery(
    api
      .q('accounts')
      .filter({ id: { $oneof: Object.values(ids) } })
      .select(['name', 'account_sync_source']),
  );
  const vinculadas = contasSync
    .filter(a => a.account_sync_source)
    .map(a => ({ conta: a.name, fonte: a.account_sync_source }));
  const catId = {};
  for (const c of await api.getCategories()) catId[c.name] ??= c.id;
  const semCategoria = [
    ...new Set(
      plano.transacoes.map(t => t.categoria).filter(n => n && !catId[n]),
    ),
  ];
  if (semCategoria.length) {
    throw new Error(
      `categorias inexistentes no orçamento: ${semCategoria.join(', ')} (renomeadas no app?); atualizar não cria categorias`,
    );
  }
  const payees = await api.getPayees();
  const payeeTransfer = Object.fromEntries(
    Object.entries(ids).map(([n, id]) => [
      n,
      payees.find(p => p.transfer_acct === id)?.id,
    ]),
  );

  const res = {
    ...(await classificar(api, plano, ids, controles)),
    aplicado: false,
    vinculadas,
    fusoes: [],
    travadas: [],
    agendamentos_criados: 0,
    agendamentos_existentes: 0,
    saldos: [],
    falhas: [],
  };
  const enviar = [
    ...res.novas,
    ...(opts['importar-suspeitas'] ? res.suspeitas.map(s => s.t) : []),
  ];
  const porConta = Map.groupBy(enviar, t => t.conta);

  // Prévia do próprio Actual (nada é gravado): casamento com lançamento
  // manual (mesmo valor, até 7 dias, sem imported_id) ou com lançamento já
  // conciliado, que fica travado.
  for (const [nome, txs] of porConta) {
    const p = await api.importTransactions(
      ids[nome],
      txs.map(t => paraTransacaoApi(t, catId, payeeTransfer)),
      { defaultCleared: true, dryRun: true },
    );
    if (p.errors?.length) {
      throw new Error(
        `prévia ${nome}: ${JSON.stringify(p.errors).slice(0, 300)}`,
      );
    }
    for (const u of p.updatedPreview) {
      const t = txs.find(x => x.imported_id === u.transaction.imported_id);
      if (u.existing) res.fusoes.push({ t, e: u.existing });
      else if (u.ignored) res.travadas.push({ t });
    }
  }
  const fundidas = new Set(res.fusoes.map(f => f.t));
  const travadas = new Set(res.travadas.map(f => f.t));
  const entram = enviar.filter(t => !fundidas.has(t) && !travadas.has(t));
  for (const [nome, c] of Object.entries(controles.contas)) {
    if (!c.saldo_final || !ids[nome]) continue;
    const data = c.saldo_final.data;
    const antes = await api.getAccountBalance(ids[nome], data);
    const efeito = entram
      .filter(t => t.data <= data)
      .reduce(
        (s, t) =>
          s +
          (t.conta === nome ? t.centavos : 0) -
          (t.transferir_para === nome ? t.centavos : 0),
        0,
      );
    res.saldos.push({
      conta: nome,
      data,
      antes,
      previsto: antes + efeito,
      declarado: parseValor(c.saldo_final.valor),
    });
  }
  if (!opts.confirmar) return res;
  // Conta vinculada ao banco bloqueia o lote inteiro: --importar-suspeitas e
  // --aplicar-parcial não liberam.
  if (res.vinculadas.length) {
    res.bloqueado = true;
    return res;
  }
  // Divergência ou suspeita sem resolução bloqueia o lote inteiro, antes de
  // qualquer gravação. Resolver é explícito: corrigir o CSV ou o app,
  // --importar-suspeitas ou --aplicar-parcial.
  const semResolucao =
    res.divergentes.length +
    (opts['importar-suspeitas'] ? 0 : res.suspeitas.length);
  if (semResolucao && !opts['aplicar-parcial']) {
    res.bloqueado = true;
    return res;
  }

  // Na fusão, o lançamento manual recebe só o imported_id e a descrição do
  // banco. O Actual regravaria favorecido, categoria, notas e "conferido" com
  // o valor que leu, e uma edição ainda não sincronizada de outro aparelho
  // perderia para essa regravação.
  for (const { t, e } of res.fusoes) {
    await atualizarTransacao(lib, e.id, {
      imported_id: t.imported_id,
      imported_payee: t.descricao,
    });
  }
  for (const [nome, txs] of porConta) {
    const resto = txs.filter(t => !fundidas.has(t));
    if (!resto.length) continue;
    const r = await api.importTransactions(
      ids[nome],
      resto.map(t => paraTransacaoApi(t, catId, payeeTransfer)),
      { defaultCleared: true, dryRun: false },
    );
    if (r.errors?.length) {
      throw new Error(
        `importação ${nome}: ${JSON.stringify(r.errors).slice(0, 300)}`,
      );
    }
    const previstas = resto.filter(t => !travadas.has(t)).length;
    if (r.updated.length || r.added.length !== previstas) {
      res.falhas.push(
        `${nome}: o Actual incluiu ${r.added.length} e alterou ${r.updated.length}; a prévia indicava ${previstas} e 0`,
      );
    }
  }
  if (!opts['sem-agendamentos']) {
    // Inclusive os excluídos no app: agendamento apagado não volta.
    const { data } = await api.aqlQuery(
      api.q('schedules').select(['name']).withDead(),
    );
    const existentes = new Set(data.map(s => s.name));
    await criarAgendamentos(api, plano, ids, existentes, res);
  }
  await api.sync();
  res.aplicado = true;

  // Conferência depois de sincronizar: nenhum imported_id do lote repetido, e
  // cada linha incluída presente uma vez.
  for (const c of plano.contas) {
    const { data } = await api.aqlQuery(
      api
        .q('transactions')
        .filter({ account: ids[c.nome] })
        .select(['imported_id'])
        .options({ splits: 'all' }),
    );
    const vezes = new Map();
    for (const { imported_id: id } of data) {
      if (id) vezes.set(id, (vezes.get(id) ?? 0) + 1);
    }
    for (const t of plano.transacoes.filter(x => x.conta === c.nome)) {
      const k = vezes.get(t.imported_id) ?? 0;
      if (k > 1 || ((entram.includes(t) || fundidas.has(t)) && k !== 1)) {
        res.falhas.push(
          `${t.origem}: imported_id ${t.imported_id} presente ${k} vez(es) depois da sincronização`,
        );
      }
    }
  }
  for (const s of res.saldos) {
    s.depois = await api.getAccountBalance(ids[s.conta], s.data);
    if (s.depois !== s.previsto) {
      res.falhas.push(
        `saldo ${s.conta} em ${s.data}: ${fmt(s.depois)} ≠ previsto ${fmt(s.previsto)}`,
      );
    }
  }
  return res;
}

function imprimirAtualizacao(r, opts) {
  const estado = r.aplicado
    ? 'aplicado e sincronizado'
    : r.bloqueado
      ? 'BLOQUEADO: nada foi gravado'
      : 'prévia: nada foi gravado';
  out(`\nATUALIZAR (${estado}) — orçamento "${opts.orcamento}"`);
  for (const [nome, n] of Object.entries(r.por_conta)) {
    out(
      `  ${nome}: ${n.lote} no lote | já no orçamento: ${n.ja_importadas} pelo id, ${n.equivalentes} pelo conteúdo | excluídas no app: ${n.excluidas} | novas: ${n.novas} | divergentes: ${n.divergentes} | suspeitas: ${n.suspeitas}`,
    );
  }
  for (const { conta, fonte } of r.vinculadas ?? []) {
    out(
      `  VINCULADA  ${conta} — sincroniza pelo banco (${fonte}): o Actual troca o imported_id do lote pelo id do banco e o período sobreposto voltaria como novo; com --confirmar, esta conta bloqueia o lote inteiro`,
    );
  }
  const linha = t => `${t.origem} ${t.data} ${fmt(t.centavos)} ${t.descricao}`;
  const doOrcamento = e =>
    `${e.date} ${fmt(e.amount)} ${e.imported_payee ?? ''}`.trim();
  for (const { t, e } of r.fusoes) {
    out(
      `  MANUAL     ${linha(t)} — casa com o lançamento manual de ${e.date}${e.payee_name ? ` (${e.payee_name})` : ''}: ele recebe só o imported_id`,
    );
  }
  for (const { t } of r.travadas) {
    out(
      `  TRAVADA    ${linha(t)} — casa com lançamento já conciliado no app: não entra`,
    );
  }
  for (const { t, e } of r.divergentes) {
    out(
      `  DIVERGENTE ${linha(t)} — no orçamento: ${doOrcamento(e)}; mantido o do orçamento`,
    );
  }
  for (const { t, e, igual } of r.suspeitas) {
    out(
      `  SUSPEITA   ${linha(t)} — ${igual ? `igual a ${doOrcamento(e)}, sem controle de saldo ou fatura que prove o lote completo` : `parece ${doOrcamento(e)}`}; ${opts['importar-suspeitas'] ? 'importada por --importar-suspeitas' : 'não importada'}`,
    );
  }
  for (const { t } of r.excluidas) {
    out(`  EXCLUÍDA   ${linha(t)} — excluída no app; não volta`);
  }
  for (const { conta, e } of r.ausentes) {
    out(
      `  AUSENTE    ${conta} ${doOrcamento(e)} — já importada, no período do lote, mas fora dele`,
    );
  }
  for (const s of r.saldos) {
    const valor = s.depois ?? s.previsto;
    out(
      `  [${valor === s.declarado ? 'ok' : 'DIVERGE'}] saldo ${s.conta} em ${s.data}: orçamento ${fmt(s.antes)} → ${fmt(valor)}${s.depois === undefined ? ' (previsto)' : ''} / declarado ${fmt(s.declarado)}`,
    );
  }
  if (r.aplicado) {
    out(
      `  agendamentos: criados ${r.agendamentos_criados}, já existentes ${r.agendamentos_existentes}`,
    );
  } else if (r.bloqueado && r.vinculadas?.length) {
    out(
      '  conta vinculada à sincronização bancária: tire-a do lote (ou desvincule-a no app) e rode de novo; --importar-suspeitas e --aplicar-parcial não liberam',
    );
  } else if (r.bloqueado) {
    out(
      '  há divergência ou suspeita sem resolução: corrija o CSV ou o app e rode de novo; ou, depois de revisar, use --importar-suspeitas (suspeitas entram como novas) e/ou --aplicar-parcial (entram só as novas)',
    );
  } else if (r.vinculadas?.length) {
    out(
      '  prévia: com --confirmar o lote seria bloqueado pela conta vinculada; tire-a do lote antes',
    );
  } else {
    out('  prévia: rode de novo com --confirmar para aplicar');
  }
  for (const f of r.falhas) out(`  FALHA ${f}`);
}

/** Itens que pedem revisão: o lote foi (ou seria) aplicado só em parte. */
function pendencias(r, opts) {
  return (
    (r.bloqueado ? 1 : 0) +
    r.divergentes.length +
    (opts['importar-suspeitas'] ? 0 : r.suspeitas.length) +
    r.saldos.filter(s => (s.depois ?? s.previsto) !== s.declarado).length +
    r.falhas.length
  );
}

// ---------------------------------------------------------------- main

async function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  if (
    !['validar', 'planejar', 'aplicar', 'conferir', 'atualizar'].includes(cmd)
  ) {
    out(
      'Uso: importar.mjs validar|planejar|aplicar|conferir|atualizar --controles <json> [opções] <csv...>',
    );
    out('Veja deploy/importacao/README.md.');
    process.exit(cmd ? 2 : 0);
  }
  const controles = lerControles(opts.controles);
  const dataCorte = opts['data-corte'] ?? hoje();
  if (!dataValida(dataCorte)) sair('--data-corte inválida');
  const v = validar(opts.arquivos, controles, dataCorte);
  out(`data de corte: ${dataCorte}`);
  imprimirValidacao(v);
  if (cmd === 'validar') process.exit(v.erros.length ? 1 : 0);
  if (v.erros.length) {
    sair('há erros de validação; nada foi planejado nem aplicado', 1);
  }

  const plano = montarPlano(v, controles);
  if (cmd === 'planejar') {
    prepararSaida(opts.saida);
    fs.writeFileSync(
      path.join(opts.saida, 'plano.json'),
      `${JSON.stringify(plano, null, 2)}\n`,
    );
    const cab = [
      'arquivo',
      'linha',
      'conta',
      'data',
      'descricao',
      'valor',
      'tipo',
      'motivo',
    ];
    fs.writeFileSync(
      path.join(opts.saida, 'revisao.csv'),
      [
        cab.join(';'),
        ...plano.revisao.map(r => cab.map(c => csvCampo(r[c])).join(';')),
      ].join('\n') + '\n',
    );
    out(`\nPLANO (simulação, nada foi gravado em orçamento):`);
    out(
      `  contas: ${plano.contas.map(c => `${c.nome} [${c.tipo}, saldo inicial ${fmt(c.saldo_inicial ?? 0)}]`).join(' | ')}`,
    );
    for (const c of plano.contas) {
      const t = plano.transacoes.filter(x => x.conta === c.nome);
      out(
        `  ${c.nome}: ${t.length} transações, soma ${fmt(t.reduce((s, x) => s + x.centavos, 0))}`,
      );
    }
    for (const p of plano.pares) {
      out(
        `  transferência ${p.saida.conta} -> ${p.entrada?.conta ?? '(sem par no outro arquivo)'} ${p.saida.valor} em ${p.saida.data} [${p.saida.imported_id}]`,
      );
    }
    out(
      `  agendamentos de parcelas futuras: ${plano.agendamentos.length} (soma ${fmt(plano.agendamentos.reduce((s, a) => s + a.centavos, 0))})`,
    );
    out(
      `  linhas não importadas: ${plano.ignoradas.length} | fila de revisão: ${plano.revisao.length}`,
    );
    out(
      `  gravado: ${path.join(opts.saida, 'plano.json')}, ${path.join(opts.saida, 'revisao.csv')}`,
    );
    return;
  }

  const verificado = verificarDataDir(opts['data-dir'], cmd);
  if (cmd === 'aplicar' && !opts.confirmar) {
    sair('aplicar exige --confirmar (rode planejar antes e revise o plano)');
  }
  if (cmd === 'atualizar') verificarServidor(opts);
  const api = carregarApi(opts.api);
  const marcador =
    cmd === 'aplicar' ? prepararDataDir(verificado) : verificado.marcador;
  const restaurar = silenciarConsole(
    path.join(verificado.real, 'importar.log'),
    opts.verbose,
  );
  let resultado;
  const sessao = {};
  try {
    if (cmd === 'atualizar') {
      const lib = await abrirOrcamentoServidor(api, opts, verificado, sessao);
      resultado = await atualizar(plano, api, lib, opts, controles);
    } else {
      const { lib, criado, id } = await abrirOrcamento(
        api,
        opts,
        cmd === 'aplicar',
        verificado,
        marcador,
      );
      if (cmd === 'aplicar') {
        resultado = {
          orcamento: { nome: opts.orcamento, id, criado },
          ...(await aplicar(plano, api, lib, opts)),
        };
        if (opts.exportar) {
          if (dentroDe(opts.exportar, REPO_ROOT)) {
            throw new Error('--exportar dentro do repositório');
          }
          fs.writeFileSync(opts.exportar, await api.exportBudget());
          resultado.exportado = opts.exportar;
        }
      } else {
        resultado = await conferir(plano, api, controles);
      }
    }
  } finally {
    if (sessao.lib && !resultado) {
      // Erro no `atualizar`: fecha sem sincronizar (a cópia local é
      // descartável). Não há atomicidade: o Actual sincroniza sozinho 1 s
      // depois de cada gravação, então etapas anteriores podem já estar no
      // servidor.
      await sessao.lib.send('close-budget').catch(() => undefined);
      if (opts.confirmar) {
        process.stderr.write(
          'se o erro veio durante a gravação, parte do lote pode já estar no servidor: rode o mesmo comando de novo (o que entrou é reconhecido pelo id e não duplica)\n',
        );
      }
    } else {
      await api.shutdown().catch(() => undefined);
    }
    restaurar();
  }
  if (cmd === 'atualizar') {
    imprimirAtualizacao(resultado, opts);
    if (pendencias(resultado, opts)) process.exit(1);
    return;
  }
  out(`\n${cmd.toUpperCase()}:`);
  if (cmd === 'aplicar') {
    out(
      `  orçamento: ${resultado.orcamento.nome} (${resultado.orcamento.criado ? 'criado agora' : 'já existia'})`,
    );
    out(
      `  contas criadas: ${resultado.contas_criadas.join(', ') || 'nenhuma'}`,
    );
    out(
      `  categorias criadas: ${resultado.categorias_criadas.join(', ') || 'nenhuma'}`,
    );
    for (const [n, x] of Object.entries(resultado.por_conta)) {
      out(
        `  ${n}: enviadas ${x.enviadas}, novas ${x.novas}, atualizadas ${x.atualizadas}`,
      );
    }
    out(
      `  agendamentos: criados ${resultado.agendamentos_criados}, já existentes ${resultado.agendamentos_existentes}`,
    );
    if (resultado.exportado) out(`  exportado: ${resultado.exportado}`);
  } else {
    for (const c of resultado.contas) {
      out(
        `  [${c.ok ? 'ok' : 'DIVERGE'}] saldo ${c.nome}: ${fmt(c.saldo)} (esperado ${fmt(c.esperado)})`,
      );
    }
    out(
      `  despesa categorizada: ${fmt(resultado.gasto_categorizado)} (esperada ${fmt(resultado.gasto_esperado)}; transferências fora)`,
    );
    out(
      `  pares de transferência com contrapartida e sem categoria: ${resultado.pares}`,
    );
    out(
      `  agendamentos de parcelas futuras presentes: ${resultado.agendamentos}`,
    );
    for (const f of resultado.falhas) out(`  FALHA ${f}`);
    if (resultado.falhas.length) process.exit(1);
  }
}

main().catch(e => {
  process.stderr.write(`ERRO: ${e.stack ?? e}\n`);
  process.exit(1);
});
