#!/usr/bin/env bash
#
# Grok como revisor independente — sem ferramenta de escrita.
#
# IMPORTANTE, e diferente do Codex: o `--sandbox` do Grok NÃO funciona neste
# devcontainer. Qualquer perfil (builtin ou custom) falha com
#   "bwrap exec failed: No such file or directory ... Refusing to start"
# porque o Grok exige o bubblewrap do sistema (não traz um embutido) e o
# container não permite criar namespaces. O Grok se recusa a rodar sem a deny
# list, então não existe sandbox de sistema operacional disponível aqui.
#
# A proteção efetiva é outra, e é real: `--tools` é uma allowlist — apenas as
# ferramentas listadas existem na sessão, e `search_replace` (a única que grava
# arquivo) e `run_terminal_cmd` (shell) ficam de fora. Isso é enforcement do
# próprio CLI, não instrução no prompt.
#
# Um detalhe que a allowlist NÃO cobre: `search_tool`/`use_tool` (descoberta e
# chamada de ferramentas MCP) sobrevivem a `--tools`. Hoje não há servidor MCP
# configurado (`grok mcp list` → nenhum), então não há caminho de escrita por
# ali; mas basta alguém adicionar um servidor com ferramenta de escrita para
# abrir esse caminho. Por isso os dois entram na deny list abaixo, junto com
# "Agent". Verificado: com eles negados, o Grok reporta ter exatamente
# read_file, list_dir e grep.
#
# Consequência: como o Grok não tem shell, é este wrapper que produz o diff e o
# entrega pronto no prompt.
#
# Uso:  .agents/review-grok.sh [pathspec...]
#       .agents/review-grok.sh
#       .agents/review-grok.sh packages/desktop-client/src/components/mobile
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
cd "$REPO"

MAX_DIFF_BYTES=${GROK_REVIEW_MAX_DIFF_BYTES:-120000}

PROMPT_FILE="$(mktemp -t grok-review-prompt.XXXXXX)"
trap 'rm -f "$PROMPT_FILE"' EXIT

{
  cat <<'CABECALHO'
Você é revisor independente deste repositório e opera em modo somente leitura.

Você NÃO tem ferramenta de escrita nem shell — apenas leitura de arquivos, grep e
listagem de diretórios. Use-as para abrir os arquivos citados no diff e entender o
contexto ao redor.

Procure bugs, regressões, problemas de UX, inconsistências e edge cases. Separe
problema real de sugestão opcional.

Responda EXATAMENTE no formato REVIEW RESULT definido na seção "Diego Finance V2 —
política dos três agentes" do AGENTS.md deste repositório, e em nada além dele. Cada
finding com arquivo, localização, problema, impacto e correção recomendada. Sem elogio
genérico, sem revisão inflada. Se não houver problema material, diga isso
explicitamente e responda APPROVE.

--- git status (resumo) ---
CABECALHO

  git status --short -- "$@" 2>/dev/null || git status --short

  echo
  echo "--- git diff --stat ---"
  git diff --stat -- "$@" 2>/dev/null || true

  echo
  echo "--- git diff (truncado em ${MAX_DIFF_BYTES} bytes) ---"
  DIFF="$(git diff -- "$@" 2>/dev/null || true)"
  if [ -z "$DIFF" ]; then
    echo "(sem diff em arquivos rastreados para este escopo)"
  else
    printf '%s' "$DIFF" | head -c "$MAX_DIFF_BYTES"
    if [ "${#DIFF}" -gt "$MAX_DIFF_BYTES" ]; then
      echo
      echo "[...diff truncado: ${#DIFF} bytes no total. Reduza o escopo com um pathspec.]"
    fi
  fi
} > "$PROMPT_FILE"

# --tools é uma allowlist e só vale em modo headless (-p). search_replace e
# run_terminal_cmd ficam de fora de propósito; "Agent" bloqueia subagentes.
exec grok \
  -p "$(cat "$PROMPT_FILE")" \
  --tools "read_file,grep,list_dir" \
  --disallowed-tools "Agent,search_tool,use_tool" \
  --disable-web-search \
  --output-format plain \
  --max-turns 20
