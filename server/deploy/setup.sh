#!/usr/bin/env bash
# Installa (o aggiorna) il server dei replay per l'utente corrente, senza sudo:
# Node LTS in ~/.local/opt, dati in ~/optcg-replay-data, servizio systemd utente "optcg-replay".
# Uso, dalla radice del repo sulla macchina:   bash server/deploy/setup.sh
# Si può rilanciare dopo ogni aggiornamento del codice: riscrive il servizio e lo riavvia.
# Variabili: PORT (8790), DATA_DIR, PUBLIC_URL (indirizzo pubblico da mettere nei link).
# Il servizio ascolta solo su 127.0.0.1: per renderlo pubblico serve un reverse proxy o un tunnel davanti.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DATA_DIR="${DATA_DIR:-$HOME/optcg-replay-data}"
PORT="${PORT:-8790}"
PUBLIC_URL="${PUBLIC_URL:-}"
NODE_HOME="$HOME/.local/opt/node"
UNIT="$HOME/.config/systemd/user/optcg-replay.service"

if [ ! -x "$NODE_HOME/bin/node" ]; then
  ver=$(curl -fsSL https://nodejs.org/dist/index.json | python3 -c 'import json,sys; print(next(r["version"] for r in json.load(sys.stdin) if r["lts"]))')
  arch=$(uname -m); case "$arch" in x86_64) arch=x64 ;; aarch64) arch=arm64 ;; esac
  file="node-$ver-linux-$arch.tar.xz"; tmp=$(mktemp -d)
  echo "Scarico Node $ver…"
  curl -fsSL -o "$tmp/$file" "https://nodejs.org/dist/$ver/$file"
  curl -fsSL "https://nodejs.org/dist/$ver/SHASUMS256.txt" | grep " $file\$" | (cd "$tmp" && sha256sum -c -)
  mkdir -p "$HOME/.local/opt"
  tar -xJf "$tmp/$file" -C "$HOME/.local/opt"
  ln -sfn "$HOME/.local/opt/node-$ver-linux-$arch" "$NODE_HOME"
  rm -rf "$tmp"
fi
echo "Node: $("$NODE_HOME/bin/node" --version)"

mkdir -p "$DATA_DIR" "$(dirname "$UNIT")"
chmod 700 "$DATA_DIR"
cat > "$UNIT" <<EOF
[Unit]
Description=OPTCG Replay - server dei replay condivisi
After=network-online.target

[Service]
WorkingDirectory=$APP_DIR
ExecStart=$NODE_HOME/bin/node server/server.js
Environment=PORT=$PORT
Environment=HOST=127.0.0.1
Environment=DATA_DIR=$DATA_DIR
Environment=PUBLIC_URL=$PUBLIC_URL
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable optcg-replay.service >/dev/null 2>&1
systemctl --user restart optcg-replay.service
sleep 2
systemctl --user is-active optcg-replay.service
curl -fsS -o /dev/null -w "pagina su 127.0.0.1:$PORT -> %{http_code}\n" "http://127.0.0.1:$PORT/"
echo "Token: DATA_DIR=$DATA_DIR $NODE_HOME/bin/node server/token.js add <nome>"
