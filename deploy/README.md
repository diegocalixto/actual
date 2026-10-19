# Diego Finance V2 — implantação

Como rodar a V2 para uso diário, fora do Cursor e sem o servidor de
desenvolvimento, e como fazer backup, restaurar e atualizar.

Esta pasta não decide **onde** hospedar. O mesmo container serve para o
computador pessoal, uma VPS ou um servidor doméstico; o que muda é a máquina e a
camada de acesso na frente dele.

## O que roda

Um único container com o servidor de sincronização do Actual, que também entrega
o cliente V2 já compilado. Não há Vite, hot reload nem código-fonte servido.

| Peça              | Onde fica                                    | Some se o container for recriado? |
| ----------------- | -------------------------------------------- | --------------------------------- |
| Aplicativo        | dentro da imagem                             | sim, e é recompilado              |
| Conta e senha     | `DF_DATA_DIR/server-files/`                  | não                               |
| Orçamentos        | `DF_DATA_DIR/user-files/`                    | não                               |
| Cópia de trabalho | armazenamento do navegador, em cada aparelho | não depende do container          |

O Actual é local-first: cada aparelho guarda uma cópia completa do orçamento e
trabalha nela; o servidor recebe e redistribui as alterações.

### Cursor fechado não é computador desligado

- **Cursor fechado, computador ligado:** o container continua no ar. Tudo
  funciona.
- **Computador desligado, suspenso ou sem rede** (quando ele é o hospedeiro): o
  servidor some. O aplicativo já instalado no iPhone ainda abre e aceita
  lançamentos na cópia local; eles sobem quando o servidor voltar. O que não
  funciona nesse intervalo: primeiro acesso de um aparelho novo, login e troca
  de alterações entre aparelhos.
- Alteração que só existe em um aparelho só está protegida depois de
  sincronizada.

## Instalação

Pré-requisitos: Docker com Compose e espaço em disco para compilar a imagem (a
compilação baixa todas as dependências do monorepo; reserve alguns GB).

```bash
cd deploy
cp .env.example .env      # ajuste DF_DATA_DIR para uma pasta fora do repositório
docker compose up -d --build
docker compose ps         # o serviço deve aparecer como "healthy"
```

A imagem é compilada do commit publicado (`DF_BUILD_CONTEXT`), não da pasta de
trabalho local. A porta fica presa em `127.0.0.1`: nada é exposto à rede por
este arquivo.

**Defina a senha logo no primeiro acesso**, ainda em `http://localhost:5006`:
enquanto o servidor não tem senha, quem chegar primeiro escolhe. Só depois
libere o acesso pelo telefone.

## Acesso pelo iPhone

O telefone precisa chegar ao servidor por **HTTPS com certificado confiável**.
Não é só segurança: sem HTTPS o Safari não registra o service worker nem libera
`SharedArrayBuffer`, e o aplicativo não funciona direito.

A camada de HTTPS fica na frente do container e depende da hospedagem escolhida;
ela é configurada na etapa de implantação, não aqui. Requisitos:

- acesso privado (rede privada entre os seus aparelhos), sem abrir porta no
  roteador;
- encaminhar para `127.0.0.1:5006` e repassar os cabeçalhos de resposta do
  servidor sem alterar (`Cross-Origin-Opener-Policy`,
  `Cross-Origin-Embedder-Policy`, `Content-Security-Policy`);
- endereço próprio para a V2. A V1 já é servida ao telefone (porta 3001, ver
  `packages/desktop-client/bin/watch-browser`); a V2 precisa de outra porta ou
  outro nome, para não tomar o lugar dela nem compartilhar armazenamento com
  ela.

O servidor aceita 500 requisições por minuto por endereço de origem, contando os
arquivos do aplicativo; a primeira carga de um aparelho usa cerca de 240. Atrás
de um proxy local, todos os aparelhos podem contar como um só endereço.

### Tela de Início

1. Abra o endereço da V2 no Safari, entre com a senha e abra o orçamento.
2. Compartilhar → **Adicionar à Tela de Início**. O nome sugerido é "Actual";
   troque ali mesmo, se quiser distinguir da V1.
3. Abra pelo ícone. O aplicativo instalado tem armazenamento separado do
   Safari: entre de novo e baixe o orçamento uma vez.

## Backup

O que precisa ser guardado é `DF_DATA_DIR` inteira.

```bash
DF_COMPOSE_DIR="$PWD" ./backup.sh /caminho/para/diego-finance-dados /caminho/para/backups
```

O script para o serviço, gera `diego-finance-AAAAMMDD-HHMMSS.tar.gz` com um
`.sha256` ao lado e religa o serviço. Depois:

- copie os dois arquivos **para fora da máquina** que hospeda o servidor;
- o backup contém seus dados financeiros sem criptografia (a menos que a
  criptografia de ponta a ponta do Actual esteja ativada no arquivo): guarde-o
  em local protegido;
- o script não apaga backups antigos; a limpeza é manual.

Segunda via, independente do servidor: no aplicativo, Configurações → **Export
data** gera um `.zip` do orçamento aberto.

## Restauração

```bash
docker compose stop
mv /caminho/para/diego-finance-dados /caminho/para/diego-finance-dados.antigo
./restore.sh /caminho/para/backups/diego-finance-AAAAMMDD-HHMMSS.tar.gz /caminho/para/diego-finance-dados
docker compose start
```

O script confere o `.sha256`, recusa pasta de destino com conteúdo e nunca
sobrescreve. A senha volta a ser a do momento do backup, e o que foi lançado
depois dele não está no arquivo. Depois de restaurar, abra o orçamento em cada
aparelho e confira os saldos antes de voltar a lançar.

Para restaurar um `.zip` exportado: tela de arquivos → **Importar arquivo** →
Actual. Ele entra como um arquivo novo, ao lado dos existentes.

## Atualização

1. Faça um backup (acima).
2. Em `.env`, aponte `DF_BUILD_CONTEXT` para o novo commit e mude
   `DF_IMAGE_TAG`.
3. `docker compose up -d --build`. A pasta de dados não é tocada pela
   recompilação; as migrações do servidor rodam sozinhas na subida.
4. Em cada aparelho o aplicativo oferece a atualização; aceite em todos. Um
   orçamento aberto por uma versão mais nova pode não abrir em uma mais antiga.

Para voltar: restaure `DF_IMAGE_TAG` e `DF_BUILD_CONTEXT` anteriores, suba de
novo e, se o orçamento já tiver sido migrado, restaure o backup do passo 1.

## Idioma

O português do fork (`packages/desktop-client/src/locale-overrides.ts`) vai
dentro do aplicativo compilado e não depende de nenhum arquivo ignorado pelo
Git. A compilação padrão também baixa o catálogo de traduções do upstream, que
cobre em português boa parte das telas que o fork ainda não traduziu (login,
configurações, agendamentos); onde os dois existem, o texto do fork vence. Sem o
catálogo essas telas aparecem em inglês.

## Segurança

- Senha forte e exclusiva; ela é a única barreira depois da rede privada.
- `.env`, pasta de dados e backups ficam fora do Git (`.gitignore` desta pasta).
- A porta do container só escuta em `127.0.0.1`.
- Sem endpoints de desenvolvimento: o servidor entrega só o aplicativo
  compilado.
- Nunca rode a produção a partir da pasta de trabalho de desenvolvimento.

## Situação da validação

Na Etapa 15 foram testados fora do Docker, com dados de demonstração e um
navegador simulando o telefone: o aplicativo compilado, o servidor, a
sincronização entre dois aparelhos, a abertura e o lançamento sem rede (com
envio ao servidor quando a rede volta), o backup e a restauração. Ainda não
foram executados: a compilação da imagem por este `docker-compose.yml` e o uso
no Safari de um iPhone real.

## Sem Docker

Equivalente, a partir de um clone limpo com as dependências instaladas:

```bash
yarn build:server
NODE_ENV=production ACTUAL_HOSTNAME=127.0.0.1 ACTUAL_DATA_DIR=/caminho/para/diego-finance-dados \
  node packages/sync-server/build/app.js
```

Aqui a permanência do processo (reinício automático, subir com a máquina) fica
por conta do sistema.
