#!/usr/bin/env bash
#
# Restaura um backup feito por deploy/backup.sh em uma pasta de dados nova.
#
#   deploy/restore.sh <backup.tar.gz> <pasta-de-dados-nova>
#
# Nunca sobrescreve: a pasta de destino precisa não existir ou estar vazia.
# Para voltar no tempo em uma instalação existente, pare o servidor, renomeie a
# pasta de dados atual, restaure na pasta original e ligue o servidor de novo.
# Se o .sha256 estiver ao lado do backup, ele é conferido antes de extrair.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <backup.tar.gz> <pasta-de-dados-nova>" >&2
  exit 64
fi

ARCHIVE="$1"
TARGET="$2"

if [ ! -f "$ARCHIVE" ]; then
  echo "Backup não encontrado: $ARCHIVE" >&2
  exit 66
fi
if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "A pasta de destino já tem conteúdo; nada foi alterado: $TARGET" >&2
  exit 73
fi

if [ -f "$ARCHIVE.sha256" ]; then
  (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$ARCHIVE").sha256")
else
  echo "Aviso: $ARCHIVE.sha256 não encontrado; integridade não conferida." >&2
fi

# Lista antes de extrair: um arquivo truncado para aqui, com o destino intacto.
if ! LISTING="$(tar -tzf "$ARCHIVE")"; then
  echo "O backup está corrompido ou incompleto; nada foi alterado." >&2
  exit 65
fi
if ! grep -q '^\./server-files/account\.sqlite$' <<<"$LISTING"; then
  echo "O backup não contém server-files/account.sqlite; não é um backup deste servidor." >&2
  exit 65
fi

mkdir -p "$TARGET"
tar -xzf "$ARCHIVE" -C "$TARGET"

echo "Backup restaurado em: $TARGET"
echo "Aponte o servidor para esta pasta (DF_DATA_DIR) e ligue-o."
