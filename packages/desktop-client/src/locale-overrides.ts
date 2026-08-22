/**
 * Translations that belong to this fork only.
 *
 * `packages/desktop-client/locale/` is git-ignored and cloned from
 * https://github.com/actualbudget/translations, which is managed on Weblate
 * and does not accept pull requests. It therefore cannot carry strings that
 * exist only here, nor terminology chosen for this fork. These entries are
 * merged over the downloaded catalog when a language is loaded (see `./i18n`),
 * so the catalog stays the source of truth for everything not listed below.
 */
export const localeOverrides: Record<string, Record<string, string>> = {
  'pt-BR': {
    // Terminology decided for this fork, replacing the catalog wording.
    'To Budget': 'A orçar',
    'On budget': 'No orçamento',
    'Closed accounts': 'Contas fechadas',
    'Closed accounts...': 'Contas fechadas...',
    Tags: 'Etiquetas',
    // The catalog spells this "Sincronizacão Bancária" (missing cedilla).
    'Bank Sync': 'Sincronização bancária',

    // Home dashboard — these strings exist only in this fork.
    'Good morning': 'Bom dia',
    'Good afternoon': 'Boa tarde',
    'Good evening': 'Boa noite',
    Overview: 'Visão geral',
    Available: 'Disponível',
    'Sum of on-budget accounts': 'Somatório das contas no orçamento',
    'Total balance': 'Saldo total',
    'Loading accounts…': 'Carregando contas…',
    'No accounts yet': 'Nenhuma conta ainda',
    'Add an account to start tracking your money.':
      'Adicione uma conta para começar a acompanhar seu dinheiro.',
    'View transactions for {{name}}': 'Ver transações de {{name}}',
    'Money in': 'Entradas',
    'Money out': 'Saídas',
    'Monthly net': 'Resultado',
    'Spending by category': 'Gastos por categoria',
    'Loading spending…': 'Carregando gastos…',
    'No spending recorded this month.': 'Nenhum gasto registrado neste mês.',
    'Recent transactions': 'Movimentações recentes',
    'Loading transactions…': 'Carregando movimentações…',
    'No transactions recorded yet.': 'Nenhuma movimentação registrada ainda.',
    'Open transaction {{title}}': 'Abrir movimentação {{title}}',

    // Reports — date-range header and range presets.
    'Select by': 'Selecionar por',
    'Quick select': 'Seleção rápida',
    Previous: 'Anterior',
    Next: 'Próximo',
    'Date range': 'Período',
    'Next 3 months': 'Próximos 3 meses',
    'Next 6 months': 'Próximos 6 meses',
    'Next year': 'Próximo ano',
    'Current quarter': 'Trimestre atual',
    'Previous quarter': 'Trimestre anterior',
    'Last 30 days': 'Últimos 30 dias',
    'Show trend lines': 'Mostrar linhas de tendência',

    // Reports — Spending report average range.
    'Last {{count}} months_one': 'Último {{count}} mês',
    'Last {{count}} months_other': 'Últimos {{count}} meses',
    YTD: 'Acumulado no ano',
    'Spent Average ({{rangeLabel}}):': 'Média de gastos ({{rangeLabel}}):',
    'Spent Average MTD ({{rangeLabel}}):':
      'Média de gastos no mês até o momento ({{rangeLabel}}):',

    // Schedules — edit form.
    'Upcoming length': 'Antecedência',
    'Use global default': 'Usar padrão global',
    'How far in advance this schedule appears as upcoming':
      'Com quanta antecedência este agendamento aparece como próximo',
  },
};
