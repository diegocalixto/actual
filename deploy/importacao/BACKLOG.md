# Backlog da importação — só planejamento

Nada aqui está implementado. São propostas para decidir com o Diego.

## A. Lançamento automático a partir do SMS do Itaú

Objetivo: cada compra no cartão vira, em segundos, uma transação **pendente de
revisão** no Diego Finance, sem acesso a credenciais do banco.

### Fluxo proposto

1. **Atalhos do iPhone** — automação "Ao receber mensagem" do remetente do
   Itaú. O atalho não interpreta nada: envia o texto bruto, a hora do
   recebimento e um id do aparelho.
2. **Recepção autenticada, sem exposição pública** — endpoint pequeno ao lado
   do servidor, ouvindo **só na interface do Tailscale** (nunca porta aberta no
   roteador, nunca serviço público). Autenticação por segredo compartilhado
   com **HMAC-SHA256** do corpo + carimbo de tempo; janela de ±5 min e cache
   de nonces para **proteção contra replay**. Segredo guardado no atalho e
   no servidor, trocável.
3. **Extração determinística** — expressões regulares escritas a partir do
   formato documentado das mensagens, testadas com mensagens **sintéticas**
   (nenhum SMS real no repositório). Campos: valor, data/hora, estabelecimento
   abreviado, últimos 4 dígitos do cartão, tipo (compra, estorno, Pix). Se a
   regex não casar por completo, nada é inferido: vai para a revisão.
4. **Mapa cartão → conta** — últimos dígitos → conta do Actual, em arquivo de
   configuração local; dígito desconhecido = revisão.
5. **Categorização por regras confiáveis** — só regras explícitas do Diego
   (estabelecimento → categoria), as mesmas regras de favorecido do Actual.
   Sem regra = sem categoria.
6. **Fila de revisão** — mensagens ambíguas, Pix, estabelecimento genérico
   (`PAG*`, `MP*`), valor fora do padrão.
7. **Idempotência** — chave = hash(texto normalizado + data/hora da mensagem +
   últimos dígitos); vira o `imported_id`. Reenvio do mesmo SMS não duplica.
8. **Servidor indisponível** — o atalho tenta de novo algumas vezes; se falhar,
   grava a mensagem numa nota/arquivo local do iPhone para reenvio manual ou
   automático depois. O endpoint responde rápido e enfileira em disco antes de
   processar.
9. **Conciliação com a fatura** — quando a fatura real chegar, o fluxo de
   `importar.mjs` casa cada lançamento vindo do SMS com a linha da fatura
   (valor, data ±3 dias, estabelecimento), marca como conciliado e aponta o que
   sobrou dos dois lados. A fatura continua sendo a verdade.
10. **Sem credenciais** — nenhuma senha, token ou acesso ao internet banking;
    só o texto do SMS que o Diego já recebe.

### Riscos

- Mudança de formato do SMS pelo banco quebra a extração (a regex falha
  fechada: tudo vai para revisão).
- O texto do SMS é dado financeiro: o log do endpoint guarda só o hash e o
  resultado, não o texto, salvo opção explícita.
- Automação de mensagens do Atalhos pode exigir confirmação manual em algumas
  versões do iOS.

## B. Comprovantes (fotos e PDFs) anexados a transações

- **Armazenamento**: o Actual não tem anexos. Opção: pasta ao lado dos dados do
  servidor (`DF_DATA_DIR/anexos/`), arquivo nomeado pelo hash do conteúdo e
  ligado à transação por um identificador nas notas.
- **Privacidade**: comprovantes têm nome, CPF, endereço e dados de terceiros.
  Servir só autenticado, só pela rede privada; remover metadados (EXIF/GPS) das
  fotos; considerar criptografia em repouso.
- **Backup**: entram no `backup.sh` (o tamanho cresce rápido; medir antes) e na
  restauração. A exportação `.zip` do Actual não os inclui.
- **Telefone**: envio pela câmera/compartilhar do iPhone; limite de tamanho e
  compressão; funcionar sem rede (fila local).

## Perguntas em aberto

- O Itaú envia SMS para todas as compras ou só acima de um valor? E Pix?
- Há outro canal (notificação do app, e-mail) mais estável que o SMS?
- O Tailscale já está nos aparelhos que hospedariam o endpoint?
- Lançamentos vindos do SMS devem aparecer no saldo já (como pendentes) ou só
  depois de revisados?
- Comprovantes: quais tipos importam (notas fiscais, recibos de Pix, garantia)?
  Por quanto tempo guardar?
- Aceita o aumento do tamanho dos backups com anexos?
