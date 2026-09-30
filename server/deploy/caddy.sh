#!/usr/bin/env bash
# Mette Caddy davanti al server dei replay, con HTTPS automatico. È l'unico passo che richiede sudo.
# Uso:   sudo bash server/deploy/caddy.sh <host> [porta]
#   es.  sudo bash server/deploy/caddy.sh 178-104-213-148.sslip.io
# <ip-con-trattini>.sslip.io è un nome gratuito che punta all'IP: basta per avere il certificato senza comprare un dominio.
# Si può rilanciare: non duplica la configurazione.
set -euo pipefail

[ "$(id -u)" = 0 ] || { echo "Va lanciato con sudo."; exit 1; }
HOST="${1:?Indica il nome pubblico, es. 178-104-213-148.sslip.io}"
PORT="${2:-8790}"
CADDYFILE=/etc/caddy/Caddyfile

if ! command -v caddy >/dev/null; then
  apt-get update -q
  DEBIAN_FRONTEND=noninteractive apt-get install -y -q caddy
fi

SITE="$HOST {
	encode gzip
	reverse_proxy 127.0.0.1:$PORT
}"
if [ -f "$CADDYFILE" ] && grep -qF "$HOST" "$CADDYFILE"; then
  echo "$HOST è già nel Caddyfile: lo lascio com'è."
elif [ ! -f "$CADDYFILE" ] || grep -q "/usr/share/caddy" "$CADDYFILE"; then
  # manca, oppure è la pagina di benvenuto del pacchetto: la sostituisco
  [ -f "$CADDYFILE" ] && cp "$CADDYFILE" "$CADDYFILE.orig"
  printf '%s\n' "$SITE" > "$CADDYFILE"
else
  # c'è già una configurazione tua: aggiungo il sito in fondo
  cp "$CADDYFILE" "$CADDYFILE.bak-$(date +%Y%m%d%H%M%S)"
  printf '\n%s\n' "$SITE" >> "$CADDYFILE"
fi
caddy validate --config "$CADDYFILE" --adapter caddyfile >/dev/null

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  echo "Firewall: aperte le porte 80 e 443."
fi

systemctl enable caddy >/dev/null 2>&1
systemctl restart caddy
echo "Attendo il certificato…"
for _ in $(seq 1 20); do
  code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' "https://$HOST/" || true)
  [ "$code" = 200 ] && { echo "Pronto: https://$HOST"; exit 0; }
  sleep 3
done
echo "Caddy è partito ma https://$HOST non risponde ancora (ultimo codice: ${code:-nessuno})."
echo "Controlla: journalctl -u caddy -n 30 --no-pager, e che 80/443 siano aperte nel firewall del provider."
exit 1
