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

    // Bank Sync — the catalog reads "Actual" as the adjective "atual"; here it
    // is the product name, paired with "Bank field". The narrow-column fallback
    // in FieldMapping.tsx renders the literal 'Actual', confirming this.
    'Actual field': 'Campo do Actual',
    // Untranslated in the catalog (value identical to the English key).
    'Completing authorization...': 'Concluindo autorização...',
    '{{provider}} menu': 'Menu do {{provider}}',

    // Bank Sync — providers panel.
    Providers: 'Provedores',
    'Set up a bank sync provider, then link new accounts or connect an existing Actual account.':
      'Configure um provedor de sincronização bancária e depois conecte novas contas ou vincule uma conta existente do Actual.',
    'this budget only': 'somente este orçamento',
    'Not configured': 'Não configurado',
    'Set up': 'Configurar',
    'Link bank account': 'Conectar conta bancária',
    'Reset {{provider}} credentials': 'Redefinir credenciais do {{provider}}',
    'Reset credentials before setting credentials for this budget file.':
      'Redefina as credenciais antes de definir credenciais para este arquivo de orçamento.',
    "You don't have the required permissions to configure all bank sync providers. You can set up Pluggy.ai because you are the owner of this budget file.":
      'Você não tem as permissões necessárias para configurar todos os provedores de sincronização bancária. Você pode configurar o Pluggy.ai porque é o proprietário deste arquivo de orçamento.',
    "You don't have the required permissions to configure bank sync providers. Please contact an Admin.":
      'Você não tem as permissões necessárias para configurar provedores de sincronização bancária. Entre em contato com um administrador.',

    // Bank Sync — provider descriptions and errors.
    'Failed to reset {{provider}}': 'Falha ao redefinir o {{provider}}',
    'Budget file ID is required.':
      'O ID do arquivo de orçamento é obrigatório.',
    'Error when trying to contact SimpleFIN':
      'Erro ao tentar contatar o SimpleFIN',
    'Error when trying to contact Enable Banking':
      'Erro ao tentar contatar o Enable Banking',
    'Error when trying to contact Akahu': 'Erro ao tentar contatar o Akahu',
    'Link a European bank account to automatically download transactions.':
      'Conecte uma conta bancária europeia para baixar transações automaticamente.',
    'Link a North American bank account to automatically download transactions.':
      'Conecte uma conta bancária norte-americana para baixar transações automaticamente.',
    'Link a Brazilian bank account to automatically download transactions.':
      'Conecte uma conta bancária brasileira para baixar transações automaticamente.',
    'Link a New Zealand bank account to automatically download transactions.':
      'Conecte uma conta bancária neozelandesa para baixar transações automaticamente.',
    'Link a European bank account via Enable Banking, a free alternative to GoCardless for PSD2-supported banks.':
      'Conecte uma conta bancária europeia via Enable Banking, uma alternativa gratuita ao GoCardless para bancos com suporte a PSD2.',

    // Bank Sync — empty states.
    'No accounts yet. Once a provider is set up, use <2>Link bank account</2> to connect your bank and create your accounts automatically. You can also add accounts manually and connect them here later.':
      'Nenhuma conta ainda. Depois de configurar um provedor, use <2>Conectar conta bancária</2> para conectar seu banco e criar suas contas automaticamente. Você também pode adicionar contas manualmente e conectá-las aqui depois.',
    'Linked accounts will appear here. Use a provider above to link your bank, or create an account from the Accounts tab and connect it here later.':
      'As contas conectadas aparecerão aqui. Use um provedor acima para conectar seu banco, ou crie uma conta na aba Contas e conecte-a aqui depois.',

    // Bank Sync — Enable Banking OAuth callback.
    'Missing authorization parameters.': 'Parâmetros de autorização ausentes.',
    'Failed to complete authorization.':
      'Não foi possível concluir a autorização.',
    'You can close this window and try again.':
      'Você pode fechar esta janela e tentar novamente.',

    // Tags — the catalog keeps the English loanword "tag(s)" throughout, which
    // clashes with the fork's frozen term. The bare `Tags` key was already
    // overridden in 7.1, so the page title read "Etiquetas" while its body read
    // "tags"; these align the rest of the surface.
    Tag: 'Etiqueta',
    'Create tag': 'Criar etiqueta',
    'New tag': 'Nova etiqueta',
    'Tag description': 'Descrição da etiqueta',
    'No Tags': 'Sem etiquetas',
    'Discover new tags': 'Descobrir novas etiquetas',
    'Filter tags...': 'Filtrar etiquetas...',
    "Don't show hidden tags": 'Não mostrar etiquetas ocultas',
    'User defined tags with color and description.':
      'Etiquetas com cor e descrição definidas pelo usuário.',

    // Tags — missing from the catalog.
    'Add tag': 'Adicionar etiqueta',
    'Show hidden tags': 'Mostrar etiquetas ocultas',
    'Tag List': 'Lista de etiquetas',
    Unhide: 'Reexibir',

    // Tags — key introduced by replacing a hardcoded `${c} Tags` template in
    // SelectedTagsButton; follows the sibling `{{count}} transactions` pattern.
    '{{count}} tags_one': '{{count}} etiqueta',
    '{{count}} tags_many': '{{count}} etiquetas',
    '{{count}} tags_other': '{{count}} etiquetas',

    // Onboarding / initial screens — the onboarding redesign that introduced
    // the welcome screen landed after the last pt-BR catalog sync, so none of
    // its strings have a translation yet.
    'Welcome to Actual': 'Bem-vindo(a) ao Actual',
    'Your finances - made simple': 'Suas finanças, simplificadas',
    'Actual is a super fast, privacy-focused app for managing your finances. It is 100% free and open source: everything stays on your device, no data is collected, and there is nothing to sign up for.':
      'Actual é um app super rápido focado em privacidade para gerenciar suas finanças. É 100% gratuito e de código aberto: tudo fica no seu dispositivo, nenhum dado é coletado e não é preciso criar conta.',
    'Start budgeting': 'Criar meu orçamento',
    'Try the demo': 'Experimentar a demonstração',
    'Connect to a sync server': 'Conectar a um servidor de sincronização',
    'Coming from another budgeting app?': 'Já usa outro app de orçamento?',
    'New to budgeting? Take the <2>guided tour</2> to learn how Actual works.':
      'Está começando a fazer seu orçamento? Faça o <2>tour guiado</2> para aprender como o Actual funciona.',

    // Onboarding — server bar at the bottom of the manager screens.
    'Using this device only': 'Usando apenas este dispositivo',
    'Set up sync': 'Configurar sincronização',

    // Server configuration — also part of the onboarding redesign.
    'Connect to a server': 'Conectar a um servidor',
    Connect: 'Conectar',
    'Use the current domain': 'Usar o domínio atual',
    'A sync server keeps your budget up to date across all your devices and unlocks features like bank syncing. It is completely optional: Actual works great on just this device too.':
      'Um servidor de sincronização mantém seu orçamento atualizado em todos os seus dispositivos e habilita recursos como a sincronização bancária. É totalmente opcional: o Actual funciona muito bem apenas neste dispositivo.',
    'If you already run a server, enter its URL below. Otherwise you can <2>learn how to set one up</2> and connect it whenever you are ready.':
      'Se você já tem um servidor, informe a URL dele abaixo. Caso contrário, você pode <2>aprender a configurar um</2> e conectá-lo quando quiser.',

    // Server status tooltips, shown by LoggedInUser on the manager screens.
    // `<1></1>` is the line break in the source string.
    'A server syncs your budget across devices and keeps a backup of your data.<1></1>Click to set one up.':
      'Um servidor sincroniza seu orçamento entre dispositivos e mantém uma cópia de segurança dos seus dados.<1></1>Clique para configurar um.',
    "Can't reach your server right now.<1></1>Changes are saved locally and will sync once it's reachable again.":
      'Não foi possível acessar seu servidor agora.<1></1>As alterações são salvas localmente e serão sincronizadas assim que ele voltar a ficar acessível.',
    'Connected to your server — your budget is syncing.':
      'Conectado ao seu servidor — seu orçamento está sincronizando.',

    // Keys introduced by moving hardcoded English onto the i18n path in
    // subscribe/Error.tsx, BudgetFileSelection.tsx, ConfigServer.tsx and
    // subscribe/OpenIdForm.tsx.
    'Unable to access server. Make sure the configured URL for the server is accessible.':
      'Não foi possível acessar o servidor. Verifique se a URL configurada para o servidor está acessível.',
    'Server returned an error while checking its status.':
      'O servidor retornou um erro ao verificar seu status.',
    'File shared with:': 'Arquivo compartilhado com:',
    Server: 'Servidor',
    'Self Signed Certificate': 'Certificado autoassinado',
    Other: 'Outro',

    // Bootstrap — "bem-vindo" is hyphenated; the catalog drops the hyphen.
    'Welcome to Actual!': 'Bem-vindo(a) ao Actual!',

    // Server configuration — the catalog puts a crase before a numeral
    // ("de 1 à 65535") and inside the fixed phrase "passo a passo".
    'Ports must be within range 1 - 65535':
      'Portas devem estar dentro do intervalo de 1 a 65535',
    'Need to expose your server to the internet? Follow our step-by-step <2>guide</2> for more information.':
      'Precisa expor seu servidor para a internet? Siga nosso <2>passo a passo</2> para mais informações.',

    // The sibling "network-failure" message on this same screen already
    // spells it "autoassinado", which is also the current orthography.
    'If the server is using a self-signed certificate <2>select it here</2>.':
      'Se o servidor estiver usando um certificado autoassinado, <2>selecione-o aqui</2>.',

    // "Sync server" is a noun (the server), not "sincronização com servidor";
    // "across your devices" is "entre", not "através de"; and "bank sync" is
    // the fork's frozen term, not "contas bancárias".
    'Failed to configure sync server':
      'Falha ao configurar o servidor de sincronização',
    'Set up your server below to enable seamless data synchronization across your devices, bank sync and more...':
      'Configure abaixo o seu servidor para habilitar a sincronização de dados entre os seus dispositivos, a sincronização bancária e mais…',

    // This button starts the bundled sync server process, so "Iniciar";
    // "Começar" reads as beginning an activity.
    Start: 'Iniciar',

    // Button labels: the catalog mixes imperative and infinitive. These three
    // sit next to "Usar um servidor externo" and "Usar o domínio atual", so
    // the infinitive is what the surrounding rows use.
    "Don't use a server": 'Não usar um servidor',
    'Stop using a server': 'Parar de usar um servidor',
    'Start using a server': 'Começar a usar um servidor',

    // Bootstrap error family — the two sibling messages read "não pode estar
    // vazio"; only these two use "ser".
    'Client ID cannot be empty': 'O ID do Cliente não pode estar vazio',
    'Client secret cannot be empty':
      'O segredo do cliente não pode estar vazio',

    // Login — pairs with "Entrar com OpenID" on the same screen.
    'Log in with password': 'Entrar com senha',

    // Login — the adjacent case reads "Falha no login automático".
    'Auto login failed - No header sent':
      'Falha no login automático - Nenhum cabeçalho enviado',

    // The notification title for this message is "Sessão expirada".
    'Login expired, please log in again.':
      'Sessão expirada, faça login novamente.',
  },
};
