# Sincronização bancária diária

Importa, uma vez por dia, o que a Pluggy já coletou do banco para **um**
orçamento e para as contas listadas — com o navegador e o Claude fechados,
bastando o notebook e o Docker ligados. É um serviço a mais no
`../docker-compose.yml` (`sincronizacao-bancaria`), na mesma imagem do servidor,
desligado até ser ativado.

## O que faz e o que não faz

- No horário (padrão **07:00 de Brasília**) abre o orçamento configurado pela
  API do Actual compilada do mesmo commit — o mesmo núcleo do app — e chama,
  conta a conta, o comando do botão **Sincronizar** (`accounts-bank-sync`).
  Quem fala com a Pluggy é o servidor do Diego Finance, como no app.
- **Não** escreve no SQLite, **não** pede à Pluggy para atualizar o item (o Meu
  Pluggy coleta sozinho, de madrugada: Itaú por volta de 00:00, Nubank por
  volta de 02:00) e **não** faz conciliação: não cria transferências, não
  categoriza à mão, não apaga nada.
- Notebook desligado no horário: importa **uma vez** quando ele voltar, mesmo
  depois de vários dias. Uma importação feita até 4 h antes do horário já vale
  pelo dia (ligou às 05:00 → importa às 05:00 e não de novo às 07:00).

## Cuidados embutidos

- **Uma importação por vez**: trava na pasta da rotina; uma segunda (agenda ou
  manual) é recusada enquanto a primeira roda.
- **Cada execução começa do servidor**: baixa o orçamento numa pasta temporária
  do contêiner, que é apagada no fim. Falha no meio não deixa nada pela metade.
- **Antes de cada conta**: confere que ela está no orçamento, aberta, vinculada
  à Pluggy e com **"reimportar apagados" desligado**; se não, não importa.
- **Depois de cada conta**, mesmo quando a importação termina com erro (ela
  pode ter gravado parte): confere que nenhum lançamento que já existia foi
  apagado, mudou valor, data, categoria, nota, favorecido ou id do banco
  (`imported_id`), deixou de estar compensado ou virou (ou deixou de ser)
  transferência, e que nenhum id do banco passou a se repetir. Preencher o que
  estava vazio e compensar um pendente é permitido. Sem como conferir, é
  tratado como mudança indevida.
- **Só conta como importada** quando o app registrou a sincronização da conta e
  o servidor confirmou o envio. Falha nunca vira sucesso.
- **Falha passageira** (servidor fora, rede, demora ou limite da Pluggy): nova
  tentativa 15 min, 1 h e 4 h depois, só nas contas que faltaram; esgotadas,
  só no dia seguinte. Nada de repetição em cascata.
- **Falha que pede ação** (senha recusada, orçamento ou conta errados, conta sem
  vínculo, "reimportar apagados" ligado, Pluggy pedindo reconexão): não
  insiste. Corrigida a configuração ou a senha, tenta de novo na verificação
  seguinte; corrigido algo no app ou no Meu Pluggy, rode `agora` ou espere o
  dia seguinte.
- **Mudança inesperada em lançamento existente**: a rotina se **bloqueia** e só
  volta depois de `liberar`. O processo sai sem enviar ao servidor; como o
  núcleo do app espera cerca de 1 s antes de enviar sozinho, em geral a
  mudança não sai do contêiner — mas isso não é garantido, por isso o bloqueio
  pede conferência no app.
- **Erro fora do previsto** (estado que não grava, pasta que sumiu): a agenda
  fica 1 h sem decidir nada, para não repetir a importação a cada verificação.
- O registro não traz senha, id completo de item, nome de pessoa nem
  lançamento: só contas, contagens e horários.

## Antes de ativar (ordem obrigatória)

1. Candidata em produção — a imagem precisa conter a rotina
   (`sincronizacao-bancaria/` dentro de `/app`); confira com
   `docker run --rm diego-finance-v2:<tag> node sincronizacao-bancaria/rotina.mjs verificar`
   (as linhas `[ok]` de Node, API e núcleo bastam; as `[--]` são normais aí).
2. Backup verificado pelo procedimento estabelecido.
3. Conciliação documentada concluída no orçamento real: contas vinculadas,
   "reimportar apagados" desligado nas cinco e uma sincronização manual com
   0 novos.

## Ativar

Tudo a partir de `deploy/`, no PowerShell.

1. **Pasta da rotina e senha.** Por padrão a pasta é a de dados com
   `-sincronizacao` no fim (`DF_DATA_DIR-sincronizacao`); `DF_BANCO_DIR` muda.
   Grave nela só a senha do Diego Finance, sem ecoar na tela:

   ```powershell
   $p = 'C:\Users\diego\DiegoFinance\dados-sincronizacao'
   New-Item -ItemType Directory -Force $p | Out-Null
   $s = Read-Host 'Senha do Diego Finance' -AsSecureString
   [IO.File]::WriteAllText("$p\senha-do-servidor.txt", [Net.NetworkCredential]::new('', $s).Password)
   Remove-Variable s
   ```

   A pasta fica fora do repositório e guarda a senha: não a copie para outro
   lugar nem a inclua em backups compartilhados.

2. **Achar o orçamento e as contas** (só leitura; abre o orçamento como o app
   abriria):

   ```powershell
   docker compose run --rm sincronizacao-bancaria node sincronizacao-bancaria/rotina.mjs contas
   ```

   Sem `DF_BANCO_ORCAMENTO` ele lista os orçamentos (Sync ID e nome). Com o Sync
   ID e o nome no `.env`, lista as contas vinculadas, mostra "reimportar
   apagados" de cada uma, quantos agendamentos lançam sozinhos e imprime a
   linha `DF_BANCO_CONTAS=…` pronta.

3. **`.env`** — acrescentar:

   ```dotenv
   COMPOSE_PROFILES=sincronizacao
   DF_BANCO_ORCAMENTO=<Sync ID>
   DF_BANCO_ORCAMENTO_NOME=<nome exato do orçamento>
   DF_BANCO_CONTAS=<id>,<id>,<id>,<id>,<id>
   # DF_BANCO_HORARIO=07:00
   ```

4. **Subir**: `docker compose up -d`. O servidor continua como está; a rotina
   sobe depois que ele estiver saudável e, como nunca importou, faz a primeira
   importação dois minutos depois (logo após a conciliação: 0 novos).

## Verificar

```powershell
docker compose ps                                   # sincronizacao-bancaria: healthy
docker compose logs --tail 30 sincronizacao-bancaria
docker compose exec sincronizacao-bancaria node sincronizacao-bancaria/rotina.mjs status
```

O `status` separa, por conta, **quando o Diego Finance importou** e **quando a
Pluggy coletou do banco** — são coisas diferentes: a importação pode ter
acontecido hoje com dados que a Pluggy coletou há dias. A mesma informação
fica em `estado.json` e `registro.log`, na pasta da rotina. No app, "atualizado
há …" de cada conta é a hora em que o Diego Finance importou.

O healthcheck fica **unhealthy** quando a agenda para, a configuração está
incompleta, a rotina está bloqueada ou o dia terminou sem importar (falha que
pede ação ou tentativas esgotadas).

## Importar já

```powershell
docker compose exec sincronizacao-bancaria node sincronizacao-bancaria/rotina.mjs agora
```

Importa todas as contas configuradas, mesmo com a agenda pausada; recusa se
outra importação estiver rodando ou se a rotina estiver bloqueada.

## Pausar e retomar

- **Sem parar nada**: crie um arquivo vazio `PAUSAR` na pasta da rotina; apague
  para retomar. O `status` mostra "PAUSADA". (`agora` continua funcionando.)
- **Parando o serviço**: `docker compose stop sincronizacao-bancaria`; volta com
  `docker compose start sincronizacao-bancaria` (ou com o próximo
  `docker compose up -d`, enquanto o perfil estiver no `.env`).

## Reverter (só o agendador)

1. `docker compose stop sincronizacao-bancaria`
2. `docker compose rm -f sincronizacao-bancaria`
3. Tire `COMPOSE_PROFILES=sincronizacao` do `.env` (as linhas `DF_BANCO_*`
   podem ficar; sem o perfil, nada as usa).
4. Se não for reativar, apague a pasta da rotina (ela tem a senha).

O servidor e os dados não são tocados. O que já foi importado fica, como se
tivesse sido sincronizado no app; desfazer importações é restaurar o backup,
pelo procedimento estabelecido.

**Antes de voltar a imagem** da produção para uma versão sem a rotina (por
exemplo `3a79bec43`), desative o agendador pelos passos acima: a imagem antiga
não tem a rotina, e o servidor antigo não tem o adaptador Pluggy corrigido.

## Comandos

Dentro do contêiner (`docker compose exec sincronizacao-bancaria node sincronizacao-bancaria/rotina.mjs <comando>`):

| Comando           | O que faz                                                        |
| ----------------- | ---------------------------------------------------------------- |
| (nenhum)          | a agenda, que fica no ar (é o comando do serviço)                |
| `status [--json]` | última importação, última tentativa, próxima, situação por conta |
| `agora`           | importa já todas as contas configuradas                          |
| `contas`          | orçamentos do servidor ou contas vinculadas do orçamento         |
| `liberar`         | tira o bloqueio de segurança, depois de conferir no app          |
| `verificar`       | confere Node, API, núcleo e configuração, sem rede               |
| `saude`           | o healthcheck                                                    |

## Mensagens e o que fazer

| No registro                                               | O que fazer                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| o servidor recusou a senha…                               | corrigir `senha-do-servidor.txt`; a rotina tenta de novo sozinha                                                   |
| servidor do Diego Finance indisponível                    | nada; nova tentativa em 15 min, 1 h e 4 h. Se continuar, `docker compose ps`                                       |
| a Pluggy pede nova autorização do banco…                  | reconectar o banco no Meu Pluggy; depois `agora` ou esperar o dia seguinte                                         |
| a Pluggy não encontrou a conta…                           | a reconexão mudou os ids: vincular a conta de novo no app (e refazer a conciliação daquela conta)                  |
| a opção de reimportar lançamentos apagados está ligada…   | desligar nas opções de sincronização da conta, no app                                                              |
| a conta não existe neste orçamento / não está vinculada   | conferir `DF_BANCO_CONTAS` com o comando `contas`                                                                  |
| o Sync ID … é do orçamento "…", não de "…"                | conferir `DF_BANCO_ORCAMENTO` e `DF_BANCO_ORCAMENTO_NOME`                                                          |
| BLOQUEADA por segurança: a importação mudou lançamentos…  | conferir no app os lançamentos citados (ids curtos); estando certo, `liberar`; se não, corrigir ou restaurar antes |
| a Pluggy não coleta esta conta desde…                     | a Pluggy parou de atualizar a conta: abrir o Meu Pluggy. O Diego Finance importou o que havia                      |
| N marcados `#conferir-duplicata` / ids do banco repetidos | conferir no app (Início → Precisa de atenção) e apagar o que for duplicata                                         |

## Limites conhecidos

- A rotina é mais um aparelho: se alguém tocar em Sincronizar no iPhone nos
  mesmos segundos em que ela importa, os dois podem trazer o mesmo lançamento.
  Ela traz do servidor antes e envia logo depois de cada conta para encurtar
  essa janela, e avisa quando aparece id do banco repetido.
- Abrir o orçamento é como abrir o app: o núcleo avança os agendamentos e lança
  os que estiverem marcados para lançar sozinhos (`contas` mostra quantos são;
  no ensaio, 0).
- A Pluggy pode atualizar o saldo antes de listar o lançamento, ou deixar de
  listar um que já entregou; a rotina importa o que está listado e mostra quando
  a Pluggy coletou cada conta.
