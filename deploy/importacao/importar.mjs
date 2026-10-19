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
//
// Sem dependências. Só `aplicar` e `conferir` carregam o @actual-app/api, e só
// contra uma pasta de dados local e isolada: nunca contra o servidor, nunca
// contra a pasta de produção. Detalhes em deploy/importacao/README.md.

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
    'confirmar',
    'criar-categorias',
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
  if (!dir) sair('aplicar exige --data-dir <pasta local e isolada>');
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

async function aplicar(plano, api, opts) {
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
      .map(t => ({
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
      }));
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

  // Parcelas futuras: agendamentos sem lançamento automático.
  if (!opts['sem-agendamentos']) {
    const existentes = new Set((await api.getSchedules()).map(s => s.name));
    for (const a of plano.agendamentos) {
      if (existentes.has(a.nome)) {
        res.agendamentos_existentes++;
        continue;
      }
      let payee = (await api.getPayees()).find(
        p => p.name === a.favorecido,
      )?.id;
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
  return res;
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

// ---------------------------------------------------------------- main

async function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  if (!['validar', 'planejar', 'aplicar', 'conferir'].includes(cmd)) {
    out(
      'Uso: importar.mjs validar|planejar|aplicar|conferir --controles <json> [opções] <csv...>',
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
  const api = carregarApi(opts.api);
  const marcador =
    cmd === 'aplicar' ? prepararDataDir(verificado) : verificado.marcador;
  const restaurar = silenciarConsole(
    path.join(verificado.real, 'importar.log'),
    opts.verbose,
  );
  let resultado;
  try {
    const { criado, id } = await abrirOrcamento(
      api,
      opts,
      cmd === 'aplicar',
      verificado,
      marcador,
    );
    if (cmd === 'aplicar') {
      resultado = {
        orcamento: { nome: opts.orcamento, id, criado },
        ...(await aplicar(plano, api, opts)),
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
  } finally {
    await api.shutdown().catch(() => undefined);
    restaurar();
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
