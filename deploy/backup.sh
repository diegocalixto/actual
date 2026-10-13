#!/usr/bin/env bash
#
# Backup da pasta de dados do servidor do Diego Finance V2.
#
#   deploy/backup.sh <pasta-de-dados> <pasta-de-destino>
#
# Gera <destino>/diego-finance-AAAAMMDD-HHMMSS.tar.gz e um .sha256 ao lado.
# A pasta de dados é a que o servidor usa como /data: guarda a conta
# (server-files/) e os arquivos de orçamento sincronizados (user-files/).
#
# O servidor grava em SQLite. Para a cópia sair íntegra ele precisa estar
# parado: defina DF_COMPOSE_DIR com a pasta do docker-compose.yml e o script
# para o serviço antes e religa depois, mesmo se a cópia falhar. Sem essa
# variável o script só copia, e a parada fica por sua conta.
#
# Nada aqui apaga backups antigos nem envia o arquivo para lugar algum.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <pasta-de-dados> <pasta-de-destino>" >&2
  exit 64
fi

DATA_DIR="$(cd "$1" 2>/dev/null && pwd)" || {
  echo "Pasta de dados não encontrada: $1" >&2
  exit 66
}
if [ ! -d "$DATA_DIR/server-files" ] || [ ! -d "$DATA_DIR/user-files" ]; then
  echo "$DATA_DIR não parece a pasta de dados do servidor (faltam server-files/ ou user-files/)." >&2
  exit 65
fi

# Resolve o destino sem criá-lo: sobe até o primeiro ancestral que existe.
resolve() {
  local path="$1" rest=""
  while [ ! -d "$path" ]; do
    rest="/$(basename "$path")$rest"
    path="$(dirname "$path")"
  done
  printf '%s%s\n' "$(cd "$path" && pwd)" "$rest"
}

DEST_DIR="$(resolve "$2")"
case "$DEST_DIR/" in
  "$DATA_DIR"/*)
    echo "O destino não pode ficar dentro da pasta de dados." >&2
    exit 65
    ;;
esac
mkdir -p "$DEST_DIR"

ARCHIVE="$DEST_DIR/diego-finance-$(date +%Y%m%d-%H%M%S).tar.gz"
if [ -e "$ARCHIVE" ]; then
  echo "Já existe um backup com este nome: $ARCHIVE" >&2
  exit 73
fi

restart() {
  if [ -n "${DF_COMPOSE_DIR:-}" ]; then
    (cd "$DF_COMPOSE_DIR" && docker compose start)
  fi
}
if [ -n "${DF_COMPOSE_DIR:-}" ]; then
  trap restart EXIT
  (cd "$DF_COMPOSE_DIR" && docker compose stop)
else
  echo "Aviso: DF_COMPOSE_DIR não definido; confirme que o servidor está parado." >&2
fi

tar -czf "$ARCHIVE" -C "$DATA_DIR" .
# Um arquivo que não lista inteiro não é backup.
tar -tzf "$ARCHIVE" >/dev/null
(cd "$DEST_DIR" && sha256sum "$(basename "$ARCHIVE")" >"$(basename "$ARCHIVE").sha256")

echo "Backup criado: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
echo "Copie o .tar.gz e o .sha256 para fora desta máquina."
