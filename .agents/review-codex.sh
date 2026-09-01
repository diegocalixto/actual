#!/usr/bin/env bash
#
# Codex como revisor técnico — read-only e efêmero.
#
# A proteção aqui é do sistema operacional, não instrução: `--sandbox read-only`
# impede escrita no working tree, e `--ephemeral` impede que a sessão seja
# gravada em disco.
#
# O `codex exec` sem mais nada emite o transcript inteiro e depois repete a
# mensagem final, o que duplica a revisão na saída. `-o/--output-last-message`
# grava só a mensagem final (num temp fora do repositório) e é ela que é
# impressa; o transcript vai para um log e só é mostrado quando algo dá errado.
#
# `--enable use_legacy_landlock` é obrigatório neste devcontainer: sem ele o
# bubblewrap falha com "No permissions to create a new namespace" e TODO comando
# de shell do Codex morre — mas o processo ainda sai com código 0 e produz uma
# resposta confiante sobre um repositório que não conseguiu ler. Por isso este
# wrapper inspeciona o stderr e avisa em voz alta se isso acontecer.
#
# Uso:  .agents/review-codex.sh [escopo]
#       .agents/review-codex.sh                       # mudanças não commitadas
#       .agents/review-codex.sh "packages/desktop-client/src/components/mobile"
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
ESCOPO="${*:-as mudanças não commitadas (git diff + arquivos não rastreados relevantes)}"

CODEX="$(command -v codex || true)"
if [ -z "$CODEX" ]; then
  CODEX=/root/.codex/packages/standalone/current/bin/codex
fi
if [ ! -x "$CODEX" ]; then
  echo "erro: binário do Codex não encontrado ($CODEX)" >&2
  exit 127
fi

STDERR_LOG="$(mktemp -t codex-review-stderr.XXXXXX)"
STDOUT_LOG="$(mktemp -t codex-review-stdout.XXXXXX)"
LAST_MSG="$(mktemp -t codex-review-last.XXXXXX)"
trap 'rm -f "$STDERR_LOG" "$STDOUT_LOG" "$LAST_MSG"' EXIT

PROMPT="Você é revisor técnico independente deste repositório e opera em modo somente leitura.

Escopo desta revisão: ${ESCOPO}

Investigue com comandos de leitura (git diff, git status, leitura de arquivos). Procure bugs,
regressões, erros de lógica, problemas de tipos, de estado, de concorrência, de segurança e
edge cases. Prefira o diff e os arquivos diretamente relacionados a ele.

NÃO altere, crie ou remova nenhum arquivo. NÃO faça commit nem push. NÃO proponha aplicar
patches — apenas descreva a correção recomendada.

Responda EXATAMENTE no formato REVIEW RESULT definido na seção 'Diego Finance V2 — política
dos três agentes' do AGENTS.md deste repositório, e em nada além dele. Cada finding com
arquivo, localização, problema, impacto e correção recomendada. Sem elogio genérico. Se não
houver problema material, diga isso explicitamente e responda APPROVE."

set +e
"$CODEX" exec \
  --sandbox read-only \
  --ephemeral \
  --enable use_legacy_landlock \
  --color never \
  -C "$REPO" \
  -o "$LAST_MSG" \
  "$PROMPT" \
  > "$STDOUT_LOG" 2> "$STDERR_LOG"
STATUS=$?
set -e

falhou() {
  echo >&2
  echo "AVISO: $1" >&2
  echo "--- transcript do Codex ---" >&2
  cat "$STDOUT_LOG" >&2
  cat "$STDERR_LOG" >&2
  exit 1
}

if grep -q "No permissions to create a new namespace" "$STDERR_LOG"; then
  falhou "o sandbox do Codex não conseguiu criar namespace — os comandos de leitura falharam e a revisão NÃO é confiável."
fi

if [ "$STATUS" -ne 0 ]; then
  falhou "o Codex saiu com status $STATUS."
fi

if [ ! -s "$LAST_MSG" ]; then
  falhou "o Codex não produziu mensagem final."
fi

cat "$LAST_MSG"
