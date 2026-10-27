#!/usr/bin/env node
// Diego Finance V2 — sincronização bancária diária, sem navegador.
//
//   node sincronizacao-bancaria/rotina.mjs            agenda (fica no ar)
//   node sincronizacao-bancaria/rotina.mjs status     o que aconteceu e o que vem
//                                                      (status --json)
//   node sincronizacao-bancaria/rotina.mjs agora      importa já, todas as contas
//   node sincronizacao-bancaria/rotina.mjs contas     orçamentos e contas vinculadas
//   node sincronizacao-bancaria/rotina.mjs liberar    tira o bloqueio de segurança
//   node sincronizacao-bancaria/rotina.mjs verificar  confere a instalação, sem rede
//   node sincronizacao-bancaria/rotina.mjs saude      healthcheck do Docker
//
// Caminhos como dentro da imagem (a partir de /app); no repositório o arquivo
// é deploy/sincronizacao-bancaria/rotina.mjs.
//
// O quê. Uma vez por dia, no horário configurado (padrão 07:00 de Brasília),
// abre o orçamento configurado pela API do Actual compilada do mesmo commit —
// o mesmo núcleo do app — e chama, conta a conta, `accounts-bank-sync`, o
// comando do botão Sincronizar. Quem fala com a Pluggy é o servidor do Diego
// Finance, como no app. A rotina nunca escreve no SQLite e nunca pede à
// Pluggy para atualizar o item: importa o que o Meu Pluggy já coletou (ele
// coleta sozinho, uma vez por dia, de madrugada). Notebook desligado no
// horário: importa uma vez quando voltar (regras em politica.mjs).
//
// Cuidados. Uma importação por vez (trava na pasta da rotina), num processo
// à parte, com limite de tempo. Cada execução baixa o orçamento numa pasta
// temporária apagada no fim: falha não deixa nada pela metade. Antes de cada
// conta confere o vínculo com a Pluggy e "reimportar apagados" desligado;
// depois — também quando a importação acusa erro — que nenhum lançamento que
// já existia mudou (regras em `conferirIntegridade`) e que nenhum id do banco
// passou a se repetir. Uma conta só conta como importada quando o app
// registrou a sincronização e o servidor confirmou o envio. Falha passageira
// tenta de novo (15 min, 1 h, 4 h); falha que pede ação espera a correção;
// mudança inesperada em lançamento existente bloqueia a rotina até `liberar`.
//
// Pasta da rotina (DF_BANCO_DIR, padrão /sincronizacao): senha-do-servidor.txt
// (gravada pelo Diego), estado.json, registro.log, batimento.json,
// execucao.trava e, para pausar, um arquivo PAUSAR. O registro nunca traz
// senha, id completo de item, nome de pessoa nem lançamento: só contas,
// contagens e horários. Configuração e operação: README.md desta pasta.

import { fork } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  andamentoDaVaga,
  classificarErroConta,
  classificarErroGeral,
  decidir,
  descreverIntegridade,
  emDia,
  ESPERAS_FALHA_PADRAO_S,
  ETIQUETA_DUVIDA,
  formatar,
  importarConferindo,
  lerHorario,
  limpar,
  partesNoFuso,
  proximaImportacao,
  registrarTentativa,
  vagaAtual,
} from './politica.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const PASTA = path.resolve(process.env.DF_BANCO_DIR || '/sincronizacao');
const ARQ = {
  senha: path.join(PASTA, 'senha-do-servidor.txt'),
  estado: path.join(PASTA, 'estado.json'),
  registro: path.join(PASTA, 'registro.log'),
  batimento: path.join(PASTA, 'batimento.json'),
  trava: path.join(PASTA, 'execucao.trava'),
  pausar: path.join(PASTA, 'PAUSAR'),
};
const PREFIXO_TEMPORARIO = 'df-banco-';
const PLUGGY_DEFASADA_MS = 36 * 3600_000;
const REGISTRO_MAXIMO = 1024 * 1024;
const CAMPOS_RETRATO = [
  'id',
  'date',
  'amount',
  'category',
  'notes',
  'payee',
  'transfer_id',
  'imported_id',
  'cleared',
];

const out = texto => process.stdout.write(`${texto}\n`);
const iso = (instante = Date.now()) => new Date(instante).toISOString();
const ms = texto => (texto ? Date.parse(texto) : null);
const curtoId = id => (id ? `${String(id).slice(0, 8)}…` : '?');
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const dormir = tempo => new Promise(resolve => setTimeout(resolve, tempo));

class Falha extends Error {
  constructor(tipo, mensagem, codigo) {
    super(mensagem);
    this.tipo = tipo;
    this.codigo = codigo;
  }
}

function comoFalha(erro) {
  if (erro instanceof Falha) return erro;
  const c = classificarErroGeral(erro);
  return new Falha(c.tipo, c.mensagem, c.codigo);
}

// ------------------------------------------------------------------ configuração

function lerConfiguracao() {
  const env = process.env;
  const erros = [];
  const inteiro = (nome, padrao, minimo, maximo) => {
    const texto = env[nome];
    if (texto == null || texto === '') return padrao;
    const n = Number(texto);
    if (Number.isInteger(n) && n >= minimo && n <= maximo) return n;
    erros.push(`${nome} inválido (de ${minimo} a ${maximo} segundos)`);
    return padrao;
  };
  const orcamento = (env.DF_BANCO_ORCAMENTO ?? '').trim();
  const nome = (env.DF_BANCO_ORCAMENTO_NOME ?? '').trim();
  const contas = [
    ...new Set(
      (env.DF_BANCO_CONTAS ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    ),
  ];
  const horarioTexto = (env.DF_BANCO_HORARIO || '07:00').trim();
  const horario = lerHorario(horarioTexto);
  let fuso = (env.DF_BANCO_FUSO || 'America/Sao_Paulo').trim();
  if (!orcamento) {
    erros.push(
      'defina DF_BANCO_ORCAMENTO (o Sync ID do orçamento; o comando "contas" lista)',
    );
  }
  if (!nome) {
    erros.push('defina DF_BANCO_ORCAMENTO_NOME (o nome exato do orçamento)');
  }
  if (!contas.length) {
    erros.push(
      'defina DF_BANCO_CONTAS (ids das contas vinculadas, separados por vírgula; o comando "contas" lista)',
    );
  }
  if (!horario) {
    erros.push(
      `DF_BANCO_HORARIO inválido: "${limpar(horarioTexto, 20)}" (use HH:MM)`,
    );
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: fuso });
  } catch {
    erros.push(`DF_BANCO_FUSO inválido: "${limpar(fuso, 40)}"`);
    fuso = 'UTC';
  }
  let esperasS = ESPERAS_FALHA_PADRAO_S;
  if (env.DF_BANCO_ESPERAS_FALHA_S) {
    const lidas = env.DF_BANCO_ESPERAS_FALHA_S.split(',').map(Number);
    if (lidas.every(s => Number.isInteger(s) && s >= 5 && s <= 86400)) {
      esperasS = lidas;
    } else {
      erros.push(
        'DF_BANCO_ESPERAS_FALHA_S inválido (segundos separados por vírgula)',
      );
    }
  }
  return {
    servidor: (env.DF_BANCO_SERVIDOR || 'http://diego-finance:5006').replace(
      /\/+$/,
      '',
    ),
    orcamento,
    nome,
    contas,
    horarioTexto,
    horario: horario ?? { hora: 7, minuto: 0 },
    fuso,
    verificarS: inteiro('DF_BANCO_VERIFICAR_S', 300, 5, 3600),
    esperaInicialS: inteiro('DF_BANCO_ESPERA_INICIAL_S', 120, 0, 3600),
    limiteS: inteiro('DF_BANCO_LIMITE_S', 900, 30, 7200),
    esperasS,
    erros,
  };
}

/** Muda quando muda a configuração ou o arquivo da senha. */
function impressaoDaConfiguracao(cfg) {
  let senha = 'ausente';
  try {
    const st = fs.statSync(ARQ.senha);
    senha = `${st.size}:${Math.round(st.mtimeMs)}`;
  } catch {
    // sem arquivo: a impressão diz "ausente"
  }
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify([
        cfg.servidor,
        cfg.orcamento,
        cfg.nome,
        [...cfg.contas].sort((a, b) => a.localeCompare(b)),
        cfg.horarioTexto,
        cfg.fuso,
        senha,
      ]),
    )
    .digest('hex')
    .slice(0, 16);
}

/** A senha do servidor, aceitando o que o Bloco de Notas e o PowerShell gravam. */
function lerSenha() {
  let bruto;
  try {
    bruto = fs.readFileSync(ARQ.senha);
  } catch (e) {
    const motivo = e.code === 'EISDIR' ? 'é uma pasta' : 'não existe';
    throw new Falha(
      'acao',
      `${path.basename(ARQ.senha)} ${motivo}: grave nele só a senha do Diego Finance, na pasta da rotina`,
      'sem-senha',
    );
  }
  let texto;
  if (bruto[0] === 0xff && bruto[1] === 0xfe) {
    texto = bruto.subarray(2).toString('utf16le');
  } else if (bruto[0] === 0xef && bruto[1] === 0xbb && bruto[2] === 0xbf) {
    texto = bruto.subarray(3).toString('utf8');
  } else {
    texto = bruto.toString('utf8');
  }
  texto = texto.replace(/[\r\n]+$/, '');
  if (!texto) {
    throw new Falha(
      'acao',
      `${path.basename(ARQ.senha)} está vazio`,
      'senha-vazia',
    );
  }
  return texto;
}

// ------------------------------------------------------------------ arquivos

function lerJson(arquivo) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return null;
  }
}

function gravarJson(arquivo, dados) {
  const temporario = `${arquivo}.${process.pid}.tmp`;
  fs.writeFileSync(temporario, `${JSON.stringify(dados, null, 2)}\n`);
  fs.renameSync(temporario, arquivo);
}

/** Estado gravado; com `reparar` (só sob a trava) guarda um arquivo ilegível. */
function lerEstado({ reparar = false } = {}) {
  if (!fs.existsSync(ARQ.estado)) return { versao: 1 };
  const estado = lerJson(ARQ.estado);
  if (estado) return estado;
  if (reparar) {
    const guardado = `${ARQ.estado}.ilegivel-${Date.now()}`;
    fs.renameSync(ARQ.estado, guardado);
    registrar(
      'aviso',
      `estado.json ilegível: guardado como ${path.basename(guardado)}; a rotina recomeça do zero`,
    );
  }
  return { versao: 1 };
}

let fusoRegistro = 'UTC';

function carimbo(instante = Date.now()) {
  const p = partesNoFuso(instante, fusoRegistro);
  const d2 = n => String(n).padStart(2, '0');
  return `${p.ano}-${d2(p.mes)}-${d2(p.dia)} ${d2(p.hora)}:${d2(p.minuto)}:${d2(p.segundo)}`;
}

function registrar(nivel, texto) {
  const linha = `${carimbo()} ${nivel.toUpperCase().padEnd(5)} ${texto}`;
  out(linha);
  try {
    const tamanho = fs.statSync(ARQ.registro, { throwIfNoEntry: false })?.size;
    if (tamanho > REGISTRO_MAXIMO) {
      fs.renameSync(ARQ.registro, `${ARQ.registro}.1`);
    }
    fs.appendFileSync(ARQ.registro, `${linha}\n`);
  } catch {
    // pasta indisponível: a linha fica só no log do contêiner
  }
}

function baterCoracao(esperaErroAte = null) {
  try {
    gravarJson(ARQ.batimento, {
      em: iso(),
      pid: process.pid,
      esperaErroAte: esperaErroAte ? iso(esperaErroAte) : null,
    });
  } catch {
    // sem pasta; o healthcheck acusa
  }
}

// ------------------------------------------------------------------ trava

function travaViva(arquivo, limiteMs) {
  const trava = lerJson(arquivo);
  if (!trava) {
    // Recém-criada e ainda sem conteúdo, ou lixo: o tempo decide.
    const st = fs.statSync(arquivo, { throwIfNoEntry: false });
    return st != null && Date.now() - st.mtimeMs < 10_000;
  }
  if (!trava.inicio || Date.now() - Date.parse(trava.inicio) > limiteMs) {
    return false;
  }
  if (trava.host !== os.hostname()) return true;
  if (trava.pid === process.pid) return false;
  try {
    process.kill(trava.pid, 0);
  } catch {
    return false;
  }
  try {
    return fs
      .readFileSync(`/proc/${trava.pid}/cmdline`, 'utf8')
      .includes('rotina.mjs');
  } catch {
    return true;
  }
}

let travaAtual = null;

function travar(cfg) {
  const dono = {
    pid: process.pid,
    host: os.hostname(),
    inicio: iso(),
    token: crypto.randomUUID(),
  };
  const limiteMs = (cfg.limiteS + 300) * 1000;
  for (let i = 0; i < 2; i++) {
    try {
      fs.writeFileSync(ARQ.trava, JSON.stringify(dono), { flag: 'wx' });
      travaAtual = dono;
      return dono;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (travaViva(ARQ.trava, limiteMs)) return null;
      fs.rmSync(ARQ.trava, { force: true });
      registrar(
        'aviso',
        'trava antiga removida (o processo que a criou não existe mais)',
      );
    }
  }
  return null;
}

function destravar(dono) {
  if (lerJson(ARQ.trava)?.token === dono.token) {
    fs.rmSync(ARQ.trava, { force: true });
  }
  if (travaAtual?.token === dono.token) travaAtual = null;
}

// ------------------------------------------------------------------ API do app

function carregarApi() {
  const caminho = path.resolve(
    process.env.DF_BANCO_API ||
      path.join(path.dirname(SCRIPT), 'api', 'index.js'),
  );
  if (!fs.existsSync(caminho)) {
    throw new Falha(
      'acao',
      `API do Actual não encontrada em ${caminho} (imagem sem a rotina?)`,
      'sem-api',
    );
  }
  return createRequire(import.meta.url)(caminho);
}

/** O núcleo escreve no console até o conteúdo dos lançamentos: nada sai. */
function silenciarConsole() {
  for (const metodo of [
    'log',
    'info',
    'debug',
    'warn',
    'error',
    'trace',
    'group',
    'groupCollapsed',
    'groupEnd',
    'table',
    'dir',
  ]) {
    console[metodo] = () => undefined;
  }
}

async function entrar(api, cfg, senha, dataDir) {
  try {
    const lib = await api.init({
      dataDir,
      serverURL: cfg.servidor,
      password: senha,
      verbose: false,
    });
    const remotos = (await api.getBudgets()).filter(b => b.state === 'remote');
    if (!remotos.length) {
      throw new Falha(
        'transitoria',
        'o servidor não listou nenhum orçamento',
        'sem-lista',
      );
    }
    return { lib, remotos };
  } catch (e) {
    throw comoFalha(e);
  }
}

/** Baixa só o orçamento configurado, conferindo Sync ID e nome antes e depois. */
async function baixarOrcamento(api, cfg, remotos) {
  const remoto = remotos.find(b => b.groupId === cfg.orcamento);
  if (!remoto) {
    throw new Falha(
      'acao',
      `o servidor não tem orçamento com o Sync ID ${curtoId(cfg.orcamento)} (DF_BANCO_ORCAMENTO); o comando "contas" lista os que existem`,
      'orcamento-ausente',
    );
  }
  if (remoto.name !== cfg.nome) {
    throw new Falha(
      'acao',
      `o Sync ID ${curtoId(cfg.orcamento)} é do orçamento "${limpar(remoto.name, 60)}", não de "${limpar(cfg.nome, 60)}" (DF_BANCO_ORCAMENTO_NOME); nada foi importado`,
      'orcamento-outro',
    );
  }
  try {
    await api.downloadBudget(cfg.orcamento);
  } catch (e) {
    throw comoFalha(e);
  }
  const local = (await api.getBudgets()).find(
    b => b.id && b.groupId === cfg.orcamento,
  );
  if (local?.name !== cfg.nome) {
    throw new Falha(
      'acao',
      'o orçamento baixado não é o configurado; nada foi importado',
      'orcamento-outro',
    );
  }
}

async function retratoConta(api, contaId) {
  const { data } = await api.aqlQuery(
    api
      .q('transactions')
      .filter({ account: contaId })
      .select(CAMPOS_RETRATO)
      .options({ splits: 'all' }),
  );
  return data;
}

/** Quando a Pluggy coletou cada conta. Só leitura: nunca atualiza o item. */
async function lerPluggy(lib) {
  try {
    const r = await lib.send('pluggyai-accounts');
    if (!Array.isArray(r?.accounts)) return null;
    return new Map(r.accounts.map(a => [a.id, a.updatedAt ?? null]));
  } catch {
    return null;
  }
}

async function importarConta(api, lib, id, { contasApp, prefs }) {
  const conta = contasApp.find(a => a.id === id);
  const base = {
    nome: conta ? limpar(conta.name, 60) : `conta ${curtoId(id)}`,
    inicio: iso(),
  };
  const falhar = (tipo, codigo, mensagem, extra = {}) => ({
    ...base,
    ...extra,
    resultado: 'falha',
    tipo,
    codigo,
    mensagem,
    fim: iso(),
  });
  if (!conta || conta.tombstone) {
    return falhar(
      'acao',
      'conta-ausente',
      'a conta não existe neste orçamento: confira DF_BANCO_CONTAS (o comando "contas" lista)',
    );
  }
  if (conta.closed) {
    return falhar('acao', 'conta-fechada', 'a conta está fechada no app');
  }
  if (
    conta.account_sync_source !== 'pluggyai' ||
    !conta.account_id ||
    !conta.bankId
  ) {
    return falhar(
      'acao',
      'sem-vinculo',
      'a conta não está vinculada à Pluggy: vincule pelo app',
    );
  }
  if (String(prefs[`sync-reimport-deleted-${id}`]) !== 'false') {
    return falhar(
      'acao',
      'reimportar-apagados',
      'a opção de reimportar lançamentos apagados está ligada nesta conta: desligue nas opções de sincronização da conta, no app',
    );
  }

  // Traz o que outros aparelhos gravaram; depois importa e confere.
  await api.sync();
  const marco = Date.now();
  const {
    resposta: res,
    excecao,
    conferencia,
    falhaConferencia,
  } = await importarConferindo({
    retratar: () => retratoConta(api, id),
    importar: () => lib.send('accounts-bank-sync', { ids: [id] }),
    atualizaDatas: String(prefs[`sync-update-dates-${id}`]) === 'true',
  });
  if (falhaConferencia) {
    return falhar(
      'seguranca',
      'sem-conferencia',
      `não deu para conferir a conta depois da importação (${limpar(falhaConferencia?.message, 80)})`,
    );
  }
  const contagens = {
    novas: res?.newTransactions?.length ?? 0,
    casadas: res?.matchedTransactions?.length ?? 0,
    aConferir: conferencia.aConferir,
    preservados: conferencia.preservados,
    repetidos: conferencia.repetidosDepois,
  };
  if (!conferencia.ok) {
    return falhar(
      'seguranca',
      'integridade',
      `a importação mudou lançamentos que já existiam (${descreverIntegridade(conferencia)})`,
      contagens,
    );
  }
  if (excecao) {
    // O comando lançou em vez de devolver erro; conferido e íntegro, vale
    // como falha comum (passageira, salvo o que pede ação).
    const f = comoFalha(excecao);
    return falhar(
      f.tipo === 'acao' ? 'acao' : 'transitoria',
      f.codigo,
      `a importação falhou (${f.message})`,
      contagens,
    );
  }
  const erro = (res?.errors ?? []).find(
    e => !e.accountId || e.accountId === id,
  );
  if (erro) {
    const c = classificarErroConta(erro);
    return falhar(c.tipo, c.codigo, c.mensagem, contagens);
  }
  const registrada = (await lib.send('accounts-get')).find(a => a.id === id);
  if (!(Number(registrada?.last_sync) >= marco - 1000)) {
    return falhar(
      'transitoria',
      'sem-registro',
      'o app não registrou a importação desta conta',
      contagens,
    );
  }
  try {
    await api.sync();
  } catch (e) {
    return falhar(
      'transitoria',
      'envio',
      `importado aqui, mas o servidor não confirmou o envio (${limpar(e?.message, 80)}); será refeito`,
      contagens,
    );
  }
  return { ...base, ...contagens, resultado: 'sucesso', fim: iso() };
}

/** O processo à parte de uma importação; responde ao pai pelo canal IPC. */
async function executar() {
  silenciarConsole();
  const cfg = lerConfiguracao();
  const ids = (process.env.DF_BANCO_CONTAS_RODADA ?? '')
    .split(',')
    .filter(Boolean);
  const dataDir = process.env.DF_BANCO_TEMPORARIO;
  const r = { inicio: iso(), contas: {}, pluggy: {} };
  let api = null;
  try {
    if (cfg.erros.length) {
      throw new Falha(
        'acao',
        `configuração incompleta: ${cfg.erros.join('; ')}`,
        'configuracao',
      );
    }
    if (!dataDir || !ids.length) {
      throw new Falha('transitoria', 'chamada sem contas ou pasta', 'chamada');
    }
    const senha = lerSenha();
    api = carregarApi();
    const { lib, remotos } = await entrar(api, cfg, senha, dataDir);
    await baixarOrcamento(api, cfg, remotos);
    const contexto = {
      contasApp: await lib.send('accounts-get'),
      prefs: (await lib.send('preferences/get')) ?? {},
    };
    const pluggy = await lerPluggy(lib);
    for (const conta of contexto.contasApp) {
      if (cfg.contas.includes(conta.id) && conta.account_id && pluggy) {
        r.pluggy[conta.id] = pluggy.get(conta.account_id) ?? null;
      }
    }
    for (const id of ids) {
      try {
        r.contas[id] = await importarConta(api, lib, id, contexto);
      } catch (e) {
        const f = comoFalha(e);
        r.contas[id] = {
          nome: limpar(
            contexto.contasApp.find(a => a.id === id)?.name ?? curtoId(id),
            60,
          ),
          resultado: 'falha',
          tipo: f.tipo === 'acao' ? 'acao' : 'transitoria',
          codigo: f.codigo,
          mensagem: f.message,
          fim: iso(),
        };
      }
      if (r.contas[id].tipo === 'seguranca') break;
    }
  } catch (e) {
    const f = comoFalha(e);
    Object.assign(r, { tipo: f.tipo, codigo: f.codigo, mensagem: f.message });
  }
  r.fim = iso();
  const contas = Object.values(r.contas);
  const insegura = contas.find(c => c.tipo === 'seguranca');
  if (insegura) {
    Object.assign(r, {
      tipo: 'seguranca',
      codigo: 'integridade',
      mensagem: `${insegura.nome}: ${insegura.mensagem}`,
    });
  }
  const certas = contas.filter(c => c.resultado === 'sucesso').length;
  if (insegura) {
    r.resultado = 'bloqueada';
  } else if (!r.tipo && certas === ids.length) {
    r.resultado = 'sucesso';
  } else {
    r.resultado = certas > 0 ? 'parcial' : 'falha';
  }
  if (process.send) {
    await new Promise(resolve =>
      process.send({ tipo: 'resultado', dados: r }, resolve),
    );
  } else {
    out(JSON.stringify(r));
  }
  // Encerrar o núcleo envia ao servidor o que ficou pendente. Com mudança
  // indevida o processo sai sem isso: o núcleo espera ~1 s antes de enviar
  // sozinho, então em geral nada sai daqui — mas não é garantido.
  if (api && !insegura) {
    await Promise.race([api.shutdown().catch(() => undefined), dormir(20_000)]);
  }
  process.exit(0);
}

// ------------------------------------------------------------------ agenda

let filhoAtual = null;
// Docker parando o contêiner: a importação em curso é interrompida e não vira
// tentativa registrada; ao voltar, a agenda decide de novo.
let encerrando = false;

function rodarProcesso(cfg, contas) {
  const temporario = fs.mkdtempSync(path.join(os.tmpdir(), PREFIXO_TEMPORARIO));
  return new Promise(resolve => {
    const inicio = iso();
    let resultado = null;
    let estourou = false;
    let terminado = false;
    const filho = fork(SCRIPT, ['executar'], {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      env: {
        ...process.env,
        DF_BANCO_CONTAS_RODADA: contas.join(','),
        DF_BANCO_TEMPORARIO: temporario,
      },
    });
    filhoAtual = filho;
    const pulso = setInterval(baterCoracao, 30_000);
    const limite = setTimeout(() => {
      estourou = true;
      filho.kill('SIGKILL');
    }, cfg.limiteS * 1000);
    const terminar = falha => {
      if (terminado) return;
      terminado = true;
      filhoAtual = null;
      clearInterval(pulso);
      clearTimeout(limite);
      fs.rmSync(temporario, { recursive: true, force: true });
      resolve(
        resultado ?? {
          inicio,
          fim: iso(),
          contas: {},
          pluggy: {},
          resultado: 'falha',
          tipo: 'transitoria',
          ...falha,
        },
      );
    };
    filho.on('message', m => {
      if (m?.tipo === 'resultado') resultado = m.dados;
    });
    filho.on('error', e =>
      terminar({
        codigo: 'processo',
        mensagem: `não foi possível iniciar a importação (${limpar(e.message, 80)})`,
      }),
    );
    filho.on('exit', (codigo, sinal) =>
      terminar(
        estourou
          ? {
              codigo: 'tempo-esgotado',
              mensagem: `a importação passou de ${cfg.limiteS} s e foi interrompida`,
            }
          : {
              codigo: `saida-${codigo ?? sinal}`,
              mensagem: 'a importação terminou sem resultado',
            },
      ),
    );
  });
}

function aplicarResultado(estado, decisao, r, cfg, origem, impressao) {
  estado.versao = 1;
  estado.configuracao = {
    orcamento: curtoId(cfg.orcamento),
    nome: limpar(cfg.nome, 80),
    contas: cfg.contas.length,
    horario: cfg.horarioTexto,
    fuso: cfg.fuso,
  };
  const registros = (estado.contas ??= {});
  for (const [id, quando] of Object.entries(r.pluggy ?? {})) {
    (registros[id] ??= {}).pluggyAtualizouEm = quando;
  }
  for (const [id, c] of Object.entries(r.contas ?? {})) {
    const reg = (registros[id] ??= {});
    reg.nome = c.nome;
    reg.ultimaTentativa = {
      em: c.fim ?? r.fim,
      origem,
      resultado: c.resultado,
      tipo: c.tipo ?? null,
      codigo: c.codigo ?? null,
      mensagem: c.mensagem ?? null,
      novas: c.novas ?? null,
      casadas: c.casadas ?? null,
      aConferir: c.aConferir ?? null,
    };
    if (c.resultado === 'sucesso') {
      reg.ultimoSucesso = {
        em: c.fim,
        origem,
        novas: c.novas,
        casadas: c.casadas,
        aConferir: c.aConferir,
        preservados: c.preservados,
        repetidos: c.repetidos,
      };
    }
  }
  let andamento;
  if (origem === 'agenda') {
    andamento = registrarTentativa(decisao.andamento, r, {
      agora: Date.now(),
      contas: cfg.contas,
      esperasS: cfg.esperasS,
    }).andamento;
  } else {
    // A manual não gasta tentativa da agenda: só soma as contas que entraram.
    andamento = structuredClone(
      andamentoDaVaga(estado.vaga, decisao.vaga, impressao),
    );
    for (const [id, c] of Object.entries(r.contas ?? {})) {
      if (c.resultado === 'sucesso' && !andamento.contasOk.includes(id)) {
        andamento.contasOk.push(id);
      }
    }
    if (cfg.contas.every(id => andamento.contasOk.includes(id))) {
      Object.assign(andamento, {
        encerrada: true,
        motivo: 'completa',
        proximaTentativa: null,
      });
    }
  }
  estado.vaga = andamento;
  estado.ultimaTentativa = {
    inicio: r.inicio,
    fim: r.fim,
    origem,
    vaga: andamento.vaga,
    resultado: r.resultado,
    tipo: r.tipo ?? null,
    codigo: r.codigo ?? null,
    mensagem: r.mensagem ?? null,
    contas: Object.keys(r.contas ?? {}).length,
  };
  const completa = cfg.contas.every(id => andamento.contasOk.includes(id));
  if (completa && r.resultado === 'sucesso') {
    estado.ultimoSucesso = {
      em: r.fim,
      vaga: andamento.vaga,
      origem,
      contas: cfg.contas.length,
    };
  }
  if (r.tipo === 'seguranca') {
    estado.bloqueio = { desde: r.fim, motivo: r.mensagem };
  }
}

function proximoPasso(estado, cfg) {
  if (estado.bloqueio) {
    return 'rotina BLOQUEADA por segurança: confira os lançamentos citados no app e rode "liberar"';
  }
  // A mesma decisão que a agenda vai tomar, para o registro não prometer
  // outra coisa.
  const decisao = decidir({
    agora: Date.now(),
    horario: cfg.horario,
    fuso: cfg.fuso,
    contas: cfg.contas,
    estado,
    impressao: impressaoDaConfiguracao(cfg),
  });
  return decisao.executar
    ? 'a agenda tenta de novo na próxima verificação'
    : descreverEspera(decisao, estado, cfg);
}

function relatar(r, estado, cfg) {
  for (const [id, c] of Object.entries(r.contas ?? {})) {
    const coleta = ms(r.pluggy?.[id] ?? estado.contas?.[id]?.pluggyAtualizouEm);
    const pluggy = coleta
      ? ` · a Pluggy coletou os dados em ${formatar(coleta, cfg.fuso)}`
      : '';
    if (c.resultado === 'sucesso') {
      const duvida = c.aConferir
        ? `, ${plural(c.aConferir, 'marcado', 'marcados')} ${ETIQUETA_DUVIDA}`
        : '';
      registrar(
        'info',
        `${c.nome}: importada · ${plural(c.novas, 'novo', 'novos')}, ${plural(c.casadas, 'atualizado pelo banco', 'atualizados pelo banco')}, ${c.preservados} preservados${duvida}${pluggy}`,
      );
    } else {
      registrar(
        c.tipo === 'transitoria' ? 'aviso' : 'erro',
        `${c.nome}: não importada — ${c.mensagem} [${c.codigo}]`,
      );
    }
  }
  if (r.tipo && !Object.keys(r.contas ?? {}).length) {
    registrar(
      r.tipo === 'transitoria' ? 'aviso' : 'erro',
      `nada importado — ${r.mensagem} [${r.codigo}]`,
    );
  }
  for (const id of cfg.contas) {
    const reg = estado.contas?.[id];
    const coleta = ms(reg?.pluggyAtualizouEm);
    if (coleta && Date.now() - coleta > PLUGGY_DEFASADA_MS) {
      const horas = Math.round((Date.now() - coleta) / 3600_000);
      registrar(
        'aviso',
        `${reg.nome ?? curtoId(id)}: a Pluggy não coleta esta conta desde ${formatar(coleta, cfg.fuso)} (há ${horas} h); o que entrou é o que ela tinha — confira a conexão no Meu Pluggy`,
      );
    }
    if (r.contas?.[id]?.repetidos) {
      registrar(
        'aviso',
        `${reg?.nome ?? curtoId(id)}: ${plural(r.contas[id].repetidos, 'id do banco aparece', 'ids do banco aparecem')} em mais de um lançamento — confira duplicatas no app`,
      );
    }
  }
  const total = Object.keys(r.contas ?? {}).length;
  const certas = Object.values(r.contas ?? {}).filter(
    c => c.resultado === 'sucesso',
  ).length;
  const contagem = total
    ? `${certas} de ${total} conta(s)`
    : 'nenhuma conta tentada';
  registrar(
    r.resultado === 'sucesso' ? 'info' : 'aviso',
    `resultado: ${r.resultado} (${contagem}); ${proximoPasso(estado, cfg)}`,
  );
}

async function executarComTrava(cfg, origem) {
  const dono = travar(cfg);
  if (!dono) {
    registrar('aviso', 'outra importação em andamento; esta não foi iniciada');
    return null;
  }
  try {
    const estado = lerEstado({ reparar: true });
    const impressao = impressaoDaConfiguracao(cfg);
    let decisao;
    if (origem === 'agenda') {
      if (estado.bloqueio) return null;
      decisao = decidir({
        agora: Date.now(),
        horario: cfg.horario,
        fuso: cfg.fuso,
        contas: cfg.contas,
        estado,
        impressao,
      });
      if (!decisao.executar) return null;
    } else {
      const vaga = vagaAtual(Date.now(), cfg.horario, cfg.fuso);
      decisao = {
        vaga,
        contas: cfg.contas,
        andamento: andamentoDaVaga(estado.vaga, vaga, impressao),
      };
    }
    const tentativa =
      origem === 'agenda'
        ? ` · tentativa ${decisao.andamento.tentativas + 1}`
        : '';
    registrar(
      'info',
      `importação iniciada (${origem} · horário de ${formatar(decisao.vaga, cfg.fuso)}${tentativa} · ${decisao.contas.length} conta(s))`,
    );
    const r = await rodarProcesso(cfg, decisao.contas);
    if (encerrando) return null;
    aplicarResultado(estado, decisao, r, cfg, origem, impressao);
    gravarEstado(estado);
    relatar(r, estado, cfg);
    return r;
  } finally {
    destravar(dono);
  }
}

function gravarEstado(estado) {
  gravarJson(ARQ.estado, estado);
}

function limparTemporarios() {
  for (const nome of fs.readdirSync(os.tmpdir())) {
    if (nome.startsWith(PREFIXO_TEMPORARIO)) {
      fs.rmSync(path.join(os.tmpdir(), nome), { recursive: true, force: true });
    }
  }
}

function descreverEspera(decisao, estado, cfg) {
  if (decisao.motivo === 'aguardando') {
    return `aguardando: nova tentativa às ${formatar(decisao.ate, cfg.fuso)}`;
  }
  const proxima = formatar(
    proximaImportacao(
      Date.now(),
      cfg.horario,
      cfg.fuso,
      ms(estado.ultimoSucesso?.em),
    ),
    cfg.fuso,
  );
  if (decisao.motivo === 'encerrada') {
    return `sem nova tentativa automática até ${proxima} (${decisao.andamento?.motivo ?? 'encerrada'}); depois de corrigir, rode "agora"`;
  }
  return `em dia; próxima importação ${proxima}`;
}

async function agendar() {
  const cfg = lerConfiguracao();
  fusoRegistro = cfg.fuso;
  fs.mkdirSync(PASTA, { recursive: true });
  baterCoracao();
  for (const sinal of ['SIGTERM', 'SIGINT']) {
    process.on(sinal, async () => {
      if (encerrando) return;
      encerrando = true;
      // A trava só sai depois de confirmada a saída do processo da
      // importação; sem confirmação em 5 s ela fica, e a próxima agenda a
      // trata como antiga quando o processo não existir mais.
      const filho = filhoAtual;
      let filhoSaiu = true;
      if (filho && filho.exitCode == null && filho.signalCode == null) {
        const saida = new Promise(resolve =>
          filho.once('exit', () => resolve(true)),
        );
        filho.kill('SIGKILL');
        filhoSaiu = await Promise.race([saida, dormir(5000).then(() => false)]);
      }
      if (travaAtual && filhoSaiu) destravar(travaAtual);
      registrar('info', `rotina parada (${sinal})`);
      process.exit(0);
    });
  }
  if (!travaViva(ARQ.trava, (cfg.limiteS + 300) * 1000)) {
    limparTemporarios();
  }
  registrar(
    'info',
    `rotina no ar · orçamento "${limpar(cfg.nome, 60)}" (Sync ID ${curtoId(cfg.orcamento)}) · ${cfg.contas.length} conta(s) · todo dia às ${cfg.horarioTexto} (${cfg.fuso}) · servidor ${cfg.servidor}`,
  );
  await dormir(cfg.esperaInicialS * 1000);
  let ultimoAviso = '';
  const avisar = (chave, nivel, texto) => {
    if (chave !== ultimoAviso) {
      ultimoAviso = chave;
      registrar(nivel, texto);
    }
  };
  // Depois de um erro fora do previsto (estado que não grava, pasta que
  // sumiu), a agenda não decide nada por 1 h: sem isso, cada verificação
  // poderia importar de novo.
  let esperaErroAte = 0;
  for (;;) {
    baterCoracao(esperaErroAte > Date.now() ? esperaErroAte : null);
    try {
      if (esperaErroAte > Date.now()) {
        avisar(
          `erro:${esperaErroAte}`,
          'aviso',
          `agenda em espera até ${formatar(esperaErroAte, cfg.fuso)} depois de uma falha inesperada`,
        );
      } else if (cfg.erros.length) {
        avisar(
          'configuracao',
          'erro',
          `parada: configuração incompleta — ${cfg.erros.join('; ')}`,
        );
      } else if (fs.existsSync(ARQ.pausar)) {
        avisar(
          'pausa',
          'info',
          'pausada: há um arquivo PAUSAR na pasta da rotina (apague-o para retomar)',
        );
      } else {
        const estado = lerEstado();
        if (estado.bloqueio) {
          avisar(
            `bloqueio:${estado.bloqueio.desde}`,
            'erro',
            `bloqueada por segurança desde ${formatar(ms(estado.bloqueio.desde), cfg.fuso)}: ${estado.bloqueio.motivo} — confira no app e rode "liberar"`,
          );
        } else {
          const decisao = decidir({
            agora: Date.now(),
            horario: cfg.horario,
            fuso: cfg.fuso,
            contas: cfg.contas,
            estado,
            impressao: impressaoDaConfiguracao(cfg),
          });
          if (decisao.executar) {
            ultimoAviso = '';
            await executarComTrava(cfg, 'agenda');
          } else {
            avisar(
              `${decisao.motivo}:${decisao.vaga}:${decisao.ate ?? ''}`,
              'info',
              descreverEspera(decisao, estado, cfg),
            );
          }
        }
      }
    } catch (e) {
      ultimoAviso = '';
      esperaErroAte = Date.now() + 3600_000;
      registrar(
        'erro',
        `falha inesperada na agenda: ${limpar(e?.message, 160)}`,
      );
    }
    await dormir(cfg.verificarS * 1000);
  }
}

// ------------------------------------------------------------------ comandos

function linhaConta(id, reg, cfg) {
  const nome = (reg?.nome ?? `conta ${curtoId(id)}`).padEnd(28);
  const sucesso = reg?.ultimoSucesso;
  const tentativa = reg?.ultimaTentativa;
  let importou = sucesso
    ? `${formatar(ms(sucesso.em), cfg.fuso)} (${plural(sucesso.novas, 'novo', 'novos')})`
    : 'nunca';
  if (tentativa && tentativa.resultado !== 'sucesso') {
    importou += ` · FALHOU ${formatar(ms(tentativa.em), cfg.fuso)}: ${tentativa.mensagem}`;
  }
  const coleta = ms(reg?.pluggyAtualizouEm);
  const pluggy = coleta ? formatar(coleta, cfg.fuso) : '—';
  return `  ${nome} importou: ${importou}\n  ${' '.repeat(28)} Pluggy coletou: ${pluggy}`;
}

function status(comoJson) {
  const cfg = lerConfiguracao();
  fusoRegistro = cfg.fuso;
  const estado = lerEstado();
  const agora = Date.now();
  const sinal = ms(lerJson(ARQ.batimento)?.em);
  const noAr =
    sinal != null &&
    agora - sinal < (Math.max(cfg.verificarS, 60) * 3 + 120) * 1000;
  const pausada = fs.existsSync(ARQ.pausar);
  const decisao = cfg.erros.length
    ? null
    : decidir({
        agora,
        horario: cfg.horario,
        fuso: cfg.fuso,
        contas: cfg.contas,
        estado,
        impressao: impressaoDaConfiguracao(cfg),
      });
  let proxima;
  if (cfg.erros.length) proxima = 'nenhuma (configuração incompleta)';
  else if (estado.bloqueio) proxima = 'nenhuma (bloqueada; rode "liberar")';
  else if (pausada) proxima = 'nenhuma (pausada)';
  else if (decisao.executar) proxima = 'na próxima verificação';
  else proxima = descreverEspera(decisao, estado, cfg);

  if (comoJson) {
    out(
      JSON.stringify(
        {
          configuracao: {
            orcamento: curtoId(cfg.orcamento),
            nome: limpar(cfg.nome, 80),
            contas: cfg.contas.length,
            horario: cfg.horarioTexto,
            fuso: cfg.fuso,
            erros: cfg.erros,
          },
          agenda: { noAr, ultimoSinal: sinal ? iso(sinal) : null, pausada },
          bloqueio: estado.bloqueio ?? null,
          ultimoSucesso: estado.ultimoSucesso ?? null,
          ultimaTentativa: estado.ultimaTentativa ?? null,
          andamento: estado.vaga ?? null,
          proxima,
          contas: Object.fromEntries(
            cfg.contas.map(id => [id, estado.contas?.[id] ?? null]),
          ),
        },
        null,
        2,
      ),
    );
    return;
  }

  const sucesso = estado.ultimoSucesso;
  const tentativa = estado.ultimaTentativa;
  const linhas = [
    'Sincronização bancária diária — Diego Finance',
    `Orçamento: "${limpar(cfg.nome, 60)}" (Sync ID ${curtoId(cfg.orcamento)}) · ${cfg.contas.length} conta(s)`,
    `Horário: todo dia às ${cfg.horarioTexto} (${cfg.fuso}); verifica a cada ${cfg.verificarS} s`,
    `Agenda: ${noAr ? 'no ar' : 'SEM SINAL'}${sinal ? ` (último sinal ${formatar(sinal, cfg.fuso, { segundos: true })})` : ''}${pausada ? ' · PAUSADA (arquivo PAUSAR)' : ''}`,
  ];
  if (cfg.erros.length) {
    linhas.push(`Configuração incompleta: ${cfg.erros.join('; ')}`);
  }
  if (estado.bloqueio) {
    linhas.push(
      `BLOQUEADA por segurança desde ${formatar(ms(estado.bloqueio.desde), cfg.fuso)}: ${estado.bloqueio.motivo}`,
    );
  }
  linhas.push(
    '',
    `Diego Finance importou todas as contas: ${sucesso ? `${formatar(ms(sucesso.em), cfg.fuso)} (${sucesso.origem})` : 'ainda não'}`,
    `Última tentativa: ${tentativa ? `${formatar(ms(tentativa.inicio), cfg.fuso)} · ${tentativa.resultado} (${tentativa.origem})${tentativa.mensagem ? ` — ${tentativa.mensagem}` : ''}` : 'nenhuma'}`,
    `Próxima: ${proxima}`,
    '',
    'Por conta — quando o Diego Finance importou e quando a Pluggy coletou do banco:',
  );
  for (const id of cfg.contas) {
    linhas.push(linhaConta(id, estado.contas?.[id], cfg));
  }
  const avisos = [];
  for (const id of cfg.contas) {
    const reg = estado.contas?.[id];
    const coleta = ms(reg?.pluggyAtualizouEm);
    if (coleta && agora - coleta > PLUGGY_DEFASADA_MS) {
      avisos.push(
        `${reg.nome}: a Pluggy não coleta esta conta há ${Math.round((agora - coleta) / 3600_000)} h — confira a conexão no Meu Pluggy`,
      );
    }
    if (reg?.ultimoSucesso?.aConferir) {
      avisos.push(
        `${reg.nome}: ${reg.ultimoSucesso.aConferir} lançamento(s) novo(s) marcado(s) ${ETIQUETA_DUVIDA} — confira no app`,
      );
    }
    if (reg?.ultimoSucesso?.repetidos) {
      avisos.push(
        `${reg.nome}: ${reg.ultimoSucesso.repetidos} id(s) do banco em mais de um lançamento — confira duplicatas no app`,
      );
    }
  }
  if (avisos.length) {
    linhas.push('', 'Avisos:', ...avisos.map(a => `  - ${a}`));
  }
  out(linhas.join('\n'));
}

async function agora() {
  const cfg = lerConfiguracao();
  fusoRegistro = cfg.fuso;
  if (cfg.erros.length) {
    out(`configuração incompleta: ${cfg.erros.join('; ')}`);
    process.exit(2);
  }
  const estado = lerEstado();
  if (estado.bloqueio) {
    out(
      `rotina bloqueada por segurança: ${estado.bloqueio.motivo} — confira no app e rode "liberar" antes`,
    );
    process.exit(2);
  }
  if (fs.existsSync(ARQ.pausar)) {
    out(
      'a agenda está pausada (arquivo PAUSAR); esta importação manual roda mesmo assim',
    );
  }
  const r = await executarComTrava(cfg, 'manual');
  if (!r) process.exit(3);
  process.exit(r.resultado === 'sucesso' ? 0 : 1);
}

async function contas() {
  silenciarConsole();
  const cfg = lerConfiguracao();
  const senha = lerSenha();
  const api = carregarApi();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), PREFIXO_TEMPORARIO));
  try {
    const { lib, remotos } = await entrar(api, cfg, senha, dataDir);
    const configurado = remotos.find(b => b.groupId === cfg.orcamento);
    if (!configurado) {
      out(
        'Orçamentos no servidor (Sync ID → DF_BANCO_ORCAMENTO; nome → DF_BANCO_ORCAMENTO_NOME):',
      );
      for (const b of remotos) out(`  ${b.groupId}  "${limpar(b.name, 80)}"`);
      if (cfg.orcamento) {
        out(
          `O Sync ID configurado (${curtoId(cfg.orcamento)}) não está na lista.`,
        );
      }
      return;
    }
    await baixarOrcamento(
      api,
      { ...cfg, nome: cfg.nome || configurado.name },
      remotos,
    );
    const contasApp = await lib.send('accounts-get');
    const prefs = (await lib.send('preferences/get')) ?? {};
    const vinculadas = contasApp.filter(
      a => a.account_sync_source && !a.tombstone,
    );
    out(
      `Orçamento "${limpar(configurado.name, 60)}" (Sync ID ${configurado.groupId}): contas vinculadas a um banco`,
    );
    for (const a of vinculadas) {
      const reimporta =
        String(prefs[`sync-reimport-deleted-${a.id}`]) !== 'false';
      out(
        `  ${a.id}  "${limpar(a.name, 40)}"  ${a.account_sync_source}${a.closed ? ' (fechada)' : ''} · reimportar apagados: ${reimporta ? 'LIGADO' : 'desligado'} · na configuração: ${cfg.contas.includes(a.id) ? 'sim' : 'não'} · última importação: ${a.last_sync ? formatar(Number(a.last_sync), cfg.fuso) : 'nunca'}`,
      );
    }
    const fora = cfg.contas.filter(id => !vinculadas.some(a => a.id === id));
    if (fora.length) {
      out(
        `Configuradas mas não vinculadas neste orçamento: ${fora.map(curtoId).join(', ')}`,
      );
    }
    const automaticos = (await api.getSchedules()).filter(
      s => s.posts_transaction && !s.completed,
    ).length;
    out(
      `Agendamentos que lançam sozinhos: ${automaticos} (abrir o orçamento os lança quando vencem, como no app)`,
    );
    out(
      `DF_BANCO_CONTAS=${vinculadas
        .filter(a => a.account_sync_source === 'pluggyai' && !a.closed)
        .map(a => a.id)
        .join(',')}`,
    );
  } finally {
    await Promise.race([api.shutdown().catch(() => undefined), dormir(20_000)]);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

function liberar() {
  const cfg = lerConfiguracao();
  fusoRegistro = cfg.fuso;
  const dono = travar(cfg);
  if (!dono) {
    out('há uma importação em andamento; tente de novo em instantes');
    process.exit(3);
  }
  try {
    const estado = lerEstado({ reparar: true });
    if (!estado.bloqueio) {
      out('não havia bloqueio');
      return;
    }
    registrar(
      'info',
      `bloqueio de segurança retirado à mão (era: ${estado.bloqueio.motivo})`,
    );
    estado.bloqueioAnterior = { ...estado.bloqueio, retiradoEm: iso() };
    delete estado.bloqueio;
    gravarEstado(estado);
  } finally {
    destravar(dono);
  }
}

async function verificar() {
  silenciarConsole();
  let grave = false;
  const item = (certo, texto, essencial = true) => {
    out(`${certo ? '[ok]' : essencial ? '[ERRO]' : '[--]'} ${texto}`);
    if (!certo && essencial) grave = true;
  };
  item(
    Number(process.versions.node.split('.')[0]) >= 20,
    `Node ${process.version}`,
  );
  const cfg = lerConfiguracao();
  item(
    true,
    `fuso ${cfg.fuso}: agora ${formatar(Date.now(), cfg.fuso, { ano: true })}`,
  );
  let api = null;
  try {
    api = carregarApi();
    item(true, 'API do Actual carregada');
  } catch (e) {
    item(false, `API do Actual: ${limpar(e.message, 160)}`);
  }
  if (api) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), PREFIXO_TEMPORARIO));
    try {
      await api.init({ dataDir: dir, verbose: false });
      item(true, 'núcleo do app inicia sem servidor (SQLite)');
    } catch (e) {
      item(false, `núcleo do app: ${limpar(e.message, 160)}`);
    } finally {
      await api.shutdown().catch(() => undefined);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  let gravavel = false;
  try {
    fs.accessSync(PASTA, fs.constants.W_OK);
    gravavel = true;
  } catch {
    // pasta não montada ou só leitura
  }
  item(
    gravavel,
    `pasta da rotina ${PASTA}${gravavel ? '' : ': ausente ou só leitura (normal ao verificar só a imagem)'}`,
    false,
  );
  item(
    !cfg.erros.length,
    cfg.erros.length
      ? `configuração: ${cfg.erros.join('; ')}`
      : `configuração: orçamento ${curtoId(cfg.orcamento)}, ${cfg.contas.length} conta(s), ${cfg.horarioTexto}`,
    false,
  );
  item(fs.existsSync(ARQ.senha), `${path.basename(ARQ.senha)} presente`, false);
  process.exit(grave ? 1 : 0);
}

function saude() {
  const cfg = lerConfiguracao();
  const batimento = lerJson(ARQ.batimento);
  const sinal = ms(batimento?.em);
  const limite = (Math.max(cfg.verificarS, 60) * 3 + 120) * 1000;
  const problemas = [];
  if (sinal == null || Date.now() - sinal > limite) {
    problemas.push('agenda sem sinal');
  }
  if (ms(batimento?.esperaErroAte) > Date.now()) {
    problemas.push('agenda em espera depois de uma falha inesperada');
  }
  if (cfg.erros.length) problemas.push('configuração incompleta');
  const estado = lerJson(ARQ.estado) ?? {};
  if (estado.bloqueio) problemas.push('bloqueada por segurança');
  // O dia em curso sem sucesso e sem nova tentativa marcada, ou com conta
  // pedindo ação: o Docker mostra "unhealthy" até o Diego olhar.
  const andamento = estado.vaga;
  if (andamento && !emDia(ms(estado.ultimoSucesso?.em), ms(andamento.vaga))) {
    if (andamento.encerrada && andamento.motivo !== 'completa') {
      problemas.push(`importação sem sucesso (${andamento.motivo})`);
    } else if (Object.keys(andamento.contasAcao ?? {}).length) {
      problemas.push('conta pedindo ação');
    }
  }
  out(problemas.length ? `com problema: ${problemas.join('; ')}` : 'ok');
  process.exit(problemas.length ? 1 : 0);
}

// ------------------------------------------------------------------ início

const [comando = 'agendar', ...opcoes] = process.argv.slice(2);
const COMANDOS = {
  agendar,
  status: () => status(opcoes.includes('--json')),
  agora,
  contas,
  liberar,
  verificar,
  saude,
  executar,
};
if (!COMANDOS[comando]) {
  out(`comando desconhecido: ${limpar(comando, 40)}`);
  out(
    'comandos: agendar (padrão), status [--json], agora, contas, liberar, verificar, saude',
  );
  process.exit(2);
}
Promise.resolve(COMANDOS[comando]()).catch(e => {
  out(`erro: ${comoFalha(e).message}`);
  process.exit(1);
});
