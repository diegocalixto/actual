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
    // "Para distribuir" is what the V2 Budget and the phone's Home already
    // print for the money not yet given to a category; the catalog's "Para
    // Orçar" and the earlier "A orçar" were a second and a third name for it,
    // one tap away from the first.
    'To Budget': 'Para distribuir',
    'To Budget:': 'Para distribuir:',
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
    'Sum of on-budget accounts': 'Soma das contas no orçamento',
    'Total balance': 'Saldo total',
    'Loading accounts…': 'Carregando contas…',
    'No accounts yet': 'Nenhuma conta ainda',
    'Add an account to start tracking your money.':
      'Adicione uma conta para começar a acompanhar seu dinheiro.',
    'View transactions for {{name}}': 'Ver transações de {{name}}',
    'Money in': 'Receitas',
    'Money out': 'Despesas',
    'Monthly net': 'Saldo do mês',
    'Spending by category': 'Despesas por categoria',
    'Loading spending…': 'Carregando despesas…',
    'No spending recorded this month.': 'Nenhuma despesa registrada neste mês.',
    'Recent transactions': 'Transações recentes',
    'Loading transactions…': 'Carregando transações…',
    'No transactions recorded yet.': 'Nenhuma transação registrada ainda.',
    'Open transaction {{title}}': 'Abrir transação {{title}}',

    // Home dashboard V2 — strings introduced by the new Overview composition.
    'Available balance': 'Saldo disponível',
    'New transaction': 'Nova transação',
    'Spending this month': 'Despesas do mês',
    'Recent activity': 'Transações recentes',

    // Budget on a phone — the switch that decides which of a category's two
    // plan figures its row prints. These strings exist only in this fork.
    'Show spent per category': 'Mostrar gasto por categoria',
    'Show budgeted per category': 'Mostrar orçado por categoria',
    // What a new category or group is told when it is given no name.
    'Name is required.': 'O nome é obrigatório.',

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
    // The two strings of the welcome screen the catalog does carry, so the
    // screen reads whole on a checkout without it.
    'Import my budget': 'Importar meu orçamento',
    'App: v{{appVersion}} | Server: {{serverVersion}}':
      'App: v{{appVersion}} | Servidor: {{serverVersion}}',

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

    // Command bar — the tour entry has no catalog translation.
    'Take a tour of {{appName}}': 'Fazer um tour pelo {{appName}}',
    // Sibling of `On Budget` ("No orçamento"); the two are rendered as
    // adjacent rows here and as the paired group labels in the report
    // account selector, so the capitalization has to match. The catalog's own
    // `Off budget` key already reads "Fora do orçamento".
    'Off Budget': 'Fora do orçamento',
    // Every other "Custom …" key in the catalog uses "personalizado";
    // this heading lists the very reports that `New custom report` calls
    // "relatório personalizado".
    'Custom Reports': 'Relatórios personalizados',
    // Searches *inside* the budget. The catalog already renders this pattern
    // as "Buscar em …" (`Search All Accounts`, `Search On Budget Accounts`);
    // "Procurar {{budgetName}}" reads as searching *for* the budget.
    'Search {{budgetName}}...': 'Buscar em {{budgetName}}…',

    // Fatal error — backend worker failure, missing from the catalog.
    "Actual couldn't load a critical backend worker. Reload the page to try again; if the problem persists, do a hard refresh to clear any stale cached assets.":
      'O Actual não conseguiu carregar um worker essencial do backend. Recarregue a página para tentar de novo; se o problema continuar, faça uma atualização forçada para limpar arquivos em cache desatualizados.',

    // Import / download errors (util/error.ts) — none of these reached the
    // catalog. "archive" is rendered "arquivo compactado" so it stays distinct
    // from the "file" it contains, and the tail follows the wording the
    // catalog already uses for its siblings.
    'This file is larger than the maximum supported size of {{maxSizeMB}} MB, sorry! Visit https://actualbudget.org/contact/ for support.':
      'Este arquivo é maior que o tamanho máximo suportado de {{maxSizeMB}} MB, desculpe! Visite https://actualbudget.org/contact/ para obter ajuda.',
    'The file "{{entryName}}" in this archive is larger than the maximum supported size of {{maxSizeMB}} MB, sorry! Visit https://actualbudget.org/contact/ for support.':
      'O arquivo "{{entryName}}" dentro deste arquivo compactado é maior que o tamanho máximo suportado de {{maxSizeMB}} MB, desculpe! Visite https://actualbudget.org/contact/ para obter ajuda.',
    'The uncompressed contents of this archive are larger than the maximum supported size of {{maxSizeMB}} MB, sorry! Visit https://actualbudget.org/contact/ for support.':
      'O conteúdo descompactado deste arquivo compactado é maior que o tamanho máximo suportado de {{maxSizeMB}} MB, desculpe! Visite https://actualbudget.org/contact/ para obter ajuda.',
    'This archive contains an entry with an unsafe file name: "{{entryName}}".':
      'Este arquivo compactado contém um item com nome de arquivo inseguro: "{{entryName}}".',
    'This archive contains more than one entry named "{{entryName}}".':
      'Este arquivo compactado contém mais de um item chamado "{{entryName}}".',
    'This file could not be imported, sorry! Visit https://actualbudget.org/contact/ for support.':
      'Não foi possível importar este arquivo, desculpe! Visite https://actualbudget.org/contact/ para obter ajuda.',
    'This file is too large to import, sorry! Visit https://actualbudget.org/contact/ for support.':
      'Este arquivo é grande demais para ser importado, desculpe! Visite https://actualbudget.org/contact/ para obter ajuda.',
    'This budget could not be loaded because it uses a newer database schema than this version of Actual supports. Make sure you are using the latest version, then try again.':
      'Este orçamento não pôde ser carregado porque usa um esquema de banco de dados mais recente do que esta versão do Actual suporta. Verifique se você está usando a versão mais recente e tente novamente.',
    'Unable to decrypt file {{fileName}}. To change your key, first download this file with the proper password.':
      'Não foi possível descriptografar o arquivo {{fileName}}. Para alterar sua chave, baixe primeiro este arquivo com a senha correta.',
    // Fallback for {{fileName}} above. `i18next-parser` never sees this key —
    // it sits inside the options object of the surrounding t() call — so it
    // is absent from the English catalog too and would render as "(unknown)".
    '(unknown)': '(desconhecido)',

    // ---- Etapa 7.10 — varredura final da V1 ----

    // Guided tour. The whole feature reached the app after the last catalog
    // sync, so none of its strings had a pt-BR translation.
    'Welcome to {{appName}}!': 'Bem-vindo(a) ao {{appName}}!',
    '{{appName}} is a budgeting app that helps you understand exactly where your money goes. This short tour walks you through the basics. It only takes a couple of minutes, and you can leave at any time and replay it later from the Help menu.':
      'O {{appName}} é um app de orçamento que ajuda você a entender exatamente para onde vai o seu dinheiro. Este tour rápido apresenta o básico. Leva poucos minutos, e você pode sair quando quiser e repeti-lo depois pelo menu Ajuda.',
    'Your Budget': 'Seu orçamento',
    'Categories in {{appName}} work like virtual envelopes: you assign the money you already have to them, then spend from each envelope. This approach is called <4>envelope budgeting</4>. If you prefer, you can switch to <7>tracking budgeting</7> in the settings.':
      'No {{appName}}, as categorias funcionam como envelopes virtuais: você distribui entre elas o dinheiro que já tem e gasta de cada envelope. Essa abordagem se chama <4>orçamento por envelopes</4>. Se preferir, você pode mudar para o <7>orçamento de acompanhamento</7> nas configurações.',
    'In a tracking budget, the amounts you budget are targets for your income and spending rather than envelopes of money. This approach is called <2>tracking budgeting</2>. If you prefer, you can switch to <5>envelope budgeting</5> in the settings.':
      'No orçamento de acompanhamento, os valores que você orça são metas de receita e de gasto, e não envelopes de dinheiro. Essa abordagem se chama <2>orçamento de acompanhamento</2>. Se preferir, você pode mudar para o <5>orçamento por envelopes</5> nas configurações.',
    'Saved This Month': 'Economizado neste mês',
    'This summary compares your income and expenses to show how much you saved this month. Rather than rolling funds over, a tracking budget plans each month on its own.':
      'Este resumo compara suas receitas e despesas para mostrar quanto você economizou neste mês. Em vez de transportar saldos, o orçamento de acompanhamento planeja cada mês separadamente.',
    'The <1>To Budget</1> amount shows the money you have not assigned to a category yet. Aim to bring it to zero, so that all of your money has a job.':
      'O valor <1>Para distribuir</1> mostra o dinheiro que você ainda não destinou a nenhuma categoria. Procure zerá-lo, para que todo o seu dinheiro tenha uma função.',
    Categories: 'Categorias',
    'Each row in the budget is a category. Click the <2>Budgeted</2> amount to assign money to a category, and keep an eye on the <4>Balance</4> column to see how much is left to spend.':
      'Cada linha do orçamento é uma categoria. Clique no valor <2>Orçado</2> para destinar dinheiro a uma categoria e acompanhe a coluna <4>Saldo</4> para ver quanto ainda há para gastar.',
    'Month by Month': 'Mês a mês',
    'Every month gets its own budget. Use the month picker to move between months, and the calendar icons on the left to choose how many months are shown side by side.':
      'Cada mês tem o seu próprio orçamento. Use o seletor de mês para navegar entre os meses e os ícones de calendário à esquerda para escolher quantos meses aparecem lado a lado.',
    'Getting Around': 'Navegando pelo app',
    'The sidebar takes you to your budget, reports, and scheduled transactions. You can find payees, rules, and the settings under <2>More</2>.':
      'A barra lateral leva você ao seu orçamento, aos relatórios e às transações agendadas. Beneficiários, regras e configurações ficam em <2>Mais</2>.',
    'Add Your Accounts': 'Adicione suas contas',
    'Transactions live in accounts, so adding your first account is the best way to get started with {{appName}}. Click here to add one. You can enter transactions yourself, or <4>link the account to your bank</4> to import them automatically.':
      'As transações ficam nas contas, então adicionar sua primeira conta é a melhor forma de começar no {{appName}}. Clique aqui para adicionar uma. Você pode lançar as transações manualmente ou <4>conectar a conta ao seu banco</4> para importá-las automaticamente.',
    'Getting Help': 'Onde buscar ajuda',
    'The Help menu is always here when you need it. Use it to replay this tour, browse the documentation, or ask the community on Discord.':
      'O menu Ajuda está sempre aqui quando você precisar. Use-o para repetir este tour, consultar a documentação ou perguntar à comunidade no Discord.',
    'New to {{appName}}? Take a short tour to learn how budgeting works and find your way around.':
      'Novo no {{appName}}? Faça um tour rápido para aprender como funciona o orçamento e se localizar no app.',
    'Take the tour': 'Fazer o tour',
    'Take a tour': 'Fazer um tour',
    'Skip tour': 'Pular tour',
    Finish: 'Concluir',
    '{{current}} of {{total}}': '{{current}} de {{total}}',

    // Titlebar — sync status tooltips.
    'Sync error — click to retry':
      'Erro de sincronização — clique para tentar novamente',
    'Offline — will sync when reconnected':
      'Offline — será sincronizado ao reconectar',
    'Local file, not connected to a server':
      'Arquivo local, não conectado a um servidor',
    'Syncing disabled for this file':
      'Sincronização desativada para este arquivo',
    'Sync with your server to back up this file and access it on other devices':
      'Sincronize com seu servidor para fazer backup deste arquivo e acessá-lo em outros dispositivos',

    // Transactions table — status-icon legend. "Confirmado" / "Não
    // confirmado" / "Reconciliado" are the words the catalog already uses for
    // the badges themselves.
    'Transaction status': 'Status da transação',
    'Cleared: verified against your account':
      'Confirmado: conferido com sua conta',
    'Uncleared: not yet verified': 'Não confirmado: ainda não conferido',
    'Reconciled: locked after reconciliation':
      'Reconciliado: bloqueado após a reconciliação',
    'Upcoming scheduled transaction': 'Próxima transação agendada',
    'Due scheduled transaction': 'Transação agendada a vencer',
    'Missed scheduled transaction': 'Transação agendada atrasada',

    // Transaction table column manager.
    'Manage table columns': 'Gerenciar colunas da tabela',
    'Transaction table columns': 'Colunas da tabela de transações',
    'Table columns': 'Colunas da tabela',
    'Choose which columns appear in the transaction table and drag them into the order you prefer.':
      'Escolha quais colunas aparecem na tabela de transações e arraste-as para a ordem que preferir.',
    'Apply to all transaction tables':
      'Aplicar a todas as tabelas de transações',
    'Use this layout everywhere, not just in the current view.':
      'Usar este layout em todos os lugares, não apenas na visualização atual.',
    'Always shown': 'Sempre visível',
    'Reorder {{ columnName }} column': 'Reordenar a coluna {{ columnName }}',
    'Running balance': 'Saldo acumulado',

    // Mobile — transaction edit and list.
    'Who did you pay?': 'Para quem você pagou?',
    'Who paid you?': 'Quem pagou você?',
    'Select an account': 'Selecione uma conta',
    'Select a category': 'Selecione uma categoria',
    'Request Location': 'Solicitar localização',
    'Clear transaction': 'Confirmar transação',
    'Unclear transaction': 'Desfazer confirmação da transação',
    'Unlock reconciled transaction': 'Desbloquear transação reconciliada',
    // Transfer payee label (mobile list/edit and the home dashboard). The
    // source used to compose this from the generic `to`/`from` keys, which
    // cannot carry the preposition each direction needs in Portuguese; these
    // two whole-phrase keys replace that composition. "de"/"para" is the pair
    // the catalog already uses in `Transferred {{amount}} from … to …`.
    'Transfer from {{accountName}}': 'Transferência de {{accountName}}',
    'Transfer to {{accountName}}': 'Transferência para {{accountName}}',
    // What the phone says once its form has saved or deleted a transaction.
    // These strings exist only in this fork.
    'Transaction added.': 'Transação adicionada.',
    'Transaction updated.': 'Transação atualizada.',
    'Transaction deleted.': 'Transação excluída.',
    'Transfer added.': 'Transferência adicionada.',
    'Transfer updated.': 'Transferência atualizada.',
    'Transfer deleted.': 'Transferência excluída.',
    // Still shared by the two date-range connectors in Reports ("Jan a Mar"),
    // where the catalog's "com" was wrong. No longer used by the transfer
    // label. `from` has no active use left, so it carries no override.
    to: 'a',

    // Empty states for accounts.
    "<0>Let's add your first account.</0> Accounts hold your transactions, like everyday spending, savings, credit cards, or cash. You can connect to your bank to import transactions automatically, or add them yourself.":
      '<0>Vamos adicionar sua primeira conta.</0> As contas guardam suas transações, como gastos do dia a dia, poupança, cartões de crédito ou dinheiro. Você pode conectar seu banco para importar transações automaticamente, ou lançá-las você mesmo.',
    'You can add more accounts at any time from the sidebar.':
      'Você pode adicionar mais contas a qualquer momento pela barra lateral.',
    'Accounts hold your transactions, like everyday spending, savings, credit cards, or cash. Add one to start tracking your money.':
      'As contas guardam suas transações, como gastos do dia a dia, poupança, cartões de crédito ou dinheiro. Adicione uma para começar a acompanhar seu dinheiro.',
    'Add your first account': 'Adicionar sua primeira conta',

    // Local account modal, category sidebar, date select and misc.
    'e.g. Bank, Savings, Credit Card, Cash':
      'ex.: Banco, Poupança, Cartão de Crédito, Dinheiro',
    'Off-budget accounts (like investments, loans, or your house) are tracked but not part of your spending budget.':
      'Contas fora do orçamento (como investimentos, empréstimos ou seu imóvel) são acompanhadas, mas não fazem parte do seu orçamento de gastos.',
    'Sort A to Z': 'Ordenar de A a Z',
    'Sort Z to A': 'Ordenar de Z a A',
    'Select month': 'Selecionar mês',
    'Sync both transfer dates': 'Sincronizar as datas das duas transferências',
    'View Schedule': 'Ver agendamento',
    Goal: 'Meta',
    'Make a transfer from the two selected transactions':
      'Criar uma transferência a partir das duas transações selecionadas',
    'For this budget only': 'Somente para este orçamento',
    Warning: 'Aviso',
    'Your environment does not support SharedArrayBuffer. You may experience data loss or degraded functionality. Click to learn more.':
      'Seu ambiente não oferece suporte a SharedArrayBuffer. Você pode sofrer perda de dados ou funcionamento degradado. Clique para saber mais.',
    'There was an error hiding the tags. Please try again.':
      'Ocorreu um erro ao ocultar as etiquetas. Tente novamente.',
    'There was an error sorting the categories. Please try again.':
      'Ocorreu um erro ao ordenar as categorias. Tente novamente.',

    // Settings — Experimental features page (the page itself is always shown,
    // even though every flag it toggles is off by default).
    'Akahu Bank Sync (NZ banks)':
      'Sincronização bancária Akahu (bancos da Nova Zelândia)',
    'Enable Banking sync (EU banks)':
      'Sincronização Enable Banking (bancos da UE)',
    'Mobile calculator': 'Calculadora no celular',
    'Monte Carlo Analysis Report': 'Relatório de análise de Monte Carlo',
    'Deprecated: this feature will be removed in a future release. Use Excel formula mode (Rule formulae) instead.':
      'Obsoleto: este recurso será removido em uma versão futura. Use o modo de fórmulas do Excel (fórmulas de regra) no lugar.',

    // Keys introduced by moving hardcoded English onto the i18n path in this
    // stage (Account, TagMultiAutocomplete, SidebarGroup, TransactionEdit,
    // ImportTransactionsModal, global-events, sync-events).
    'Failed to apply rules to transactions':
      'Falha ao aplicar as regras às transações',
    'Choose tags': 'Escolher etiquetas',
    'Group:': 'Grupo:',
    'Failed to add tag, check logs':
      'Falha ao adicionar a etiqueta, verifique os logs',
    'Financial Files': 'Arquivos financeiros',
    'Unable to save changes': 'Não foi possível salvar as alterações',
    'This browser only supports using the app in one tab at a time, and another tab has opened the app. No changes will be saved from this tab; please close it and continue working in the other one.':
      'Este navegador só permite usar o app em uma aba por vez, e outra aba abriu o app. Nenhuma alteração será salva a partir desta aba; feche-a e continue trabalhando na outra.',
    'Unable to authenticate with server':
      'Não foi possível autenticar no servidor',

    // ---- Etapa 7.11 — localização visual total ----

    // Dashboard defaults. These are written to the database by the dashboard
    // migrations, but they are text the system chose, not text the user
    // typed, so they are translated on display (see
    // `components/reports/defaultDashboardText.ts`).
    Main: 'Principal',
    'Total Income (YTD)': 'Receita total (no ano)',
    'Total Expenses (YTD)': 'Despesa total (no ano)',
    'Avg Per Month': 'Média por mês',
    'Avg Per Transaction': 'Média por transação',
    'This Month': 'Este mês',
    'Budget Overview': 'Visão geral do orçamento',
    '3-Month Average': 'Média de 3 meses',
    'Transaction Calendar': 'Calendário de transações',
    'Recent Net Worth Change': 'Variação recente do patrimônio',

    // The markdown widget shipped with the default dashboard.
    '## Dashboard Tips\n\nYou can add new widgets or edit existing widgets by using the buttons at the top of the page. Choose a widget type and customize it to fit your needs.\n\n**Moving cards:** Drag any card by its header to reposition it.\n\n**Deleting cards:** Click the three-dot menu on any card and select "Remove".':
      '## Dicas do painel\n\nVocê pode adicionar novos cartões ou editar os existentes pelos botões no topo da página. Escolha um tipo de cartão e personalize-o como preferir.\n\n**Mover cartões:** arraste qualquer cartão pelo cabeçalho para reposicioná-lo.\n\n**Excluir cartões:** clique no menu de três pontos do cartão e escolha "Remover".',

    // Bank sync credential scope. Spelled the same in both languages; declared
    // explicitly so it is a decision rather than a missing entry. Its sibling
    // is `this budget only` -> "somente este orçamento".
    global: 'global',

    // Name generated for a schedule created from a future transaction.
    'Auto-created future transaction ({{formattedDate}}) - {{timestamp}}':
      'Transação futura criada automaticamente ({{formattedDate}}) - {{timestamp}}',

    // Theme names. The catalog reads `Light` as "Modo Claro", which does not
    // match its siblings in the same menu.
    Light: 'Claro',
    Dark: 'Escuro',
    Midnight: 'Meia-noite',

    // ---- Etapa 10 — as quatro páginas V2 ----

    // What the V2 shell and its four pages print is listed here even where the
    // upstream catalog has a translation. These screens belong to the fork and
    // so does their wording — "Receitas" and "Despesas", where the catalog has
    // "Receita" and "Gastos" — and listing it is also what lets them read in
    // Portuguese on a checkout that never downloaded the catalog (see
    // `./i18n`).

    // Shell — rail, header and their menus.
    // The rail names the first destination as the phone's bar does, in one word
    // that fits its tile; the page under it keeps the title "Visão geral".
    Overview_nav: 'Início',
    Budget: 'Orçamento',
    Accounts: 'Contas',
    Reports: 'Relatórios',
    More: 'Mais',
    Schedules: 'Agendamentos',
    Payees: 'Beneficiários',
    Rules: 'Regras',
    Settings: 'Configurações',
    Help: 'Ajuda',
    'Budget file options': 'Opções do arquivo de orçamento',
    'Rename budget': 'Renomear orçamento',
    'Switch file': 'Trocar arquivo',
    Unnamed: 'Sem nome',
    'No server': 'Sem servidor',
    // The header's shortcut to them. The catalog says "não categorizadas" here
    // and "sem categoria" everywhere else, which is what the V2 pages say.
    '{{count}} uncategorized transactions_one':
      '{{count}} transação sem categoria',
    '{{count}} uncategorized transactions_many':
      '{{count}} transações sem categoria',
    '{{count}} uncategorized transactions_other':
      '{{count}} transações sem categoria',
    'Switch theme': 'Trocar tema',
    'Enable privacy mode': 'Habilitar modo de privacidade',
    'Disable privacy mode': 'Desabilitar modo de privacidade',
    Documentation: 'Documentação',
    'Keyboard shortcuts': 'Atalhos de teclado',
    'Community support (Discord)': 'Suporte da comunidade (Discord)',
    'A new version of Actual is available!':
      'Uma nova versão do Actual está disponível!',
    'Version {{latestVersion}} of Actual was recently released.':
      'A versão {{latestVersion}} do Actual foi lançada recentemente.',
    'Open changelog': 'Abrir histórico de mudanças',
    Close: 'Fechar',
    'Modal dialog': 'Caixa de diálogo modal',

    // Home.
    'This month': 'Este mês',
    'Loading this month…': 'Carregando o mês…',
    'Nothing recorded this month.': 'Nada registrado neste mês.',
    'No accounts yet.': 'Nenhuma conta ainda.',
    'Off budget': 'Fora do orçamento',
    // A split transaction, named in the list where a payee would be: one word,
    // because the Budget's column for it is a narrow one. The bare `Split` key
    // stays the catalog's "Dividir", which is right for the button.
    Split_label: 'Dividida',

    // Accounts.
    'Add account': 'Adicionar conta',
    'All transactions': 'Todas as transações',
    'vs last month': 'vs. mês anterior',
    'Last update': 'Última atualização',
    'Balance over time': 'Evolução do saldo',
    'Not enough history yet': 'Ainda não há histórico suficiente',
    'The curve appears once this period has more than one day of movement.':
      'A curva aparece quando o período tiver mais de um dia com transações.',
    'Account distribution': 'Distribuição das contas',
    'The ring, its total and its shares cover positive balances only.':
      'O anel, o total e as participações consideram apenas os saldos positivos.',

    // Reports.
    'Analyze your financial performance and discover insights to make better decisions.':
      'Acompanhe seu desempenho financeiro e encontre informações para decidir melhor.',
    Income: 'Receitas',
    Expenses: 'Despesas',
    // What is left of the income once the expenses are out: "Saldo do mês" on
    // the Home and on the Budget, and the same word here for the period.
    'Net Result': 'Saldo',
    'Savings Rate': 'Taxa de poupança',
    'vs {{previousPeriodLabel}}': 'vs. {{previousPeriodLabel}}',
    'Income, Expenses & Net Result': 'Receitas, despesas e saldo',
    'Total income': 'Total de receitas',
    'Total expenses': 'Total de despesas',
    // Not "Saldo total", which on the Accounts page is the sum of the balances.
    'Total net result': 'Saldo do período',
    'Top categories': 'Principais categorias',
    'Where your money went': 'Para onde foi o seu dinheiro',
    Category: 'Categoria',
    Amount: 'Valor',
    '% of total': '% do total',
    'View all spending': 'Ver todas as despesas',
    'Expenses by category': 'Despesas por categoria',
    'View all categories': 'Ver todas as categorias',
    'Monthly comparison': 'Comparativo mensal',
    'Income (avg)': 'Receitas (média)',
    'Expenses (avg)': 'Despesas (média)',
    'Net Result (avg)': 'Saldo (média)',
    'View full comparison': 'Ver comparativo completo',
    'Loading the period…': 'Carregando o período…',
    'No transactions in this period.': 'Nenhuma transação neste período.',
    'Loading categories…': 'Carregando categorias…',
    'No spending recorded in this period.':
      'Nenhuma despesa registrada neste período.',
    'No spending to break down.': 'Nenhuma despesa para detalhar.',
    // Reports — the period's menu, the links that open the rest of a list or
    // lead to a detailed report, and the phone's arrangement of the page.
    'Period: {{period}}': 'Período: {{period}}',
    'Show fewer': 'Ver menos',
    'Running totals for the period, day by day, in on-budget accounts. Transfers between accounts are not counted.':
      'Acumulado do período, dia a dia, nas contas no orçamento. Transferências entre contas não entram.',
    'Cash flow report': 'Relatório de fluxo de caixa',
    'Net worth report': 'Relatório de patrimônio líquido',
    'Spending report': 'Relatório de despesas',
    'Custom dashboard': 'Painel personalizável',
    'Detailed reports': 'Relatórios detalhados',
    'Open a report with its own filters':
      'Abra um relatório com filtros próprios',

    // Budget — what the actions of a category and of a month open, on the
    // desktop and on a phone. "Rollover" was "Rolar gasto excedente" in the
    // catalog, a word-for-word rendering that says nothing about where the
    // overspending goes.
    'Transfer to another category': 'Transferir para outra categoria',
    // Where the phone's transfer between two categories goes. The bare `To:`
    // is shared with the date ranges and the catalog reads it "Com:".
    'To:_transfer': 'Para:',
    'Cover overspending': 'Cobrir gastos excedentes',
    'Rollover overspending': 'Levar o gasto excedente para o próximo mês',
    'Remove overspending rollover':
      'Não levar o gasto excedente para o próximo mês',
    Budgeted: 'Orçado',
    Balance: 'Saldo',
    Actions: 'Ações',
    'No notes': 'Sem notas',
    'Edit notes': 'Editar notas',
    'Add category': 'Adicionar categoria',
    'Add category group': 'Adicionar grupo de categorias',
    'Show hidden categories': 'Exibir categorias ocultas',
    // The catalog reads "Mostrar/ocultar categorias" for both states.
    'Hide hidden categories': 'Não exibir categorias ocultas',
    'Switch budget file': 'Trocar de arquivo de orçamento',
    'Available funds': 'Recursos disponíveis',
    'Overspent in {{prevMonthName}}': 'Gasto excedente em {{prevMonthName}}',

    // Budget on a phone — what a screen reader calls the lists and each notice.
    'Expense category groups': 'Grupos de categorias de despesas',
    '{{categoryGroupName}} expense group categories':
      'Categorias do grupo de despesas {{categoryGroupName}}',
    'Income categories': 'Categorias de receitas',
    'Overspent banner': 'Aviso de categorias que passaram do orçado',
    'Uncategorized transactions banner': 'Aviso de transações sem categoria',
    'Overbudgeted banner': 'Aviso de orçamento acima do disponível',

    // Accounts on a phone — the names of its lists. The catalog's "Contas
    // dentro do orçamento" was a second wording for the fork's "No orçamento".
    'Account list': 'Lista de contas',
    'On budget accounts': 'Contas no orçamento',
    'Off budget accounts': 'Contas fora do orçamento',

    // The form the Accounts pages open to add an account.
    Name: 'Nome',
    Cancel: 'Cancelar',
    Create: 'Criar',
    'This cannot be changed later. See <2>Accounts Overview</2> for more information.':
      'Isto não pode ser alterado depois. Veja <2>Visão geral das contas</2> para mais informações.',

    // What the V2 pages open. The catalog's wording, corrected where it was a
    // title in title case ("Nova Transação"), a misspelling ("transacão"), a
    // phrase short of its preposition or a sentence left in English.
    'New Transaction': 'Nova transação',
    'Add transaction': 'Adicionar transação',
    'Budget Summary': 'Resumo do orçamento',
    'For next month': 'Guardado para o próximo mês',
    'Once the account is created, you can also <2>import QIF/OFX/QFX files</2> into it.':
      'Depois de criar a conta, você também pode <2>importar arquivos QIF/OFX/QFX</2> para ela.',

    // ---- Etapa 14 — o que as quatro áreas abrem ----

    // What the four V2 pages open is the application's classic screens: the
    // register of an account, the phone's transaction form, the pickers, the
    // detailed reports and the dashboard. A checkout — or a build — without the
    // upstream catalog showed them in English one tap away from a Portuguese
    // page. Listed here is every string those screens asked for while they were
    // walked on the desktop and on a phone, plus the other strings of the same
    // components (errors, empty states, confirmations). The wording is the
    // catalog's where it had one, brought to this fork's glossary and to
    // sentence case; the catalog's own title case ("Menu da Conta") and second
    // names ("Gastos", "dashboard", "widget") are not carried over.

    // Names the application gives, not the user: a new file, the demo.
    'My Finances': 'Minhas finanças',
    'Test Budget': 'Orçamento de demonstração',
    'Making demo...': 'Criando demonstração…',
    'Creating budget...': 'Criando orçamento…',
    // Translated where they are shown, by `budget/queries` and `payees/queries`.
    // The stored names stay: the server finds this category and this payee by
    // their English names.
    'Starting Balances': 'Saldos iniciais',
    'Starting Balance': 'Saldo inicial',

    // Shell and what any screen may show.
    'All Accounts': 'Todas as contas',
    'On Budget': 'No orçamento',
    'Command Bar': 'Barra de comandos',
    Navigation: 'Navegação',
    Back: 'Voltar',
    Add: 'Adicionar',
    Delete: 'Excluir',
    Remove: 'Remover',
    Rename: 'Renomear',
    Hide: 'Ocultar',
    Export: 'Exportar',
    Import: 'Importar',
    Search: 'Buscar',
    Options: 'Opções',
    // Spelled the same in both languages; declared so that they are a decision
    // and not a missing entry.
    Total: 'Total',
    Menu: 'Menu',

    // The register of an account — its header, its columns and its menus.
    'Account menu': 'Menu da conta',
    'Edit account name': 'Editar nome da conta',
    // The button that opens a new row. The catalog's "Adicionar Novo" leaves
    // out what is added.
    'Add New': 'Nova transação',
    Filter: 'Filtrar',
    'Search {{accountName}}': 'Buscar em {{accountName}}',
    // The phone's other lists of transactions. The first two were English
    // written into the source, and reach the translator from this stage on.
    'Search {{categoryName}}': 'Buscar em {{categoryName}}',
    'Search uncategorized transactions': 'Buscar nas transações sem categoria',
    'Search All Accounts': 'Buscar em todas as contas',
    'Search On Budget Accounts': 'Buscar nas contas no orçamento',
    'Search Off Budget Accounts': 'Buscar nas contas fora do orçamento',
    'Clear search term': 'Limpar a busca',
    Reconcile: 'Reconciliar',
    'Not yet reconciled': 'Ainda não reconciliado',
    'Enter the current balance of your bank account that you want to reconcile with:':
      'Informe o saldo atual da sua conta no banco, com o qual você quer reconciliar:',
    'Cleared total:': 'Total confirmado:',
    'Uncleared total:': 'Total não confirmado:',
    'Selected balance:': 'Saldo selecionado:',
    'Close account': 'Fechar conta',
    'Show balance chart': 'Exibir gráfico de saldo',
    'Hide reconciled transactions': 'Ocultar transações reconciliadas',
    'See schedule details': 'Ver detalhes do agendamento',
    Date: 'Data',
    Account: 'Conta',
    Payee: 'Beneficiário',
    Notes: 'Notas',
    // Which way the money goes in the account. A payment is not always an
    // expense, nor a deposit an income — a transfer is neither — so these are
    // not "Despesa" and "Receita".
    Payment: 'Saída',
    Deposit: 'Entrada',
    'Net Payment': 'Saída líquida',
    'Net Deposit': 'Entrada líquida',
    Net: 'Saldo',
    Cleared: 'Confirmado',
    Uncleared: 'Não confirmado',
    Categorize: 'Categorizar',
    'Split Transaction': 'Dividir transação',
    '(No payee)': '(Sem beneficiário)',
    Uncategorized: 'Sem categoria',
    'Uncategorized & Off budget': 'Sem categoria e fora do orçamento',
    'Collapse split transactions': 'Recolher transações divididas',
    'Expand split transactions': 'Expandir transações divididas',
    'View notes': 'Ver notas',
    'Next month': 'Próximo mês',
    'Previous month': 'Mês anterior',
    '{{count}} transactions_one': '{{count}} transação',
    '{{count}} transactions_many': '{{count}} transações',
    '{{count}} transactions_other': '{{count}} transações',
    Duplicate: 'Duplicar',
    'Create rule': 'Criar regra',
    'Link schedule': 'Vincular agendamento',
    'Unlink schedule': 'Desvincular agendamento',
    'View schedule': 'Ver agendamento',
    'Post transaction': 'Registrar transação',
    'Post transaction today': 'Registrar transação hoje',
    'Skip next scheduled date': 'Pular a próxima data agendada',
    'Mark as completed': 'Marcar como concluído',
    'Unsplit {{count}} transactions_one':
      'Desfazer a divisão de {{count}} transação',
    'Unsplit {{count}} transactions_many':
      'Desfazer a divisão de {{count}} transações',
    'Unsplit {{count}} transactions_other':
      'Desfazer a divisão de {{count}} transações',
    'Transaction list': 'Lista de transações',
    'Loading transactions...': 'Carregando transações…',
    'No transactions': 'Nenhuma transação',
    'Scheduled date': 'Data agendada',

    // What a scheduled transaction is at, where the register lists it. "A
    // vencer" is the word this fork's legend already uses for `due`.
    upcoming: 'próximo',
    due: 'a vencer',
    missed: 'atrasado',
    scheduled: 'agendado',

    // The fields of a transaction as a filter names them, in lower case
    // because the menu capitalises them itself. `saved` is the entry for the
    // filters that were saved, hence the plural.
    date: 'data',
    account: 'conta',
    payee: 'beneficiário',
    notes: 'notas',
    category: 'categoria',
    amount: 'valor',
    cleared: 'confirmado',
    reconciled: 'reconciliado',
    transfer: 'transferência',
    saved: 'salvos',

    // The pickers of a payee, a category and an account.
    'Create payee "{{payeeName}}"': 'Criar beneficiário "{{payeeName}}"',
    'Suggested Payees': 'Beneficiários sugeridos',
    'Nearby Payees': 'Beneficiários próximos',
    'Transfer To/From': 'Transferir para/de',
    'Make transfer': 'Fazer transferência',
    'Manage payees': 'Gerenciar beneficiários',
    'More payees are available, search to find them':
      'Há mais beneficiários; busque para encontrá-los',
    forget: 'Esquecer',
    // What a screen reader is told as a list changes. These replace the fixed
    // English of the list's library; see `Autocomplete`.
    'No results are available.': 'Nenhum resultado disponível.',
    '1 result is available, use up and down arrow keys to navigate. Press Enter key to select.':
      '1 resultado disponível; use as setas para cima e para baixo para navegar. Pressione Enter para selecionar.',
    '{{resultCount}} results are available, use up and down arrow keys to navigate. Press Enter key to select.':
      '{{resultCount}} resultados disponíveis; use as setas para cima e para baixo para navegar. Pressione Enter para selecionar.',

    // Date ranges and intervals, shared by the filters and the reports.
    'All time': 'Desde o início',
    'This week': 'Esta semana',
    'Last week': 'Semana passada',
    // "Último mês" in the catalog, beside "Semana passada" and "Ano passado".
    'Last month': 'Mês passado',
    'Last 3 months': 'Últimos 3 meses',
    'Last 6 months': 'Últimos 6 meses',
    'Last 12 months': 'Últimos 12 meses',
    'Year to date': 'Acumulado no ano',
    'Last year': 'Ano passado',
    'Prior year to date': 'Ano passado até a mesma data',
    Interval: 'Intervalo',
    // The catalog mixes adverbs and adjectives ("Diariamente", "Mensal").
    Daily: 'Diário',
    Weekly: 'Semanal',
    Monthly: 'Mensal',
    Yearly: 'Anual',
    Day: 'Dia',
    Month: 'Mês',
    Year: 'Ano',
    Ascending: 'Crescente',
    // "Descendente" in the catalog, which is somebody's offspring.
    Descending: 'Decrescente',

    // The dashboard. It is "painel" and its widgets are "cartões", as the
    // shipped tips already call them; the catalog says "dashboard" in one
    // menu and "painel" in the next.
    'Add new widget': 'Adicionar novo cartão',
    'Edit dashboard': 'Editar painel',
    'Finish editing dashboard': 'Concluir a edição do painel',
    'Rename dashboard': 'Renomear painel',
    'Delete dashboard': 'Excluir painel',
    'Copy to dashboard': 'Copiar para o painel',
    'Reset to default': 'Restaurar o padrão',
    'Edit content': 'Editar conteúdo',
    'Text position:': 'Posição do texto:',
    Left: 'Esquerda',
    Center: 'Centro',
    Right: 'Direita',
    'Cash flow graph': 'Gráfico de fluxo de caixa',
    'Net worth graph': 'Gráfico de patrimônio líquido',
    'Crossover point': 'Ponto de cruzamento',
    'Age of Money': 'Idade do dinheiro',
    'Spending analysis': 'Análise de despesas',
    'Text widget': 'Cartão de texto',
    'Summary card': 'Cartão de resumo',
    'Calendar card': 'Cartão de calendário',
    'New custom report': 'Novo relatório personalizado',
    'Positive amount: {{amount}}': 'Valor positivo: {{amount}}',
    'Negative amount: {{amount}}': 'Valor negativo: {{amount}}',
    'Compare {{formattedStartDate}} to {{typeOrFormattedEndDate}}':
      'Comparar {{formattedStartDate}} com {{typeOrFormattedEndDate}}',
    budgeted: 'orçado',

    // The detailed reports the V2 Reports page leads to. "Receitas" and
    // "Despesas" as on that page, where the catalog has "Receita" and
    // "Gastos".
    'Loading reports...': 'Carregando relatórios…',
    'Loading report...': 'Carregando relatório…',
    Live: 'Dinâmico',
    Static: 'Estático',
    'Cash Flow': 'Fluxo de caixa',
    'Income:': 'Receitas:',
    'Expenses:': 'Despesas:',
    'Transfers:': 'Transferências:',
    Transfers: 'Transferências',
    'Balance:': 'Saldo:',
    'Change:': 'Variação:',
    'Hide balance': 'Ocultar saldo',
    '<0><0>How is cash flow calculated?</0></0><1>Cash flow shows the balance of your budgeted accounts over time, and the amount of expenses/income each day or month. Your budgeted accounts are considered to be "cash on hand," so this gives you a picture of how available money fluctuates.</1>':
      '<0><0>Como o fluxo de caixa é calculado?</0></0><1>O fluxo de caixa mostra o saldo das suas contas no orçamento ao longo do tempo e o valor das despesas e receitas de cada dia ou mês. As contas no orçamento são tratadas como "dinheiro em mãos", então isto mostra como o dinheiro disponível varia.</1>',
    'Net Worth': 'Patrimônio líquido',
    'How is net worth calculated?': 'Como o patrimônio líquido é calculado?',
    'Net worth shows the balance of all accounts over time, including all of your investments. Your "net worth" is considered to be the amount you\'d have if you sold all your assets and paid off as much debt as possible. If you hover over the graph, you can also see the amount of assets and debt individually.':
      'O patrimônio líquido mostra o saldo de todas as contas ao longo do tempo, incluindo todos os seus investimentos. Seu "patrimônio líquido" é o valor que você teria se vendesse todos os seus ativos e quitasse o máximo possível de dívidas. Passando o cursor sobre o gráfico, você também vê o valor dos ativos e das dívidas separadamente.',
    'Change interval': 'Alterar intervalo',
    'Change mode': 'Alterar modo',
    Trend: 'Tendência',
    // "Acumulado" in the catalog, which is what a running total is called.
    Stacked: 'Empilhado',
    'Monthly Spending': 'Despesas mensais',
    Compare: 'Comparar',
    'Single month': 'Um único mês',
    Average: 'Média',
    'Budgeted MTD': 'Orçado no mês até o momento',
    'Spent {{monthYearFormatted}} MTD':
      'Gasto em {{monthYearFormatted}} até o momento',
    'Spent {{monthYearFormatted}}:': 'Gasto em {{monthYearFormatted}}:',
    '<0><0>How are "Average" and "Spent Average MTD" calculated?</0></0><1>They are both the average cumulative spending by day for the selected average range before the selected "compare" month.</1>':
      '<0><0>Como são calculados "Média" e "Média de gastos no mês até o momento"?</0></0><1>Ambos são a média do gasto acumulado por dia no período de média escolhido, anterior ao mês selecionado em "Comparar".</1>',
    Summary: 'Resumo',
    'Show as': 'Exibir como',
    Sum: 'Soma',
    Percentage: 'Porcentagem',
    'Average per month': 'Média por mês',
    'Average per transaction': 'Média por transação',
    'Average per year': 'Média por ano',
    'all transactions': 'todas as transações',
    Calendar: 'Calendário',

    // The custom report and its side panel.
    'Custom Report:': 'Relatório personalizado:',
    '<0><0>Custom Report:</0></0> <2>{{name}}</2>':
      '<0><0>Relatório personalizado:</0></0> <2>{{name}}</2>',
    'Unsaved report': 'Relatório não salvo',
    Display: 'Exibição',
    'Mode:': 'Modo:',
    'Split:': 'Dividir por:',
    'Type:': 'Tipo:',
    'Interval:': 'Intervalo:',
    'Sort:': 'Ordenar:',
    'Range:': 'Período:',
    Time: 'Tempo',
    'Date filters': 'Filtros de data',
    Group: 'Grupo',
    'Category group': 'Grupo de categorias',
    'Category+Group': 'Categoria + grupo',
    'Bar Graph': 'Gráfico de barras',
    'Line Graph': 'Gráfico de linha',
    'Area Graph': 'Gráfico de área',
    'Donut Graph': 'Gráfico de rosca',
    'Data Table': 'Tabela de dados',
    'Show Legend': 'Exibir legenda',
    'Show Summary': 'Exibir resumo',
    'Show Labels': 'Exibir rótulos',
    'Download Snapshot': 'Baixar imagem do relatório',
    'Select All': 'Selecionar tudo',
    'Unselect All': 'Desmarcar tudo',
    'Hide unchecked': 'Ocultar desmarcados',
    'Show empty rows': 'Exibir linhas vazias',
    'Show rows that are zero or blank': 'Exibir linhas zeradas ou em branco',
    'Show off budget': 'Exibir fora do orçamento',
    'Show off budget accounts': 'Exibir contas fora do orçamento',
    'Show uncategorized': 'Exibir sem categoria',
    'Show uncategorized transactions': 'Exibir transações sem categoria',
    'Include current Month': 'Incluir o mês atual',
    'Include current Month in live range':
      'Incluir o mês atual no período dinâmico',
    'Include current period': 'Incluir o período atual',
    'Include current period in live range':
      'Incluir o período atual no período dinâmico',
    'Trim intervals': 'Remover intervalos vazios',
    'Trim empty intervals at the start and end of the report':
      'Remover intervalos vazios no início e no fim do relatório',
    'Add a trend line per series (line graphs only)':
      'Adicionar uma linha de tendência por série (apenas gráficos de linha)',

    // Budget on a phone — the menus of a category and of a group.
    Automation: 'Automação',

    // The register — the rest of what its header, its table and its menus say.
    'Filtered balance:': 'Saldo filtrado:',
    'Selected transactions': 'Transações selecionadas',
    'Export transactions': 'Exportar transações',
    'Financial files': 'Arquivos financeiros',
    'On Budget Accounts': 'Contas no orçamento',
    'Off Budget Accounts': 'Contas fora do orçamento',
    'Closed Accounts': 'Contas fechadas',
    'Closed: {{ accountName }}': 'Fechada: {{ accountName }}',
    'Closed: {{accountName}}': 'Fechada: {{accountName}}',
    'Reopen account': 'Reabrir conta',
    'Link account': 'Conectar conta',
    'Unlink account': 'Desconectar conta',
    'Bank Sync Offline': 'Sincronização bancária offline',
    'Hide balance chart': 'Ocultar gráfico de saldo',
    'Show reconciled transactions': 'Exibir transações reconciliadas',
    'Show running balance': 'Exibir saldo acumulado',
    'Hide running balance': 'Ocultar saldo acumulado',
    'Remove all sorting': 'Remover toda a ordenação',
    // The account is what was reconciled, so the feminine. What follows is
    // written by the date library in the language of the page.
    'Reconciled {{ relativeTimeAgo }} ({{ absoluteDate }})':
      'Reconciliada {{ relativeTimeAgo }} ({{ absoluteDate }})',
    'All reconciled!': 'Tudo reconciliado!',
    'Create reconciliation transaction': 'Criar transação de reconciliação',
    'Exit reconciliation': 'Sair da reconciliação',
    'Lock transactions': 'Bloquear transações',
    'Use last synced total': 'Usar o último total sincronizado',
    'Last Balance from Bank: ': 'Último saldo informado pelo banco: ',
    "Your cleared balance <2>{{clearedBalance}}</2> needs <5>{{difference}}</5> to match<7></7> your bank's balance of <10>{{bankBalance}}</10>":
      'Seu saldo confirmado de <2>{{clearedBalance}}</2> precisa de <5>{{difference}}</5> para igualar<7></7> o saldo do banco, de <10>{{bankBalance}}</10>',
    'Account is a required field': 'A conta é um campo obrigatório',
    'Add Split': 'Adicionar divisão',
    'Amount left:': 'Valor restante:',
    Distribute: 'Distribuir',
    // Where a category would be, on a transaction that is split.
    'Split ({{count}})': 'Dividida ({{count}})',
    'Imported Payee': 'Beneficiário importado',
    'Imported payee': 'Beneficiário importado',
    'No payee': 'Sem beneficiário',
    'No account': 'Sem conta',
    'Needs Repair': 'Precisa de reparo',
    'See transfer account': 'Ver a conta da transferência',
    'Edit field': 'Editar campo',
    'Make as split transaction': 'Transformar em transação dividida',
    'Run Rules': 'Executar regras',
    Today: 'Hoje',
    '(hidden)': '(oculta)',
    'No results found': 'Nenhum resultado encontrado',
    'New Account': 'Nova conta',
    'Select account': 'Selecionar conta',

    // Filters — the menu, and the operators a condition is written with.
    Filters: 'Filtros',
    Apply: 'Aplicar',
    'Amount (inflow)': 'Valor (entrada)',
    'Amount (outflow)': 'Valor (saída)',
    'Existing filters will be cleared': 'Os filtros atuais serão removidos',
    'Invalid date format': 'Formato de data inválido',
    is: 'é',
    'is not': 'não é',
    'is approx': 'é aproximadamente',
    'one of': 'um dos',
    'not one of': 'não é nenhum dos',
    contains: 'contém',
    'does not contain': 'não contém',
    'is before': 'é antes de',
    'is before or equals': 'é igual ou antes de',
    'is after': 'é depois de',
    'is after or equals': 'é igual ou depois de',
    'is greater than': 'é maior que',
    'is greater than or equals': 'é maior ou igual a',
    'is less than': 'é menor que',
    'is less than or equals': 'é menor ou igual a',
    // A yes/no field reads "confirmado: sim" rather than "é verdadeiro".
    'is true': 'sim',
    'is false': 'não',
    'is on budget': 'está no orçamento',
    'is off budget': 'está fora do orçamento',
    and: 'e',
    or: 'ou',
    'amount (inflow)': 'valor (entrada)',
    'amount (outflow)': 'valor (saída)',
    'category group': 'grupo de categorias',
    'imported payee': 'beneficiário importado',
    'payee (name)': 'beneficiário (nome)',
    set: 'definir',
    'link schedule': 'vincular agendamento',
    'delete transaction': 'excluir transação',
    'prepend to notes': 'acrescentar ao início das notas',
    'append to notes': 'acrescentar ao fim das notas',
    allocate: 'destinar',
    'a fixed amount': 'um valor fixo',
    'a fixed percent of the remainder': 'uma porcentagem fixa do restante',
    'an equal portion of the remainder': 'uma parte igual do restante',
    'based on a formula': 'com base em uma fórmula',
    Pre: 'Pré',
    Post: 'Pós',

    // The phone — the transaction form, its lists and what they answer.
    Transaction: 'Transação',
    Transfer: 'Transferência',
    'Add a note (optional)': 'Adicionar uma nota (opcional)',
    Save: 'Salvar',
    'Save changes': 'Salvar alterações',
    Split: 'Dividir',
    'Delete split': 'Excluir divisão',
    'Delete transaction': 'Excluir transação',
    'Are you sure you want to delete the transaction?':
      'Tem certeza de que deseja excluir a transação?',
    Reconciled: 'Reconciliado',
    '{{status}} (Split)': '{{status}} (dividida)',
    'Amount left: {{amount}}': 'Valor restante: {{amount}}',
    'Add new split - {{amount}} left': 'Adicionar divisão - restam {{amount}}',
    'Use remaining: {{amount}}': 'Usar o restante: {{amount}}',
    Nearby: 'Por perto',
    'Failed to save location': 'Falha ao salvar a localização',
    'Schedule created successfully': 'Agendamento criado com sucesso',
    'Go to budget': 'Ir para o orçamento',
    'To add a transaction, you need to <2>create a category first</2>. You can add categories from the budget page.':
      'Para adicionar uma transação, você precisa <2>criar uma categoria primeiro</2>. Você pode adicionar categorias na página do orçamento.',
    'To add a transaction, you need to <2>create an account first</2>. You can add an account from the accounts page.':
      'Para adicionar uma transação, você precisa <2>criar uma conta primeiro</2>. Você pode adicionar uma conta na página de contas.',
    Edit: 'Editar',
    'Edit fields': 'Editar campos',
    Merge: 'Mesclar',
    'More options': 'Mais opções',
    'Loading...': 'Carregando…',
    'Loading more transactions...': 'Carregando mais transações…',
    'Show transactions': 'Exibir transações',
    'Hide transactions': 'Ocultar transações',
    'Successfully deleted {{count}} transactions._one':
      '{{count}} transação excluída.',
    'Successfully deleted {{count}} transactions._many':
      '{{count}} transações excluídas.',
    'Successfully deleted {{count}} transactions._other':
      '{{count}} transações excluídas.',
    'Successfully duplicated {{count}} transactions._one':
      '{{count}} transação duplicada.',
    'Successfully duplicated {{count}} transactions._many':
      '{{count}} transações duplicadas.',
    'Successfully duplicated {{count}} transactions._other':
      '{{count}} transações duplicadas.',
    'Successfully linked {{count}} transactions to {{schedule}}._one':
      '{{count}} transação vinculada a {{schedule}}.',
    'Successfully linked {{count}} transactions to {{schedule}}._many':
      '{{count}} transações vinculadas a {{schedule}}.',
    'Successfully linked {{count}} transactions to {{schedule}}._other':
      '{{count}} transações vinculadas a {{schedule}}.',
    'Successfully marked {{count}} transactions as transfer._one':
      '{{count}} transação marcada como transferência.',
    'Successfully marked {{count}} transactions as transfer._many':
      '{{count}} transações marcadas como transferência.',
    'Successfully marked {{count}} transactions as transfer._other':
      '{{count}} transações marcadas como transferência.',
    'Successfully unlinked {{count}} transactions from their respective schedules._one':
      '{{count}} transação desvinculada do seu agendamento.',
    'Successfully unlinked {{count}} transactions from their respective schedules._many':
      '{{count}} transações desvinculadas dos seus agendamentos.',
    'Successfully unlinked {{count}} transactions from their respective schedules._other':
      '{{count}} transações desvinculadas dos seus agendamentos.',
    'Successfully merged transactions': 'Transações mescladas com sucesso',
    'View rules': 'Ver regras',
    '{{count}} associated rules_one': '{{count}} regra associada',
    '{{count}} associated rules_many': '{{count}} regras associadas',
    '{{count}} associated rules_other': '{{count}} regras associadas',

    // Budget on a phone — covering, and the notices of a month. "Orçado a
    // mais" and "passou do orçado" are what its page already says.
    'Cover overbudgeted': 'Cobrir o orçado a mais',
    'Covered {{toCategoryName}} overspending from {{fromCategoryName}}.':
      'O gasto excedente de {{toCategoryName}} foi coberto por {{fromCategoryName}}.',
    'Covered overbudgeted from {{categoryName}}':
      'O orçado a mais foi coberto por {{categoryName}}',
    'Overspent categories': 'Categorias que passaram do orçado',
    'Budget automations': 'Automações do orçamento',
    'budget templates have been applied.':
      'modelos de orçamento foram aplicados.',
    'Overwrite with templates': 'Sobrescrever com modelos',
    'New category name': 'Nome da nova categoria',
    'New group name': 'Nome do novo grupo',
    Show: 'Exibir',

    // Reports and the dashboard — the rest of their menus, notices and errors.
    // Also the name a dashboard is given when it is created.
    'New dashboard': 'Novo painel',
    'Add new dashboard': 'Adicionar novo painel',
    'Export Dashboard': 'Exportar painel',
    'Import is running...': 'Importação em andamento…',
    "Dashboard has been successfully imported. Don't like what you see? You can always press [ctrl+z](#undo) to undo.":
      'O painel foi importado. Não gostou do resultado? Pressione [ctrl+z](#undo) para desfazer.',
    "Dashboard has been successfully reset to default state. Don't like what you see? You can always press [ctrl+z](#undo) to undo.":
      'O painel voltou ao padrão. Não gostou do resultado? Pressione [ctrl+z](#undo) para desfazer.',
    'Failed importing the dashboard file.':
      'Falha ao importar o arquivo do painel.',
    'Failed parsing the imported JSON.':
      'Falha ao interpretar o JSON importado.',
    'Fatal error occurred: unable to open import file dialog.':
      'Erro fatal: não foi possível abrir a janela de importação de arquivo.',
    'This widget has failed to load.': 'Não foi possível carregar este cartão.',
    'Failed to save dashboard widget.': 'Falha ao salvar o cartão do painel.',
    'Cannot save: No widget available.':
      'Não é possível salvar: nenhum cartão disponível.',
    // Also what a text card says until it is edited.
    'Edit this widget to change the **markdown** content.':
      'Edite este cartão para alterar o conteúdo em **markdown**.',
    'Text Widget': 'Cartão de texto',
    'Formula card': 'Cartão de fórmula',
    'Sankey card': 'Cartão Sankey',
    'Balance forecast': 'Previsão de saldo',
    'Budget analysis': 'Análise do orçamento',
    'Monte Carlo analysis': 'Análise de Monte Carlo',
    'Show balance': 'Exibir saldo',
    'Assets:': 'Ativos:',
    'Debt:': 'Dívidas:',
    'Net worth:': 'Patrimônio líquido:',
    'All future': 'Todo o futuro',
    'Current month': 'Mês atual',
    // Of a date range. The catalog reads the second "Com:".
    'From:': 'De:',
    'To:': 'Até:',
    average: 'média',
    'There was a problem loading your date range':
      'Ocorreu um problema ao carregar o período',
    Closed: 'Fechadas',
    'Show unchecked': 'Exibir desmarcados',
    'Stacked Bar Graph': 'Gráfico de barras empilhadas',
    'Custom Report: {{name}}': 'Relatório personalizado: {{name}}',
    'This report is configured to use a non-existing filter value (i.e. category/account/payee).':
      'Este relatório usa um valor de filtro que não existe mais (por exemplo, uma categoria, uma conta ou um beneficiário).',
    'Choose Report': 'Escolher relatório',
    'Save new report': 'Salvar novo relatório',
    'Update report': 'Atualizar relatório',
    'Revert changes': 'Reverter alterações',
    'Include current Year': 'Incluir o ano atual',
    'Include current Year in live range':
      'Incluir o ano atual no período dinâmico',
    'Remove active category filters to show the category selector.':
      'Remova os filtros de categoria ativos para exibir o seletor de categorias.',
    'Save compare and filter options':
      'Salvar opções de comparação e de filtro',
    'Spent {{monthYearFormatted}}': 'Gasto em {{monthYearFormatted}}',
    'Spent {{monthYearFormatted}} MTD:':
      'Gasto em {{monthYearFormatted}} até o momento:',
    'All time divisor': 'Divisor para todo o período',
    'number of months': 'número de meses',
    'number of transactions': 'número de transações',
    'number of years': 'número de anos',

    // Importing a file of transactions into an account, from its register.
    'Import transactions': 'Importar transações',
    'Import {{count}} transactions_one': 'Importar {{count}} transação',
    'Import {{count}} transactions_many': 'Importar {{count}} transações',
    'Import {{count}} transactions_other': 'Importar {{count}} transações',
    'No transactions found': 'Nenhuma transação encontrada',
    'Select new file...': 'Selecionar outro arquivo…',
    'Error:': 'Erro:',
    'CSV FIELDS': 'CAMPOS DO CSV',
    'CSV OPTIONS': 'OPÇÕES DO CSV',
    'AMOUNT OPTIONS': 'OPÇÕES DE VALOR',
    'Delimiter:': 'Delimitador:',
    'File has header row': 'O arquivo tem linha de cabeçalho',
    'Skip start lines:': 'Ignorar linhas iniciais:',
    'Skip end lines:': 'Ignorar linhas finais:',
    'Only import transactions since:':
      'Importar somente transações a partir de:',
    'Flip amount': 'Inverter o sinal do valor',
    'Split amount into separate inflow/outflow columns':
      'Separar o valor em colunas de entrada e de saída',
    'In/Out': 'Entrada/saída',
    // "Em fluxo" and "Fora de fluxo" in the catalog.
    Inflow: 'Entrada',
    Outflow: 'Saída',
    Clear: 'Limpar',
    'Clear transactions on import': 'Confirmar as transações ao importar',
    'Merge with existing transactions': 'Mesclar com as transações existentes',
    'Reimport deleted transactions': 'Reimportar transações excluídas',
    'Import notes from file': 'Importar as notas do arquivo',
    'Swap Payee and Memo': 'Trocar beneficiário e nota',
    'Use Memo as a fallback for empty Payees':
      'Usar a nota quando o beneficiário estiver vazio',
    'Transaction on {{date}} has no amount':
      'A transação de {{date}} não tem valor',
    'Unable to parse date {{date}} with given date format':
      'Não foi possível ler a data {{date}} com o formato de data informado',

    // The list of budget files, where "Trocar arquivo" leads.
    Files: 'Arquivos',
    'Budget files': 'Arquivos de orçamento',
    'No budget files': 'Nenhum arquivo de orçamento',
    'Create new file': 'Criar novo arquivo',
    'Create test file': 'Criar arquivo de teste',
    'Import file': 'Importar arquivo',
    Refresh: 'Atualizar',
    Local: 'Local',
    Syncing: 'Sincronizando',
    'Available for download': 'Disponível para baixar',
    'Network unavailable': 'Conexão indisponível',
    Unknown: 'Desconhecido',
    'Owner:': 'Proprietário:',
    You: 'Você',
    Unassigned: 'Não atribuído',
    'This file is encrypted and you have key to access it.':
      'Este arquivo é criptografado e você tem a chave para acessá-lo.',
    'This is a cloud-based file but its state is unknown because you are offline.':
      'Este é um arquivo na nuvem, mas seu estado é desconhecido porque você está offline.',

    // ---- Etapa 14, ajuste final — nomes de fábrica, mensagens e diálogos ----

    // The categories and groups a new budget file ships with, as they are
    // shown; see `budget/starterCategories`. The file keeps the English names,
    // and a row is translated only while it has the id and the name it shipped
    // with. "Bills" is not "Contas", which here is what accounts are called.
    'Usual Expenses_starter': 'Despesas do dia a dia',
    'Investments and Savings_starter': 'Investimentos e poupança',
    Income_starter: 'Receitas',
    Food_starter: 'Alimentação',
    General_starter: 'Geral',
    Bills_starter: 'Contas fixas',
    'Bills (Flexible)_starter': 'Contas variáveis',
    Savings_starter: 'Poupança',

    // Words the application writes into what it creates.
    // The notes of the transaction that closes a reconciliation.
    'Reconciliation balance adjustment': 'Ajuste de saldo da reconciliação',
    'New Category': 'Nova categoria',
    'New Category Group': 'Novo grupo de categorias',

    // What an action on an account, a category, a report or a file answers when it fails.
    'There was an error closing the account. Please try again.':
      'Ocorreu um erro ao fechar a conta. Tente novamente.',
    'There was an error creating the account. Please try again.':
      'Ocorreu um erro ao criar a conta. Tente novamente.',
    'There was an error importing preview transactions to the account. Please try again.':
      'Ocorreu um erro ao pré-visualizar a importação de transações para a conta. Tente novamente.',
    'There was an error importing transactions to the account. Please try again.':
      'Ocorreu um erro ao importar as transações para a conta. Tente novamente.',
    'There was an error linking the account. Please try again.':
      'Ocorreu um erro ao conectar a conta. Tente novamente.',
    'There was an error moving the account. Please try again.':
      'Ocorreu um erro ao mover a conta. Tente novamente.',
    'There was an error re-opening the account. Please try again.':
      'Ocorreu um erro ao reabrir a conta. Tente novamente.',
    'There was an error syncing accounts. Please try again.':
      'Ocorreu um erro ao sincronizar as contas. Tente novamente.',
    'There was an error unlinking the account. Please try again.':
      'Ocorreu um erro ao desconectar a conta. Tente novamente.',
    'There was an error updating the account. Please try again.':
      'Ocorreu um erro ao atualizar a conta. Tente novamente.',
    'There was an error applying the budget action. Please try again.':
      'Ocorreu um erro ao aplicar a ação de orçamento. Tente novamente.',
    'There was an error creating the category group. Please try again.':
      'Ocorreu um erro ao criar o grupo de categorias. Tente novamente.',
    'There was an error creating the category. Please try again.':
      'Ocorreu um erro ao criar a categoria. Tente novamente.',
    'There was an error deleting the category group. Please try again.':
      'Ocorreu um erro ao excluir o grupo de categorias. Tente novamente.',
    'There was an error deleting the category. Please try again.':
      'Ocorreu um erro ao excluir a categoria. Tente novamente.',
    'There was an error moving the category group. Please try again.':
      'Ocorreu um erro ao mover o grupo de categorias. Tente novamente.',
    'There was an error moving the category. Please try again.':
      'Ocorreu um erro ao mover a categoria. Tente novamente.',
    'There was an error updating the category group. Please try again.':
      'Ocorreu um erro ao atualizar o grupo de categorias. Tente novamente.',
    'There was an error updating the category. Please try again.':
      'Ocorreu um erro ao atualizar a categoria. Tente novamente.',
    'A category group with name "{{name}}" already exists.':
      'Já existe um grupo de categorias chamado "{{name}}".',
    'Category "{{name}}" already exists in group (it may be hidden)':
      'A categoria "{{name}}" já existe no grupo (pode estar oculta)',
    'There was an error adding the dashboard widget. Please try again.':
      'Ocorreu um erro ao adicionar o cartão ao painel. Tente novamente.',
    'There was an error copying the dashboard widget. Please try again.':
      'Ocorreu um erro ao copiar o cartão do painel. Tente novamente.',
    'There was an error creating the dashboard page. Please try again.':
      'Ocorreu um erro ao criar o painel. Tente novamente.',
    'There was an error creating the report. Please try again.':
      'Ocorreu um erro ao criar o relatório. Tente novamente.',
    'There was an error deleting the dashboard page. Please try again.':
      'Ocorreu um erro ao excluir o painel. Tente novamente.',
    'There was an error deleting the report. Please try again.':
      'Ocorreu um erro ao excluir o relatório. Tente novamente.',
    'There was an error importing the dashboard page. Please try again.':
      'Ocorreu um erro ao importar o painel. Tente novamente.',
    'There was an error removing the dashboard widget. Please try again.':
      'Ocorreu um erro ao remover o cartão do painel. Tente novamente.',
    'There was an error renaming the dashboard page. Please try again.':
      'Ocorreu um erro ao renomear o painel. Tente novamente.',
    'There was an error resetting the dashboard page. Please try again.':
      'Ocorreu um erro ao restaurar o painel. Tente novamente.',
    'There was an error updating the dashboard widget. Please try again.':
      'Ocorreu um erro ao atualizar o cartão do painel. Tente novamente.',
    'There was an error updating the dashboard widgets. Please try again.':
      'Ocorreu um erro ao atualizar os cartões do painel. Tente novamente.',
    'There was an error updating the report. Please try again.':
      'Ocorreu um erro ao atualizar o relatório. Tente novamente.',
    'Name {{ newAccountName }} already exists.':
      'O nome {{ newAccountName }} já existe.',
    'Name cannot be blank.': 'O nome não pode ficar em branco.',
    'A file with id "{{id}}" already exists with the name "{{name}}". This file will be replaced. This probably happened because files were manually moved around outside of Actual.':
      'Já existe um arquivo com o id "{{id}}" e o nome "{{name}}". Ele será substituído. Isso provavelmente aconteceu porque arquivos foram movidos manualmente, fora do Actual.',
    'Closing...': 'Fechando…',
    'Downloading...': 'Baixando…',
    'Duplicating: {{oldName}} to: {{newName}}':
      'Duplicando {{oldName}} como {{newName}}',
    'Make sure the app is up-to-date.': 'Verifique se o app está atualizado.',
    'We hit a limit on the local storage available. Edits may not be saved. Please get in touch https://actualbudget.org/contact/ so we can help debug this.':
      'Atingimos o limite do armazenamento local disponível. As edições podem não ser salvas. Entre em contato pelo https://actualbudget.org/contact/ para que possamos ajudar a investigar.',
    'Something internally went wrong. You may want to restart the app if anything looks wrong. Please report this as a new issue on GitHub.':
      'Algo deu errado internamente. Se alguma coisa parecer incorreta, reinicie o app. Por favor, relate o problema abrindo uma issue no GitHub.',
    'File path copied to clipboard':
      'Caminho do arquivo copiado para a área de transferência',

    // Starting up, updating, and when the application cannot go on.
    'Initializing the connection to the local database...':
      'Iniciando a conexão com o banco de dados local…',
    'Loading global preferences...': 'Carregando preferências globais…',
    'Opening last budget...': 'Abrindo o último orçamento…',
    'Retrieving remote files...': 'Buscando arquivos remotos…',
    'Downloading and applying update...': 'Baixando e aplicando a atualização…',
    'Login expired': 'Sessão expirada',
    'Go to login': 'Ir para o login',
    'App updated to {{version}}': 'App atualizado para a versão {{version}}',
    Restart: 'Reiniciar',
    'Update now': 'Atualizar agora',
    'Click the button below to reload and apply the update.':
      'Clique no botão abaixo para recarregar e aplicar a atualização.',
    'A new version of Actual is available! Your Pikapods instance will be automatically updated in the next few days - no action needed.':
      'Uma nova versão do Actual está disponível! Sua instância no Pikapods será atualizada automaticamente nos próximos dias — nenhuma ação é necessária.',
    'Something went wrong loading this section.':
      'Algo deu errado ao carregar esta seção.',
    'Try again': 'Tentar novamente',
    'Fatal Error': 'Erro fatal',
    'Loading Error': 'Erro ao carregar',
    'Show Error': 'Exibir o erro',
    'Restart app': 'Reiniciar o app',
    'Open Actual': 'Abrir o Actual',
    'Advanced options': 'Opções avançadas',
    'There was an unrecoverable error in the UI. Sorry!':
      'Ocorreu um erro irrecuperável na interface. Desculpe!',
    'There was a problem loading the app in this browser version.':
      'Houve um problema ao carregar o app nesta versão do navegador.',
    'There was a problem loading one of the chunks of the application. Please reload the page and try again. If the issue persists - there might be an issue with either your internet connection and/or the server where the app is hosted.':
      'Houve um problema ao carregar uma das partes do aplicativo. Recarregue a página e tente novamente. Se o problema continuar, pode haver algo errado com a sua conexão de internet ou com o servidor onde o app está hospedado.',
    'If this error persists, please get <2>in touch</2> so it can be investigated.':
      'Se o erro persistir, <2>entre em contato</2> para que ele possa ser investigado.',
    "Your browser doesn't support IndexedDB in this environment, a feature that Actual requires to run. This might happen if you are in private browsing mode. Please try a different browser or turn off private browsing.":
      'Seu navegador não oferece suporte a IndexedDB neste ambiente, um recurso de que o Actual precisa para funcionar. Isso pode acontecer no modo de navegação privada. Tente outro navegador ou desative a navegação privada.',
    "Actual requires access to <1>SharedArrayBuffer</1> in order to function properly. If you're seeing this error, either your browser does not support <3>SharedArrayBuffer</3>, or your server is not sending the appropriate headers, or you are not using HTTPS. See <6>our troubleshooting documentation</6> to learn more. <9></9>":
      'O Actual precisa de acesso ao <1>SharedArrayBuffer</1> para funcionar corretamente. Se você está vendo este erro, ou o seu navegador não oferece suporte a <3>SharedArrayBuffer</3>, ou o seu servidor não está enviando os cabeçalhos necessários, ou você não está usando HTTPS. Consulte a <6>nossa documentação de solução de problemas</6> para saber mais. <9></9>',
    'Actual uses <1>SharedArrayBuffer</1> to allow usage from multiple tabs at once and to ensure correct behavior when switching files. While it can run without access to<3>SharedArrayBuffer</3>, you may encounter data loss or notice multiple budget files being merged with each other.':
      'O Actual usa <1>SharedArrayBuffer</1> para permitir o uso em várias abas ao mesmo tempo e garantir o comportamento correto ao trocar de arquivo. Ele até funciona sem acesso ao <3>SharedArrayBuffer</3>, mas você pode perder dados ou ver arquivos de orçamento sendo mesclados entre si.',
    'I understand the risks, run Actual in the unsupported fallback mode':
      'Entendo os riscos; executar o Actual no modo alternativo, sem suporte',

    // The header and its menus — the rest.
    'Server Sync': 'Sincronização com o servidor',
    Disabled: 'Desativado',
    'Load Backup…': 'Carregar backup…',
    'Goal templates': 'Modelos de metas',
    Undo: 'Desfazer',
    Redo: 'Refazer',
    'Notes (markdown supported)': 'Notas (aceita markdown)',
    'Notes: {{name}}': 'Notas: {{name}}',
    'Save notes': 'Salvar notas',

    // Budget — the menus and notices of a month and of a category. "Orçado"
    // for the amount planned, "guardar" for what is held for next month and
    // "orçado a mais" for more planned than there is, as the V2 pages say.
    "Copy last month's budget": 'Copiar o orçado do mês passado',
    'Set to 3 month average': 'Definir pela média de 3 meses',
    'Set to 6 month average': 'Definir pela média de 6 meses',
    'Set to yearly average': 'Definir pela média anual',
    'Overwrite with template': 'Sobrescrever com o modelo',
    'Copy until year end': 'Copiar até o fim do ano',
    'Set budgets to zero': 'Zerar o orçado de todas as categorias',
    'Set budgets to 3 month average': 'Definir o orçado pela média de 3 meses',
    'Set budgets to 6 month average': 'Definir o orçado pela média de 6 meses',
    'Set budgets to 12 month average':
      'Definir o orçado pela média de 12 meses',
    'Check templates': 'Verificar modelos',
    'Apply budget template': 'Aplicar modelo de orçamento',
    'Overwrite with budget template': 'Sobrescrever com o modelo de orçamento',
    'End of month cleanup': 'Limpeza de fim de mês',
    'Collapse month summary': 'Recolher o resumo do mês',
    'Expand month summary': 'Expandir o resumo do mês',
    '{{displayMonth}} budgets have all been set to zero.':
      'O orçado de {{displayMonth}} foi zerado.',
    "{{displayMonth}} budgets have all been set to last month's budgeted amounts.":
      'O orçado de {{displayMonth}} foi definido com os valores do mês passado.',
    '{{displayMonth}} budget templates have been applied.':
      'Os modelos de orçamento de {{displayMonth}} foram aplicados.',
    '{{displayMonth}} budget templates have been overwritten.':
      'Os modelos de orçamento de {{displayMonth}} foram sobrescritos.',
    '{{displayMonth}} end-of-month cleanup templates have been applied.':
      'A limpeza de fim de mês de {{displayMonth}} foi aplicada.',
    "Budget set to last month's budget.":
      'Orçado definido com o valor do mês passado.',
    'Budget set to {{numberOfMonths}}-month average.':
      'Orçado definido pela média de {{numberOfMonths}} meses.',
    'Budget template applied.': 'Modelo de orçamento aplicado.',
    'Budget copied until year end.': 'Orçado copiado até o fim do ano.',
    '{{categoryName}} budget copied until year end.':
      'O orçado de {{categoryName}} foi copiado até o fim do ano.',
    'Overbudgeted:': 'Orçado a mais:',
    'Move to a category': 'Mover para uma categoria',
    'Cover from a category': 'Cobrir com uma categoria',
    'Hold for next month': 'Guardar para o próximo mês',
    "Reset next month's buffer":
      'Liberar o que foi guardado para o próximo mês',
    'Disable current auto hold': 'Desativar a guarda automática atual',
    'Enable auto hold': 'Ativar a guarda automática',
    'Disable auto hold': 'Desativar a guarda automática',
    'No actions available': 'Nenhuma ação disponível',
    Hold: 'Guardar',
    'Hold this amount:': 'Guardar este valor:',
    'Cover this amount:': 'Cobrir este valor:',
    'Transfer this amount:': 'Transferir este valor:',
    // Of a category to cover from.
    '(none)': '(nenhuma)',
    'View transactions': 'Ver transações',
    Received: 'Recebido',
    Spent: 'Gasto',
    Collapse: 'Recolher',
    'Collapse all': 'Recolher tudo',
    Expand: 'Expandir',
    'Expand all': 'Expandir tudo',
    'Fully Expand': 'Expandir totalmente',
    'Toggle hidden categories': 'Exibir ou ocultar as categorias ocultas',
    '<0>Balance:</0><1>{{amount}}</1>': '<0>Saldo:</0><1>{{amount}}</1>',
    '<0>Budgeted:</0><1>{{amount}}</1>': '<0>Orçado:</0><1>{{amount}}</1>',
    '<0>Goal:</0><1>{{amount}}</1>': '<0>Meta:</0><1>{{amount}}</1>',
    '<0>Goal Type:</0><1>{{type}}</1>': '<0>Tipo de meta:</0><1>{{type}}</1>',
    'Fully funded': 'Meta atingida',
    'Overfunded ({{amount}})': 'Acima da meta ({{amount}})',
    'Underfunded ({{amount}})': 'Abaixo da meta ({{amount}})',
    '<allocatedAmount /> <italic>of <totalAmount /></italic>':
      '<allocatedAmount /> <italic>de <totalAmount /></italic>',
    'Saved:': 'Economizado:',
    'Projected savings:': 'Economia projetada:',
    'Overspent:': 'Gasto excedente:',
    'Difference:': 'Diferença:',
    'Covered {{amount}} {{toCategoryName}} overspending from {{fromCategoryName}}.':
      '{{amount}} do gasto excedente de {{toCategoryName}} cobertos por {{fromCategoryName}}.',
    'Transferred {{amount}} from {{fromCategoryName}} to {{toCategoryName}}.':
      '{{amount}} transferidos de {{fromCategoryName}} para {{toCategoryName}}.',
    '{{scheduleName}} is due {{distanceFromNow}} ({{formattedDate}})':
      '{{scheduleName}} vence {{distanceFromNow}} ({{formattedDate}})',
    'Missed {{scheduleName}} due {{distanceFromNow}} ({{formattedDate}})':
      '{{scheduleName}} está atrasado: venceu {{distanceFromNow}} ({{formattedDate}})',
    // Fills `distanceFromNow` above when the schedule is due today.
    today: 'hoje',
    'Confirm Delete': 'Confirmar exclusão',
    'Transfer to:': 'Transferir para:',
    '<0>{{category}}</0> is used by existing transactions.':
      '<0>{{category}}</0> é usada por transações existentes.',
    '<0>{{category}}</0> is used by existing transactions or it has a positive leftover balance currently.':
      '<0>{{category}}</0> é usada por transações existentes ou tem saldo positivo no momento.',
    'Categories in the group <2>{{group}}</2> are used by existing transactions.':
      'Categorias do grupo <2>{{group}}</2> são usadas por transações existentes.',
    'Categories in the group <2>{{group}}</2> are used by existing transactions or it has a positive leftover balance currently.':
      'Categorias do grupo <2>{{group}}</2> são usadas por transações existentes ou têm saldo positivo no momento.',
    '<0>Are you sure you want to delete it?</0> If so, you must select another category to transfer existing transactions and balance to.':
      '<0>Tem certeza de que deseja excluir?</0> Nesse caso, selecione outra categoria para receber as transações e o saldo existentes.',

    // Accounts — closing one, adding one, and the dialogs of its register.
    'Close Account': 'Fechar conta',
    'Are you sure you want to close <2>{{accountName}}</2>? ':
      'Tem certeza de que deseja fechar <2>{{accountName}}</2>? ',
    'This account has a balance of <2>{{balance}}</2>. To close this account, select a different account to transfer this balance to:':
      'Esta conta tem saldo de <2>{{balance}}</2>. Para fechá-la, selecione outra conta para receber esse saldo:',
    'Since you are transferring the balance from an on budget account to an off budget account, this transaction must be categorized. Select a category:':
      'Como você está transferindo o saldo de uma conta no orçamento para uma conta fora do orçamento, esta transação precisa de uma categoria. Selecione uma:',
    'This account has no transactions so it will be permanently deleted.':
      'Esta conta não tem transações, então será excluída definitivamente.',
    "This account has transactions so we can't permanently delete it.":
      'Esta conta tem transações, então não pode ser excluída definitivamente.',
    'You can also <2>force close</2> the account which will delete it and all its transactions permanently. Doing so may change your budget unexpectedly since money in it may vanish.':
      'Você também pode <2>forçar o fechamento</2> da conta, o que a exclui definitivamente com todas as suas transações. Isso pode alterar seu orçamento de forma inesperada, já que o dinheiro dela pode desaparecer.',
    'Select account...': 'Selecione uma conta…',
    'Select category...': 'Selecione uma categoria…',
    'Transfer is required': 'A transferência é obrigatória',
    'Category is required': 'A categoria é obrigatória',
    'Create a local account': 'Criar uma conta local',
    '<0>Create a local account</0> if you want to add transactions manually. You can also <3>import QIF/OFX/QFX files into a local account</3>.':
      '<0>Crie uma conta local</0> se quiser adicionar transações manualmente. Você também pode <3>importar arquivos QIF/OFX/QFX para uma conta local</3>.',
    'Choose a bank sync provider to connect this account.':
      'Escolha um provedor de sincronização bancária para conectar esta conta.',
    'Configure providers and link accounts from the Bank Sync page.':
      'Configure provedores e conecte contas na página Sincronização bancária.',
    'Reconciled Transaction': 'Transação reconciliada',
    Confirm: 'Confirmar',
    'Are you sure you want to edit this transaction?':
      'Tem certeza de que deseja editar esta transação?',
    'Saving your changes to this reconciled transaction may bring your reconciliation out of balance.':
      'Salvar as alterações nesta transação reconciliada pode desequilibrar a sua reconciliação.',
    'Editing reconciled transactions may bring your reconciliation out of balance.':
      'Editar transações reconciliadas pode desequilibrar a sua reconciliação.',
    'Deleting reconciled transactions may bring your reconciliation out of balance.':
      'Excluir transações reconciliadas pode desequilibrar a sua reconciliação.',
    "This transfer has a linked transaction in another account that is reconciled. Editing it may bring that account's reconciliation out of balance.":
      'Esta transferência tem uma transação vinculada, em outra conta, que está reconciliada. Editá-la pode desequilibrar a reconciliação daquela conta.',
    "This transfer has a linked transaction in another account that is reconciled. Deleting it may bring that account's reconciliation out of balance.":
      'Esta transferência tem uma transação vinculada, em outra conta, que está reconciliada. Excluí-la pode desequilibrar a reconciliação daquela conta.',
    "Unlocking this transaction means you won't be warned about changes that can impact your reconciled balance. (Changes to amount, account, payee, etc).":
      'Desbloquear esta transação significa que você não será avisado sobre alterações que podem afetar seu saldo reconciliado (valor, conta, beneficiário etc.).',
    "Your cleared balance <2>{{clearedBalance}}</2> needs <5>{{difference}}</5> to match your bank's balance of <8>{{bankBalance}}</8>":
      'Seu saldo confirmado de <2>{{clearedBalance}}</2> precisa de <5>{{difference}}</5> para igualar o saldo do banco, de <8>{{bankBalance}}</8>',
    'Convert to Schedule': 'Converter em agendamento',
    'This transaction has a future date. Would you like to convert it to a single-time schedule instead?':
      'Esta transação tem data futura. Deseja convertê-la em um agendamento de ocorrência única?',
    'The transaction will appear as a schedule preview in your account.':
      'A transação aparecerá na conta como prévia de um agendamento.',
    '<0>Warning:</0> This transaction is {{daysUntilTransaction}} days away, which is beyond your configured upcoming length of {{upcomingDays}} days. The schedule preview will not be visible in your account until it gets closer to the date.':
      '<0>Aviso:</0> faltam {{daysUntilTransaction}} dias para esta transação, mais do que a antecedência configurada de {{upcomingDays}} dias. A prévia do agendamento só aparecerá na conta quando a data estiver mais próxima.',
    'Yes, create schedule': 'Sim, criar agendamento',
    'No, keep as transaction': 'Não, manter como transação',
    'Are you sure you want to delete these {{count}} transactions?_one':
      'Tem certeza de que deseja excluir esta transação?',
    'Are you sure you want to delete these {{count}} transactions?_many':
      'Tem certeza de que deseja excluir estas {{count}} transações?',
    'Are you sure you want to delete these {{count}} transactions?_other':
      'Tem certeza de que deseja excluir estas {{count}} transações?',
    'Split (no payee)': 'Dividida (sem beneficiário)',
    '(+{{numHiddenPayees}} more)': '(mais {{numHiddenPayees}})',
    Find: 'Localizar',
    Replace: 'Substituir',
    'Use Regular Expressions': 'Usar expressões regulares',
    'Find value required': 'Informe o texto a localizar',
    'Invalid regular expression': 'Expressão regular inválida',
    'Invalid amount value': 'Valor inválido',
    'Make negative': 'Tornar negativo',
    'Make positive': 'Tornar positivo',
    yyyy: 'aaaa',
    // The phone's calculator keypad.
    Dismiss: 'Fechar',
    Reset: 'Limpar',

    // Filters — saved filters and the rest of the menu.
    'Saved Filters': 'Filtros salvos',
    'Unsaved filter': 'Filtro não salvo',
    '(modified)': '(modificado)',
    'Save new filter': 'Salvar novo filtro',
    'Update conditions': 'Atualizar condições',
    'Clear all conditions': 'Limpar todas as condições',
    'Delete filter': 'Excluir filtro',
    'Filter name': 'Nome do filtro',
    Update: 'Atualizar',
    nothing: 'vazio',

    // Importing transactions — what each row of the preview says.
    'Date format': 'Formato de data',
    Multiplier: 'Multiplicador',
    'Multiply amount': 'Multiplicar o valor',
    'Select column to specify if amount goes in/out':
      'Selecionar a coluna que indica se o valor entra ou sai',
    'In/Out outflow value': 'Valor que indica saída',
    "Value for out rows, e.g: 'Credit'":
      "Valor das linhas de saída, ex.: 'Débito'",
    Empty: 'Vazio',
    Invalid: 'Inválido',
    'Invalid: unable to parse the value':
      'Inválido: não foi possível ler o valor',
    'Invalid: unable to parse the value ({{amount}})':
      'Inválido: não foi possível ler o valor ({{amount}})',
    'New transaction. You can import it, or skip it.':
      'Transação nova. Você pode importá-la ou ignorá-la.',
    'Already imported transaction. You can skip it, or import it again.':
      'Transação já importada. Você pode ignorá-la ou importá-la de novo.',
    'Updated transaction. You can update it, import it again, or skip it.':
      'Transação atualizada. Você pode atualizá-la, importá-la de novo ou ignorá-la.',
    'This transaction will be deleted by Rules':
      'Esta transação será excluída pelas regras',

    // Reports — saving a report, the dashboard's notices and what the graphs say.
    'Saved Reports': 'Relatórios salvos',
    'Report Name': 'Nome do relatório',
    Dashboard: 'Painel',
    None: 'Nenhum',
    'Please select a dashboard to save the report':
      'Selecione um painel para salvar o relatório',
    "Are you sure you want to delete the report named '<2>{{name}}</2>'?":
      "Tem certeza de que deseja excluir o relatório '<2>{{name}}</2>'?",
    Yes: 'Sim',
    No: 'Não',
    'Dashboard not found': 'Painel não encontrado',
    'Loading dashboards...': 'Carregando painéis…',
    'No dashboards available': 'Nenhum painel disponível',
    'Save widget': 'Salvar cartão',
    'Dashboard widget successfully saved.': 'Cartão do painel salvo.',
    'Save failed: No widget found to save.':
      'Falha ao salvar: nenhum cartão encontrado.',
    'There was a problem loading your report':
      'Ocorreu um problema ao carregar o relatório',
    'Failed saving report name: {{error}}':
      'Falha ao salvar o nome do relatório: {{error}}',
    'This custom report has been deleted.':
      'Este relatório personalizado foi excluído.',
    'The widget is configured to use a non-existing filter value (i.e. category/account/payee). Edit the filters used in this report widget to remove the warning.':
      'Este cartão usa um valor de filtro que não existe mais (por exemplo, uma categoria, uma conta ou um beneficiário). Edite os filtros deste cartão para remover o aviso.',
    'Hidden amount': 'Valor oculto',
    'Unknown amount': 'Valor desconhecido',
    'Zero amount': 'Valor zero',
    'No data available': 'Nenhum dado disponível',
    Totals: 'Totais',
    Payments: 'Saídas',
    Deposits: 'Entradas',
    'For this time period': 'Neste período',
    'Per {{interval}}': 'Por {{interval}}',
    'TOTAL SPENDING': 'TOTAL DE DESPESAS',
    'TOTAL DEPOSITS': 'TOTAL DE ENTRADAS',
    'TOTAL BUDGETED': 'TOTAL ORÇADO',
    // `net` is one of the two words below, both feminine here.
    'NET {{net}}': '{{net}} LÍQUIDA',
    PAYMENT: 'SAÍDA',
    DEPOSIT: 'ENTRADA',
    'AVERAGE SPENDING': 'DESPESA MÉDIA',
    'AVERAGE DEPOSIT': 'ENTRADA MÉDIA',
    'AVERAGE BUDGETED': 'MÉDIA ORÇADA',
    'AVERAGE NET': 'SALDO MÉDIO',
    'Budgeted:': 'Orçado:',
    'Debts:': 'Dívidas:',
    'Net:': 'Saldo:',
    'Net Assets:': 'Ativos líquidos:',
    'Net Debts:': 'Dívidas líquidas:',
    'Average:': 'Média:',
    'Compare:': 'Comparar:',
    'Day: {{dayOfMonth}}': 'Dia: {{dayOfMonth}}',
    // Spelled the same in both languages.
    '28+': '28+',

    // The Age of Money report.
    'What is Age of Money?': 'O que é a idade do dinheiro?',
    'Age of Money shows how many days, on average, your money sits in your budget before you spend it. It measures the gap between when you earn money and when you spend it.':
      'A idade do dinheiro mostra quantos dias, em média, o dinheiro fica no orçamento antes de ser gasto. Ela mede o intervalo entre receber e gastar.',
    "A higher Age of Money means you're spending older money, which indicates you're living on last month's income rather than paycheck-to-paycheck. An age of 30 days or more is considered ideal—it means you're typically spending money you earned a month ago.":
      'Uma idade do dinheiro maior significa que você está gastando dinheiro mais antigo: vive da receita do mês passado, e não de salário em salário. Uma idade de 30 dias ou mais é considerada ideal — em geral você está gastando o que recebeu há um mês.',
    'How is it calculated?': 'Como é calculada?',
    "The calculation uses the FIFO (First In, First Out) method: when you spend money, it's considered to come from your oldest income first. The age is the difference in days between when you received that income and when you spent it. The displayed value is the average age of your last 10 expenses.":
      'O cálculo usa o método FIFO (o primeiro que entra é o primeiro que sai): quando você gasta, considera-se que o dinheiro vem primeiro da sua receita mais antiga. A idade é a diferença, em dias, entre o recebimento dessa receita e o gasto. O valor exibido é a idade média das suas 10 últimas despesas.',
    'Note: Some expenses could not be matched to income (spending exceeded income in this period)':
      'Nota: algumas despesas não puderam ser associadas a receitas (as despesas superaram as receitas neste período)',
    'Change granularity': 'Alterar o detalhamento',
    '{{days}} days': '{{days}} dias',
    '30 days': '30 dias',
    'Age of Money: {{days}} days': 'Idade do dinheiro: {{days}} dias',
    'Incomplete data': 'Dados incompletos',
    Improving: 'Melhorando',
    Declining: 'Piorando',
    Stable: 'Estável',
    '↑ Improving': '↑ Melhorando',
    '↓ Declining': '↓ Piorando',
    '→ Stable': '→ Estável',
    // "Não disponível", as the abbreviation is read in Portuguese.
    'N/A': 'N/D',

    // The Crossover Point report. Its "income accounts" are the accounts
    // whose yield pays for retirement, so "contas de rendimento" — not
    // "receitas", which is what the budget takes in.
    'Crossover Point': 'Ponto de cruzamento',
    'What is the Crossover Point?': 'O que é o ponto de cruzamento?',
    'The crossover point is when your monthly investment income (from selected accounts using the safe withdrawal rate) meets or exceeds your total monthly expenses (from selected categories). The chart projects into the future using your estimated return until the lines cross.':
      'O ponto de cruzamento é quando o rendimento mensal dos seus investimentos (das contas selecionadas, pela taxa de retirada segura) alcança ou supera o total das suas despesas mensais (das categorias selecionadas). O gráfico projeta o futuro com o retorno estimado até as linhas se cruzarem.',
    'Years to Retire': 'Anos até a aposentadoria',
    '{{years}} years': '{{years}} anos',
    'Target Monthly Income': 'Meta de rendimento mensal',
    'Target Life Savings': 'Meta de economias acumuladas',
    'Expenses categories': 'Categorias de despesas',
    'Income accounts': 'Contas de rendimento',
    'Show hidden': 'Exibir ocultas',
    'Hide hidden': 'Não exibir ocultas',
    'Safe withdrawal rate (%)': 'Taxa de retirada segura (%)',
    'Expense Projection Type': 'Tipo de projeção das despesas',
    'Hampel Filtered Median': 'Mediana com filtro de Hampel',
    Median: 'Mediana',
    Mean: 'Média',
    'Target Income (% of expenses)': 'Meta de rendimento (% das despesas)',
    'Use custom growth projections': 'Usar projeções de crescimento próprias',
    'Expected return (annual %)': 'Retorno esperado (% ao ano)',
    'Expected monthly contribution': 'Aporte mensal esperado',
    '(projected)': '(projetado)',
    'Monthly expenses:': 'Despesas mensais:',
    'Monthly investment income:': 'Rendimento mensal dos investimentos:',
    'Life savings:': 'Economias acumuladas:',
    'Target income:': 'Meta de rendimento:',
    'Used to estimate your future expenses.<1></1><2></2>Select the budget categories that reflect your living expenses in retirement.<4></4>Ex: Food, Utilities, Entertainment, Medical<6></6><7></7>Exclude categories that will not continue in retirement.<9></9>Ex: Retirement Savings':
      'Usadas para estimar suas despesas futuras.<1></1><2></2>Selecione as categorias do orçamento que refletem seu custo de vida na aposentadoria.<4></4>Ex.: alimentação, contas da casa, lazer, saúde<6></6><7></7>Exclua as categorias que não continuarão na aposentadoria.<9></9>Ex.: poupança para a aposentadoria',
    'Used to estimate your future income.<1></1><2></2>Select the accounts that will be used to fund your retirement.<4></4>Ex: Retirement Accounts, Savings Accounts<6></6><7></7>Exclude accounts that will not.<9></9>Ex: Mortgage Accounts, Child Education Accounts':
      'Usadas para estimar seu rendimento futuro.<1></1><2></2>Selecione as contas que vão financiar sua aposentadoria.<4></4>Ex.: contas de previdência, contas de poupança<6></6><7></7>Exclua as que não vão.<9></9>Ex.: financiamento imobiliário, contas para a educação dos filhos',
    'The amount you plan to withdraw from your Income Accounts each year to fund your living expenses.<1></1><2>More info.</2>':
      'O valor que você pretende retirar das suas contas de rendimento a cada ano para pagar suas despesas.<1></1><2>Mais informações.</2>',
    'How past expenses are projected into the future.<1></1><2></2>Hampel Filtered Median: Filters out outliers before calculating the median expense.<4></4><5></5>Median: Uses the median of all historical expenses without filtering.<7></7><8></8>Mean: Uses the average of all historical expenses.':
      'Como as despesas passadas são projetadas para o futuro.<1></1><2></2>Mediana com filtro de Hampel: descarta valores atípicos antes de calcular a mediana das despesas.<4></4><5></5>Mediana: usa a mediana de todas as despesas do histórico, sem filtro.<7></7><8></8>Média: usa a média de todas as despesas do histórico.',
    'Your target retirement income as a percentage of projected expenses.<1></1><2></2>100% means you need retirement income equal to your current projected expenses.<4></4>Values above 100% mean you plan to spend more in retirement.<6></6>Values below 100% mean you plan to spend less in retirement.<8></8><9></9>The graph shows both the projected expenses (solid red line) and your target income (dashed red line).':
      'Sua meta de rendimento na aposentadoria, como porcentagem das despesas projetadas.<1></1><2></2>100% significa que você precisa de um rendimento igual às suas despesas projetadas.<4></4>Acima de 100%, você pretende gastar mais na aposentadoria.<6></6>Abaixo de 100%, pretende gastar menos.<8></8><9></9>O gráfico mostra as despesas projetadas (linha vermelha contínua) e a sua meta de rendimento (linha vermelha tracejada).',
    'Enable this to specify custom monthly contribution amounts and investment returns that will be used to project your investments into the future.<1></1><2></2>When disabled, uses historical performance from your Income Accounts (which includes both past contributions and investment growth).':
      'Ative para informar aportes mensais e retornos de investimento próprios, que serão usados para projetar seus investimentos no futuro.<1></1><2></2>Desativado, usa o desempenho histórico das suas contas de rendimento (que inclui tanto os aportes passados quanto o crescimento dos investimentos).',
    'The expected annual return rate for your investments, used to project growth of Income Accounts.':
      'A taxa de retorno anual esperada dos seus investimentos, usada para projetar o crescimento das contas de rendimento.',
    'The amount you plan to contribute to your Income Accounts each month. This amount is added to your balance each month before applying the investment return.':
      'O valor que você pretende aportar nas suas contas de rendimento a cada mês. Ele é somado ao saldo todo mês, antes de aplicar o retorno do investimento.',

    // The Formula card's own page.
    Formula: 'Fórmula',
    'Formula:': 'Fórmula:',
    'Result:': 'Resultado:',
    'Show title:': 'Exibir título:',
    'Font size:': 'Tamanho da fonte:',
    'Font size (px):': 'Tamanho da fonte (px):',
    Dynamic: 'Dinâmico',
    'Conditional color (optional):': 'Cor condicional (opcional):',

    // What the inventory still found in the forms and sheets of the four areas.
    Cover: 'Cobrir',
    'Transfer to category': 'Transferir para uma categoria',
    'Transferred {{amount}} to {{categoryName}}':
      '{{amount}} transferidos para {{categoryName}}',
    'Category name': 'Nome da categoria',
    'Category group name': 'Nome do grupo de categorias',
    'Add group': 'Adicionar grupo',
    'Choose the number of months shown at a time':
      'Escolha quantos meses são exibidos de cada vez',
    'Create Local Account': 'Criar conta local',
    'Balance must be a number': 'O saldo deve ser um número',
    'No other dashboard pages available.': 'Nenhum outro painel disponível.',

    // Two sentences of the reports that no catalog could translate. The first
    // had its figure written into the text; it is a value now. The second is
    // written in the source with HTML entities for its quotation marks, so the
    // key the extractor records is not the one asked for at run time — this
    // is the one asked for.
    'Using calculated historical return of {{historicalReturnPercent}}%':
      'Usando o retorno histórico calculado de {{historicalReturnPercent}}%',
    'Formula that returns a color (e.g., \u201Cred\u201D, \u201C#ff0000\u201D). Leave blank for default. Use RESULT variable to access the main formula result.':
      'Fórmula que retorna uma cor (ex.: "red", "#ff0000"). Deixe em branco para usar o padrão. Use a variável RESULT para acessar o resultado da fórmula principal.',
  },
};
