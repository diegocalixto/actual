// Diego Finance V2 — política da sincronização bancária diária, sem efeitos
// colaterais: quando importar, como tratar uma falha, o que conta como
// lançamento preservado e como limpar um texto antes de registrá-lo. Quem
// executa (servidor, API, arquivos) é rotina.mjs; os testes estão em
// politica.test.mjs (`node --test deploy/sincronizacao-bancaria/politica.test.mjs`).

/**
 * Uma importação feita até 4 h antes do horário já vale pelo dia. Com o
 * horário padrão (07:00) a janela começa às 03:00, depois da coleta noturna
 * do Meu Pluggy (Itaú ~00:03, Nubank ~02:04 em out/2026): ligar o notebook às
 * 05:00 importa uma vez só, e não de novo às 07:00.
 */
export const COBERTURA_MS = 4 * 3600_000;

/** Espera depois de cada falha passageira; esgotadas, só no próximo dia. */
export const ESPERAS_FALHA_PADRAO_S = [900, 3600, 14400];

/** Etiqueta que o núcleo do fork põe no lançamento novo que pode repetir outro. */
export const ETIQUETA_DUVIDA = '#conferir-duplicata';

// ------------------------------------------------------------------ horário

/** "HH:MM" → { hora, minuto }; null quando inválido. */
export function lerHorario(texto) {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(texto ?? '').trim());
  return m ? { hora: Number(m[1]), minuto: Number(m[2]) } : null;
}

/** Data e hora que o relógio de `fuso` marca no instante dado (ms). */
export function partesNoFuso(instante, fuso) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instante));
  const p = Object.fromEntries(partes.map(x => [x.type, Number(x.value)]));
  return {
    ano: p.year,
    mes: p.month,
    dia: p.day,
    hora: p.hour,
    minuto: p.minute,
    segundo: p.second,
  };
}

function deslocamentoMs(instante, fuso) {
  const p = partesNoFuso(instante, fuso);
  const comoUtc = Date.UTC(
    p.ano,
    p.mes - 1,
    p.dia,
    p.hora,
    p.minuto,
    p.segundo,
  );
  return comoUtc - Math.floor(instante / 1000) * 1000;
}

/** Instante (ms) em que o relógio de `fuso` marca a data e a hora dadas. */
export function instanteLocal(ano, mes, dia, hora, minuto, fuso) {
  const ingenuo = Date.UTC(ano, mes - 1, dia, hora, minuto);
  const primeiro = ingenuo - deslocamentoMs(ingenuo, fuso);
  return ingenuo - deslocamentoMs(primeiro, fuso);
}

function horarioDoDia(agora, horario, fuso, dias) {
  const p = partesNoFuso(agora, fuso);
  const d = new Date(Date.UTC(p.ano, p.mes - 1, p.dia + dias));
  return instanteLocal(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    horario.hora,
    horario.minuto,
    fuso,
  );
}

/** O horário mais recente que já passou (o de hoje ou o de ontem). */
export function vagaAtual(agora, horario, fuso) {
  const hoje = horarioDoDia(agora, horario, fuso, 0);
  return hoje <= agora ? hoje : horarioDoDia(agora, horario, fuso, -1);
}

/** O próximo horário ainda por vir. */
export function proximaVaga(agora, horario, fuso) {
  const hoje = horarioDoDia(agora, horario, fuso, 0);
  return hoje > agora ? hoje : horarioDoDia(agora, horario, fuso, 1);
}

/** Se a última importação completa já vale pelo horário `vaga`. */
export function emDia(ultimoSucesso, vaga) {
  return ultimoSucesso != null && ultimoSucesso >= vaga - COBERTURA_MS;
}

/** Quando a rotina vai importar sozinha da próxima vez, estando em dia. */
export function proximaImportacao(agora, horario, fuso, ultimoSucesso) {
  let vaga = proximaVaga(agora, horario, fuso);
  while (emDia(ultimoSucesso, vaga)) {
    vaga = proximaVaga(vaga + 60_000, horario, fuso);
  }
  return vaga;
}

const ms = texto => (texto ? Date.parse(texto) : null);
const iso = instante => new Date(instante).toISOString();

// ------------------------------------------------------------------ decisão

/**
 * O andamento do dia guarda quantas tentativas houve, que contas já entraram,
 * quais pedem ação e quando tentar de novo. Muda de dia, ou muda a
 * configuração (inclusive o arquivo da senha), e ele recomeça do zero: assim
 * corrigir o que pedia ação vale já na verificação seguinte.
 */
export function andamentoDaVaga(atual, vaga, impressao) {
  if (atual && ms(atual.vaga) === vaga && atual.impressao === impressao) {
    return atual;
  }
  return {
    vaga: iso(vaga),
    impressao,
    tentativas: 0,
    contasOk: [],
    contasAcao: {},
    proximaTentativa: null,
    encerrada: false,
    motivo: null,
  };
}

const pendentesDe = (andamento, contas) =>
  contas.filter(
    id => !andamento.contasOk.includes(id) && !(id in andamento.contasAcao),
  );

/**
 * O que fazer agora. Sem horário perdido não há o que importar; perdido um ou
 * vários (notebook desligado), importa uma vez só, para o mais recente.
 */
export function decidir({ agora, horario, fuso, contas, estado, impressao }) {
  const vaga = vagaAtual(agora, horario, fuso);
  if (emDia(ms(estado.ultimoSucesso?.em), vaga)) {
    return { executar: false, motivo: 'em-dia', vaga, contas: [] };
  }
  const andamento = andamentoDaVaga(estado.vaga, vaga, impressao);
  const pendentes = pendentesDe(andamento, contas);
  if (andamento.encerrada || !pendentes.length) {
    return {
      executar: false,
      motivo: 'encerrada',
      vaga,
      contas: [],
      andamento,
    };
  }
  const espera = ms(andamento.proximaTentativa);
  if (espera != null && agora < espera) {
    return {
      executar: false,
      motivo: 'aguardando',
      vaga,
      contas: [],
      andamento,
      ate: espera,
    };
  }
  return {
    executar: true,
    motivo: andamento.tentativas ? 'nova-tentativa' : 'horario',
    vaga,
    contas: pendentes,
    andamento,
  };
}

/**
 * Junta uma tentativa da agenda ao andamento do dia. `resultado.contas` traz,
 * por conta tentada, `{ resultado: 'sucesso' | 'falha', tipo, mensagem }`;
 * `resultado.tipo` é a falha geral (senha, orçamento, servidor) quando nenhuma
 * conta chegou a ser tentada. Só a falha passageira volta a ser tentada, e só
 * nas contas que faltam.
 */
export function registrarTentativa(
  andamento,
  resultado,
  { agora, contas, esperasS },
) {
  const a = {
    ...andamento,
    tentativas: andamento.tentativas + 1,
    contasOk: [...andamento.contasOk],
    contasAcao: { ...andamento.contasAcao },
  };
  for (const [id, r] of Object.entries(resultado.contas ?? {})) {
    if (r.resultado === 'sucesso') {
      if (!a.contasOk.includes(id)) a.contasOk.push(id);
      delete a.contasAcao[id];
    } else if (r.tipo === 'acao') {
      a.contasAcao[id] = r.mensagem ?? 'precisa de ação';
    }
  }
  const pendentes = pendentesDe(a, contas);
  const completa = contas.every(id => a.contasOk.includes(id));
  let motivo = null;
  if (resultado.tipo === 'acao' || resultado.tipo === 'seguranca') {
    motivo = resultado.tipo;
  } else if (completa) {
    motivo = 'completa';
  } else if (!pendentes.length) {
    motivo = 'acao';
  } else if (a.tentativas > esperasS.length) {
    motivo = 'tentativas-esgotadas';
  }
  a.encerrada = motivo != null;
  a.motivo = motivo;
  a.proximaTentativa = a.encerrada
    ? null
    : iso(agora + esperasS[a.tentativas - 1] * 1000);
  return { andamento: a, completa };
}

// ------------------------------------------------------------------ falhas

const CATEGORIAS_ACAO = new Map([
  [
    'ITEM_ERROR',
    'a Pluggy pede nova autorização do banco: reconecte a conta no Meu Pluggy',
  ],
  [
    'INVALID_ACCESS_TOKEN',
    'a Pluggy pede nova autorização do banco: reconecte a conta no Meu Pluggy',
  ],
  [
    'INVALID_INPUT',
    'a Pluggy recusou o acesso à conta: reconecte o banco no Meu Pluggy',
  ],
  [
    'ACCOUNT_NEEDS_ATTENTION',
    'o banco pede atenção na conta (consentimento ou termos): abra o Meu Pluggy',
  ],
  [
    'ACCOUNT_MISSING',
    'a Pluggy não encontrou a conta (reconectar o banco muda os ids): vincule a conta de novo no app',
  ],
]);

const CATEGORIAS_PASSAGEIRAS = new Map([
  ['RATE_LIMIT_EXCEEDED', 'limite de requisições da Pluggy'],
  ['TIMED_OUT', 'a Pluggy demorou a responder'],
  ['Connection', 'a Pluggy respondeu com erro'],
]);

const MOTIVOS_ACAO = [
  [
    /not-configured/,
    'a Pluggy não está configurada no servidor (credenciais em Configurações)',
  ],
  [
    /file-access-denied|invalid-file-id/,
    'o servidor negou acesso a este orçamento',
  ],
  [/not linked properly/i, 'a conta perdeu o vínculo: vincule de novo no app'],
];

/**
 * Um item de `errors` do comando `accounts-bank-sync` → o que fazer. O que
 * se resolve sozinho (rede, limite, demora) é "transitoria" e volta a ser
 * tentado; o que precisa do Diego é "acao" e espera o próximo dia ou o
 * comando `agora`.
 */
export function classificarErroConta(erro) {
  if (erro?.type === 'SyncError') {
    const codigo = limpar(`${erro.category}/${erro.code}`, 80);
    const acao = CATEGORIAS_ACAO.get(erro.category);
    if (acao) {
      return { tipo: 'acao', codigo, mensagem: acao };
    }
    const passageira = CATEGORIAS_PASSAGEIRAS.get(erro.category);
    return {
      tipo: 'transitoria',
      codigo,
      mensagem: passageira ?? 'falha ao ler a Pluggy',
    };
  }
  if (erro?.internal) {
    const linha = String(erro.internal).split('\n')[0];
    return {
      tipo: 'transitoria',
      codigo: 'interno',
      mensagem: `erro interno do núcleo do app (${limpar(linha, 120)})`,
    };
  }
  const texto = String(erro?.message ?? '');
  for (const [padrao, mensagem] of MOTIVOS_ACAO) {
    if (padrao.test(texto)) {
      return { tipo: 'acao', codigo: limpar(texto, 60), mensagem };
    }
  }
  return {
    tipo: 'transitoria',
    codigo: limpar(texto, 60) || 'desconhecido',
    mensagem: /network/.test(texto)
      ? 'sem conexão com o servidor do Diego Finance'
      : 'falha ao importar',
  };
}

const CODIGOS_GERAIS = new Map([
  [
    'invalid-password',
    [
      'acao',
      'o servidor recusou a senha do arquivo senha-do-servidor.txt da pasta da rotina',
    ],
  ],
  [
    'budget-not-found',
    [
      'acao',
      'o orçamento configurado (DF_BANCO_ORCAMENTO) não existe no servidor',
    ],
  ],
  [
    'missing-key',
    ['acao', 'o orçamento é criptografado; a rotina não usa a chave dele'],
  ],
  ['decrypt-failure', ['acao', 'o orçamento é criptografado e não abriu']],
  [
    'network-failure',
    ['transitoria', 'servidor do Diego Finance indisponível'],
  ],
  ['token-expired', ['transitoria', 'a sessão no servidor expirou']],
]);

/** Falha antes das contas (entrar, achar e baixar o orçamento). */
export function classificarErroGeral(erro) {
  const texto = String(erro?.message ?? erro ?? '');
  const codigo = erro?.code ?? /failed: ([\w-]+)/.exec(texto)?.[1] ?? null;
  const conhecido = codigo ? CODIGOS_GERAIS.get(codigo) : null;
  if (conhecido) {
    return { tipo: conhecido[0], codigo, mensagem: conhecido[1] };
  }
  return {
    tipo: 'transitoria',
    codigo: limpar(codigo ?? 'desconhecido', 60),
    mensagem: `falha ao abrir o orçamento (${limpar(texto, 120)})`,
  };
}

// ------------------------------------------------------------------ preservação

/**
 * Compara os lançamentos de uma conta antes e depois da importação. O núcleo
 * só pode: criar lançamentos; preencher categoria, nota ou favorecido que
 * estavam vazios; marcar como compensado; e trocar o id do banco quando um
 * pendente compensa com outro id. Qualquer outra mudança em lançamento que já
 * existia — apagar, mudar valor, data, categoria, nota, favorecido ou id do
 * banco, deixar de estar compensado, virar ou deixar de ser transferência — é
 * problema; um id do banco que passa a aparecer mais vezes também.
 */
export function conferirIntegridade(antes, depois, { atualizaDatas = false }) {
  const porId = new Map(depois.map(t => [t.id, t]));
  const problemas = {
    apagado: [],
    valor: [],
    data: [],
    categoria: [],
    nota: [],
    favorecido: [],
    transferencia: [],
    compensacao: [],
    idBanco: [],
  };
  for (const a of antes) {
    const d = porId.get(a.id);
    if (!d) {
      problemas.apagado.push(a.id);
      continue;
    }
    if (a.amount !== d.amount) problemas.valor.push(a.id);
    if (!atualizaDatas && a.date !== d.date) problemas.data.push(a.id);
    if (a.category && a.category !== d.category) problemas.categoria.push(a.id);
    if (a.notes && a.notes !== d.notes) problemas.nota.push(a.id);
    if (a.payee && a.payee !== d.payee) problemas.favorecido.push(a.id);
    if ((a.transfer_id ?? null) !== (d.transfer_id ?? null)) {
      problemas.transferencia.push(a.id);
    }
    if (a.cleared && !d.cleared) problemas.compensacao.push(a.id);
    const compensou = !a.cleared && d.cleared;
    if (a.imported_id && a.imported_id !== d.imported_id && !compensou) {
      problemas.idBanco.push(a.id);
    }
  }
  const existentes = new Set(antes.map(t => t.id));
  const novos = depois.filter(t => !existentes.has(t.id));
  const vezesAntes = vezesPorIdBanco(antes);
  const vezesDepois = vezesPorIdBanco(depois);
  const repetidosNovos = [...vezesDepois].filter(
    ([idBanco, n]) => n > 1 && n > (vezesAntes.get(idBanco) ?? 0),
  ).length;
  const alterados = Object.values(problemas).reduce((n, l) => n + l.length, 0);
  return {
    ok: alterados === 0 && repetidosNovos === 0,
    problemas,
    preservados: antes.length - problemas.apagado.length,
    novos: novos.length,
    aConferir: novos.filter(t =>
      String(t.notes ?? '').includes(ETIQUETA_DUVIDA),
    ).length,
    repetidosNovos,
    repetidosDepois: [...vezesDepois.values()].filter(n => n > 1).length,
  };
}

/**
 * Importa uma conta e confere o resultado sempre — também quando o comando
 * acusa erro ou lança, porque ele pode ter gravado parte. `retratar` e
 * `importar` vêm de fora: a API do app em rotina.mjs, dados de mentira nos
 * testes. Falha do retrato de antes sobe (nada foi tentado); a de depois volta
 * em `falhaConferencia`.
 */
export async function importarConferindo({
  retratar,
  importar,
  atualizaDatas = false,
}) {
  const antes = await retratar();
  let resposta = null;
  let excecao = null;
  try {
    resposta = await importar();
  } catch (e) {
    excecao = e;
  }
  let conferencia = null;
  let falhaConferencia = null;
  try {
    conferencia = conferirIntegridade(antes, await retratar(), {
      atualizaDatas,
    });
  } catch (e) {
    falhaConferencia = e;
  }
  return { resposta, excecao, conferencia, falhaConferencia };
}

function vezesPorIdBanco(lancamentos) {
  const vezes = new Map();
  for (const t of lancamentos) {
    if (t.imported_id) {
      vezes.set(t.imported_id, (vezes.get(t.imported_id) ?? 0) + 1);
    }
  }
  return vezes;
}

const NOMES_PROBLEMA = {
  apagado: 'apagados',
  valor: 'valor mudou',
  data: 'data mudou',
  categoria: 'categoria mudou',
  nota: 'nota mudou',
  favorecido: 'favorecido mudou',
  transferencia: 'transferência mudou',
  compensacao: 'deixou de estar compensado',
  idBanco: 'id do banco mudou',
};

/** Resumo legível do que a conferência achou (contagens e ids curtos). */
export function descreverIntegridade(conferencia) {
  const partes = Object.entries(conferencia.problemas)
    .filter(([, ids]) => ids.length)
    .map(
      ([chave, ids]) =>
        `${NOMES_PROBLEMA[chave]}: ${ids.length} (${ids
          .slice(0, 3)
          .map(id => id.slice(0, 8))
          .join(', ')})`,
    );
  if (conferencia.repetidosNovos) {
    partes.push(
      `ids do banco que passaram a se repetir: ${conferencia.repetidosNovos}`,
    );
  }
  return partes.join('; ');
}

// ------------------------------------------------------------------ texto

/**
 * Limpa um texto vindo de fora (erro do servidor, do núcleo ou da Pluggy)
 * antes de registrá-lo: ids longos ficam com 8 caracteres, CPF, e-mail,
 * números de 4+ dígitos e sequências que parecem chave somem, e o tamanho é
 * limitado. Nomes de conta passam por aqui também.
 */
export function limpar(texto, max = 200) {
  // Os ids vêm separados do resto antes das outras regras, para que um id só
  // de dígitos não vire "<nº>" nem um pedaço dele vire "<oculto>".
  const UUID = /([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})/i;
  const s = String(texto ?? '')
    .split(UUID)
    .map((parte, i) =>
      i % 2
        ? `${parte.slice(0, 8)}…`
        : parte
            .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '<e-mail>')
            .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '<CPF>')
            .replace(/[A-Za-z0-9+/=_-]{32,}/g, '<oculto>')
            .replace(/\d{4,}/g, '<nº>'),
    )
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** "27/10 07:00" no fuso dado (com o ano quando `ano`). */
export function formatar(
  instante,
  fuso,
  { ano = false, segundos = false } = {},
) {
  if (instante == null || Number.isNaN(instante)) return '—';
  const p = partesNoFuso(instante, fuso);
  const d2 = n => String(n).padStart(2, '0');
  const data = `${d2(p.dia)}/${d2(p.mes)}${ano ? `/${p.ano}` : ''}`;
  const hora = `${d2(p.hora)}:${d2(p.minuto)}${segundos ? `:${d2(p.segundo)}` : ''}`;
  return `${data} ${hora}`;
}
