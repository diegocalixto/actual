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
      'O valor <1>A orçar</1> mostra o dinheiro que você ainda não destinou a nenhuma categoria. Procure zerá-lo, para que todo o seu dinheiro tenha uma função.',
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
  },
};
