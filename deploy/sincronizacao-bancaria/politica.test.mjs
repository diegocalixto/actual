// node --test deploy/sincronizacao-bancaria/politica.test.mjs
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  andamentoDaVaga,
  classificarErroConta,
  classificarErroGeral,
  conferirIntegridade,
  decidir,
  descreverIntegridade,
  emDia,
  formatar,
  importarConferindo,
  instanteLocal,
  lerHorario,
  limpar,
  proximaImportacao,
  proximaVaga,
  registrarTentativa,
  vagaAtual,
} from './politica.mjs';

const FUSO = 'America/Sao_Paulo';
const SETE = { hora: 7, minuto: 0 };
// Hora de Brasília (UTC−3, sem horário de verão) → instante.
const brt = (dia, hora, minuto = 0) =>
  instanteLocal(2026, 10, dia, hora, minuto, FUSO);
const CONTAS = ['a', 'b', 'c'];
const ESPERAS = [900, 3600, 14400];

function decidirEm(agora, estado, impressao = 'i1') {
  return decidir({
    agora,
    horario: SETE,
    fuso: FUSO,
    contas: CONTAS,
    estado,
    impressao,
  });
}

function sucessoEm(instante) {
  return { ultimoSucesso: { em: new Date(instante).toISOString() } };
}

describe('horário', () => {
  it('lê HH:MM e recusa o resto', () => {
    assert.deepEqual(lerHorario('07:00'), { hora: 7, minuto: 0 });
    assert.deepEqual(lerHorario(' 7:05 '), { hora: 7, minuto: 5 });
    assert.equal(lerHorario('24:00'), null);
    assert.equal(lerHorario('7h'), null);
    assert.equal(lerHorario(undefined), null);
  });

  it('converte a hora de Brasília para o instante certo', () => {
    assert.equal(
      new Date(brt(27, 7)).toISOString(),
      '2026-10-27T10:00:00.000Z',
    );
  });

  it('respeita fuso com horário de verão', () => {
    const ny = instanteLocal(2026, 3, 9, 7, 0, 'America/New_York');
    assert.equal(new Date(ny).toISOString(), '2026-03-09T11:00:00.000Z');
  });

  it('acha o horário mais recente e o próximo', () => {
    assert.equal(vagaAtual(brt(27, 6, 59), SETE, FUSO), brt(26, 7));
    assert.equal(vagaAtual(brt(27, 7), SETE, FUSO), brt(27, 7));
    assert.equal(proximaVaga(brt(27, 7), SETE, FUSO), brt(28, 7));
    assert.equal(proximaVaga(brt(27, 6), SETE, FUSO), brt(27, 7));
  });

  it('formata no fuso', () => {
    assert.equal(formatar(brt(27, 7, 5), FUSO), '27/10 07:05');
    assert.equal(formatar(null, FUSO), '—');
  });
});

describe('quando importar', () => {
  it('na primeira vez importa já', () => {
    const d = decidirEm(brt(27, 15), {});
    assert.equal(d.executar, true);
    assert.deepEqual(d.contas, CONTAS);
  });

  it('em dia, espera o próximo horário', () => {
    const estado = sucessoEm(brt(27, 7, 1));
    assert.equal(decidirEm(brt(27, 20), estado).executar, false);
    assert.equal(decidirEm(brt(28, 6, 59), estado).executar, false);
    assert.equal(decidirEm(brt(28, 7), estado).executar, true);
  });

  it('com o notebook desligado no horário, importa uma vez ao voltar', () => {
    // Último sucesso três dias antes; volta às 19:00 de 27/10.
    const estado = sucessoEm(brt(24, 7));
    const d = decidirEm(brt(27, 19), estado);
    assert.equal(d.executar, true);
    assert.equal(d.vaga, brt(27, 7));
    // Importou às 19:00: nada mais até o horário de 28/10.
    const depois = sucessoEm(brt(27, 19, 2));
    assert.equal(decidirEm(brt(27, 23), depois).executar, false);
    assert.equal(decidirEm(brt(28, 6), depois).executar, false);
    assert.equal(decidirEm(brt(28, 7), depois).executar, true);
  });

  it('ligado às 05:00 depois de perder ontem, não repete às 07:00', () => {
    const estado = sucessoEm(brt(25, 7));
    assert.equal(decidirEm(brt(27, 5), estado).executar, true);
    const depois = sucessoEm(brt(27, 5, 3));
    assert.equal(decidirEm(brt(27, 7), depois).executar, false);
    assert.equal(
      proximaImportacao(brt(27, 7), SETE, FUSO, brt(27, 5, 3)),
      brt(28, 7),
    );
  });

  it('importação de madrugada (antes da coleta da Pluggy) não vale pelo dia', () => {
    const depois = sucessoEm(brt(27, 2));
    assert.equal(emDia(brt(27, 2), brt(27, 7)), false);
    assert.equal(decidirEm(brt(27, 7), depois).executar, true);
  });
});

describe('falhas', () => {
  const agora = brt(27, 7);
  const base = andamentoDaVaga(null, agora, 'i1');

  it('falha passageira espera 15 min, 1 h, 4 h e desiste até o dia seguinte', () => {
    let a = base;
    const esperas = [];
    for (let i = 0; i < 4; i++) {
      const r = registrarTentativa(
        a,
        { tipo: 'transitoria', contas: {} },
        { agora, contas: CONTAS, esperasS: ESPERAS },
      );
      a = r.andamento;
      esperas.push(a.proximaTentativa);
    }
    assert.deepEqual(esperas.slice(0, 3), [
      new Date(agora + 900_000).toISOString(),
      new Date(agora + 3_600_000).toISOString(),
      new Date(agora + 14_400_000).toISOString(),
    ]);
    assert.equal(a.encerrada, true);
    assert.equal(a.motivo, 'tentativas-esgotadas');
    const estado = { ultimoSucesso: { em: null }, vaga: a };
    assert.equal(decidirEm(brt(27, 23), estado).executar, false);
    assert.equal(decidirEm(brt(28, 7), estado).executar, true);
  });

  it('antes da hora da nova tentativa não importa', () => {
    const { andamento } = registrarTentativa(
      base,
      { tipo: 'transitoria', contas: {} },
      { agora, contas: CONTAS, esperasS: ESPERAS },
    );
    const estado = { vaga: andamento };
    assert.equal(decidirEm(agora + 600_000, estado).motivo, 'aguardando');
    assert.equal(decidirEm(agora + 900_000, estado).executar, true);
  });

  it('falha que pede ação não é repetida no mesmo dia', () => {
    const { andamento } = registrarTentativa(
      base,
      { tipo: 'acao', contas: {} },
      { agora, contas: CONTAS, esperasS: ESPERAS },
    );
    assert.equal(andamento.encerrada, true);
    assert.equal(decidirEm(brt(27, 12), { vaga: andamento }).executar, false);
  });

  it('corrigida a configuração, tenta de novo no mesmo dia', () => {
    const { andamento } = registrarTentativa(
      base,
      { tipo: 'acao', contas: {} },
      { agora, contas: CONTAS, esperasS: ESPERAS },
    );
    const d = decidirEm(brt(27, 12), { vaga: andamento }, 'i2');
    assert.equal(d.executar, true);
    assert.deepEqual(d.contas, CONTAS);
  });

  it('parcial: repete só a conta que faltou; conta com ação fica fora', () => {
    const { andamento, completa } = registrarTentativa(
      base,
      {
        contas: {
          a: { resultado: 'sucesso' },
          b: { resultado: 'falha', tipo: 'transitoria' },
          c: { resultado: 'falha', tipo: 'acao', mensagem: 'reconecte' },
        },
      },
      { agora, contas: CONTAS, esperasS: ESPERAS },
    );
    assert.equal(completa, false);
    assert.equal(andamento.encerrada, false);
    const d = decidirEm(agora + 900_000, { vaga: andamento });
    assert.deepEqual(d.contas, ['b']);
    const fim = registrarTentativa(
      andamento,
      { contas: { b: { resultado: 'sucesso' } } },
      { agora: agora + 900_000, contas: CONTAS, esperasS: ESPERAS },
    );
    assert.equal(fim.completa, false);
    assert.equal(fim.andamento.encerrada, true);
    assert.equal(fim.andamento.motivo, 'acao');
  });

  it('todas as contas certas encerram o dia como completo', () => {
    const r = registrarTentativa(
      base,
      {
        contas: Object.fromEntries(
          CONTAS.map(id => [id, { resultado: 'sucesso' }]),
        ),
      },
      { agora, contas: CONTAS, esperasS: ESPERAS },
    );
    assert.equal(r.completa, true);
    assert.equal(r.andamento.motivo, 'completa');
  });
});

describe('classificação dos erros', () => {
  it('Pluggy pedindo nova autorização é ação', () => {
    const r = classificarErroConta({
      type: 'SyncError',
      category: 'ITEM_ERROR',
      code: 'ITEM_LOGIN_REQUIRED',
    });
    assert.equal(r.tipo, 'acao');
    assert.match(r.mensagem, /Meu Pluggy/);
  });

  it('limite e rede são passageiros', () => {
    assert.equal(
      classificarErroConta({
        type: 'SyncError',
        category: 'RATE_LIMIT_EXCEEDED',
        code: 'X',
      }).tipo,
      'transitoria',
    );
    assert.equal(
      classificarErroConta({ message: 'network-failure' }).tipo,
      'transitoria',
    );
  });

  it('erro interno é passageiro e não leva o rastro inteiro', () => {
    const r = classificarErroConta({
      message: 'There was an internal error.',
      internal: 'TypeError: x is undefined\n    at /app/segredo.js:1:1',
    });
    assert.equal(r.tipo, 'transitoria');
    assert.doesNotMatch(r.mensagem, /segredo/);
  });

  it('conta sem vínculo é ação', () => {
    const r = classificarErroConta({
      message: 'Account "X" is not linked properly. Please link it again.',
    });
    assert.equal(r.tipo, 'acao');
  });

  it('senha recusada é ação; servidor fora é passageiro', () => {
    const senha = Object.assign(
      new Error('Authentication failed: invalid-password'),
      { code: 'invalid-password' },
    );
    assert.equal(classificarErroGeral(senha).tipo, 'acao');
    const rede = new Error('Authentication failed: network-failure');
    assert.equal(classificarErroGeral(rede).tipo, 'transitoria');
    assert.equal(
      classificarErroGeral(
        Object.assign(new Error('x'), { code: 'budget-not-found' }),
      ).tipo,
      'acao',
    );
  });
});

describe('preservação dos lançamentos', () => {
  const t = (id, extra = {}) => ({
    id,
    date: '2026-10-20',
    amount: -1000,
    category: 'cat',
    notes: 'nota',
    payee: 'fav',
    transfer_id: null,
    imported_id: `pl-${id}`,
    cleared: true,
    ...extra,
  });

  it('sem mudança e com lançamento novo: ok', () => {
    const antes = [t('1'), t('2')];
    const depois = [...antes, t('3', { notes: 'PIX #conferir-duplicata' })];
    const r = conferirIntegridade(antes, depois, {});
    assert.equal(r.ok, true);
    assert.equal(r.novos, 1);
    assert.equal(r.aConferir, 1);
    assert.equal(r.preservados, 2);
  });

  it('preencher o que estava vazio e compensar: ok', () => {
    const antes = [
      t('1', { category: null, notes: '', payee: null, cleared: false }),
    ];
    const depois = [t('1')];
    assert.equal(conferirIntegridade(antes, depois, {}).ok, true);
  });

  it('pendente que compensa com outro id do banco: ok', () => {
    const antes = [t('1', { cleared: false, imported_id: 'pendente' })];
    const depois = [t('1', { cleared: true, imported_id: 'compensado' })];
    assert.equal(conferirIntegridade(antes, depois, {}).ok, true);
  });

  it('id do banco trocado sem compensar: problema', () => {
    const antes = [t('1')];
    const depois = [t('1', { imported_id: 'outro' })];
    const r = conferirIntegridade(antes, depois, {});
    assert.equal(r.ok, false);
    assert.deepEqual(r.problemas.idBanco, ['1']);
  });

  it('categoria, nota, transferência, valor, data e apagado: problema', () => {
    const antes = [
      t('1'),
      t('2'),
      t('3', { transfer_id: 'x' }),
      t('4'),
      t('5'),
      t('6'),
    ];
    const depois = [
      t('1', { category: 'outra' }),
      t('2', { notes: 'outra' }),
      t('3', { transfer_id: null }),
      t('4', { amount: -999 }),
      t('5', { date: '2026-10-21' }),
    ];
    const r = conferirIntegridade(antes, depois, {});
    assert.equal(r.ok, false);
    assert.deepEqual(
      {
        categoria: r.problemas.categoria,
        nota: r.problemas.nota,
        transferencia: r.problemas.transferencia,
        valor: r.problemas.valor,
        data: r.problemas.data,
        apagado: r.problemas.apagado,
      },
      {
        categoria: ['1'],
        nota: ['2'],
        transferencia: ['3'],
        valor: ['4'],
        data: ['5'],
        apagado: ['6'],
      },
    );
    assert.match(descreverIntegridade(r), /categoria mudou: 1/);
  });

  it('data pode mudar quando a conta pede atualizar datas', () => {
    const r = conferirIntegridade([t('1')], [t('1', { date: '2026-10-22' })], {
      atualizaDatas: true,
    });
    assert.equal(r.ok, true);
  });

  it('id do banco repetido por lançamento novo: problema', () => {
    const antes = [t('1')];
    const depois = [t('1'), t('9', { imported_id: 'pl-1' })];
    const r = conferirIntegridade(antes, depois, {});
    assert.equal(r.ok, false);
    assert.equal(r.repetidosDepois, 1);
  });

  it('deixar de estar compensado: problema', () => {
    const r = conferirIntegridade([t('1')], [t('1', { cleared: false })], {});
    assert.equal(r.ok, false);
    assert.deepEqual(r.problemas.compensacao, ['1']);
  });

  it('virar transferência: problema', () => {
    const r = conferirIntegridade(
      [t('1', { transfer_id: null })],
      [t('1', { transfer_id: 'outra-conta' })],
      {},
    );
    assert.equal(r.ok, false);
    assert.deepEqual(r.problemas.transferencia, ['1']);
  });

  it('duplicata nova não se esconde atrás de uma antiga que sumiu', () => {
    // Antes: "pend" repetido (dois pendentes). Depois: um deles compensa com
    // outro id (permitido) e um lançamento novo repete "pl-2". A contagem de
    // ids repetidos fica igual (1 → 1), mas "pl-2" passou a se repetir.
    const antes = [
      t('1', { cleared: false, imported_id: 'pend' }),
      t('2', { cleared: false, imported_id: 'pend' }),
      t('3', { imported_id: 'pl-2' }),
    ];
    const depois = [
      t('1', { cleared: true, imported_id: 'compensado' }),
      t('2', { cleared: false, imported_id: 'pend' }),
      t('3', { imported_id: 'pl-2' }),
      t('9', { imported_id: 'pl-2' }),
    ];
    const r = conferirIntegridade(antes, depois, {});
    assert.equal(r.ok, false);
    assert.equal(r.repetidosNovos, 1);
    assert.match(descreverIntegridade(r), /passaram a se repetir: 1/);
  });

  describe('importar e conferir sempre', () => {
    // Uma conta de mentira: `importar` mexe nela como o comando poderia.
    function conta(inicial) {
      let lancamentos = inicial.map(x => ({ ...x }));
      return {
        retratar: async () => lancamentos.map(x => ({ ...x })),
        mudar: f => (lancamentos = f(lancamentos)),
      };
    }

    it('comando que altera um lançamento e lança: a conferência acusa', async () => {
      const c = conta([t('1'), t('2')]);
      const r = await importarConferindo({
        retratar: c.retratar,
        importar: async () => {
          c.mudar(l =>
            l.map(x => (x.id === '1' ? { ...x, category: 'outra' } : x)),
          );
          throw new Error('quebrou no meio');
        },
      });
      assert.equal(r.excecao.message, 'quebrou no meio');
      assert.equal(r.conferencia.ok, false);
      assert.deepEqual(r.conferencia.problemas.categoria, ['1']);
    });

    it('comando que só acrescenta e lança: conferência íntegra, exceção guardada', async () => {
      const c = conta([t('1')]);
      const r = await importarConferindo({
        retratar: c.retratar,
        importar: async () => {
          c.mudar(l => [...l, t('2')]);
          throw new Error('rede caiu');
        },
      });
      assert.equal(r.conferencia.ok, true);
      assert.equal(r.conferencia.novos, 1);
      assert.ok(r.excecao);
    });

    it('comando que devolve erro sem lançar: resposta e conferência', async () => {
      const c = conta([t('1')]);
      const r = await importarConferindo({
        retratar: c.retratar,
        importar: async () => ({ errors: [{ message: 'network-failure' }] }),
      });
      assert.equal(r.excecao, null);
      assert.equal(r.conferencia.ok, true);
      assert.equal(r.resposta.errors.length, 1);
    });

    it('retrato de depois que falha volta como falha da conferência', async () => {
      let chamadas = 0;
      const r = await importarConferindo({
        retratar: async () => {
          chamadas += 1;
          if (chamadas > 1) throw new Error('consulta falhou');
          return [t('1')];
        },
        importar: async () => ({ errors: [] }),
      });
      assert.equal(r.conferencia, null);
      assert.equal(r.falhaConferencia.message, 'consulta falhou');
    });
  });

  it('duplicata que já existia não bloqueia', () => {
    const antes = [t('1', { imported_id: 'x' }), t('2', { imported_id: 'x' })];
    const r = conferirIntegridade(antes, antes, {});
    assert.equal(r.ok, true);
    assert.equal(r.repetidosDepois, 1);
  });
});

describe('limpeza de texto', () => {
  it('encurta ids e esconde números, CPF, e-mail e chaves', () => {
    // Valores fictícios. O id começa só com dígitos de propósito: o prefixo
    // curto não pode virar "<nº>".
    const texto =
      'Item 12345678-0f0f-4a4a-8b8b-0123456789ab cartão 4321 CPF 123.456.789-09 ' +
      'de fulano@exemplo.com token abcdefghijklmnopqrstuvwxyz0123456789ABCD';
    const s = limpar(texto);
    assert.match(s, /12345678…/);
    assert.doesNotMatch(s, /0f0f|4321|123\.456|fulano|abcdefghij/);
  });

  it('mantém números curtos e limita o tamanho', () => {
    assert.equal(limpar('status 500'), 'status 500');
    assert.equal(limpar('x'.repeat(10), 5), 'xxxx…');
  });
});
