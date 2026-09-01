#!/usr/bin/env bash
#
# Guarda do executor (Claude Code) para o fork Diego Finance V2.
#
# Complementa scripts/agent-hooks/git-guard.sh, que é compartilhado com o
# upstream e portanto não deve carregar regra específica deste fork. Aquele
# script exige o prefixo [AI] e barra force-push e push para main; este barra o
# que a política dos três agentes reserva ao Diego: commit, push, descarte de
# modificações e instalação de dependências.
#
# Interface de PreToolUse do Claude Code: JSON em stdin; exit 2 + stderr bloqueia
# a chamada. Qualquer outro exit deixa passar.
set -uo pipefail

command -v jq >/dev/null 2>&1 || {
  echo "executor-guard.sh precisa do jq no PATH." >&2
  exit 2
}

CMD="$(jq -r '.tool_input.command // ""')"
[ -z "$CMD" ] && exit 0

block() {
  echo "Bloqueado (política dos três agentes — AGENTS.md): $1" >&2
  exit 2
}

case "$CMD" in
  *"git commit"*)
    block "commit é manual. Claude implementa; Diego revisa e commita." ;;
  *"git push"*)
    block "push é manual. Diego decide quando publicar." ;;
  *"git reset"* | *"git restore"* | *"git clean"*)
    block "descartar modificações é proibido — o working tree tem trabalho do Diego." ;;
  *"git checkout"*)
    block "git checkout pode descartar modificações. Peça ao Diego para trocar de branch." ;;
  *"git stash drop"* | *"git stash clear"* | *"git stash pop"*)
    block "a pilha de stash é compartilhada entre worktrees; nunca descarte entradas." ;;
  *"git rm"*)
    block "remoção rastreada de arquivos precisa de autorização explícita do Diego." ;;
  *"yarn add"* | *"yarn remove"* | *"yarn up"* | *"yarn install"* | \
  *"npm install"* | *"npm i "* | *"npm add"* | *"pnpm add"* | *"pnpm install"*)
    block "instalar ou alterar dependências exige autorização explícita do Diego." ;;
esac

exit 0
