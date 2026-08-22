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

    // Settings — theme custom CSS indicator.
    'Custom CSS is active': 'CSS personalizado ativo',
    'Custom CSS override active — click to edit':
      'CSS personalizado ativo — clique para editar',

    // Settings — export size warnings.
    'This export is larger than Actual can safely re-import. You may not be able to restore this backup.':
      'Esta exportação é maior do que o Actual consegue reimportar com segurança. Talvez você não consiga restaurar esta cópia.',
    'This export is larger than the memory available on this device. Restoring it here may fail.':
      'Esta exportação é maior que a memória disponível neste dispositivo. Restaurá-la aqui pode falhar.',

    // Settings — repair transactions. The catalog reads "Fixed" as the
    // adjective ("Transferências fixas de {{count}}"); every sibling message in
    // this family correctly reads it as the verb "corrigidas".
    'Fixed {{count}} transfers._one': '{{count}} transferência foi corrigida.',
    'Fixed {{count}} transfers._many':
      '{{count}} transferências foram corrigidas.',
    'Fixed {{count}} transfers._other':
      '{{count}} transferências foram corrigidas.',

    // Payees — "Transfer:" labels a transfer payee, so it is the noun
    // "Transferência", not the verb. The catalog already renders the bare
    // `Transfer` key as "Transferência"; only these two prefixed forms
    // disagree. The account name is concatenated separately and untouched.
    'Transfer: ': 'Transferência: ',
    'Transfer: {{name}}': 'Transferência: {{name}}',
    // The catalog drops the article: "Exibir todos beneficiários".
    'Show all payees': 'Exibir todos os beneficiários',

    // Rules — tag operators, missing from the catalog.
    'has all tags': 'tem todas as etiquetas',
    'has any tag': 'tem alguma etiqueta',
    // Rules — shown for rules that already have a persisted `options.template`,
    // so it appears even with the templating flag off.
    'Templating is deprecated and will be removed in a future release. Switch this action to a formula instead.':
      'O uso de modelos está obsoleto e será removido em uma versão futura. Troque esta ação por uma fórmula.',

    // Rules — the catalog reads these as the wrong part of speech.
    // "Filter rules" is the mobile search placeholder (a verb); the catalog
    // renders it as the noun phrase "Regras de filtro". The desktop sibling
    // key "Filter rules..." is already correct.
    'Filter rules…': 'Filtrar regras…',
    // Fills "Se {{allOrAny}} dessas condições corresponderem:"; "tudo" does not
    // agree with "condições".
    all: 'todas',
    // Operator label followed by an arbitrary value, so no crase.
    matches: 'corresponde a',
    // Labels split number N, so the noun "Divisão", not the verb "Dividir".
    'Split {{num}}': 'Divisão {{num}}',
    // The catalog has "vinculadas à agendamentos"; crase is wrong here.
    'Some rules were not deleted because they are linked to schedules.':
      'Algumas regras não foram removidas, pois estão vinculadas a agendamentos.',
  },
};
